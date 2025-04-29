// file: backend/App/models/jobModel.js

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const JobsSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    company: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["full-time", "part-time", "contract", " internship"],
    },
    salary: {
      type: String,
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    remote: {
      type: Boolean,
      default: false,
    },
    exp: {
      type: String,
      required: true,
    },
    desc: {
      type: String,
      required: true,
    },
    fullDesc: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
    responsibilities: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

let JobModel = mongoose.model("Jobs", JobsSchema);
module.exports = JobModel;
