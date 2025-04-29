// File: backend/App/routes/web/applicationRoutes.js
const express = require("express");
const {
  applicationInsert,
  fetchCandidateApplications,
  fetchJobApplications,
  fetchApplicationById,
  updateApplicationStatus,
  deleteApplication,
} = require("../../controllers/web/applicationController");
const applicationRouter = express.Router();

// Routes for handling applications
applicationRouter.post("/insert", applicationInsert);
applicationRouter.get("/candidate/:userId", fetchCandidateApplications);
applicationRouter.get("/job/:jobId", fetchJobApplications);
applicationRouter.get("/:id", fetchApplicationById);
applicationRouter.put("/update-status", updateApplicationStatus);
applicationRouter.delete("/delete", deleteApplication);

module.exports = applicationRouter;
