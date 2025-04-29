// File: backend/App/routes/web/jobsRoutes.js
let express = require("express");
const {
  jobInsert,
  jobDelete,
  jobUpdate,
  jobFetch,
  jobFetchById,
} = require("../../controllers/web/jobController");
let jobRouter = express.Router();

jobRouter.get("/", jobFetch);
jobRouter.get("/:id", jobFetchById);
jobRouter.post("/insert", jobInsert);
jobRouter.put("/update", jobUpdate);
jobRouter.delete("/delete", jobDelete);

module.exports = jobRouter;
