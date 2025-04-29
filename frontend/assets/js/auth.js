// file: frontend/assets/js/auth.js
let currentUser = null;

// Authentication functions
const auth = {
  isAuthenticated() {
    return !!currentUser;
  },
  getUserId() {
    return currentUser?.id;
  },

  getCurrentUserRole() {
    return currentUser?.role;
  },

  async login(email, password) {
    try {
      const response = await fetch("http://localhost:8000/api/web/user/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        currentUser = data.user;
        localStorage.setItem("currentUser", JSON.stringify(currentUser));
        return { success: true, user: currentUser };
      } else {
        return { success: false, error: data.message || "Invalid credentials" };
      }
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: "Server error. Please try again later." };
    }
  },

  logout() {
    currentUser = null;
    localStorage.removeItem("currentUser");
    window.location.href = "/frontend/pages/index.html";
  },

  async register(userData) {
    try {
      const response = await fetch(
        "http://localhost:8000/api/web/user/insert",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        }
      );

      const data = await response.json();

      if (data.success) {
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.message || "Registration failed" };
      }
    } catch (error) {
      console.error("Registration error:", error);
      return { success: false, error: "Server error. Please try again later." };
    }
  },
  async forgotPassword(email) {
    try {
      const response = await fetch(
        "http://localhost:8000/api/web/user/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Forgot password error:", error);
      return {
        success: false,
        error: "Server error. Please try again later.",
      };
    }
  },
};

