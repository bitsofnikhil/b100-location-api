const xlsx = require("xlsx");
const path = require("path");

const filePath = path.join(__dirname, "dataset", "Rdir_2011_02_HIMACHAL_PRADESH.xls");

const workbook = xlsx.readFile(filePath);
const sheetName = workbook.SheetNames[0];

const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], {
  defval: "",
});

console.log("Sheet:", sheetName);
console.log("Total rows:", rows.length);
console.log("First row keys:");
console.log(Object.keys(rows[0]));
console.log("First row:");
console.log(rows[0]);