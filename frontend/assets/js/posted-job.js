// posted-job.js - Handles the display and management of posted jobs
document.addEventListener("DOMContentLoaded", function () {
  // Initialize UI elements
  const jobsContainer = document.getElementById("jobs-container");
  const loadingIndicator = document.getElementById("loading-indicator");
  const noJobsMessage = document.getElementById("no-jobs-message");
  const jobSearchInput = document.getElementById("job-search");
  const statusFilter = document.getElementById("status-filter");
  const sortBySelect = document.getElementById("sort-by");
  const deleteModal = document.getElementById("delete-modal");
  const cancelDeleteBtn = document.getElementById("cancel-delete");
  const confirmDeleteBtn = document.getElementById("confirm-delete");

  // State management
  let allJobs = [];
  let currentFilteredJobs = []; // Store filtered jobs for pagination
  let currentJobId = null;
  const PAGE_SIZE = 5;
  let currentPage = 1;

  // Initialize page
  fetchJobs();

  // Setup event listeners
  jobSearchInput.addEventListener("input", filterJobs);
  statusFilter.addEventListener("change", filterJobs);
  sortBySelect.addEventListener("change", filterJobs);
  cancelDeleteBtn.addEventListener("click", hideDeleteModal);
  confirmDeleteBtn.addEventListener("click", confirmDelete);

  /**
   * Fetch all jobs
   */
  function fetchJobs() {
    showLoading(true);

    // Use the appropriate API endpoint for your application
    fetch("http://localhost:8000/api/web/job")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        showLoading(false);

        if (data.success && Array.isArray(data.jobs)) {
          allJobs = data.jobs;
          currentFilteredJobs = allJobs; // Initialize filtered jobs
          if (allJobs.length > 0) {
            filterJobs(); // This will handle display and pagination
          } else {
            showNoJobsMessage(false);
          }
        } else {
          showError(data.error || "Failed to load jobs");
        }
      })
      .catch((error) => {
        showLoading(false);
        showError("Error connecting to the server");
        console.error("Error:", error);
      });
  }

  /**
   * Display jobs in the container
   * @param {Array} jobs - The jobs to display
   */
  function displayJobs(jobs) {
    // Clear the container except for loading indicator and no jobs message
    clearJobsContainer();

    // Hide no jobs message if we have jobs
    noJobsMessage.classList.add("hidden");

    // Calculate pagination bounds
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    const paginatedJobs = jobs.slice(startIndex, endIndex);

    if (paginatedJobs.length === 0) {
      // Check if this is due to search/filter or really no jobs
      const isSearching =
        jobSearchInput.value.trim() !== "" || statusFilter.value !== "all";
      showNoJobsMessage(isSearching);
      return;
    }

    // Get the template
    const template = document.getElementById("job-card-template");

    // Create and append job cards
    paginatedJobs.forEach((job) => {
      const jobCard = document.importNode(template.content, true);

      // Set job details
      jobCard.querySelector(".job-title").textContent =
        job.title || "Untitled Job";
      jobCard.querySelector(".job-company").textContent =
        job.company || "Company Not Specified";
      jobCard.querySelector(".job-location").textContent =
        job.location || "Location Not Specified";
      jobCard.querySelector(".job-type").textContent =
        formatJobType(job.type) || "Type Not Specified";
      jobCard.querySelector(".job-description").textContent =
        job.desc || "No description available";

      // Set job status
      const statusElement = jobCard.querySelector(".job-status");
      setJobStatus(statusElement, job.status || "active");

      // Set date
      const dateElement = jobCard.querySelector(".job-date");
      dateElement.textContent = formatDate(job.createdAt);

      // Set application and view counts
      jobCard.querySelector(".applications-count").textContent =
        job.applications || 0;
      jobCard.querySelector(".views-count").textContent = job.views || 0;

      // Add tags
      const tagsContainer = jobCard.querySelector(".job-tags");
      if (job.tags && Array.isArray(job.tags) && job.tags.length > 0) {
        job.tags.forEach((tag) => {
          const tagElement = document.createElement("span");
          tagElement.className =
            "bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded";
          tagElement.textContent = tag;
          tagsContainer.appendChild(tagElement);
        });
      } else {
        // Add a placeholder if no tags
        const noTagsEl = document.createElement("span");
        noTagsEl.className = "text-gray-400 text-xs";
        noTagsEl.textContent = "No tags";
        tagsContainer.appendChild(noTagsEl);
      }

      // Set up action buttons
      const editButton = jobCard.querySelector(".edit-job-btn");
      editButton.href = `/frontend/pages/post-job.html?id=${job._id}`;

      const deleteButton = jobCard.querySelector(".delete-job-btn");
      deleteButton.addEventListener("click", () => showDeleteModal(job._id));

      const toggleButton = jobCard.querySelector(".toggle-status-btn");
      const toggleText = toggleButton.querySelector(".toggle-text");
      toggleText.textContent =
        job.status === "active" ? "Deactivate" : "Activate";
      toggleButton.addEventListener("click", () =>
        toggleJobStatus(job._id, job.status)
      );

      // Add the job card to the container
      jobsContainer.appendChild(jobCard);
    });
  }

  /**
   * Filter jobs based on search, status, and sort options
   */
  function filterJobs() {
    const searchTerm = jobSearchInput.value.toLowerCase();
    const statusValue = statusFilter.value.toLowerCase();
    const sortValue = sortBySelect.value;

    // Filter jobs
    let filteredJobs = allJobs.filter((job) => {
      // Filter by search term
      const matchesSearch =
        (job.title && job.title.toLowerCase().includes(searchTerm)) ||
        (job.company && job.company.toLowerCase().includes(searchTerm)) ||
        (job.location && job.location.toLowerCase().includes(searchTerm));

      // Filter by status
      const matchesStatus =
        statusValue === "all" ||
        (job.status && job.status.toLowerCase() === statusValue);

      return matchesSearch && matchesStatus;
    });

    // Sort jobs
    filteredJobs = sortJobs(filteredJobs, sortValue);

    // Store filtered jobs for pagination
    currentFilteredJobs = filteredJobs;

    //  Always reset to page 1 when filtering changes
    currentPage = 1;

    function setupPagination(totalJobs) {
      const paginationContainer = document.getElementById("pagination");
      paginationContainer.innerHTML = "";

      const totalPages = Math.ceil(totalJobs / PAGE_SIZE);

      // Don't show pagination if no pages or only one page
      if (totalPages <= 1) {
        return;
      }

      // Previous page button
      const prevButton = createPaginationButton("Previous", currentPage > 1);
      if (currentPage > 1) {
        prevButton.addEventListener("click", () => {
          currentPage--;
          displayJobs(currentFilteredJobs);
          setupPagination(totalJobs); // Re-render pagination after page change
        });
      }
      paginationContainer.appendChild(prevButton);

      // Page number buttons
      for (let i = 1; i <= totalPages; i++) {
        const pageButton = createPaginationButton(
          i.toString(),
          true,
          i === currentPage
        );
        pageButton.addEventListener("click", () => {
          currentPage = i;
          displayJobs(currentFilteredJobs);
          setupPagination(totalJobs); // Re-render pagination after page change
        });
        paginationContainer.appendChild(pageButton);
      }

      // Next page button
      const nextButton = createPaginationButton(
        "Next",
        currentPage < totalPages
      );
      if (currentPage < totalPages) {
        nextButton.addEventListener("click", () => {
          currentPage++;
          displayJobs(currentFilteredJobs);
          setupPagination(totalJobs); // Re-render pagination after page change
        });
      }
      paginationContainer.appendChild(nextButton);
    }

    // Display jobs and set up pagination
    displayJobs(filteredJobs);
    setupPagination(filteredJobs.length);
  }

  /**
   * Sort jobs based on the selected option
   * @param {Array} jobs - The jobs to sort
   * @param {string} sortOption - The sort option
   * @returns {Array} - The sorted jobs
   */
  function sortJobs(jobs, sortOption) {
    switch (sortOption) {
      case "newest":
        return [...jobs].sort(
          (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );
      case "oldest":
        return [...jobs].sort(
          (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
        );
      case "title":
        return [...jobs].sort((a, b) =>
          (a.title || "").localeCompare(b.title || "")
        );
      default:
        return [...jobs];
    }
  }

  /**
   * Setup pagination controls
   * @param {number} totalJobs - The total number of jobs
   */
  function setupPagination(totalJobs) {
    const paginationContainer = document.getElementById("pagination");
    paginationContainer.innerHTML = "";

    const totalPages = Math.ceil(totalJobs / PAGE_SIZE);
    if (totalPages <= 1) return;

    // Previous page button
    const prevButton = createPaginationButton("Previous", currentPage > 1);
    if (currentPage > 1) {
      prevButton.addEventListener("click", () => {
        currentPage--;
        displayJobs(currentFilteredJobs);
      });
    }
    paginationContainer.appendChild(prevButton);

    // Page number buttons - Show limited number of pages
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Adjust if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages && startPage > 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      const pageButton = createPaginationButton(
        i.toString(),
        true,
        i === currentPage
      );
      pageButton.addEventListener("click", () => {
        currentPage = i;
        displayJobs(currentFilteredJobs);
      });
      paginationContainer.appendChild(pageButton);
    }

    // Next page button
    const nextButton = createPaginationButton("Next", currentPage < totalPages);
    if (currentPage < totalPages) {
      nextButton.addEventListener("click", () => {
        currentPage++;
        displayJobs(currentFilteredJobs);
      });
    }
    paginationContainer.appendChild(nextButton);
  }

  /**
   * Create a pagination button
   * @param {string} text - The button text
   * @param {boolean} enabled - Whether the button is enabled
   * @param {boolean} active - Whether the button is active (current page)
   * @returns {HTMLButtonElement} - The button element
   */
  function createPaginationButton(text, enabled = true, active = false) {
    const button = document.createElement("button");
    button.textContent = text;

    if (active) {
      button.className = "px-3 py-1 rounded gradient-bg text-white";
    } else if (enabled) {
      button.className = "px-3 py-1 rounded border hover:bg-gray-100";
    } else {
      button.className =
        "px-3 py-1 rounded border text-gray-400 cursor-not-allowed";
      button.disabled = true;
    }

    return button;
  }

  /**
   * Toggle job status (active/inactive)
   * @param {string} jobId - The ID of the job
   * @param {string} currentStatus - The current job status
   */
  function toggleJobStatus(jobId, currentStatus) {
    const newStatus = currentStatus === "active" ? "closed" : "active";

    // Show notification before API call to improve perceived performance
    const button = event.currentTarget;
    const toggleText = button.querySelector(".toggle-text");
    const originalText = toggleText.textContent;
    toggleText.textContent = "Updating...";
    button.disabled = true;

    fetch("http://localhost:8000/api/web/job/update-status", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: jobId,
        status: newStatus,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (data.success) {
          showNotification(
            `Job ${
              newStatus === "active" ? "activated" : "deactivated"
            } successfully!`,
            "success"
          );
          // Update local job data
          allJobs = allJobs.map((job) =>
            job._id === jobId ? { ...job, status: newStatus } : job
          );
          // Re-apply current filters
          filterJobs();
        } else {
          showNotification(`Error: ${data.error || "Unknown error"}`, "error");
          // Restore button
          toggleText.textContent = originalText;
          button.disabled = false;
        }
      })
      .catch((error) => {
        showNotification(`Error: ${error.message}`, "error");
        console.error("Error:", error);
        // Restore button
        toggleText.textContent = originalText;
        button.disabled = false;
      });
  }

  /**
   * Show delete confirmation modal
   * @param {string} jobId - The ID of the job to delete
   */
  function showDeleteModal(jobId) {
    currentJobId = jobId;
    deleteModal.classList.remove("hidden");
  }

  /**
   * Hide delete confirmation modal
   */
  function hideDeleteModal() {
    deleteModal.classList.add("hidden");
    currentJobId = null;
  }

  /**
   * Confirm and execute job deletion
   */
  function confirmDelete() {
    if (!currentJobId) return;

    // Show loading in the button
    const confirmButton = document.getElementById("confirm-delete");
    const originalText = confirmButton.textContent;
    confirmButton.textContent = "Deleting...";
    confirmButton.disabled = true;

    deleteJob(currentJobId)
      .then((success) => {
        hideDeleteModal();
        if (success) {
          // Remove job from local array
          allJobs = allJobs.filter((job) => job._id !== currentJobId);

          // Check if current page is now empty and adjust if needed
          const totalPages = Math.ceil(allJobs.length / PAGE_SIZE);
          if (currentPage > totalPages && currentPage > 1) {
            currentPage = totalPages || 1;
          }

          // Re-apply current filters and display updated jobs
          filterJobs();
        }
      })
      .finally(() => {
        confirmButton.textContent = originalText;
        confirmButton.disabled = false;
      });
  }

  /**
   * Delete a job
   * @param {string} jobId - The ID of the job to delete
   * @returns {Promise<boolean>} - Promise that resolves to success status
   */
  function deleteJob(jobId) {
    return fetch("http://localhost:8000/api/web/job/delete", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: jobId }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (data.success) {
          showNotification("Job deleted successfully!", "success");
          return true;
        } else {
          showNotification(`Error: ${data.error || "Unknown error"}`, "error");
          return false;
        }
      })
      .catch((error) => {
        showNotification(`Error: ${error.message}`, "error");
        console.error("Error:", error);
        return false;
      });
  }

  /**
   * Format job type for display
   * @param {string} type - The job type
   * @returns {string} - The formatted job type
   */
  function formatJobType(type) {
    if (!type) return "";
    return type.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  }

  /**
   * Format date for display
   * @param {string} dateString - The date string
   * @returns {string} - The formatted date
   */
  function formatDate(dateString) {
    if (!dateString) return "Unknown date";
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(date);
    } catch (e) {
      console.error("Date formatting error:", e);
      return "Invalid date";
    }
  }

  /**
   * Set job status style and text
   * @param {HTMLElement} element - The status element
   * @param {string} status - The job status
   */
  function setJobStatus(element, status) {
    let bgColor, textColor, statusText;

    switch (status.toLowerCase()) {
      case "active":
        bgColor = "bg-green-100";
        textColor = "text-green-800";
        statusText = "Active";
        break;
      case "closed":
        bgColor = "bg-red-100";
        textColor = "text-red-800";
        statusText = "Closed";
        break;
      case "draft":
        bgColor = "bg-gray-100";
        textColor = "text-gray-800";
        statusText = "Draft";
        break;
      default:
        bgColor = "bg-blue-100";
        textColor = "text-blue-800";
        statusText = status || "Unknown";
    }

    element.className = `${bgColor} ${textColor} px-2 py-1 text-xs rounded-full`;
    element.textContent = statusText;
  }

  /**
   * Show loading indicator
   * @param {boolean} show - Whether to show or hide the loading indicator
   */
  function showLoading(show) {
    if (show) {
      loadingIndicator.classList.remove("hidden");
    } else {
      loadingIndicator.classList.add("hidden");
    }
  }

  /**
   * Show no jobs message
   * @param {boolean} isSearchResult - Whether this is due to a search with no results
   */
  function showNoJobsMessage(isSearchResult = false) {
    clearJobsContainer();
    noJobsMessage.classList.remove("hidden");

    // Update the message text based on whether it's due to search/filter
    const messageTitle = noJobsMessage.querySelector("h3");
    const messageDesc = noJobsMessage.querySelector("p");
    const messageButton = noJobsMessage.querySelector("a");

    if (isSearchResult) {
      messageTitle.textContent = "No matching jobs found";
      messageDesc.textContent =
        "Try adjusting your search criteria or filters.";
      messageButton.classList.add("hidden"); // Hide the "Post your first job" button
    } else {
      messageTitle.textContent = "You haven't posted any jobs yet";
      messageDesc.textContent =
        "Start attracting candidates by posting your first job listing.";
      messageButton.classList.remove("hidden");
    }
  }

  /**
   * Clear the jobs container
   */
  function clearJobsContainer() {
    // Remove all child elements except loading and no jobs message
    Array.from(jobsContainer.children).forEach((child) => {
      if (child !== loadingIndicator && child !== noJobsMessage) {
        child.remove();
      }
    });
  }

  /**
   * Show a notification message
   * @param {string} message - The message to display
   * @param {string} type - The type of notification ('success' or 'error')
   */
  function showNotification(message, type) {
    // Check if notification container exists, create if not
    let notificationContainer = document.getElementById(
      "notification-container"
    );
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

  /**
   * Show error message
   * @param {string} message - The error message
   */
  function showError(message) {
    showNotification(message, "error");
  }
});
