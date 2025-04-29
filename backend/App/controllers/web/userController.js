// userController.js

const userModel = require("../../models/userModel");

let userInsert = (req, res) => {
  let { email, password, role, name } = req.body;

  // Check if user already exists
  userModel
    .findOne({ email: email })
    .then((existingUser) => {
      if (existingUser) {
        return res.json({
          success: false,
          error: "Email already registered",
        });
      }

      // Create a new user object
      let user = new userModel({
        email,
        password,
        role,
        name,
      });

      // Save the user to the database
      user
        .save()
        .then(() => {
          res.json({
            success: true,
            message: "User created successfully",
            user: {
              email: user.email,
              role: user.role,
              name: user.name,
              id: user._id,
            },
          });
        })
        .catch((err) => {
          console.error("Save error:", err);
          res.json({
            success: false,
            error: "Error creating user: " + err.message,
          });
        });
    })
    .catch((err) => {
      console.error("Find error:", err);
      res.json({
        success: false,
        error: "Server error: " + err.message,
      });
    });
};

let userLogin = (req, res) => {
  const { email, password } = req.body;

  // Find user by email and password
  userModel
    .findOne({ email: email, password: password })
    .then((user) => {
      if (user) {
        // User found, return success with user data
        res.json({
          success: true,
          message: "Login successful",
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        });
      } else {
        // No user found with matching credentials
        res.json({
          success: false,
          error: "Invalid email or password",
        });
      }
    })
    .catch((err) => {
      console.error("Login error:", err);
      res.json({
        success: false,
        error: "Error during login: " + err.message,
      });
    });
};

let forgotPassword = (req, res) => {
  const { email } = req.body;

  // Check if the email exists in the database
  userModel
    .findOne({ email: email })
    .then((user) => {
      if (user) {
        // In a real app, you would generate a token and send an email here
        // For now, we'll just confirm the email exists
        res.json({
          success: true,
          message: "Password reset link has been sent to your email address",
        });
      } else {
        // Email not found, but for security, don't reveal this
        res.json({
          success: true,
          message:
            "If an account exists with this email, reset instructions will be sent",
        });
      }
    })
    .catch((err) => {
      console.error("Forgot password error:", err);
      res.json({
        success: false,
        error: "An error occurred. Please try again later.",
      });
    });
};
let userView = async (req, res) => {
  const { id } = req.body; // or use req.params.id if sent via URL

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      error: "Invalid user ID format",
    });
  }

  try {
    const user = await userModel.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (err) {
    console.error("Find error:", err);
    res.status(500).json({
      success: false,
      error: "Server error: " + err.message,
    });
  }
};

module.exports = { userInsert, userLogin, forgotPassword, userView };
