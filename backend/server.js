const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

require("dotenv").config();

const app = express();

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "B100 Location API is running",
  });
});

async function apiAuth(req, res, next) {
  try {
    const apiKey = req.header("x-api-key");
    const apiSecret = req.header("x-api-secret");

    if (!apiKey || !apiSecret) {
      return res.status(401).json({
        success: false,
        message: "API key and secret are required",
      });
    }

    const client = await prisma.apiClient.findUnique({
      where: { apiKey },
    });

    if (!client || !client.isActive) {
      return res.status(403).json({
        success: false,
        message: "Invalid or inactive API key",
      });
    }

    const validSecret = await bcrypt.compare(
      apiSecret,
      client.apiSecretHash
    );

    if (!validSecret) {
      return res.status(403).json({
        success: false,
        message: "Invalid API secret",
      });
    }

    req.client = client;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Authentication error",
      error: error.message,
    });
  }
}

app.post("/admin/clients", async (req, res) => {
  try {
    const { companyName } = req.body;

    if (!companyName) {
      return res.status(400).json({
        success: false,
        message: "companyName is required",
      });
    }

    const apiKey = crypto.randomBytes(16).toString("hex");
    const apiSecret = crypto.randomBytes(24).toString("hex");
    const apiSecretHash = await bcrypt.hash(apiSecret, 10);

    const client = await prisma.apiClient.create({
      data: {
        companyName,
        apiKey,
        apiSecretHash,
      },
    });

    res.json({
      success: true,
      message: "API client created successfully",
      data: {
        id: client.id,
        companyName: client.companyName,
        apiKey,
        apiSecret,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

app.get("/api/v1/states", apiAuth, async (req, res) => {
  try {
    const states = await prisma.state.findMany({
      orderBy: { name: "asc" },
    });

    res.json({
      success: true,
      count: states.length,
      data: states,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

app.get("/api/v1/districts", apiAuth, async (req, res) => {
  try {
    const { stateCode } = req.query;

    const districts = await prisma.district.findMany({
      where: stateCode
        ? {
            state: {
              lgdCode: String(stateCode),
            },
          }
        : {},
      orderBy: { name: "asc" },
    });

    res.json({
      success: true,
      count: districts.length,
      data: districts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

app.get("/api/v1/sub-districts", apiAuth, async (req, res) => {
  try {
    const { districtCode } = req.query;

    const subDistricts = await prisma.subDistrict.findMany({
      where: districtCode
        ? {
            district: {
              lgdCode: String(districtCode),
            },
          }
        : {},
      orderBy: { name: "asc" },
    });

    res.json({
      success: true,
      count: subDistricts.length,
      data: subDistricts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

app.get("/api/v1/villages", apiAuth, async (req, res) => {
  try {
    const { subDistrictCode } = req.query;

    const villages = await prisma.village.findMany({
      where: subDistrictCode
        ? {
            subDistrict: {
              lgdCode: String(subDistrictCode),
            },
          }
        : {},
      orderBy: { name: "asc" },
      take: 100,
    });

    res.json({
      success: true,
      count: villages.length,
      data: villages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

app.get("/api/v1/search", apiAuth, async (req, res) => {
  try {
    const { q } = req.query;

    const villages = await prisma.village.findMany({
      where: {
        name: {
          contains: q || "",
          mode: "insensitive",
        },
      },
      include: {
        subDistrict: {
          include: {
            district: {
              include: {
                state: true,
              },
            },
          },
        },
      },
      take: 50,
    });

    res.json({
      success: true,
      count: villages.length,
      data: villages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});