// Enhanced Modal HTML with all features
const modalHTML = `
    <div id="auth-modal" class="fixed inset-0 bg-black bg-opacity-50 hidden z-50">
        <div class="fixed inset-0" style="backdrop-filter: blur(5px);"></div>
        <div class="relative z-10">
            <div class="bg-white rounded-lg max-w-5xl mx-auto mt-10 p-8 shadow-2xl">
                <!-- Back and Close buttons -->
                <button id="modal-back" class="absolute top-4 left-4 text-gray-600 hover:text-gray-800">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                    </svg>
                </button>
                <button id="modal-close" class="absolute top-4 right-4 text-gray-600 hover:text-gray-800">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>

                <!-- Notification Toast -->
                <div id="notification-toast" class="fixed top-4 right-4 max-w-md hidden transform transition-all duration-300">
                    <div class="flex items-center p-4 rounded-lg shadow-lg">
                        <div class="mr-3">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"></svg>
                        </div>
                        <div>
                            <p class="font-medium"></p>
                            <p class="text-sm"></p>
                        </div>
                    </div>
                </div>

                <div class="grid md:grid-cols-2 gap-8">
                    <!-- Left side - Forms -->
                    <div>
                        <!-- Login Form -->
                        <div id="login-form" class="space-y-6 transform transition-all duration-300">
                            <div class="text-center">
                                <h2 class="text-3xl font-bold mb-2">Welcome Back</h2>
                                <p class="text-gray-600">Please enter your details</p>
                            </div>
                            <div class="space-y-4">
                                <div class="form-field-animation">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input type="email" id="email" placeholder="Enter your email" 
                                        class="w-full p-3 border border-gray-300 rounded-lg transition-all duration-300">
                                </div>
                                <div class="form-field-animation relative">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                    <input type="password" id="password" placeholder="Enter your password" 
                                        class="w-full p-3 border border-gray-300 rounded-lg transition-all duration-300">
                                    <button class="toggle-password absolute right-3 top-9 text-gray-600">
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                        </svg>
                                    </button>
                                </div>
                                <div class="flex justify-between items-center">
                                    <label class="flex items-center">
                                        <input type="checkbox" class="form-checkbox h-4 w-4 text-blue-600">
                                        <span class="ml-2 text-sm text-gray-600">Remember me</span>
                                    </label>
                                    <button id="forgot-password-btn" class="text-sm text-blue-600 hover:text-blue-800">
                                        Forgot Password?
                                    </button>
                                </div>
                            </div>
                            <button id="login-btn" 
                                class="w-full gradient-bg text-white p-3 rounded-lg font-medium hover:opacity-90 transition-all duration-300 relative">
                                <span class="button-text">Sign In</span>
                                <div class="button-loader hidden">
                                    <div class="loader-spinner"></div>
                                </div>
                            </button>
                            <p class="text-center text-gray-600">
                                Don't have an account? 
                                <a href="#" id="show-signup" class="text-blue-600 font-medium hover:text-blue-800">Sign up</a>
                            </p>
                        </div>
                        
                        <!-- Signup Form -->
                        <div id="signup-form" class="hidden space-y-6 transform transition-all duration-300">
                            <div class="text-center">
                                <h2 class="text-3xl font-bold mb-2">Create Account</h2>
                                <p class="text-gray-600">Join us today</p>
                            </div>
                            <div class="space-y-4">
                                <div class="form-field-animation">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                    <input type="text" id="name" placeholder="Enter your full name" 
                                        class="w-full p-3 border border-gray-300 rounded-lg transition-all duration-300">
                                </div>
                                <div class="form-field-animation">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input type="email" id="signup-email" placeholder="Enter your email" 
                                        class="w-full p-3 border border-gray-300 rounded-lg transition-all duration-300">
                                </div>
                                <div class="form-field-animation relative">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                    <input type="password" id="signup-password" placeholder="Create a password" 
                                        class="w-full p-3 border border-gray-300 rounded-lg transition-all duration-300">
                                    <button class="toggle-password absolute right-3 top-9 text-gray-600">
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                        </svg>
                                    </button>
                                </div>
                                <div class="form-field-animation relative">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                                    <input type="password" id="confirm-password" placeholder="Confirm your password" 
                                        class="w-full p-3 border border-gray-300 rounded-lg transition-all duration-300">
                                    <button class="toggle-password absolute right-3 top-9 text-gray-600">
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                        </svg>
                                    </button>
                                </div>
                                <div class="form-field-animation">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                                    <select id="role" 
                                        class="w-full p-3 border border-gray-300 rounded-lg transition-all duration-300">
                                        <option value="candidate">Job Seeker</option>
                                        <option value="employer">Employer</option>
                                    </select>
                                </div>
                                <div class="form-field-animation">
                                    <label class="flex items-center">
                                        <input type="checkbox" id="terms-checkbox" class="form-checkbox h-4 w-4 text-blue-600">
                                        <span class="ml-2 text-sm text-gray-600">
                                            I agree to the <a href="/terms.html" target="_blank" class="text-blue-600 hover:text-blue-800">Terms and Conditions</a>
                                        </span>
                                    </label>
                                </div>
                            </div>
                            <button id="signup-btn" 
                                class="w-full gradient-bg text-white p-3 rounded-lg font-medium hover:opacity-90 transition-all duration-300 relative">
                                <span class="button-text">Create Account</span>
                                <div class="button-loader hidden">
                                    <div class="loader-spinner"></div>
                                </div>
                            </button>
                            <p class="text-center text-gray-600">
                                Already have an account? 
                                <a href="#" id="show-login" class="text-blue-600 font-medium hover:text-blue-800">Sign in</a>
                            </p>
                        </div>

                        <!-- Forgot Password Form -->
                        <div id="forgot-password-form" class="hidden space-y-6 transform transition-all duration-300">
                            <div class="text-center">
                                <h2 class="text-3xl font-bold mb-2">Reset Password</h2>
                                <p class="text-gray-600">Enter your email to receive reset instructions</p>
                            </div>
                            <div class="space-y-4">
                                <div class="form-field-animation">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input type="email" id="reset-email" placeholder="Enter your email" 
                                        class="w-full p-3 border border-gray-300 rounded-lg transition-all duration-300">
                                </div>
                            </div>
                            <button id="reset-password-btn" 
                                class="w-full gradient-bg text-white p-3 rounded-lg font-medium hover:opacity-90 transition-all duration-300 relative">
                                <span class="button-text">Send Reset Link</span>
                                <div class="button-loader hidden">
                                    <div class="loader-spinner"></div>
                                </div>
                            </button>
                            <p class="text-center text-gray-600">
                                Remember your password? 
                                <a href="#" id="back-to-login" class="text-blue-600 font-medium hover:text-blue-800">Back to login</a>
                            </p>
                        </div>
                    </div>

                    <!-- Right side - 3D illustration -->
                    <div class="hidden md:block">
                        <div class="h-full flex items-center justify-center">
                            <img src="/frontend/assets/images/login_ilu.jpg" alt="3D illustration" class="w-full max-w-md" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
`;

