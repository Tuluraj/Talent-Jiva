// post-job.js - Fixed version
document.addEventListener("DOMContentLoaded", function () {
  // Get the job form element
  const jobForm = document.getElementById("job-form");

  // Add submit event listener
  if (jobForm) {
    jobForm.addEventListener("submit", handleJobSubmit);
  }

  // Initialize any edit functionality if we're on an edit page
  const jobId = new URLSearchParams(window.location.search).get("id");
  if (jobId) {
    initializeEditMode(jobId);
  }
});

/**
 * Handle form submission for creating a new job
 * @param {Event} event - The form submit event
 */
function handleJobSubmit(event) {
  event.preventDefault();

  // Get form values
  const formData = getFormData();

  // Validate form data
  if (!validateFormData(formData)) {
    return;
  }

  // Determine if we're creating a new job or updating an existing one
  const jobId = new URLSearchParams(window.location.search).get("id");

  if (jobId) {
    // Update existing job
    updateJob(jobId, formData);
  } else {
    // Create new job
    createJob(formData);
  }
}

/**
 * Extract all form data as an object
 * @returns {Object} The form data as an object
 */
function getFormData() {
  return {
    title: document.getElementById("job-title").value.trim(),
    company: document.getElementById("company-name").value.trim(),
    location: document.getElementById("job-location").value.trim(),
    type: document.getElementById("job-type").value,
    salary: document.getElementById("salary-range").value.trim(),
    tags: document
      .getElementById("skills-required")
      .value.trim()
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag !== ""),
    remote: document.getElementById("remote-job").checked,
    exp: document.getElementById("experience").value.trim(),
    desc: document.getElementById("short-description").value.trim(),
    fullDesc: document.getElementById("job-description").value.trim(),
    role: document.getElementById("job-role").value.trim(),
    responsibilities: document
      .getElementById("responsibilities")
      .value.trim()
      .split("\n")
      .filter((item) => item.trim() !== "")
      .map((item) => item.trim()),
  };
}

/**
 * Validate form data and show appropriate error messages
 * @param {Object} formData - The job data to validate
 * @returns {boolean} True if data is valid, false otherwise
 */
function validateFormData(formData) {
  let isValid = true;
  const requiredFields = [
    "title",
    "company",
    "location",
    "type",
    "desc",
    "fullDesc",
  ];

  // Clear any existing error messages
  document.querySelectorAll(".error-message").forEach((elem) => elem.remove());
  document.querySelectorAll(".border-red-500").forEach((elem) => {
    elem.classList.remove("border-red-500");
  });

  // Check required fields
  for (const field of requiredFields) {
    const value = formData[field];
    if (!value || (Array.isArray(value) && value.length === 0)) {
      isValid = false;
      const inputElement = document.getElementById(fieldToElementId(field));
      showError(inputElement, "This field is required");
    }
  }

  // Validate tags
  if (formData.tags.length === 0) {
    isValid = false;
    showError(
      document.getElementById("skills-required"),
      "At least one skill is required"
    );
  }

  return isValid;
}

/**
 * Convert a field name to its corresponding element ID
 * @param {string} field - The field name
 * @returns {string} The corresponding element ID
 */
function fieldToElementId(field) {
  const mapping = {
    title: "job-title",
    company: "company-name",
    location: "job-location",
    type: "job-type",
    desc: "short-description",
    fullDesc: "job-description",
  };

  return mapping[field] || field;
}

/**
 * Show an error message for a form field
 * @param {HTMLElement} element - The input element with an error
 * @param {string} message - The error message to display
 */
function showError(element, message) {
  const errorDiv = document.createElement("div");
  errorDiv.className = "error-message text-red-500 text-sm mt-1";
  errorDiv.textContent = message;
  element.parentNode.appendChild(errorDiv);
  element.classList.add("border-red-500");
}

/**
 * Create a new job by sending data to the API
 * @param {Object} jobData - The job data to send
 */
function createJob(jobData) {
  // Show loading state
  const submitButton = document.querySelector('button[type="submit"]');
  const originalText = submitButton.textContent;
  submitButton.textContent = "Creating...";
  submitButton.disabled = true;

  // Make API request
  fetch("http://localhost:8000/api/web/job/insert", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(jobData),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        showNotification("Job created successfully!", "success");
        // Reset form after successful submission
        document.getElementById("job-form").reset();
        setTimeout(() => {
          window.location.href = "/frontend/pages/posted-job.html";
        }, 2000);
      } else {
        showNotification(`Error: ${data.error}`, "error");
      }
    })
    .catch((error) => {
      showNotification(`Error: ${error.message}`, "error");
      console.error("Error:", error);
    })
    .finally(() => {
      // Reset button state
      submitButton.textContent = originalText;
      submitButton.disabled = false;
    });
}

/**
 * Update an existing job
 * @param {string} jobId - The ID of the job to update
 * @param {Object} jobData - The updated job data
 */
