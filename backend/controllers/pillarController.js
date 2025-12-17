import Pillar from "../models/Pillar.js";
import logger from "../utils/logger.js";

// @desc    Get all pillars
// @route   GET /api/pillars
// @access  Public
export const getPillars = async (req, res) => {
  try {
    let pillars;
    let postgresOk = false;
    let postgresCount;
    let postgresError = false;

    try {
      const { default: prisma } = await import("../src/db/prismaClient.js");
      const pgPillars = await prisma.pillar.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: "asc" },
        select: { identifier: true },
      });

      postgresOk = true;
      postgresCount = pgPillars.length;
      logger.debug("Primary read pillars (postgres) ok", {
        postgresCount,
      });

      if (pgPillars.length > 0) {
        const preferredOrder = pgPillars.map((p) => p.identifier);
        const preferredSet = new Set(preferredOrder);

        const mongoPillars = await Pillar.find({ isActive: true }).sort({
          order: 1,
        });

        const byIdentifier = new Map(
          mongoPillars.map((p) => [p.identifier, p])
        );

        const ordered = [];
        for (const identifier of preferredOrder) {
          const p = byIdentifier.get(identifier);
          if (p) ordered.push(p);
        }

        for (const p of mongoPillars) {
          if (!preferredSet.has(p.identifier)) ordered.push(p);
        }

        pillars = ordered;
      }
    } catch (err) {
      postgresError = true;
      logger.debug("Primary read pillars (postgres) failed", {
        code: err?.code,
        error: err?.message,
      });
    }

    if (!pillars || pillars.length === 0) {
      logger.debug("Pillars read used mongo fallback", {
        reason: postgresError
          ? "postgres_error"
          : postgresOk && postgresCount === 0
          ? "postgres_empty"
          : "postgres_no_data",
        postgresCount,
      });
      pillars = await Pillar.find({ isActive: true }).sort({ order: 1 });
    } else {
      logger.debug("Pillars read used postgres primary", {
        postgresCount,
        resultCount: pillars.length,
      });
    }

    res.json({
      success: true,
      count: pillars.length,
      data: pillars,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Get single pillar by ID or identifier
// @route   GET /api/pillars/:id
// @access  Public
export const getPillar = async (req, res) => {
  try {
    let pillar;
    let postgresOk = false;
    let postgresHit = false;
    let postgresError = false;

    try {
      const { default: prisma } = await import("../src/db/prismaClient.js");
      const pgPillar = await prisma.pillar.findFirst({
        where: {
          OR: [{ id: req.params.id }, { identifier: req.params.id }],
        },
        select: { identifier: true },
      });

      postgresOk = true;
      postgresHit = Boolean(pgPillar?.identifier);
      logger.debug("Primary read pillar (postgres) ok", {
        hit: postgresHit,
      });

      if (pgPillar?.identifier) {
        pillar = await Pillar.findOne({ identifier: pgPillar.identifier });
      }
    } catch (err) {
      postgresError = true;
      logger.debug("Primary read pillar (postgres) failed", {
        code: err?.code,
        error: err?.message,
      });
    }

    if (!pillar) {
      logger.debug("Pillar read used mongo fallback", {
        reason: postgresError
          ? "postgres_error"
          : postgresOk && !postgresHit
          ? "postgres_miss"
          : "postgres_no_data",
      });
      pillar = await Pillar.findOne({
        $or: [{ _id: req.params.id }, { identifier: req.params.id }],
      });
    } else {
      logger.debug("Pillar read used postgres primary", {
        hit: postgresHit,
      });
    }

    if (!pillar) {
      return res.status(404).json({
        success: false,
        error: "Pillar not found",
      });
    }

    res.json({
      success: true,
      data: pillar,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Create new pillar
// @route   POST /api/pillars
// @access  Private/Admin
export const createPillar = async (req, res) => {
  try {
    const pillar = await Pillar.create(req.body);

    // Dual-write to Postgres (Prisma) after successful Mongo write.
    // Never affects response; failures are debug-only.
    void (async () => {
      try {
        const { default: prisma } = await import("../src/db/prismaClient.js");
        await prisma.pillar.upsert({
          where: { identifier: pillar.identifier },
          create: {
            identifier: pillar.identifier,
            displayName: pillar.name,
            isActive: pillar.isActive ?? true,
            displayOrder: pillar.order ?? 0,
          },
          update: {
            displayName: pillar.name,
            isActive: pillar.isActive ?? true,
            displayOrder: pillar.order ?? 0,
          },
          select: { id: true },
        });
        logger.debug("Dual write pillar (postgres) ok", {
          identifier: pillar.identifier,
        });
      } catch (err) {
        logger.debug("Dual write pillar (postgres) failed", {
          code: err?.code,
          error: err?.message,
        });
      }
    })();

    res.status(201).json({
      success: true,
      data: pillar,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Update pillar
// @route   PUT /api/pillars/:id
// @access  Private/Admin
export const updatePillar = async (req, res) => {
  try {
    const pillar = await Pillar.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!pillar) {
      return res.status(404).json({
        success: false,
        error: "Pillar not found",
      });
    }

    // Dual-write to Postgres (Prisma) after successful Mongo write.
    // Never affects response; failures are debug-only.
    void (async () => {
      try {
        const { default: prisma } = await import("../src/db/prismaClient.js");
        await prisma.pillar.upsert({
          where: { identifier: pillar.identifier },
          create: {
            identifier: pillar.identifier,
            displayName: pillar.name,
            isActive: pillar.isActive ?? true,
            displayOrder: pillar.order ?? 0,
          },
          update: {
            displayName: pillar.name,
            isActive: pillar.isActive ?? true,
            displayOrder: pillar.order ?? 0,
          },
          select: { id: true },
        });
        logger.debug("Dual write pillar (postgres) ok", {
          identifier: pillar.identifier,
        });
      } catch (err) {
        logger.debug("Dual write pillar (postgres) failed", {
          code: err?.code,
          error: err?.message,
        });
      }
    })();

    res.json({
      success: true,
      data: pillar,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Delete pillar
// @route   DELETE /api/pillars/:id
// @access  Private/Admin
export const deletePillar = async (req, res) => {
  try {
    const pillar = await Pillar.findByIdAndDelete(req.params.id);

    if (!pillar) {
      return res.status(404).json({
        success: false,
        error: "Pillar not found",
      });
    }

    // Dual-write delete to Postgres (Prisma) after successful Mongo delete.
    // Never affects response; failures are debug-only.
    void (async () => {
      try {
        const { default: prisma } = await import("../src/db/prismaClient.js");
        await prisma.pillar.deleteMany({
          where: { identifier: pillar.identifier },
        });
        logger.debug("Dual delete pillar (postgres) ok", {
          identifier: pillar.identifier,
        });
      } catch (err) {
        logger.debug("Dual delete pillar (postgres) failed", {
          code: err?.code,
          error: err?.message,
        });
      }
    })();

    res.json({
      success: true,
      data: {},
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export default {
  getPillars,
  getPillar,
  createPillar,
  updatePillar,
  deletePillar,
};
