// File: backend/App/controllers/web/applicationController.js
const Application = require("../../models/applicationModal");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configure multer for file upload handling
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = "uploads/resumes";
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileExt = path.extname(file.originalname);
    cb(null, `resume-${uniqueSuffix}${fileExt}`);
  },
});

const fileFilter = (req, file, cb) => {
  // Accept only PDF, DOC, and DOCX
  const allowedFileTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (allowedFileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Please upload PDF, DOC, or DOCX."), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
}).single("resume");

// Create a new application
const applicationInsert = (req, res) => {
  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading
      return res.status(400).json({
        success: false,
        message: `File upload error: ${err.message}`,
      });
    } else if (err) {
      // An unknown error occurred
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    try {
      // Verify user authentication
      if (!req.body.userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required to apply for jobs",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Resume file is required",
        });
      }

      // Create new application
      const newApplication = new Application({
        userId: req.body.userId,
        jobId: req.body.jobId,
        firstName: req.body["first-name"],
        lastName: req.body["last-name"],
        email: req.body.email,
        phone: req.body.phone,
        experience: req.body.experience,
        skills: req.body.skills,
        education: req.body.education || "",
        coverLetter: req.body["cover-letter"] || "",
        resumeFile: req.file.path,
        applicationDate: req.body.applicationDate || new Date(),
        status: req.body.status || "pending",
      });

      await newApplication.save();

      res.status(201).json({
        success: true,
        message: "Application submitted successfully",
        application: {
          id: newApplication._id,
          status: newApplication.status,
        },
      });
    } catch (error) {
      // Handle duplicate application error
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: "You have already applied for this job",
        });
      }

      console.error("Error submitting application:", error);
      res.status(500).json({
        success: false,
        message: "Failed to submit application",
        error: error.message,
      });
    }
  });
};

// Fetch all applications for a candidate (used in candidate dashboard)
const fetchCandidateApplications = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Validate user ID
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Fetch applications and populate job details
    const applications = await Application.find({ userId })
      .populate("jobId", "title company location type salary postDate deadline")
      .sort({ applicationDate: -1 });

    res.status(200).json({
      success: true,
      applications,
    });
  } catch (error) {
    console.error("Error fetching candidate applications:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch applications",
      error: error.message,
    });
  }
};

// Fetch all applications for a specific job (used in employer dashboard)
const fetchJobApplications = async (req, res) => {
  try {
    const jobId = req.params.jobId;

    // Validate job ID
    if (!jobId) {
      return res.status(400).json({
        success: false,
        message: "Job ID is required",
      });
    }

    // Fetch applications for the job and populate user details
    const applications = await Application.find({ jobId })
      .populate("userId", "name email profilePicture")
      .sort({ applicationDate: -1 });

    res.status(200).json({
      success: true,
      applications,
    });
  } catch (error) {
    console.error("Error fetching job applications:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch applications",
      error: error.message,
    });
  }
};

// Fetch a specific application by ID
const fetchApplicationById = async (req, res) => {
  try {
    const applicationId = req.params.id;

    // Validate application ID
    if (!applicationId) {
      return res.status(400).json({
        success: false,
        message: "Application ID is required",
      });
    }

    // Fetch application with populated job and user details
    const application = await Application.findById(applicationId)
      .populate("userId", "name email profilePicture")
      .populate("jobId", "title company location type salary");

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    res.status(200).json({
      success: true,
      application,
    });
  } catch (error) {
    console.error("Error fetching application:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch application",
      error: error.message,
    });
  }
};

// Update application status (for employers to update status)
const updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId, status, notes } = req.body;

    // Validate inputs
    if (!applicationId || !status) {
      return res.status(400).json({
        success: false,
        message: "Application ID and status are required",
      });
    }

    // Validate status value
    const validStatuses = [
      "pending",
      "reviewed",
      "interviewed",
      "rejected",
      "accepted",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    // Update application
    const updatedApplication = await Application.findByIdAndUpdate(
      applicationId,
      {
        status,
        employerNotes: notes || "",
      },
      { new: true }
    );

    if (!updatedApplication) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Application status updated successfully",
      application: {
        id: updatedApplication._id,
        status: updatedApplication.status,
      },
    });
  } catch (error) {
    console.error("Error updating application:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update application",
      error: error.message,
    });
  }
};

// Delete application
const deleteApplication = async (req, res) => {
  try {
    const applicationId = req.body.applicationId;

    // Validate application ID
    if (!applicationId) {
      return res.status(400).json({
        success: false,
        message: "Application ID is required",
      });
    }

    // First find application to get resume file path
    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Delete resume file if it exists
    if (application.resumeFile) {
      try {
        if (fs.existsSync(application.resumeFile)) {
          fs.unlinkSync(application.resumeFile);
        }
      } catch (fileError) {
        console.error("Error deleting resume file:", fileError);
        // Continue with application deletion even if file deletion fails
      }
    }

    // Delete application from database
    await Application.findByIdAndDelete(applicationId);

    res.status(200).json({
      success: true,
      message: "Application deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting application:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete application",
      error: error.message,
    });
  }
};

module.exports = {
  applicationInsert,
  fetchCandidateApplications,
  fetchJobApplications,
  fetchApplicationById,
  updateApplicationStatus,
  deleteApplication,
};
