let express = require("express");
let cors = require("cors");
let mongoose = require("mongoose");
const userRouter = require("./App/routes/web/userRoutes");
const jobRouter = require("./App/routes/web/jobsRoutes");
const applicationRouter = require("./App/routes/web/applicationRoutes");
const path = require("path");
require("dotenv").config();

let app = express();

app.use(cors());

app.use(express.json());

// Serve static files from the uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/web/user", userRouter);
app.use("/api/web/job", jobRouter);
app.use("/api/web/application", applicationRouter);

// connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(process.env.PORT || 3000, () => {
      console.log(`Server is running on port ${process.env.PORT || 3000}`);
    });
  })
  .catch((err) => {
    console.log("Error connecting to MongoDB", err.message);
  });