// Initialize authentication system
document.addEventListener("DOMContentLoaded", function () {
  // Insert modal HTML
  document.body.insertAdjacentHTML("beforeend", modalHTML);

  // Get DOM elements
  const modal = document.getElementById("auth-modal");
  const loginForm = document.getElementById("login-form");
  const signupForm = document.getElementById("signup-form");
  const forgotPasswordForm = document.getElementById("forgot-password-form");

  // Add logout button to navigation if user is logged in
  function updateNavigation() {
    const navDiv = document.querySelector("nav .md\\:flex");
    const existingLogoutBtn = document.querySelector("#logout-btn");

    if (auth.isAuthenticated() && !existingLogoutBtn && navDiv) {
      const logoutBtn = document.createElement("button");
      logoutBtn.id = "logout-btn";
      logoutBtn.className = "hover:text-gray-200";
      logoutBtn.textContent = "Logout";
      logoutBtn.addEventListener("click", () => auth.logout());
      navDiv.appendChild(logoutBtn);
    } else if (!auth.isAuthenticated() && existingLogoutBtn) {
      existingLogoutBtn.remove();
    }
  }

  // Handle sidebar logout functionality
  const sidebarLogoutBtn = document.getElementById("logoutBtn");
  if (sidebarLogoutBtn) {
    sidebarLogoutBtn.addEventListener("click", function (e) {
      e.preventDefault();
      auth.logout();
    });
  }

  // Add general logout functionality for any logout button with onclick="logout()"
  window.logout = function () {
    auth.logout();
  };

  // Update navigation on page load
  updateNavigation();

  // Handle login click from navigation
  const loginLink = document.querySelector('a[href*="login.html"]');
  if (loginLink) {
    loginLink.addEventListener("click", function (e) {
      e.preventDefault();
      if (!auth.isAuthenticated()) {
        showAuthModal();
      }
    });
  }

  // Add event listeners for dashboard links
  document
    .querySelectorAll(
      'a[href*="/frontend/pages/candidate.html"], a[href*="/frontend/pages/employer.html"]'
    )
    .forEach((link) => {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        const targetRole = this.href.includes("candidate")
          ? "candidate"
          : "employer";

        if (!auth.isAuthenticated()) {
          showAuthModal(targetRole);
        } else if (auth.getCurrentUserRole() === targetRole) {
          window.location.href = this.href;
        } else {
          alert("You do not have permission to access this area");
        }
      });
    });

  // Handle back button in modal
  document.getElementById("modal-back").addEventListener("click", function () {
    if (signupForm.classList.contains("hidden") === false) {
      signupForm.classList.add("hidden");
      loginForm.classList.remove("hidden");
    } else if (forgotPasswordForm.classList.contains("hidden") === false) {
      forgotPasswordForm.classList.add("hidden");
      loginForm.classList.remove("hidden");
    }
  });

  // Handle close button in modal
  document.getElementById("modal-close").addEventListener("click", function () {
    modal.classList.add("hidden");
    document.body.classList.remove("overflow-hidden");
  });

  // Handle login button click
  document
    .getElementById("login-btn")
    .addEventListener("click", async function () {
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      // Show loading state if available
      const buttonText = this.querySelector(".button-text");
      const buttonLoader = this.querySelector(".button-loader");

      if (buttonText && buttonLoader) {
        buttonText.classList.add("hidden");
        buttonLoader.classList.remove("hidden");
      }

      const result = await auth.login(email, password);

      // Hide loading state
      if (buttonText && buttonLoader) {
        buttonText.classList.remove("hidden");
        buttonLoader.classList.add("hidden");
      }

      if (result.success) {
        modal.classList.add("hidden");
        updateNavigation();
        // Check if there's a pending apply URL
        const pendingApplyUrl = localStorage.getItem("pendingApplyUrl");
        if (pendingApplyUrl) {
          localStorage.removeItem("pendingApplyUrl"); // Clear it
          window.location.href = pendingApplyUrl; // Redirect to apply page
        } else {
          // Regular login flow - redirect based on role
          if (result.user.role === "candidate") {
            window.location.href = "/frontend/pages/candidate.html";
          } else {
            window.location.href = "/frontend/pages/employer.html";
          }
        }
      } else {
        alert(result.error);
      }
    });

  // Handle signup button click
  document
    .getElementById("signup-btn")
    .addEventListener("click", async function () {
      const userData = {
        name: document.getElementById("name").value,
        email: document.getElementById("signup-email").value,
        password: document.getElementById("signup-password").value,
        role: document.getElementById("role").value,
      };

      // Show loading state if available
      const buttonText = this.querySelector(".button-text");
      const buttonLoader = this.querySelector(".button-loader");

      if (buttonText && buttonLoader) {
        buttonText.classList.add("hidden");
        buttonLoader.classList.remove("hidden");
      }

      const result = await auth.register(userData);

      // Hide loading state
      if (buttonText && buttonLoader) {
        buttonText.classList.remove("hidden");
        buttonLoader.classList.add("hidden");
      }

      if (result.success) {
        const loginResult = await auth.login(userData.email, userData.password);
        if (loginResult.success) {
          modal.classList.add("hidden");
          updateNavigation();
          // Redirect based on role
          if (loginResult.user.role === "candidate") {
            window.location.href = "/frontend/pages/candidate.html";
          } else {
            window.location.href = "/frontend/pages/employer.html";
          }
        }
      } else {
        alert(result.error);
      }
    });

  // Toggle between login and signup forms
  document
    .getElementById("show-signup")
    .addEventListener("click", function (e) {
      e.preventDefault();
      loginForm.classList.add("hidden");
      signupForm.classList.remove("hidden");
    });

  document.getElementById("show-login").addEventListener("click", function (e) {
    e.preventDefault();
    signupForm.classList.add("hidden");
    loginForm.classList.remove("hidden");
  });

  // Forgot password functionality
  document
    .getElementById("forgot-password-btn")
    .addEventListener("click", function (e) {
      e.preventDefault();
      loginForm.classList.add("hidden");
      forgotPasswordForm.classList.remove("hidden");
    });

  document
    .getElementById("back-to-login")
    .addEventListener("click", function (e) {
      e.preventDefault();
      forgotPasswordForm.classList.add("hidden");
      loginForm.classList.remove("hidden");
    });

  // Handle reset password button
  // Replace your existing reset-password-btn click handler with this:
  document
    .getElementById("reset-password-btn")
    .addEventListener("click", async function () {
      const email = document.getElementById("reset-email").value;

      if (!email) {
        alert("Please enter a valid email address");
        return;
      }

      // Show loading state if available
      const buttonText = this.querySelector(".button-text");
      const buttonLoader = this.querySelector(".button-loader");

      if (buttonText && buttonLoader) {
        buttonText.classList.add("hidden");
        buttonLoader.classList.remove("hidden");
      }

      // Send reset request to API
      const result = await auth.forgotPassword(email);

      // Hide loading state
      if (buttonText && buttonLoader) {
        buttonText.classList.remove("hidden");
        buttonLoader.classList.add("hidden");
      }

      // Show notification
      if (result.success) {
        // Create an obfuscated email for privacy (e.g., tj***sahu@gmail.com)
        const obfuscatedEmail = obfuscateEmail(email);

        // Show notification toast
        showNotification(
          "success",
          "Reset Link Sent",
          `Password reset instructions have been sent to ${obfuscatedEmail}`
        );

        // Return to login form
        document.getElementById("forgot-password-form").classList.add("hidden");
        document.getElementById("login-form").classList.remove("hidden");
      } else {
        showNotification("error", "Error", result.error);
      }
    });

  function obfuscateEmail(email) {
    const parts = email.split("@");
    if (parts.length !== 2) return email;

    const localPart = parts[0];
    const domain = parts[1];

    // If local part is 3 chars or less, just show first char
    if (localPart.length <= 3) {
      return localPart.charAt(0) + "**@" + domain;
    }

    // Otherwise show first 2 chars, some stars, and last char
    return (
      localPart.substring(0, 2) +
      "*".repeat(localPart.length - 3) +
      localPart.charAt(localPart.length - 1) +
      "@" +
      domain
    );
  }

  function showNotification(type, title, message) {
    const toast = document.getElementById("notification-toast");
    const icon = toast.querySelector("svg");
    const titleEl = toast.querySelector("p.font-medium");
    const messageEl = toast.querySelector("p.text-sm");

    // Set content
    titleEl.textContent = title;
    messageEl.textContent = message;

    // Style based on type
    if (type === "success") {
      toast.className =
        "fixed top-4 right-4 max-w-md bg-green-100 text-green-800 rounded-lg shadow-lg transform transition-all duration-300";
      icon.innerHTML =
        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>';
    } else {
      toast.className =
        "fixed top-4 right-4 max-w-md bg-red-100 text-red-800 rounded-lg shadow-lg transform transition-all duration-300";
      icon.innerHTML =
        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>';
    }

    // Show the toast
    toast.classList.remove("hidden");

    // Hide after 5 seconds
    setTimeout(() => {
      toast.classList.add("hidden");
    }, 5000);
  }

  // Toggle password visibility for all toggle buttons
  document.querySelectorAll(".toggle-password").forEach((button) => {
    button.addEventListener("click", function () {
      const passwordField = this.previousElementSibling;
      if (passwordField.type === "password") {
        passwordField.type = "text";
        this.innerHTML = `
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
          </svg>
        `;
      } else {
        passwordField.type = "password";
        this.innerHTML = `
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
          </svg>
        `;
      }
    });
  });

  // Close modal when clicking outside
  modal.addEventListener("click", function (e) {
    if (e.target === modal) {
      modal.classList.add("hidden");
      document.body.classList.remove("overflow-hidden");
    }
  });

  // Check for stored user session
  const storedUser = localStorage.getItem("currentUser");
  if (storedUser) {
    currentUser = JSON.parse(storedUser);
    updateNavigation();
  }
});

// Enhanced modal show function
function showAuthModal(targetRole) {
  const modal = document.getElementById("auth-modal");
  const roleSelect = document.getElementById("role");

  if (targetRole) {
    roleSelect.value = targetRole;
    roleSelect.disabled = true;
  } else {
    roleSelect.disabled = false;
  }

  modal.classList.remove("hidden");
  document.body.classList.add("overflow-hidden");

  // Reset to login form when opening modal
  document.getElementById("login-form").classList.remove("hidden");
  document.getElementById("signup-form").classList.add("hidden");
  document.getElementById("forgot-password-form").classList.add("hidden");
}
