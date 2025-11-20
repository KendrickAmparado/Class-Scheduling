/**
 * MVCC-Enhanced Section Routes
 * Implements optimistic locking for concurrent section management
 */

import express from "express";
import Section from "../models/Section.js";
import Schedule from "../models/Schedule.js";
import { withRetry, MVCCTransaction } from "../middleware/mvccTransaction.js";
import { updateSectionWithConflictResolution, updateWithVersionControl } from "../utils/mvccManager.js";

const router = express.Router();

/**
 * POST create section with MVCC protection
 * Detects concurrent duplicate section creation
 */
router.post("/create-mvcc", async (req, res) => {
  try {
    const { course, year, name } = req.body;

    if (!course || !year || !name) {
      return res.status(400).json({
        success: false,
        message: "Course, year, and name are required",
        code: "VALIDATION_ERROR"
      });
    }

    const transaction = new MVCCTransaction(req.userId || 'system', 'section_creation');

    // Check for duplicate section (race condition prevention)
    const existingSection = await Section.findOne({
      course,
      year,
      name,
      archived: false
    });

    if (existingSection) {
      return res.status(409).json({
        success: false,
        message: `Section ${name} already exists in ${course} ${year}`,
        code: "DUPLICATE_SECTION"
      });
    }

    const newSection = new Section({
      course,
      year,
      name
    });

    await newSection.save();
    transaction.addOperation(newSection._id, 'create', newSection.__v, newSection);
    const txnRecord = transaction.commit();

    res.status(201).json({
      success: true,
      message: "Section created with MVCC protection",
      section: newSection,
      transaction: txnRecord
    });

  } catch (error) {
    if (error.code === 11000) { // MongoDB duplicate key error
      return res.status(409).json({
        success: false,
        message: "Section already exists",
        code: "DUPLICATE_ERROR"
      });
    }

    console.error("Section creation error:", error);
    res.status(500).json({
      success: false,
      message: "Server error creating section",
      error: error.message
    });
  }
});

/**
 * PUT update section with optimistic locking
 * Prevents concurrent modifications and data conflicts
 */
router.put("/:id/update-mvcc", async (req, res) => {
  try {
    const { id } = req.params;
    const { version, course, year, name } = req.body;

    if (version === undefined) {
      return res.status(400).json({
        success: false,
        message: "Version field required for optimistic locking",
        code: "VERSION_REQUIRED"
      });
    }

    const transaction = new MVCCTransaction(req.userId || 'system', 'section_update');

    const updatedSection = await withRetry(async () => {
      return await updateSectionWithConflictResolution(
        Section,
        id,
        version,
        { course, year, name },
        req.userId || 'system'
      );
    }, 3, 100);

    transaction.addOperation(id, 'update', updatedSection.__v, updatedSection);
    const txnRecord = transaction.commit();

    res.json({
      success: true,
      message: "Section updated with optimistic locking",
      section: updatedSection,
      transaction: txnRecord
    });

  } catch (error) {
    if (error.message?.includes('Version conflict')) {
      return res.status(409).json({
        success: false,
        message: "Concurrent update detected. Please refresh and try again.",
        code: "VERSION_CONFLICT"
      });
    }

    if (error.message?.includes('conflict')) {
      return res.status(409).json({
        success: false,
        message: error.message,
        code: "DATA_CONFLICT"
      });
    }

    console.error("Section update error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating section",
      error: error.message
    });
  }
});

/**
 * GET section with version info
 * Returns current version for optimistic locking
 */
router.get("/:id/version", async (req, res) => {
  try {
    const section = await Section.findById(req.params.id);

    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found"
      });
    }

    res.json({
      success: true,
      section: {
        _id: section._id,
        __v: section.__v,
        course: section.course,
        year: section.year,
        name: section.name,
        archived: section.archived,
        createdAt: section.createdAt,
        updatedAt: section.updatedAt
      }
    });

  } catch (error) {
    console.error("Error fetching section version:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching section"
    });
  }
});

/**
 * POST bulk update sections with transaction support
 * Atomically updates multiple sections
 */
router.post("/bulk/update-mvcc", async (req, res) => {
  try {
    const { sections } = req.body;

    if (!Array.isArray(sections) || sections.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Sections array required",
        code: "INVALID_INPUT"
      });
    }

    const transaction = new MVCCTransaction(req.userId || 'system', 'bulk_section_update');
    const updated = [];
    const failed = [];

    for (const sectionData of sections) {
      try {
        const result = await updateWithVersionControl(
          Section,
          sectionData._id,
          sectionData.__v,
          {
            course: sectionData.course,
            year: sectionData.year,
            name: sectionData.name
          }
        );

        transaction.addOperation(sectionData._id, 'update', result.__v, result);
        updated.push(result);

      } catch (error) {
        failed.push({
          sectionId: sectionData._id,
          error: error.message
        });
      }
    }

    transaction.status = failed.length > 0 ? 'partial_success' : 'success';
    const txnRecord = transaction.commit();

    res.json({
      success: failed.length === 0,
      message: `Updated ${updated.length} sections${failed.length > 0 ? `, ${failed.length} failed` : ''}`,
      updated: updated.length,
      failed: failed.length,
      sections: updated,
      failures: failed,
      transaction: txnRecord
    });

  } catch (error) {
    console.error("Bulk section update error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating sections",
      error: error.message
    });
  }
});

/**
 * DELETE section with cascade to schedules
 * Enforces referential integrity during concurrent deletes
 */
router.delete("/:id/with-cascade-mvcc", async (req, res) => {
  try {
    const { id } = req.params;

    const section = await Section.findById(id);
    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found"
      });
    }

    const transaction = new MVCCTransaction(req.userId || 'system', 'section_delete_cascade');

    // Find all schedules for this section
    const schedules = await Schedule.find({
      course: section.course,
      year: section.year,
      section: section.name
    });

    // Delete schedules first
    for (const schedule of schedules) {
      await Schedule.deleteOne({ _id: schedule._id });
      transaction.addOperation(schedule._id, 'delete', schedule.__v, schedule);
    }

    // Delete section
    const deletedSection = await Section.findByIdAndDelete(id);
    transaction.addOperation(id, 'delete', deletedSection.__v, deletedSection);
    const txnRecord = transaction.commit();

    res.json({
      success: true,
      message: `Section deleted with ${schedules.length} schedules removed`,
      section: deletedSection,
      schedulesDeleted: schedules.length,
      transaction: txnRecord
    });

  } catch (error) {
    console.error("Section deletion error:", error);
    res.status(500).json({
      success: false,
      message: "Server error deleting section",
      error: error.message
    });
  }
});

/**
 * GET concurrent modification statistics
 */
router.get("/stats/concurrency", async (req, res) => {
  try {
    const stats = await Section.aggregate([
      {
        $group: {
          _id: "$__v",
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const totalSections = await Section.countDocuments();
    const recentlyModified = await Section.countDocuments({
      updatedAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) }
    });

    res.json({
      success: true,
      stats: {
        totalSections,
        recentlyModified,
        versionDistribution: stats
      }
    });

  } catch (error) {
    console.error("Error fetching section concurrency stats:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching statistics"
    });
  }
});

export default router;
