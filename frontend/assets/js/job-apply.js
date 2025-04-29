// job-apply.js

// Check user authentication status
document.addEventListener("DOMContentLoaded", function () {
  // Get job ID from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const jobId = urlParams.get("id");

  // Check if there's a job ID in URL or in localStorage
  if (!jobId) {
    // Try to get from localStorage
    const storedJobId = localStorage.getItem("currentJobId");
    if (storedJobId) {
      // Update URL without reloading
      const newUrl = new URL(window.location);
      newUrl.searchParams.set("id", storedJobId);
      window.history.pushState({}, "", newUrl);

      // Now fetch job details with the ID from localStorage
      fetchJobDetails(storedJobId);
    } else {
      // No job ID available, redirect to jobs page
      window.location.href = "/frontend/pages/all-job.html";
      return;
    }
  } else {
    // Save job ID to localStorage for persistence
    localStorage.setItem("currentJobId", jobId);

    // Fetch job details with the ID from URL
    fetchJobDetails(jobId);
  }

  // Set up form submission
  const form = document.getElementById("job-application-form");
  form.addEventListener("submit", handleFormSubmit);

  // Set up file input display
  const resumeInput = document.getElementById("resume");
  resumeInput.addEventListener("change", handleFileSelect);
});

// Function to fetch job details
function fetchJobDetails(jobId) {
  // Use the same endpoint as in job-details.js for consistency
  fetch(`http://localhost:8000/api/web/job/${jobId}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to fetch job details: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      if (!data.success) {
        throw new Error(data.error || "Failed to retrieve job details");
      }

      const job = data.job;

      // Update the template variables in the page
      document.getElementById("job-title").textContent = job.title;
      document.getElementById("company-name").textContent = job.company;
      document.getElementById("job-location").textContent = job.location;
      document.getElementById("job-type-badge").textContent = job.type;

      // Set remote badge
      const remoteBadge = document.getElementById("remote-badge");
      if (job.remote) {
        remoteBadge.textContent = "Remote";
        remoteBadge.style.display = "inline-block";
      } else {
        remoteBadge.textContent = "On-site";
        remoteBadge.style.display = "inline-block";
      }

      // Set company logo if available
      if (job.companyLogo) {
        document.getElementById("company-logo").src = job.companyLogo;
      }

      // Pre-fill job title in the application form if the field exists
      const jobTitleInput = document.getElementById("job-title-input");
      if (jobTitleInput) {
        jobTitleInput.value = job.title;
      }
    })
    .catch((error) => {
      console.error("Error fetching job details:", error);
      showErrorModal("Could not load job details. Please try again later.");
    });
}

// Handle file selection
function handleFileSelect(event) {
  const file = event.target.files[0];
  const fileNameDisplay = document.getElementById("file-name");

  if (file) {
    // Validate file type
    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!validTypes.includes(file.type)) {
      fileNameDisplay.textContent =
        "Invalid file type. Please upload PDF, DOC, or DOCX.";
      fileNameDisplay.classList.add("text-red-500");
      event.target.value = "";
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      fileNameDisplay.textContent = "File too large. Maximum size is 5MB.";
      fileNameDisplay.classList.add("text-red-500");
      event.target.value = "";
      return;
    }

    fileNameDisplay.textContent = file.name;
    fileNameDisplay.classList.remove("text-red-500");
    fileNameDisplay.classList.add("text-green-600");
  } else {
    fileNameDisplay.textContent = "";
  }
}

// Handle form submission - FIXED VERSION
async function handleFormSubmit(event) {
  event.preventDefault();

  // Validate form
  if (!validateForm()) {
    return;
  }

  // Check if user is authenticated - Use the auth module
  if (!auth.isAuthenticated()) {
    // Save current URL for redirect after login
    localStorage.setItem("pendingApplyUrl", window.location.href);
    showLoginRequiredModal();
    return;
  }

  const form = event.target;
  const formData = new FormData(form);

  // Get userId and jobId
  const userId = auth.getUserId(); // Use auth.getUserId() instead of localStorage
  const jobId =
    new URLSearchParams(window.location.search).get("id") ||
    localStorage.getItem("currentJobId");

  if (!jobId) {
    showErrorModal("Job ID not found. Please try again.");
    return;
  }

  // Add additional data to formData
  formData.append("userId", userId);
  formData.append("jobId", jobId);
  formData.append("applicationDate", new Date().toISOString());
  formData.append("status", "pending");

  // Show loading indicator
  const submitButton = form.querySelector('button[type="submit"]');
  const originalButtonText = submitButton.textContent;
  submitButton.disabled = true;
  submitButton.textContent = "Submitting...";

  try {
    // Make the fetch request
    const response = await fetch(
      "http://localhost:8000/api/web/application/insert",
      {
        method: "POST",
        body: formData, // Use FormData for multipart/form-data (file uploads)
      }
    );

    // Get the response text first (safer than direct json parsing)
    const responseText = await response.text();

    // Try to parse the response as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse response as JSON:", responseText);
      throw new Error("Server returned an invalid response");
    }

    // Handle response based on HTTP status
    if (!response.ok) {
      // If unauthorized, prompt for login
      if (response.status === 401) {
        localStorage.setItem("pendingApplyUrl", window.location.href);
        showLoginRequiredModal();
        return;
      }

      throw new Error(data?.message || "Failed to submit application");
    }

    // Success case
    showSuccessModal("Your application has been submitted successfully!");

    // Reset form after successful submission
    form.reset();
    document.getElementById("file-name").textContent = "";
  } catch (error) {
    console.error("Error submitting application:", error);
    showErrorModal(
      error.message || "Failed to submit application. Please try again."
    );
  } finally {
    // Restore button state
    submitButton.disabled = false;
    submitButton.textContent = originalButtonText;
  }
}

// Form validation
function validateForm() {
  const requiredFields = [
    "first-name",
    "last-name",
    "email",
    "phone",
    "experience",
    "skills",
    "resume",
  ];

  let isValid = true;

  requiredFields.forEach((field) => {
    const element = document.getElementById(field);
    if (!element.value.trim()) {
      highlightInvalidField(element);
      isValid = false;
    } else {
      removeInvalidHighlight(element);
    }
  });

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const emailField = document.getElementById("email");
  if (emailField.value && !emailRegex.test(emailField.value)) {
    highlightInvalidField(emailField, "Please enter a valid email address");
    isValid = false;
  }

  // Validate phone number
  const phoneField = document.getElementById("phone");
  const phoneRegex = /^\d{10,15}$/;
  if (
    phoneField.value &&
    !phoneRegex.test(phoneField.value.replace(/\D/g, ""))
  ) {
    highlightInvalidField(phoneField, "Please enter a valid phone number");
    isValid = false;
  }

  return isValid;
}

function highlightInvalidField(element, message) {
  element.classList.add("border-red-500", "bg-red-50");

  // Add error message if not already present
  let errorElement = element.nextElementSibling;
  if (!errorElement || !errorElement.classList.contains("error-message")) {
    errorElement = document.createElement("p");
    errorElement.className = "error-message text-red-500 text-sm mt-1";
    errorElement.textContent = message || "This field is required";
    element.parentNode.insertBefore(errorElement, element.nextSibling);
  }
}

function removeInvalidHighlight(element) {
  element.classList.remove("border-red-500", "bg-red-50");

  // Remove error message if present
  const errorElement = element.nextElementSibling;
  if (errorElement && errorElement.classList.contains("error-message")) {
    errorElement.remove();
  }
}

// Modal functions
function showLoginRequiredModal() {
  const modalHTML = `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" id="login-modal">
      <div class="bg-white rounded-lg p-8 max-w-md mx-4 shadow-xl">
        <h2 class="text-2xl font-bold mb-4">Login Required</h2>
        <p class="mb-6">You need to be logged in to apply for jobs. Please log in or create an account to continue.</p>
        <div class="flex justify-end space-x-4">
          <button id="cancel-login" class="px-4 py-2 border rounded hover:bg-gray-100">Cancel</button>
          <button id="go-to-login" class="px-4 py-2 gradient-bg text-white rounded hover:opacity-90">Login</button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", modalHTML);

  document.getElementById("cancel-login").addEventListener("click", () => {
    document.getElementById("login-modal").remove();
  });

  document.getElementById("go-to-login").addEventListener("click", () => {
    document.getElementById("login-modal").remove();
    showAuthModal(); // Use the modal from auth.js
  });
}

function showSuccessModal(message) {
  const modalHTML = `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" id="success-modal">
      <div class="bg-white rounded-lg p-8 max-w-md mx-4 shadow-xl">
        <div class="text-center mb-4">
          <svg class="h-16 w-16 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <h2 class="text-2xl font-bold mb-4 text-center">Success!</h2>
        <p class="mb-6 text-center">${message}</p>
        <div class="flex justify-center">
          <button id="close-success-modal" class="px-6 py-2 gradient-bg text-white rounded hover:opacity-90">OK</button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", modalHTML);

  document
    .getElementById("close-success-modal")
    .addEventListener("click", () => {
      document.getElementById("success-modal").remove();
      window.location.href = "/frontend/pages/candidate.html";
    });
}

function showErrorModal(message) {
  const modalHTML = `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" id="error-modal">
      <div class="bg-white rounded-lg p-8 max-w-md mx-4 shadow-xl">
        <div class="text-center mb-4">
          <svg class="h-16 w-16 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <h2 class="text-2xl font-bold mb-4 text-center">Error</h2>
        <p class="mb-6 text-center">${message}</p>
        <div class="flex justify-center">
          <button id="close-error-modal" class="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700">OK</button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", modalHTML);

  document.getElementById("close-error-modal").addEventListener("click", () => {
    document.getElementById("error-modal").remove();
  });
}
