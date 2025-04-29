// File: backend/App/modals/web/applicationModal.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const applicationSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  jobId: {
    type: Schema.Types.ObjectId,
    ref: "Job",
    required: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  experience: {
    type: String,
    required: true,
  },
  skills: {
    type: String,
    required: true,
  },
  education: {
    type: String,
  },
  coverLetter: {
    type: String,
  },
  resumeFile: {
    type: String, // Path to stored resume file
    required: true,
  },
  applicationDate: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ["pending", "reviewed", "interviewed", "rejected", "accepted"],
    default: "pending",
  },
  employerNotes: {
    type: String,
  },
});

// Create compound index for preventing duplicate applications
applicationSchema.index({ userId: 1, jobId: 1 }, { unique: true });

module.exports = mongoose.model("Application", applicationSchema);
