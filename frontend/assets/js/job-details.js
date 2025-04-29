// job-details.js - Handles dynamic job details display and application process

document.addEventListener("DOMContentLoaded", () => {
  // Get job ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const jobId = urlParams.get("id");

  // If no job ID in URL but exists in localStorage, use that
  if (!jobId && localStorage.getItem("currentJobId")) {
    jobId = localStorage.getItem("currentJobId");
    // Update URL without reloading page
    const newUrl = new URL(window.location);
    newUrl.searchParams.set("id", jobId);
    window.history.pushState({}, "", newUrl);
  }

  if (!jobId) {
    showError("No job ID provided");
    return;
  }
  // Save job ID to localStorage for persistence
  localStorage.setItem("currentJobId", jobId);

  // Fetch job details
  fetchJobDetails(jobId);

  // Fetch similar jobs
  fetchSimilarJobs(jobId);

  // Add event listeners to apply buttons
  const applyButtons = document.querySelectorAll(
    "#apply-link, #apply-link-bottom"
  );
  applyButtons.forEach((button) => {
    button.addEventListener("click", handleApplyClick);
  });
});

// Function to fetch job details from API
async function fetchJobDetails(jobId) {
  try {
    const response = await fetch(`http://localhost:8000/api/web/job/${jobId}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch job details: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to retrieve job details");
    }

    displayJobDetails(data.job);
  } catch (error) {
    console.error("Error fetching job details:", error);
    showError("Failed to load job details. Please try again later.");
  }
}

// Function to format date
function formatDate(dateString) {
  const options = { year: "numeric", month: "long", day: "numeric" };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

// Function to calculate days ago
function getDaysAgo(dateString) {
  const posted = new Date(dateString);
  const today = new Date();
  const diffTime = Math.abs(today - posted);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "Today";
  } else if (diffDays === 1) {
    return "Yesterday";
  } else {
    return `${diffDays} days ago`;
  }
}

// Function to display job details on the page
function displayJobDetails(job) {
  // Update page title
  document.title = `${job.title} at ${job.company} - Talent Jiva`;

  // Update job header information
  document.getElementById("job-title").textContent = job.title;
  document.getElementById("company-name").textContent = job.company;

  // Set company logo if available (fallback to default if not)
  const companyLogo = document.getElementById("company-logo");
  if (job.companyLogo) {
    companyLogo.src = job.companyLogo;
  }

  // Update job details
  document.getElementById("job-type").textContent = job.type;
  document.getElementById("job-location").textContent = job.location;

  // Show/hide remote badge based on job data
  const remoteBadge = document.getElementById("remote-badge");
  if (job.remote) {
    remoteBadge.style.display = "inline-flex";
  } else {
    remoteBadge.style.display = "none";
  }

  // Update salary range
  document.getElementById("salary-range").textContent =
    job.salary || "Not specified";

  // Update experience required
  document.getElementById("experience-required").textContent =
    job.exp || "Not specified";

  // Update job description
  document.getElementById("job-description").innerHTML =
    job.fullDesc || job.desc;

  // Add posting date if available
  if (job.createdAt) {
    // Create a posting date section
    const jobOverviewSection = document.querySelector(
      ".grid.grid-cols-1.md\\:grid-cols-3.gap-6.mb-8"
    );

    // Create new date element
    const dateElement = document.createElement("div");
    dateElement.className = "p-4 border rounded-lg";
    dateElement.innerHTML = `
      <h3 class="font-semibold text-gray-700 mb-2">Posted</h3>
      <div class="flex items-center">
        <svg class="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span title="${formatDate(job.createdAt)}">${getDaysAgo(
      job.createdAt
    )}</span>
      </div>
    `;

    // Add it to the job overview section
    jobOverviewSection.appendChild(dateElement);
  }

  // Generate skills tags
  const skillsContainer = document.getElementById("skills-container");
  skillsContainer.innerHTML = ""; // Clear existing skills

  if (job.tags && job.tags.length > 0) {
    job.tags.forEach((skill) => {
      const skillTag = document.createElement("span");
      skillTag.className = "px-3 py-2 bg-blue-100 text-blue-800 rounded-lg";
      skillTag.textContent = skill;
      skillsContainer.appendChild(skillTag);
    });
  } else {
    skillsContainer.innerHTML =
      '<span class="text-gray-500">No specific skills mentioned</span>';
  }

  // Add responsibilities section if available
  if (job.responsibilities && job.responsibilities.length > 0) {
    // Find where to insert responsibilities (after job description)
    const jobDescriptionSection = document.querySelector(
      ".mb-8:has(#job-description)"
    );
    const responsibilitiesSection = document.createElement("div");
    responsibilitiesSection.className = "mb-8";
    responsibilitiesSection.innerHTML = `
      <h3 class="text-xl font-bold mb-4">Key Responsibilities</h3>
      <ul class="list-disc pl-5 space-y-2 text-gray-700">
        ${job.responsibilities.map((resp) => `<li>${resp}</li>`).join("")}
      </ul>
    `;

    // Insert after job description
    jobDescriptionSection.parentNode.insertBefore(
      responsibilitiesSection,
      jobDescriptionSection.nextSibling
    );
  }

  // Update apply links with the job ID
  const applyLinks = document.querySelectorAll(
    "#apply-link, #apply-link-bottom"
  );
  applyLinks.forEach((link) => {
    link.href = `job-apply.html?id=${job._id}`;
  });
}

// Function to fetch similar jobs
async function fetchSimilarJobs(currentJobId) {
  try {
    // Fetch jobs that might be similar (based on current implementation in jobController)
    // You might want to enhance this to use tags for better similarity matching
    const response = await fetch(`http://localhost:8000/api/web/job`);

    if (!response.ok) {
      throw new Error(`Failed to fetch similar jobs: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to retrieve similar jobs");
    }

    // Filter out current job and limit to 3 jobs
    const similarJobs = data.jobs
      .filter((job) => job._id !== currentJobId)
      .slice(0, 3);

    displaySimilarJobs(similarJobs);
  } catch (error) {
    console.error("Error fetching similar jobs:", error);
    // Just hide the section instead of showing an error
    const similarJobsSection = document.querySelector(
      "section.py-12.bg-gray-100"
    );
    if (similarJobsSection) {
      similarJobsSection.style.display = "none";
    }
  }
}

// Function to display similar jobs
function displaySimilarJobs(jobs) {
  const container = document.getElementById("similar-jobs-container");
  container.innerHTML = ""; // Clear existing jobs

  if (!jobs || jobs.length === 0) {
    container.innerHTML = '<p class="text-gray-500">No similar jobs found.</p>';
    return;
  }

  jobs.forEach((job) => {
    const jobCard = document.createElement("div");
    jobCard.className = "bg-white rounded-lg shadow p-6";
    jobCard.innerHTML = `
      <div class="mb-4">
        <h3 class="text-xl font-bold">${job.title}</h3>
        <p class="text-gray-600">${job.company}</p>
      </div>
      <div class="mb-3">
        <div class="flex items-center text-sm text-gray-500 mb-1">
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          ${job.location}
          ${
            job.remote
              ? '<span class="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Remote</span>'
              : ""
          }
        </div>
        <div class="flex items-center text-sm text-gray-500">
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          ${job.type}
        </div>
        ${
          job.salary
            ? `
        <div class="flex items-center text-sm text-gray-500 mt-1">
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          ${job.salary}
        </div>
        `
            : ""
        }
        ${
          job.createdAt
            ? `
        <div class="flex items-center text-sm text-gray-500 mt-1">
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          ${getDaysAgo(job.createdAt)}
        </div>
        `
            : ""
        }
      </div>
      <div class="flex flex-wrap gap-1 mb-3">
        ${
          job.tags
            ? job.tags
                .slice(0, 3)
                .map(
                  (tag) =>
                    `<span class="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">${tag}</span>`
                )
                .join("")
            : ""
        }
      </div>
      <a href="job-details.html?id=${
        job._id
      }" class="inline-block gradient-bg text-white px-4 py-2 rounded hover:opacity-90 transition-all">View Details</a>
    `;
    container.appendChild(jobCard);
  });
}

// Function to handle apply button click
function handleApplyClick(event) {
  event.preventDefault();
  const applyUrl = event.target.href;

  // Store the apply URL for later use
  localStorage.setItem("pendingApplyUrl", applyUrl);

  // Check if user is logged in
  checkLoginStatus()
    .then((isLoggedIn) => {
      if (isLoggedIn) {
        // If logged in, redirect to the apply page
        window.location.href = applyUrl;
      } else {
        // If not logged in, show login prompt
        showLoginPrompt(applyUrl);
      }
    })
    .catch((error) => {
      console.error("Error checking login status:", error);
      showError("Something went wrong. Please try again.");
    });
}

// Function to check if user is logged in
async function checkLoginStatus() {
  // First check localStorage
  if (localStorage.getItem("currentUser")) {
    return true;
  }

  try {
    // If no localStorage user, try API check
    const response = await fetch("/api/auth/check-auth", {
      credentials: "include", // Include cookies in the request
    });

    return response.ok;
  } catch (error) {
    console.error("Error checking authentication:", error);
    return false;
  }
}

// Function to show login prompt modal
function showLoginPrompt(redirectUrl) {
  // Create modal container
  const modalContainer = document.createElement("div");
  modalContainer.className =
    "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";

  // Create modal content
  const modal = document.createElement("div");
  modal.className = "bg-white rounded-lg p-8 max-w-md w-full";
  modal.innerHTML = `
    <h3 class="text-xl font-bold mb-4">Login Required</h3>
    <p class="mb-6">You need to be logged in to apply for this job.</p>
    <div class="flex justify-end space-x-4">
      <button id="cancel-login" class="px-4 py-2 border rounded hover:bg-gray-100">Cancel</button>
      <a href="/frontend/pages/login.html?redirect=${encodeURIComponent(
        redirectUrl
      )}" 
        class="gradient-bg text-white px-4 py-2 rounded hover:opacity-90">
        Login
      </a>
    </div>
  `;

  modalContainer.appendChild(modal);
  document.body.appendChild(modalContainer);

  // Add event listener to cancel button
  document.getElementById("cancel-login").addEventListener("click", () => {
    document.body.removeChild(modalContainer);
  });
}

// Function to show errors on the page
function showError(message) {
  // Find the main job details card section where we want to display errors
  const jobDetailsCard = document.querySelector(
    ".bg-white.rounded-lg.shadow-lg.p-6.md\\:p-8"
  );

  if (jobDetailsCard) {
    const errorElement = document.createElement("div");
    errorElement.className = "bg-red-100 text-red-700 p-4 rounded mb-6";
    errorElement.textContent = message;

    // Add to the beginning of the job details card
    jobDetailsCard.prepend(errorElement);
  } else {
    // Fallback to container if job details card isn't found
    const container = document.querySelector(".container");
    if (container) {
      const errorElement = document.createElement("div");
      errorElement.className = "bg-red-100 text-red-700 p-4 rounded mb-6";
      errorElement.textContent = message;
      container.insertBefore(errorElement, container.firstChild);
    }
  }
}