function updateJob(jobId, jobData) {
  // Include the ID in the data
  const dataToSend = { ...jobData, id: jobId };

  // Show loading state
  const submitButton = document.querySelector('button[type="submit"]');
  const originalText = submitButton.textContent;
  submitButton.textContent = "Updating...";
  submitButton.disabled = true;

  // Make API request
  fetch("http://localhost:8000/api/web/job/update", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dataToSend),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        showNotification("Job updated successfully!", "success");
        setTimeout(() => {
          window.location.href = "/frontend/pages/posted-job.html";
        }, 2000);
      } else {
        showNotification(`Error: ${data.error}`, "error");
      }
    })
    .catch((error) => {
      showNotification(`Error: ${error.message}`, "error");
      console.error("Error:", error);
    })
    .finally(() => {
      // Reset button state
      submitButton.textContent = originalText;
      submitButton.disabled = false;
    });
}

/**
 * Delete a job
 * @param {string} jobId - The ID of the job to delete
 */
function deleteJob(jobId) {
  if (!confirm("Are you sure you want to delete this job?")) {
    return;
  }

  // Show loading state
  const deleteButton = document.querySelector('button[type="button"]');
  const originalText = deleteButton.textContent;
  deleteButton.textContent = "Deleting...";
  deleteButton.disabled = true;

  // Make API request
  fetch("http://localhost:8000/api/web/job/delete", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id: jobId }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        showNotification("Job deleted successfully!", "success");
        setTimeout(() => {
          window.location.href = "/frontend/pages/posted-job.html";
        }, 2000);
      } else {
        showNotification(`Error: ${data.error}`, "error");
      }
    })
    .catch((error) => {
      showNotification(`Error: ${error.message}`, "error");
      console.error("Error:", error);
    })
    .finally(() => {
      // Reset button state
      deleteButton.textContent = originalText;
      deleteButton.disabled = false;
    });
}

/**
 * Initialize edit mode by fetching job data
 * @param {string} jobId - The ID of the job to edit
 */
function initializeEditMode(jobId) {
  if (!jobId) return;

  // Update form title and button
  document.querySelector("h2").textContent = "Edit Job";
  document.querySelector('button[type="submit"]').textContent = "Update Job";

  // Fetch job data
  fetch(`http://localhost:8000/api/web/job/${jobId}`)
    .then((response) => response.json())
    .then((data) => {
      if (data.success && data.job) {
        populateFormWithJobData(data.job);
        addDeleteButton(jobId);
      } else {
        showNotification(`Error: ${data.error || "Job not found"}`, "error");
      }
    })
    .catch((error) => {
      showNotification(`Error: ${error.message}`, "error");
      console.error("Error:", error);
    });
}

/**
 * Populate form with existing job data
 * @param {Object} job - The job data to populate
 */
function populateFormWithJobData(job) {
  document.getElementById("job-title").value = job.title || "";
  document.getElementById("company-name").value = job.company || "";
  document.getElementById("job-location").value = job.location || "";
  document.getElementById("job-type").value = job.type || "full-time";
  document.getElementById("salary-range").value = job.salary || "";
  document.getElementById("skills-required").value = job.tags
    ? job.tags.join(", ")
    : "";
  document.getElementById("remote-job").checked = job.remote || false;
  document.getElementById("experience").value = job.exp || "";
  document.getElementById("short-description").value = job.desc || "";
  document.getElementById("job-description").value = job.fullDesc || "";
  document.getElementById("job-role").value = job.role || "";
  document.getElementById("responsibilities").value = job.responsibilities
    ? job.responsibilities.join("\n")
    : "";
}

/**
 * Add a delete button to the form
 * @param {string} jobId - The ID of the job
 */
function addDeleteButton(jobId) {
  // Check if delete button already exists
  if (document.querySelector(".bg-red-500")) return;

  const submitButton = document.querySelector('button[type="submit"]');
  const deleteButton = document.createElement("button");
  deleteButton.className =
    "bg-red-500 text-white px-8 py-3 rounded hover:bg-red-600 ml-4";
  deleteButton.textContent = "Delete Job";
  deleteButton.type = "button";
  deleteButton.onclick = () => deleteJob(jobId);
  submitButton.parentNode.appendChild(deleteButton);
}

/**
 * Show a notification message
 * @param {string} message - The message to display
 * @param {string} type - The type of notification ('success' or 'error')
 */
function showNotification(message, type) {
  // Check if notification container exists, create if not
  let notificationContainer = document.getElementById("notification-container");
  if (!notificationContainer) {
    notificationContainer = document.createElement("div");
    notificationContainer.id = "notification-container";
    notificationContainer.className = "fixed top-4 right-4 z-50";
    document.body.appendChild(notificationContainer);
  }

  // Create notification element
  const notification = document.createElement("div");
  notification.className = `p-4 mb-4 rounded shadow-md ${
    type === "success" ? "bg-green-500" : "bg-red-500"
  } text-white`;
  notification.textContent = message;

  // Add to container
  notificationContainer.appendChild(notification);

  // Remove after timeout
  setTimeout(() => {
    notification.remove();
    if (notificationContainer.children.length === 0) {
      notificationContainer.remove();
    }
  }, 5000);
}
