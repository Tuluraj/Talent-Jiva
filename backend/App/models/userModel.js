// App/models/user.model.js
const mongoose = require("mongoose");
let Schema = mongoose.Schema;
let UserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: ["candidate", "employer"],
      default: "candidate",
    },
  },
  { timestamps: true }
);

let UserModel = mongoose.model("User", UserSchema);
module.exports = UserModel;
