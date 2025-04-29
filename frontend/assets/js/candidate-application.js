// File: frontend/assets/js/candidate-application.js

document.addEventListener("DOMContentLoaded", function () {
  // Initialize variables
  const applicationsContainer = document.getElementById(
    "applications-container"
  );
  const loadingIndicator = document.getElementById("loading-indicator");
  const noApplicationsMessage = document.getElementById(
    "no-applications-message"
  );
  const applicationDetailModal = document.getElementById(
    "application-detail-modal"
  );
  const applicationDetailContent = document.querySelector(
    ".application-detail-content"
  );
  const statusFilter = document.getElementById("status-filter");
  const sortBy = document.getElementById("sort-by");
  const searchInput = document.getElementById("application-search");

  // Mock user ID (in production this would come from authentication)
  const currentUserId = "60d0fe4f5311236168a109ca"; // Example user ID

  // Fetch candidate's applications
  function fetchApplications() {
    // Show loading indicator
    loadingIndicator.style.display = "block";

    // Hide applications and no applications message
    if (noApplicationsMessage) noApplicationsMessage.classList.add("hidden");

    // In production, this would be a fetch to your API
    fetch(
      `http://localhost:8000//api/web/application/candidate/${currentUserId}`
    )
      .then((response) => response.json())
      .then((data) => {
        loadingIndicator.style.display = "none";

        if (data.success && data.applications.length > 0) {
          renderApplications(data.applications);
        } else {
          // Show no applications message
          if (noApplicationsMessage)
            noApplicationsMessage.classList.remove("hidden");
        }
      })
      .catch((error) => {
        console.error("Error fetching applications:", error);
        loadingIndicator.style.display = "none";

        // For demo, display static applications
        displayDemoApplications();
      });
  }

  // Display demo applications (for static page)
  function displayDemoApplications() {
    // Hide loading indicator and no applications message
    loadingIndicator.style.display = "none";
    if (noApplicationsMessage) noApplicationsMessage.classList.add("hidden");

    // The static HTML already contains demo applications
    const applicationCards = document.querySelectorAll(".application-card");
    applicationCards.forEach((card) => {
      card.style.display = "block";
    });

    // Add event listeners to view buttons
    setupViewButtonListeners();
  }

  // Render applications from API data
  function renderApplications(applications) {
    // Clear existing applications
    const existingCards = document.querySelectorAll(".application-card");
    existingCards.forEach((card) => {
      card.remove();
    });

    applications.forEach((application) => {
      const job = application.jobId;
      const applicationDate = new Date(application.applicationDate);
      const daysAgo = Math.floor(
        (new Date() - applicationDate) / (1000 * 60 * 60 * 24)
      );

      const card = document.createElement("div");
      card.className =
        "application-card bg-white rounded-lg shadow overflow-hidden";
      card.dataset.id = application._id;

      card.innerHTML = `
        <div class="p-6">
          <div class="flex flex-col md:flex-row justify-between">
            <!-- Application Info -->
            <div class="flex-1">
              <div class="flex items-center mb-2">
                <h3 class="text-xl font-bold text-gray-800 mr-3">${
                  job.title
                }</h3>
                <span class="px-2 py-1 text-xs rounded-full ${getStatusClass(
                  application.status
                )}">${capitalizeFirstLetter(application.status)}</span>
              </div>
              <div class="mb-4">
                <span class="text-gray-700 font-medium">${job.company}</span>
                <span class="mx-2">•</span>
                <span class="text-gray-700">${job.location}</span>
                <span class="mx-2">•</span>
                <span class="text-gray-700">${job.type}</span>
              </div>
              <p class="text-gray-600 mb-4">${
                job.description
                  ? job.description.substring(0, 120) + "..."
                  : "No description available"
              }</p>
              <div class="flex flex-wrap gap-2 mb-4">
                ${application.skills
                  .split(",")
                  .map(
                    (skill) =>
                      `<span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">${skill.trim()}</span>`
                  )
                  .join("")}
              </div>
              <div class="flex items-center text-gray-500 text-sm">
                <span class="mr-4"><i class="far fa-calendar-alt mr-1"></i> Applied on ${formatDate(
                  applicationDate
                )}</span>
                <span class="mr-4"><i class="far fa-clock mr-1"></i> ${daysAgo} days ago</span>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex flex-row md:flex-col justify-start gap-2 mt-4 md:mt-0 md:ml-4">
              <a href="#" class="view-application-btn text-blue-600 hover:text-blue-800 w-full text-right" data-id="${
                application._id
              }">
                <i class="fas fa-eye"></i> View
              </a>
              <button class="download-resume-btn text-green-600 hover:text-green-800 w-full text-right" data-path="${
                application.resumeFile
              }">
                <i class="fas fa-download"></i> Resume
              </button>
              <button class="delete-application-btn text-red-600 hover:text-red-800 w-full text-right" data-id="${
                application._id
              }">
                <i class="fas fa-trash"></i> Delete
              </button>
            </div>
          </div>
        </div>
      `;

      applicationsContainer.appendChild(card);
    });

    // Setup event listeners
    setupViewButtonListeners();
    setupDeleteButtonListeners();
    setupDownloadButtonListeners();
  }

  // Setup view application button listeners
  function setupViewButtonListeners() {
    const viewButtons = document.querySelectorAll(".view-application-btn");
    viewButtons.forEach((button) => {
      button.addEventListener("click", function (e) {
        e.preventDefault();
        const applicationId = this.getAttribute("data-id");
        viewApplicationDetails(applicationId);
      });
    });
  }

  // Setup delete application button listeners
  function setupDeleteButtonListeners() {
    const deleteButtons = document.querySelectorAll(".delete-application-btn");
    deleteButtons.forEach((button) => {
      button.addEventListener("click", function () {
        const applicationId = this.getAttribute("data-id");
        if (confirm("Are you sure you want to delete this application?")) {
          deleteApplication(applicationId);
        }
      });
    });
  }

  // Setup download resume button listeners
  function setupDownloadButtonListeners() {
    const downloadButtons = document.querySelectorAll(".download-resume-btn");
    downloadButtons.forEach((button) => {
      button.addEventListener("click", function () {
        const resumePath = this.getAttribute("data-path");
        if (resumePath) {
          window.open("/" + resumePath, "_blank");
        } else {
          alert("Resume file not available.");
        }
      });
    });
  }

  // View application details
  function viewApplicationDetails(applicationId) {
    // In production, fetch application details from API
    fetch(`http://localhost:8000//api/web/application/${applicationId}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          displayApplicationDetails(data.application);
        } else {
          console.error("Error fetching application details:", data.message);
          // For demo, display static application details
          displayDemoApplicationDetails();
        }
      })
      .catch((error) => {
        console.error("Error fetching application details:", error);
        // For demo, display static application details
        displayDemoApplicationDetails();
      });

    // Show modal
    applicationDetailModal.classList.remove("hidden");
  }

  // Display application details in modal
  function displayApplicationDetails(application) {
    const job = application.jobId;

    applicationDetailContent.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 class="font-bold text-lg mb-3">Job Details</h4>
          <p class="mb-2"><span class="font-medium">Position:</span> ${
            job.title
          }</p>
          <p class="mb-2"><span class="font-medium">Company:</span> ${
            job.company
          }</p>
          <p class="mb-2"><span class="font-medium">Location:</span> ${
            job.location
          }</p>
          <p class="mb-2"><span class="font-medium">Job Type:</span> ${
            job.type
          }</p>
          <p class="mb-4"><span class="font-medium">Salary:</span> ${
            job.salary || "Not specified"
          }</p>
          
          <h4 class="font-bold text-lg mb-3">Application Status</h4>
          <div class="mb-4">
            <span class="px-3 py-1 rounded-full ${getStatusClass(
              application.status
            )}">${capitalizeFirstLetter(application.status)}</span>
            <p class="mt-2 text-sm text-gray-600">Applied on ${formatDate(
              new Date(application.applicationDate)
            )}</p>
          </div>
        </div>
        
        <div>
          <h4 class="font-bold text-lg mb-3">Your Application</h4>
          <div class="mb-3">
            <p class="font-medium mb-1">Experience</p>
            <p class="text-gray-700">${application.experience}</p>
          </div>
          <div class="mb-3">
            <p class="font-medium mb-1">Skills</p>
            <p class="text-gray-700">${application.skills}</p>
          </div>
          <div class="mb-3">
            <p class="font-medium mb-1">Education</p>
            <p class="text-gray-700">${
              application.education || "Not provided"
            }</p>
          </div>
          <div class="mb-3">
            <p class="font-medium mb-1">Cover Letter</p>
            <p class="text-gray-700">${
              application.coverLetter || "Not provided"
            }</p>
          </div>
        </div>
      </div>
      
      ${
        application.employerNotes
          ? `<div class="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
          <h4 class="font-bold text-lg mb-2">Employer Notes</h4>
          <p>${application.employerNotes}</p>
        </div>`
          : ""
      }
    `;
  }

  // Display demo application details (for static page)
  function displayDemoApplicationDetails() {
    applicationDetailContent.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 class="font-bold text-lg mb-3">Job Details</h4>
          <p class="mb-2"><span class="font-medium">Position:</span> Senior Frontend Developer</p>
          <p class="mb-2"><span class="font-medium">Company:</span> Talent Jiva Tech</p>
          <p class="mb-2"><span class="font-medium">Location:</span> Bangalore, India</p>
          <p class="mb-2"><span class="font-medium">Job Type:</span> Full-time</p>
          <p class="mb-4"><span class="font-medium">Salary:</span> $80,000 - $100,000</p>
          
          <h4 class="font-bold text-lg mb-3">Application Status</h4>
          <div class="mb-4">
            <span class="px-3 py-1 rounded-full bg-yellow-100 text-yellow-800">Pending</span>
            <p class="mt-2 text-sm text-gray-600">Applied on Apr 15, 2025</p>
          </div>
        </div>
        
        <div>
          <h4 class="font-bold text-lg mb-3">Your Application</h4>
          <div class="mb-3">
            <p class="font-medium mb-1">Experience</p>
            <p class="text-gray-700">5+ years of frontend development experience</p>
          </div>
          <div class="mb-3">
            <p class="font-medium mb-1">Skills</p>
            <p class="text-gray-700">React, JavaScript, HTML, CSS, Tailwind CSS</p>
          </div>
          <div class="mb-3">
            <p class="font-medium mb-1">Education</p>
            <p class="text-gray-700">Bachelor's in Computer Science</p>
          </div>
          <div class="mb-3">
            <p class="font-medium mb-1">Cover Letter</p>
            <p class="text-gray-700">I am excited to apply for the Senior Frontend Developer position at Talent Jiva Tech...</p>
          </div>
        </div>
      </div>
    `;
  }

  // Delete application
  function deleteApplication(applicationId) {
    // In production, send delete request to API
    fetch("http://localhost:8000//api/web/application/delete", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ applicationId }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          // Remove application card from DOM
          const applicationCard = document.querySelector(
            `.application-card[data-id="${applicationId}"]`
          );
          if (applicationCard) {
            applicationCard.remove();
          }

          // Check if there are no applications left
          const remainingCards = document.querySelectorAll(".application-card");
          if (remainingCards.length === 0) {
            if (noApplicationsMessage)
              noApplicationsMessage.classList.remove("hidden");
          }

          alert("Application deleted successfully!");
        } else {
          console.error("Error deleting application:", data.message);
          alert("Failed to delete application. Please try again.");
        }
      })
      .catch((error) => {
        console.error("Error deleting application:", error);

        // For demo, just remove the application card
        const applicationCard = document.querySelector(
          `.application-card[data-id="${applicationId}"]`
        );
        if (applicationCard) {
          applicationCard.remove();
        }

        alert("Application deleted successfully! (Demo mode)");
      });
  }

  // Filter applications by status
  if (statusFilter) {
    statusFilter.addEventListener("change", function () {
      filterApplications();
    });
  }

  // Sort applications
  if (sortBy) {
    sortBy.addEventListener("change", function () {
      filterApplications();
    });
  }

  // Search applications
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      filterApplications();
    });
  }

  // Filter applications based on status, sort, and search
  function filterApplications() {
    const status = statusFilter.value;
    const sort = sortBy.value;
    const searchText = searchInput.value.toLowerCase();

    const applicationCards = document.querySelectorAll(".application-card");

    applicationCards.forEach((card) => {
      const statusElement = card.querySelector(".rounded-full");
      const titleElement = card.querySelector("h3");
      const companyElement = card.querySelector(".text-gray-700.font-medium");

      // Check if card matches filters
      let matchesStatus =
        status === "all" ||
        (statusElement && statusElement.textContent.toLowerCase() === status);
      let matchesSearch =
        !searchText ||
        (titleElement &&
          titleElement.textContent.toLowerCase().includes(searchText)) ||
        (companyElement &&
          companyElement.textContent.toLowerCase().includes(searchText));

      // Show or hide card
      if (matchesStatus && matchesSearch) {
        card.style.display = "block";
      } else {
        card.style.display = "none";
      }
    });

    // Sort cards - basic implementation for demo
    const sortedCards = Array.from(applicationCards).filter(
      (card) => card.style.display !== "none"
    );
    if (sort === "oldest") {
      sortedCards.reverse();
    } else if (sort === "company") {
      sortedCards.sort((a, b) => {
        const companyA =
          a
            .querySelector(".text-gray-700.font-medium")
            ?.textContent.toLowerCase() || "";
        const companyB =
          b
            .querySelector(".text-gray-700.font-medium")
            ?.textContent.toLowerCase() || "";
        return companyA.localeCompare(companyB);
      });
    }

    // Reorder cards in the DOM
    sortedCards.forEach((card) => {
      applicationsContainer.appendChild(card);
    });
  }

  // Helper functions
  function getStatusClass(status) {
    const statusClasses = {
      pending: "bg-yellow-100 text-yellow-800",
      reviewed: "bg-blue-100 text-blue-800",
      interviewed: "bg-purple-100 text-purple-800",
      rejected: "bg-red-100 text-red-800",
      accepted: "bg-green-100 text-green-800",
    };

    return statusClasses[status] || "bg-gray-100 text-gray-800";
  }

  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  function formatDate(date) {
    const options = { month: "short", day: "numeric", year: "numeric" };
    return date.toLocaleDateString("en-US", options);
  }

  // Close modal when close button is clicked
  const closeModalButtons = document.querySelectorAll(
    "#close-modal, #close-detail-btn"
  );
  closeModalButtons.forEach((button) => {
    button.addEventListener("click", function () {
      applicationDetailModal.classList.add("hidden");
    });
  });

  // Close modal when clicking outside the modal content
  applicationDetailModal.addEventListener("click", function (e) {
    if (e.target === applicationDetailModal) {
      applicationDetailModal.classList.add("hidden");
    }
  });

  // Initialize the page
  fetchApplications();
});
