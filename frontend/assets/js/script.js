// First, let's add a mobile menu div to your HTML right after the button
const mobileMenuHTML = `
<div id="mobile-menu" class="hidden md:hidden w-full">
    <div class="px-2 pt-2 pb-3 space-y-1">
        <a href="/frontend/pages/index.html" class="block px-3 py-2 text-white hover:bg-white/10 rounded-md">Home</a>
        <a href="/frontend/pages/all-job.html" class="block px-3 py-2 text-white hover:bg-white/10 rounded-md">Jobs</a>
        <a href="/frontend/pages/employer.html" class="block px-3 py-2 text-white hover:bg-white/10 rounded-md">Employers</a>
        <a href="/frontend/pages/candidate.html" class="block px-3 py-2 text-white hover:bg-white/10 rounded-md">Candidates</a>
        <a href="/frontend/pages/login.html" class="block px-3 py-2 text-white hover:bg-white/10 rounded-md">Login</a>
    </div>
</div>
`;

// Mobile menu toggle functionality
document.addEventListener("DOMContentLoaded", function () {
  // Insert mobile menu HTML after the button
  const hamburgerButton = document.querySelector("nav button");
  hamburgerButton.insertAdjacentHTML("afterend", mobileMenuHTML);

  const mobileMenu = document.getElementById("mobile-menu");

  hamburgerButton.addEventListener("click", function () {
    // Toggle the mobile menu
    const isHidden = mobileMenu.classList.contains("hidden");
    if (isHidden) {
      mobileMenu.classList.remove("hidden");
      // Add animation classes
      mobileMenu.classList.add("animate-fadeIn");
    } else {
      mobileMenu.classList.add("hidden");
      mobileMenu.classList.remove("animate-fadeIn");
    }
  });

  // Close mobile menu when clicking outside
  document.addEventListener("click", function (event) {
    if (
      !mobileMenu.contains(event.target) &&
      !hamburgerButton.contains(event.target)
    ) {
      mobileMenu.classList.add("hidden");
      mobileMenu.classList.remove("animate-fadeIn");
    }
  });

  // Close mobile menu when window is resized to larger screen
  window.addEventListener("resize", function () {
    if (window.innerWidth >= 768) {
      // md breakpoint
      mobileMenu.classList.add("hidden");
      mobileMenu.classList.remove("animate-fadeIn");
    }
  });
});

// Job Search logic
document.addEventListener("DOMContentLoaded", function () {
  // Style updates for search inputs
  const searchInputs = document.querySelectorAll('input[type="text"]');
  searchInputs.forEach((input) => {
    input.classList.add("text-gray-800", "placeholder-gray-500");
  });

  // Get search form elements
  const searchForm = document.querySelector("form");
  const jobInput = searchForm.querySelector(
    'input[placeholder="Job title or keyword"]'
  );
  const locationInput = searchForm.querySelector(
    'input[placeholder="Location"]'
  );

  // Handle search form submission
  searchForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const searchParams = new URLSearchParams();
    searchParams.append("job", jobInput.value);
    searchParams.append("location", locationInput.value);
    window.location.href = `/frontend/pages/all-job.html?${searchParams.toString()}`;
  });
});
