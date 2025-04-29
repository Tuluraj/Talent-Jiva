// frontend/assets/js/jobs.js
const jobs = {
  async createJob(jobData) {
    try {
      const response = await fetch("http://localhost:8000/api/web/job/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...jobData,
          userId: JSON.parse(localStorage.getItem("currentUser")).id,
        }),
      });

      return await response.json();
    } catch (error) {
      console.error("Create job error:", error);
      return {
        success: false,
        error: "Server error. Please try again later.",
      };
    }
  },

  async getEmployerJobs() {
    try {
      const currentUser = JSON.parse(localStorage.getItem("currentUser"));
      if (!currentUser || currentUser.role !== "employer") {
        return { success: false, error: "Unauthorized" };
      }

      const response = await fetch(
        "http://localhost:8000/api/web/job/employer-jobs",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            employerId: currentUser.id,
          }),
        }
      );

      return await response.json();
    } catch (error) {
      console.error("Get jobs error:", error);
      return {
        success: false,
        error: "Server error. Please try again later.",
      };
    }
  },

  async updateJobStatus(jobId, status) {
    try {
      const currentUser = JSON.parse(localStorage.getItem("currentUser"));
      if (!currentUser || currentUser.role !== "employer") {
        return { success: false, error: "Unauthorized" };
      }

      const response = await fetch(
        "http://localhost:8000/api/web/job/update-status",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jobId,
            employerId: currentUser.id,
            status,
          }),
        }
      );

      return await response.json();
    } catch (error) {
      console.error("Update job error:", error);
      return {
        success: false,
        error: "Server error. Please try again later.",
      };
    }
  },

  async getAllJobs() {
    try {
      const response = await fetch("http://localhost:8000/api/web/job/all");
      return await response.json();
    } catch (error) {
      console.error("Get all jobs error:", error);
      return {
        success: false,
        error: "Server error. Please try again later.",
      };
    }
  },
};
async function updateJobStatus(jobId, status) {
  const result = await jobs.updateJobStatus(jobId, status);

  if (result.success) {
    loadEmployerJobs();
  } else {
    alert(result.error || "An error occurred while updating job status.");
  }
}

// Debounce function for search input
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}
