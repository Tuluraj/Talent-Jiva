// backend/App/controllers/web/jobController.js
const JobModel = require("../../models/jobModel");

// Fetch all jobs with optional filtering
let jobFetch = async (req, res) => {
  try {
    // Build query object from request parameters
    const query = {};

    // Handle title/keyword search
    if (req.query.title) {
      query.$or = [
        { title: { $regex: req.query.title, $options: "i" } },
        { company: { $regex: req.query.title, $options: "i" } },
        { tags: { $elemMatch: { $regex: req.query.title, $options: "i" } } },
      ];
    }

    // Handle location search
    if (req.query.location) {
      query.location = { $regex: req.query.location, $options: "i" };
    }

    // Handle job type filter
    if (req.query.type) {
      // Handle both single type and array of types
      const types = Array.isArray(req.query.type)
        ? req.query.type
        : [req.query.type];
      query.type = { $in: types };
    }

    // Handle remote filter
    if (req.query.remote !== undefined) {
      query.remote = req.query.remote === "true";
    }

    // Execute the query
    const jobs = await JobModel.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      jobs: jobs,
      count: jobs.length,
    });
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({
      success: false,
      error: "Server error: " + err.message,
    });
  }
};

// Fetch a single job by ID
let jobFetchById = async (req, res) => {
  try {
    const jobId = req.params.id;
    const job = await JobModel.findById(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: "Job not found",
      });
    }

    res.json({
      success: true,
      job: job,
    });
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({
      success: false,
      error: "Server error: " + err.message,
    });
  }
};

let jobInsert = async (req, res) => {
  try {
    const {
      title,
      company,
      location,
      type,
      salary,
      tags,
      remote,
      exp,
      desc,
      fullDesc,
      role,
      responsibilities,
    } = req.body;

    // Validate required fields
    if (!title || !company || !location || !type || !desc || !fullDesc) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    // Check if job already exists
    const existingJob = await JobModel.findOne({
      title,
      company,
      location,
      type,
    });

    if (existingJob) {
      return res.status(409).json({
        success: false,
        error: "Job already exists",
      });
    }

    // Create a new job object
    const job = new JobModel({
      title,
      company,
      location,
      type,
      salary,
      tags,
      remote,
      exp,
      desc,
      fullDesc,
      role,
      responsibilities,
    });

    // Save the job to the database
    await job.save();

    res.status(201).json({
      success: true,
      message: "Job created successfully",
      jobId: job._id,
    });
  } catch (err) {
    console.error("Save error:", err);
    res.status(500).json({
      success: false,
      error: "Error creating job: " + err.message,
    });
  }
};

let jobUpdate = async (req, res) => {
  try {
    const {
      id,
      title,
      company,
      location,
      type,
      salary,
      tags,
      remote,
      exp,
      desc,
      fullDesc,
      role,
      responsibilities,
    } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Job ID is required",
      });
    }

    // Check if job exists
    const existingJob = await JobModel.findById(id);

    if (!existingJob) {
      return res.status(404).json({
        success: false,
        error: "Job not found",
      });
    }

    // Update the job object
    existingJob.title = title || existingJob.title;
    existingJob.company = company || existingJob.company;
    existingJob.location = location || existingJob.location;
    existingJob.type = type || existingJob.type;
    existingJob.salary = salary || existingJob.salary;
    existingJob.tags = tags || existingJob.tags;
    existingJob.remote = remote !== undefined ? remote : existingJob.remote;
    existingJob.exp = exp || existingJob.exp;
    existingJob.desc = desc || existingJob.desc;
    existingJob.fullDesc = fullDesc || existingJob.fullDesc;
    existingJob.role = role || existingJob.role;
    existingJob.responsibilities =
      responsibilities || existingJob.responsibilities;

    // Save the updated job to the database
    await existingJob.save();

    res.json({
      success: true,
      message: "Job updated successfully",
    });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({
      success: false,
      error: "Error updating job: " + err.message,
    });
  }
};

let jobDelete = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Job ID is required",
      });
    }

    // Check if job exists and delete it
    const deletedJob = await JobModel.findByIdAndDelete(id);

    if (!deletedJob) {
      return res.status(404).json({
        success: false,
        error: "Job not found",
      });
    }

    res.json({
      success: true,
      message: "Job deleted successfully",
    });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({
      success: false,
      error: "Server error: " + err.message,
    });
  }
};

module.exports = {
  jobFetch,
  jobFetchById,
  jobInsert,
  jobUpdate,
  jobDelete,
};
