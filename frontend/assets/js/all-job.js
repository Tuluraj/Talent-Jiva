document.addEventListener("DOMContentLoaded", function () {
  // Get DOM elements
  const jobsGrid = document.querySelector(".jobs-grid");
  const searchForm = document.querySelector(".jobs-search-form");
  const jobInput = searchForm?.querySelector(
    'input[placeholder="Job title or keyword"]'
  );
  const locationInput = searchForm?.querySelector(
    'input[placeholder="Location"]'
  );
  const jobCountElement = document.getElementById("job-count");
  const sortSelect = document.getElementById("sort-select");

  const noResultsTemplate = `
      <div class="col-span-full text-center py-12">
          <div class="max-w-sm mx-auto">
              <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <h3 class="text-lg font-semibold text-gray-900 mb-2">No jobs found</h3>
              <p class="text-gray-600 mb-4">We couldn't find any jobs matching your search criteria.</p>
              <button onclick="clearSearch()" class="gradient-bg text-white px-6 py-2 rounded hover:opacity-90">
                  Clear Search
              </button>
          </div>
      </div>
  `;

  // Error message template
  const errorTemplate = `
      <div class="col-span-full text-center py-12">
          <div class="max-w-sm mx-auto">
              <svg class="w-16 h-16 mx-auto text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              <h3 class="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h3>
              <p class="text-gray-600 mb-4">There was an error loading the jobs. Please try again later.</p>
              <button onclick="window.location.reload()" class="gradient-bg text-white px-6 py-2 rounded hover:opacity-90">
                  Retry
              </button>
          </div>
      </div>
  `;

  // API URL
  const API_URL = "http://localhost:8000/api/web/job/";

  // Get URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const jobQuery = urlParams.get("job") || "";
  const locationQuery = urlParams.get("location") || "";

  // Initialize filters object
  let filters = {
    job: jobQuery,
    location: locationQuery,
    types: [],
    remote: null,
  };

  // Store all jobs data
  let allJobs = [];
  let currentPage = 1;
  const jobsPerPage = 10;

  // Initialize the page
  try {
    initializeFilters();
    fetchJobs();
  } catch (error) {
    console.error("Error initializing page:", error);
    showError();
  }

  // Set up event listeners
  if (searchForm) {
    searchForm.addEventListener("submit", handleSearch);
  }

  // Set up filter listeners
  document.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    checkbox.addEventListener("change", handleFilterChange);
  });

  // Set up sort listener
  if (sortSelect) {
    sortSelect.addEventListener("change", handleSortChange);
  }

  // Set up pagination listeners
  document.querySelectorAll(".pagination-btn").forEach((button) => {
    button.addEventListener("click", handlePagination);
  });

  // Function to initialize filters
  function initializeFilters() {
    // Clear the search inputs first
    if (jobInput) jobInput.value = "";
    if (locationInput) locationInput.value = "";

    // Only set values if there are search parameters
    if (jobQuery || locationQuery) {
      if (jobInput) jobInput.value = jobQuery;
      if (locationInput) locationInput.value = locationQuery;
    }

    // Clear URL parameters after initializing filters
    if (window.history.replaceState) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }

  // Function to fetch jobs from API
  async function fetchJobs() {
    try {
      // Show loading state
      if (jobsGrid) {
        jobsGrid.innerHTML = `
          <div class="col-span-full text-center py-12">
            <div class="mx-auto">
              <svg class="animate-spin h-10 w-10 mx-auto text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p class="mt-3 text-gray-600">Loading jobs...</p>
            </div>
          </div>
        `;
      }

      // Construct query parameters for filtering from the backend
      let queryParams = new URLSearchParams();

      if (filters.job) {
        queryParams.append("search", filters.job);
      }

      if (filters.location) {
        queryParams.append("location", filters.location);
      }

      if (filters.types.length > 0) {
        queryParams.append("types", filters.types.join(","));
      }

      if (filters.remote !== null) {
        queryParams.append("remote", filters.remote);
      }

      // Add sorting parameter if needed
      if (sortSelect && sortSelect.value) {
        queryParams.append("sort", sortSelect.value);
      }

      // Add pagination parameters
      queryParams.append("page", currentPage);
      queryParams.append("limit", jobsPerPage);

      // Fetch jobs from API
      const response = await fetch(`${API_URL}?${queryParams.toString()}`);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        allJobs = data.jobs || [];
        updateJobsDisplay(allJobs);

        // Update job count
        if (jobCountElement) {
          jobCountElement.textContent = `Showing ${allJobs.length} jobs`;
        }

        // Update pagination
        updatePagination(data.pagination);
      } else {
        console.error("API returned error:", data.message);
        showError();
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
      showError();
    }
  }

  // Function to handle search
  function handleSearch(e) {
    e.preventDefault();

    try {
      filters.job = jobInput?.value || "";
      filters.location = locationInput?.value || "";
      currentPage = 1; // Reset to first page on new search
      fetchJobs();
    } catch (error) {
      console.error("Error handling search:", error);
      showError();
    }
  }

  // Function to handle filter changes
  function handleFilterChange(e) {
    try {
      if (e.target.id === "remote-only") {
        filters.remote = e.target.checked;
      } else {
        const type = e.target.value;
        if (e.target.checked) {
          filters.types.push(type);
        } else {
          filters.types = filters.types.filter((t) => t !== type);
        }
      }
      currentPage = 1; // Reset to first page on filter change
      fetchJobs();
    } catch (error) {
      console.error("Error handling filter change:", error);
      showError();
    }
  }

  // Function to handle sort changes
  function handleSortChange(e) {
    try {
      fetchJobs();
    } catch (error) {
      console.error("Error handling sort change:", error);
      showError();
    }
  }

  // Function to handle pagination
  function handlePagination(e) {
    try {
      const action = e.target.dataset.action;

      if (action === "prev" && currentPage > 1) {
        currentPage--;
      } else if (action === "next") {
        currentPage++;
      } else if (action === "page") {
        currentPage = parseInt(e.target.dataset.page);
      }

      fetchJobs();
      // Scroll to top of jobs section
      document
        .querySelector(".jobs-grid")
        .scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      console.error("Error handling pagination:", error);
      showError();
    }
  }

  // Function to update pagination UI
  function updatePagination(paginationData) {
    if (!paginationData) return;

    const paginationContainer = document.querySelector(".pagination");
    if (!paginationContainer) return;

    const { currentPage, totalPages } = paginationData;

    let paginationHTML = `
      <button data-action="prev" class="pagination-btn px-4 py-2 rounded-l-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 ${
        currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""
      }">
          Previous
      </button>
    `;

    // Create page buttons
    for (let i = 1; i <= totalPages; i++) {
      paginationHTML += `
        <button data-action="page" data-page="${i}" class="pagination-btn px-4 py-2 border-t border-b border-gray-300 ${
        currentPage === i
          ? "bg-blue-600 text-white"
          : "bg-white text-gray-700 hover:bg-gray-50"
      }">
            ${i}
        </button>
      `;
    }

    paginationHTML += `
      <button data-action="next" class="pagination-btn px-4 py-2 rounded-r-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 ${
        currentPage === totalPages ? "opacity-50 cursor-not-allowed" : ""
      }">
          Next
      </button>
    `;

    paginationContainer.innerHTML = paginationHTML;

    // Reattach event listeners
    document.querySelectorAll(".pagination-btn").forEach((button) => {
      button.addEventListener("click", handlePagination);
    });
  }

  // Function to clear search
  window.clearSearch = function () {
    try {
      // Reset filters
      filters = {
        job: "",
        location: "",
        types: [],
        remote: null,
      };

      // Clear input fields
      if (jobInput) jobInput.value = "";
      if (locationInput) locationInput.value = "";

      // Reset checkboxes
      document
        .querySelectorAll('input[type="checkbox"]')
        .forEach((checkbox) => {
          checkbox.checked = false;
        });

      // Reset to first page
      currentPage = 1;

      // Update listings
      fetchJobs();
    } catch (error) {
      console.error("Error clearing search:", error);
      showError();
    }
  };

  // Function to update jobs display
  function updateJobsDisplay(jobs) {
    if (!jobsGrid) return;

    try {
      if (jobs.length === 0) {
        jobsGrid.innerHTML = noResultsTemplate;
        return;
      }

      jobsGrid.innerHTML = jobs
        .map(
          (job) => `
            <div class="bg-white rounded-lg shadow-md p-6 transition-all duration-300 card-hover">
                <div class="flex justify-between">
                    <div>
                        <h3 class="text-xl font-bold">${job.title}</h3>
                        <p class="text-gray-600">${job.company}</p>
                    </div>
                    <div class="flex items-start">
                        <button class="text-blue-600 hover:text-blue-800 save-job-btn" data-job-id="${
                          job._id || job.id
                        }">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <div class="mt-4 flex flex-wrap gap-2">
                    <span class="px-3 py-1 ${getJobTypeStyle(
                      job.type
                    )} rounded-full text-sm">${job.type}</span>
                    <span class="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">${
                      job.location
                    }</span>
                    ${
                      job.remote
                        ? '<span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Remote</span>'
                        : ""
                    }
                    ${
                      job.exp
                        ? `<span class="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">${job.exp}</span>`
                        : ""
                    }
                </div>
                
                <div class="mt-3">
                    <p class="text-gray-700">${job.desc || ""}</p>
                </div>
                
                <div class="mt-3 flex flex-wrap gap-2">
                    ${(job.tags || [])
                      .map(
                        (tag) => `
                        <span class="px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm">${tag}</span>
                    `
                      )
                      .join("")}
                </div>
                
                <div class="mt-4 flex justify-between items-center">
                    <p class="text-gray-700 font-medium">₹${job.salary}</p>
                    <p class="text-gray-500 text-sm">Posted ${formatDate(
                      job.createdAt
                    )}</p>
                </div>
                
                <div class="mt-4 pt-4 border-t flex justify-between">
                    <a href="/frontend/pages/job-details.html?id=${
                      job._id || job.id
                    }" class="text-blue-600 hover:text-blue-800 font-medium">View Details</a>
                    <a href="/frontend/pages/job-apply.html?id=${
                      job._id || job.id
                    }" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Apply Now</a>
                </div>
            </div>
          `
        )
        .join("");

      // Add event listeners for saved jobs buttons
      attachSaveJobListeners();
    } catch (error) {
      console.error("Error updating jobs display:", error);
      showError();
    }
  }

  // Function to attach save job button listeners
  function attachSaveJobListeners() {
    document.querySelectorAll(".save-job-btn").forEach((button) => {
      button.addEventListener("click", function (e) {
        const jobId = this.dataset.jobId;
        toggleSaveJob(jobId, this);
      });
    });
  }

  // Function to toggle job saved status
  function toggleSaveJob(jobId, button) {
    // Get saved jobs from local storage
    const savedJobs = JSON.parse(localStorage.getItem("savedJobs") || "[]");

    // Check if job is already saved
    const jobIndex = savedJobs.indexOf(jobId);

    if (jobIndex === -1) {
      // Save job
      savedJobs.push(jobId);
      button.querySelector("svg").setAttribute("fill", "currentColor");
      showToast("Job saved successfully!");
    } else {
      // Unsave job
      savedJobs.splice(jobIndex, 1);
      button.querySelector("svg").setAttribute("fill", "none");
      showToast("Job removed from saved jobs.");
    }

    // Save updated array back to local storage
    localStorage.setItem("savedJobs", JSON.stringify(savedJobs));
  }

  // Function to show toast notification
  function showToast(message) {
    // Create toast element if it doesn't exist
    let toast = document.getElementById("toast-notification");

    if (!toast) {
      toast = document.createElement("div");
      toast.id = "toast-notification";
      toast.className =
        "fixed bottom-4 right-4 bg-gray-800 text-white px-6 py-3 rounded shadow-lg transform transition-all duration-500 translate-y-20 opacity-0";
      document.body.appendChild(toast);
    }

    // Set message and show toast
    toast.textContent = message;
    toast.classList.remove("translate-y-20", "opacity-0");

    // Hide toast after 3 seconds
    setTimeout(() => {
      toast.classList.add("translate-y-20", "opacity-0");
    }, 3000);
  }

  // Function to show error message
  function showError() {
    if (jobsGrid) {
      jobsGrid.innerHTML = errorTemplate;
    }
  }

  // Helper function for job type styles
  function getJobTypeStyle(type) {
    const styles = {
      "Full-time": "bg-blue-100 text-blue-800",
      "Part-time": "bg-purple-100 text-purple-800",
      Contract: "bg-green-100 text-green-800",
      Internship: "bg-yellow-100 text-yellow-800",
    };
    return styles[type] || "bg-gray-100 text-gray-800";
  }

  // Helper function to format date
  function formatDate(dateString) {
    if (!dateString) return "recently";

    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return "today";
      } else if (diffDays === 1) {
        return "yesterday";
      } else if (diffDays < 7) {
        return `${diffDays} days ago`;
      } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
      } else {
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      }
    } catch (error) {
      console.error("Error formatting date:", error);
      return "recently";
    }
  }

  // Mark saved jobs on initial load
  function markSavedJobs() {
    try {
      const savedJobs = JSON.parse(localStorage.getItem("savedJobs") || "[]");

      document.querySelectorAll(".save-job-btn").forEach((button) => {
        const jobId = button.dataset.jobId;
        if (savedJobs.includes(jobId)) {
          button.querySelector("svg").setAttribute("fill", "currentColor");
        }
      });
    } catch (error) {
      console.error("Error marking saved jobs:", error);
    }
  }
});
