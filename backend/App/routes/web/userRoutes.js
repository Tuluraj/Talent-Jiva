// File: App/routes/web/userRoutes.js
let express = require("express");
const {
  userInsert,
  userLogin,
  forgotPassword,
  userView,
} = require("../../controllers/web/userController");
let userRouter = express.Router();

userRouter.post("/insert", userInsert);
userRouter.post("/login", userLogin);
userRouter.post("/forgot-password", forgotPassword);
userRouter.post("/view-profile", userView);

module.exports = userRouter;
