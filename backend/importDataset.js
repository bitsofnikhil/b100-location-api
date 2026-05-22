const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

require("dotenv").config();

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

const DATASET_DIR = path.join(__dirname, "dataset");

function clean(value) {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

async function main() {
  const files = fs
    .readdirSync(DATASET_DIR)
    .filter((file) =>
      !file.startsWith("._") &&
      (file.endsWith(".xls") || file.endsWith(".xlsx") || file.endsWith(".ods"))
    );

  console.log(`Found ${files.length} real dataset files`);

  let totalRows = 0;
  let imported = 0;
  let skipped = 0;

  for (const file of files) {
    const filePath = path.join(DATASET_DIR, file);
    console.log(`\nReading: ${file}`);

    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];

    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], {
      defval: "",
    });

    console.log(`Rows found: ${rows.length}`);

    for (const row of rows) {
      totalRows++;

      const stateCode = clean(row["MDDS STC"]);
      const stateName = clean(row["STATE NAME"]);

      const districtCode = clean(row["MDDS DTC"]);
      const districtName = clean(row["DISTRICT NAME"]);

      const subDistrictCode = clean(row["MDDS Sub_DT"]);
      const subDistrictName = clean(row["SUB-DISTRICT NAME"]);

      const villageCode = clean(row["MDDS PLCN"]);
      const villageName = clean(row["Area Name"]);

      // skip summary/invalid rows
      if (!stateCode || !stateName) {
        skipped++;
        continue;
      }

      if (!districtCode || districtCode === "000") {
        skipped++;
        continue;
      }

      if (!subDistrictCode || subDistrictCode === "00000") {
        skipped++;
        continue;
      }

      if (!villageCode || villageCode === "000000") {
        skipped++;
        continue;
      }

      if (!districtName || !subDistrictName || !villageName) {
        skipped++;
        continue;
      }

      const finalDistrictCode = `${stateCode}-${districtCode}`;
      const finalSubDistrictCode = `${stateCode}-${districtCode}-${subDistrictCode}`;
      const finalVillageCode = `${stateCode}-${districtCode}-${subDistrictCode}-${villageCode}`;

      const state = await prisma.state.upsert({
        where: { lgdCode: stateCode },
        update: { name: stateName },
        create: {
          lgdCode: stateCode,
          name: stateName,
        },
      });

      const district = await prisma.district.upsert({
        where: { lgdCode: finalDistrictCode },
        update: {
          name: districtName,
          stateId: state.id,
        },
        create: {
          lgdCode: finalDistrictCode,
          name: districtName,
          stateId: state.id,
        },
      });

      const subDistrict = await prisma.subDistrict.upsert({
        where: { lgdCode: finalSubDistrictCode },
        update: {
          name: subDistrictName,
          districtId: district.id,
        },
        create: {
          lgdCode: finalSubDistrictCode,
          name: subDistrictName,
          districtId: district.id,
        },
      });

      await prisma.village.upsert({
        where: { lgdCode: finalVillageCode },
        update: {
          name: villageName,
          subDistrictId: subDistrict.id,
          villageType: "Village",
          status: "Active",
        },
        create: {
          lgdCode: finalVillageCode,
          name: villageName,
          subDistrictId: subDistrict.id,
          villageType: "Village",
          status: "Active",
        },
      });

      imported++;

      if (imported % 50 === 0) {
        console.log(`Imported villages: ${imported}`);
      }
    }
  }

  console.log("\nImport completed");
  console.log(`Total rows scanned: ${totalRows}`);
  console.log(`Skipped rows: ${skipped}`);
  console.log(`Imported/updated villages: ${imported}`);

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error("Import failed:", error);
  await prisma.$disconnect();
  process.exit(1);
});