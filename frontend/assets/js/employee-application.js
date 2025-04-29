// File: frontend/assets/js/employee-application.js

document.addEventListener("DOMContentLoaded", function () {
  // DOM elements
  const jobSelector = document.getElementById("job-selector");
  const applicationSearch = document.getElementById("application-search");
  const statusFilter = document.getElementById("status-filter");
  const sortBy = document.getElementById("sort-by");
  const applicationsContainer = document.getElementById(
    "applications-container"
  );
  const loadingIndicator = document.getElementById("loading-indicator");
  const noApplicationsMessage = document.getElementById(
    "no-applications-message"
  );
  const noJobsMessage = document.getElementById("no-jobs-message");
  const paginationContainer = document.getElementById("pagination");
  const applicationDetailModal = document.getElementById(
    "application-detail-modal"
  );
  const closeModalBtn = document.getElementById("close-modal");

  // State management
  let currentEmployerId;
  let employerJobs = [];
  let currentJobId = null;
  let applications = [];
  let filteredApplications = [];
  let currentPage = 1;
  const applicationsPerPage = 5;

  // Initialize the page
  init();

  async function init() {
    // Check authentication and get employer ID - FIXED: Use auth.getUserId() instead of getCurrentUserId()
    currentEmployerId = auth.getUserId(); // Using the correct function from auth.js

    if (!currentEmployerId) {
      window.location.href = "/frontend/pages/login.html";
      return;
    }

    // Load employer's jobs
    await loadEmployerJobs();

    // If jobs exist, load applications for the first job
    if (employerJobs.length > 0) {
      currentJobId = jobSelector.value;
      await loadApplications(currentJobId);
    } else {
      // Show no jobs message
      hideLoadingState();
      noJobsMessage.classList.remove("hidden");
    }

    // Setup event listeners
    setupEventListeners();
  }

  function setupEventListeners() {
    // Job selector change
    jobSelector.addEventListener("change", async function () {
      currentJobId = this.value;
      currentPage = 1;
      await loadApplications(currentJobId);
    });

    // Search field input
    applicationSearch.addEventListener("input", filterAndDisplayApplications);

    // Status filter change
    statusFilter.addEventListener("change", filterAndDisplayApplications);

    // Sort by change
    sortBy.addEventListener("change", filterAndDisplayApplications);

    // Close modal buttons
    closeModalBtn.addEventListener("click", closeModal);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        closeModal();
      }
    });
  }

  async function loadEmployerJobs() {
    try {
      showLoadingState();

      // Fetch jobs posted by the employer
      // In a real application, you would have an API endpoint for this
      const response = await fetch(
        `http://localhost:8000/api/web/application/job/${jobId}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch jobs");
      }

      const data = await response.json();

      if (data.success && data.jobs.length > 0) {
        employerJobs = data.jobs;
        populateJobSelector();
      } else {
        hideLoadingState();
        noJobsMessage.classList.remove("hidden");
      }
    } catch (error) {
      console.error("Error loading jobs:", error);
      alert("Failed to load jobs. Please try again later.");
      hideLoadingState();
    }
  }

  function populateJobSelector() {
    // Clear existing options except the default one
    while (jobSelector.options.length > 1) {
      jobSelector.remove(1);
    }

    // Add job options
    employerJobs.forEach((job) => {
      const option = document.createElement("option");
      option.value = job._id;
      option.textContent = job.title;
      jobSelector.appendChild(option);
    });

    // Set the first job as selected
    if (employerJobs.length > 0) {
      jobSelector.value = employerJobs[0]._id;
      currentJobId = employerJobs[0]._id;
    }
  }

  async function loadApplications(jobId) {
    if (!jobId) return;

    try {
      showLoadingState();

      // Fetch applications for the selected job
      const response = await fetch(
        `http://localhost:8000/api/web/application/job/${jobId}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch applications");
      }

      const data = await response.json();

      if (data.success) {
        applications = data.applications;
        filteredApplications = [...applications];
        filterAndDisplayApplications();
      } else {
        applications = [];
        filteredApplications = [];
        displayApplications();
      }
    } catch (error) {
      console.error("Error loading applications:", error);
      alert("Failed to load applications. Please try again later.");
      hideLoadingState();
    }
  }

  function filterAndDisplayApplications() {
    const searchTerm = applicationSearch.value.toLowerCase();
    const statusValue = statusFilter.value;
    const sortValue = sortBy.value;

    // Filter applications based on search term and status
    filteredApplications = applications.filter((app) => {
      const nameMatch =
        `${app.firstName} ${app.lastName}`.toLowerCase().includes(searchTerm) ||
        app.email.toLowerCase().includes(searchTerm);
      const statusMatch = statusValue === "all" || app.status === statusValue;

      return nameMatch && statusMatch;
    });

    // Sort applications
    sortApplications(sortValue);

    // Reset to first page when filters change
    currentPage = 1;

    // Display filtered applications
    displayApplications();
  }

  function sortApplications(sortValue) {
    switch (sortValue) {
      case "newest":
        filteredApplications.sort(
          (a, b) => new Date(b.applicationDate) - new Date(a.applicationDate)
        );
        break;
      case "oldest":
        filteredApplications.sort(
          (a, b) => new Date(a.applicationDate) - new Date(b.applicationDate)
        );
        break;
      case "name":
        filteredApplications.sort((a, b) =>
          `${a.firstName} ${a.lastName}`.localeCompare(
            `${b.firstName} ${b.lastName}`
          )
        );
        break;
      default:
        filteredApplications.sort(
          (a, b) => new Date(b.applicationDate) - new Date(a.applicationDate)
        );
    }
  }

  function displayApplications() {
    hideLoadingState();

    // Clear previous applications
    const existingCards = document.querySelectorAll(".application-card");
    existingCards.forEach((card) => card.remove());

    // Check if there are applications to display
    if (filteredApplications.length === 0) {
      noApplicationsMessage.classList.remove("hidden");
      paginationContainer.innerHTML = "";
      return;
    }

    // Hide no applications message
    noApplicationsMessage.classList.add("hidden");

    // Calculate pagination
    const startIndex = (currentPage - 1) * applicationsPerPage;
    const endIndex = Math.min(
      startIndex + applicationsPerPage,
      filteredApplications.length
    );
    const currentPageApplications = filteredApplications.slice(
      startIndex,
      endIndex
    );

    // Create application cards
    currentPageApplications.forEach((application) => {
      const card = createApplicationCard(application);
      applicationsContainer.appendChild(card);
    });

    // Update pagination
    updatePagination();
  }

  function createApplicationCard(application) {
    // Get user and job details from the application
    const {
      _id,
      firstName,
      lastName,
      email,
      phone,
      status,
      applicationDate,
      userId,
    } = application;

    // Create card element
    const card = document.createElement("div");
    card.className =
      "application-card bg-white rounded-lg shadow overflow-hidden";

    // Format date
    const formattedDate = new Date(applicationDate).toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );

    // Calculate days since application
    const daysSinceApplication = Math.floor(
      (new Date() - new Date(applicationDate)) / (1000 * 60 * 60 * 24)
    );

    // Status badge color
    const statusColors = {
      pending: "bg-yellow-100 text-yellow-800",
      reviewed: "bg-blue-100 text-blue-800",
      interviewed: "bg-purple-100 text-purple-800",
      accepted: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };

    // Card HTML
    card.innerHTML = `
      <div class="p-6">
        <div class="flex flex-col md:flex-row justify-between">
          <!-- Candidate Info -->
          <div class="flex-1">
            <div class="flex items-center mb-2">
              <h3 class="text-xl font-bold text-gray-800 mr-3">${firstName} ${lastName}</h3>
              <span class="px-2 py-1 text-xs rounded-full ${
                statusColors[status] || "bg-gray-100 text-gray-800"
              }">${status.charAt(0).toUpperCase() + status.slice(1)}</span>
            </div>
            <div class="mb-4">
              <span class="text-gray-700"><i class="far fa-envelope mr-1"></i>${email}</span>
              <span class="mx-2">•</span>
              <span class="text-gray-700"><i class="fas fa-phone mr-1"></i>${phone}</span>
            </div>
            <div class="flex items-center text-gray-500 text-sm">
              <span class="mr-4"><i class="far fa-calendar-alt mr-1"></i> Applied on ${formattedDate}</span>
              <span><i class="far fa-clock mr-1"></i> ${daysSinceApplication} days ago</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex flex-row md:flex-col justify-start gap-2 mt-4 md:mt-0 md:ml-4">
            <button class="view-application-btn text-blue-600 hover:text-blue-800 flex items-center justify-end" data-id="${_id}">
              <i class="fas fa-eye mr-1"></i> View Details
            </button>
            <button class="download-resume-btn text-green-600 hover:text-green-800 flex items-center justify-end" data-path="${
              application.resumeFile
            }">
              <i class="fas fa-download mr-1"></i> Download Resume
            </button>
            <div class="status-dropdown relative">
              <button class="update-status-btn text-gray-600 hover:text-gray-800 flex items-center justify-end">
                <i class="fas fa-edit mr-1"></i> Update Status
              </button>
              <div class="status-options absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg hidden z-10">
                <div class="py-1">
                  <button class="status-option block w-full text-left px-4 py-2 text-sm text-yellow-700 hover:bg-yellow-100" data-id="${_id}" data-status="pending">
                    <i class="fas fa-circle mr-2 text-yellow-500"></i> Pending
                  </button>
                  <button class="status-option block w-full text-left px-4 py-2 text-sm text-blue-700 hover:bg-blue-100" data-id="${_id}" data-status="reviewed">
                    <i class="fas fa-circle mr-2 text-blue-500"></i> Reviewed
                  </button>
                  <button class="status-option block w-full text-left px-4 py-2 text-sm text-purple-700 hover:bg-purple-100" data-id="${_id}" data-status="interviewed">
                    <i class="fas fa-circle mr-2 text-purple-500"></i> Interviewed
                  </button>
                  <button class="status-option block w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-green-100" data-id="${_id}" data-status="accepted">
                    <i class="fas fa-circle mr-2 text-green-500"></i> Accepted
                  </button>
                  <button class="status-option block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-100" data-id="${_id}" data-status="rejected">
                    <i class="fas fa-circle mr-2 text-red-500"></i> Rejected
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add event listeners
    const viewBtn = card.querySelector(".view-application-btn");
    viewBtn.addEventListener("click", () => openApplicationDetail(application));

    const downloadBtn = card.querySelector(".download-resume-btn");
    downloadBtn.addEventListener("click", () =>
      downloadResume(application.resumeFile)
    );

    const updateStatusBtn = card.querySelector(".update-status-btn");
    const statusOptions = card.querySelector(".status-options");

    updateStatusBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      statusOptions.classList.toggle("hidden");
    });

    // Add click listener to document to close dropdown when clicking outside
    document.addEventListener("click", () => {
      statusOptions.classList.add("hidden");
    });

    // Stop propagation to prevent dropdown from closing when clicking inside it
    statusOptions.addEventListener("click", (e) => {
      e.stopPropagation();
    });

    // Add event listeners to status options
    const statusOptionBtns = card.querySelectorAll(".status-option");
    statusOptionBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const applicationId = btn.dataset.id;
        const newStatus = btn.dataset.status;
        updateApplicationStatus(applicationId, newStatus);
        statusOptions.classList.add("hidden");
      });
    });

    return card;
  }

  function updatePagination() {
    paginationContainer.innerHTML = "";

    const totalPages = Math.ceil(
      filteredApplications.length / applicationsPerPage
    );

    if (totalPages <= 1) {
      return;
    }

    // Previous button
    if (currentPage > 1) {
      const prevButton = document.createElement("button");
      prevButton.className =
        "px-3 py-1 rounded border text-gray-700 hover:bg-gray-100";
      prevButton.innerHTML = "&laquo;";
      prevButton.addEventListener("click", () => {
        currentPage--;
        displayApplications();
        window.scrollTo(0, 0);
      });
      paginationContainer.appendChild(prevButton);
    }

    // Page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Adjust startPage if endPage is maxed out
    if (endPage === totalPages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      const pageButton = document.createElement("button");
      pageButton.className = `px-3 py-1 rounded border ${
        i === currentPage
          ? "bg-gray-200 font-bold"
          : "text-gray-700 hover:bg-gray-100"
      }`;
      pageButton.textContent = i;
      pageButton.addEventListener("click", () => {
        currentPage = i;
        displayApplications();
        window.scrollTo(0, 0);
      });
      paginationContainer.appendChild(pageButton);
    }

    // Show ellipsis if there are more pages
    if (endPage < totalPages) {
      const ellipsis = document.createElement("span");
      ellipsis.className = "px-3 py-1";
      ellipsis.textContent = "...";
      paginationContainer.appendChild(ellipsis);

      // Add last page button
      const lastPageButton = document.createElement("button");
      lastPageButton.className =
        "px-3 py-1 rounded border text-gray-700 hover:bg-gray-100";
      lastPageButton.textContent = totalPages;
      lastPageButton.addEventListener("click", () => {
        currentPage = totalPages;
        displayApplications();
        window.scrollTo(0, 0);
      });
      paginationContainer.appendChild(lastPageButton);
    }

    // Next button
    if (currentPage < totalPages) {
      const nextButton = document.createElement("button");
      nextButton.className =
        "px-3 py-1 rounded border text-gray-700 hover:bg-gray-100";
      nextButton.innerHTML = "&raquo;";
      nextButton.addEventListener("click", () => {
        currentPage++;
        displayApplications();
        window.scrollTo(0, 0);
      });
      paginationContainer.appendChild(nextButton);
    }
  }

  async function updateApplicationStatus(applicationId, newStatus) {
    try {
      // Build request data
      const requestData = {
        applicationId,
        status: newStatus,
        notes: "", // You could add a notes field in the modal for this
      };

      // Make API request to update status
      const response = await fetch("/api/web/application/update-status", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error("Failed to update application status");
      }

      const data = await response.json();

      if (data.success) {
        // Update application in local array
        const applicationIndex = applications.findIndex(
          (app) => app._id === applicationId
        );
        if (applicationIndex !== -1) {
          applications[applicationIndex].status = newStatus;

          // Also update in filtered array if present
          const filteredIndex = filteredApplications.findIndex(
            (app) => app._id === applicationId
          );
          if (filteredIndex !== -1) {
            filteredApplications[filteredIndex].status = newStatus;
          }

          // Refresh display
          displayApplications();
        }
      } else {
        throw new Error(data.message || "Failed to update application status");
      }
    } catch (error) {
      console.error("Error updating application status:", error);
      alert(`Failed to update status: ${error.message}`);
    }
  }

  function openApplicationDetail(application) {
    // Get references to modal elements
    const candidateInfoContainer = document.getElementById("candidate-info");
    const statusControlsContainer = document.getElementById("status-controls");

    // Format application date
    const formattedDate = new Date(
      application.applicationDate
    ).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    // Populate candidate information
    candidateInfoContainer.innerHTML = `
      <h4 class="text-xl font-bold mb-4">${application.firstName} ${
      application.lastName
    }</h4>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <p class="text-gray-600 mb-1">Email</p>
          <p class="font-medium">${application.email}</p>
        </div>
        <div>
          <p class="text-gray-600 mb-1">Phone</p>
          <p class="font-medium">${application.phone}</p>
        </div>
        <div>
          <p class="text-gray-600 mb-1">Applied On</p>
          <p class="font-medium">${formattedDate}</p>
        </div>
        <div>
          <p class="text-gray-600 mb-1">Experience</p>
          <p class="font-medium">${application.experience}</p>
        </div>
      </div>
      
      <div class="mb-6">
        <h5 class="font-bold text-gray-700 mb-2">Skills</h5>
        <p>${application.skills}</p>
      </div>
      
      ${
        application.education
          ? `
        <div class="mb-6">
          <h5 class="font-bold text-gray-700 mb-2">Education</h5>
          <p>${application.education}</p>
        </div>
      `
          : ""
      }
      
      ${
        application.coverLetter
          ? `
        <div class="mb-6">
          <h5 class="font-bold text-gray-700 mb-2">Cover Letter</h5>
          <div class="bg-gray-50 p-3 rounded">${application.coverLetter}</div>
        </div>
      `
          : ""
      }
      
      <div class="mt-4">
        <button class="download-resume-modal-btn bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600" data-path="${
          application.resumeFile
        }">
          <i class="fas fa-download mr-2"></i> Download Resume
        </button>
      </div>
    `;

    // Status control colors
    const statusColors = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      reviewed: "bg-blue-100 text-blue-800 border-blue-200",
      interviewed: "bg-purple-100 text-purple-800 border-purple-200",
      accepted: "bg-green-100 text-green-800 border-green-200",
      rejected: "bg-red-100 text-red-800 border-red-200",
    };

    // Populate status controls
    statusControlsContainer.innerHTML = `
      <div class="status-badge mb-4 p-3 rounded-lg ${
        statusColors[application.status] || "bg-gray-100"
      } border">
        <p class="font-bold">Current Status:</p>
        <p class="text-lg">${
          application.status.charAt(0).toUpperCase() +
          application.status.slice(1)
        }</p>
      </div>
      
      <div class="mb-4">
        <label class="block text-gray-700 mb-2">Update Status</label>
        <select id="modal-status-select" class="w-full border rounded-md px-3 py-2">
          <option value="pending" ${
            application.status === "pending" ? "selected" : ""
          }>Pending</option>
          <option value="reviewed" ${
            application.status === "reviewed" ? "selected" : ""
          }>Reviewed</option>
          <option value="interviewed" ${
            application.status === "interviewed" ? "selected" : ""
          }>Interviewed</option>
          <option value="accepted" ${
            application.status === "accepted" ? "selected" : ""
          }>Accepted</option>
          <option value="rejected" ${
            application.status === "rejected" ? "selected" : ""
          }>Rejected</option>
        </select>
      </div>
      
      <div class="mb-4">
        <label class="block text-gray-700 mb-2">Notes to Candidate</label>
        <textarea id="modal-notes-textarea" class="w-full border rounded-md px-3 py-2 h-32" placeholder="Add feedback or notes about this candidate...">${
          application.employerNotes || ""
        }</textarea>
      </div>
      
      <div class="flex justify-between mt-6">
        <button id="save-status-btn" class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600" data-id="${
          application._id
        }">
          Save Changes
        </button>
        
        <button id="reject-application-btn" class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 ${
          application.status === "rejected" ? "hidden" : ""
        }" data-id="${application._id}">
          Reject Application
        </button>
      </div>
    `;

    // Add event listeners to modal buttons
    const downloadResumeBtn = candidateInfoContainer.querySelector(
      ".download-resume-modal-btn"
    );
    downloadResumeBtn.addEventListener("click", () =>
      downloadResume(application.resumeFile)
    );

    const saveStatusBtn = document.getElementById("save-status-btn");
    saveStatusBtn.addEventListener("click", () => {
      const newStatus = document.getElementById("modal-status-select").value;
      const notes = document.getElementById("modal-notes-textarea").value;
      updateApplicationWithNotes(application._id, newStatus, notes);
    });

    const rejectBtn = document.getElementById("reject-application-btn");
    if (rejectBtn) {
      rejectBtn.addEventListener("click", () => {
        document.getElementById("modal-status-select").value = "rejected";
        document.getElementById("save-status-btn").click();
      });
    }

    // Show the modal
    applicationDetailModal.classList.remove("hidden");
  }

  async function updateApplicationWithNotes(applicationId, newStatus, notes) {
    try {
      // Build request data
      const requestData = {
        applicationId,
        status: newStatus,
        notes,
      };

      // Make API request to update status
      const response = await fetch("/api/web/application/update-status", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error("Failed to update application");
      }

      const data = await response.json();

      if (data.success) {
        // Update application in local array
        const applicationIndex = applications.findIndex(
          (app) => app._id === applicationId
        );
        if (applicationIndex !== -1) {
          applications[applicationIndex].status = newStatus;
          applications[applicationIndex].employerNotes = notes;

          // Also update in filtered array if present
          const filteredIndex = filteredApplications.findIndex(
            (app) => app._id === applicationId
          );
          if (filteredIndex !== -1) {
            filteredApplications[filteredIndex].status = newStatus;
            filteredApplications[filteredIndex].employerNotes = notes;
          }

          // Show success message
          alert("Application updated successfully");

          // Close the modal
          closeModal();

          // Refresh display
          displayApplications();
        }
      } else {
        throw new Error(data.message || "Failed to update application");
      }
    } catch (error) {
      console.error("Error updating application:", error);
      alert(`Failed to update application: ${error.message}`);
    }
  }

  function downloadResume(filePath) {
    if (!filePath) {
      alert("Resume file not found");
      return;
    }

    // Create a temporary anchor to trigger download
    const downloadLink = document.createElement("a");
    downloadLink.href = "/" + filePath; // Assuming the path is relative to the server root
    downloadLink.target = "_blank";
    downloadLink.download = filePath.split("/").pop(); // Extract filename

    // Append, click, and remove
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  }

  function closeModal() {
    applicationDetailModal.classList.add("hidden");
  }

  function showLoadingState() {
    loadingIndicator.style.display = "block";
    noApplicationsMessage.classList.add("hidden");
    noJobsMessage.classList.add("hidden");
  }

  function hideLoadingState() {
    loadingIndicator.style.display = "none";
  }
});
