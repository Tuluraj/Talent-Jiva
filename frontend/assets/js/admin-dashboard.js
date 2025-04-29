// admin-dashboard.js

document.addEventListener('DOMContentLoaded', function() {
    // Initialize components
    initializeNotifications();
    initializeApprovalActions();
    initializeSearch();
    loadDashboardData();
});

// Handle notifications
function initializeNotifications() {
    const notificationBtn = document.querySelector('.notifications');
    if (notificationBtn) {
        notificationBtn.addEventListener('click', function() {
            // Implementation for notifications panel
            console.log('Notifications clicked');
            // Add your notification panel logic here
        });
    }
}

// Handle approval actions
function initializeApprovalActions() {
    document.querySelectorAll('.approve-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const userId = this.closest('tr').dataset.userId;
            try {
                await approveUser(userId);
                updateApprovalUI(userId, 'approved');
            } catch (error) {
                showError('Failed to approve user');
            }
        });
    });

    document.querySelectorAll('.reject-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const userId = this.closest('tr').dataset.userId;
            if (await confirmReject()) {
                try {
                    await rejectUser(userId);
                    updateApprovalUI(userId, 'rejected');
                } catch (error) {
                    showError('Failed to reject user');
                }
            }
        });
    });
}

// Search functionality
function initializeSearch() {
    const searchInput = document.querySelector('.search-bar input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function(e) {
            searchAdmin(e.target.value);
        }, 300));
    }
}

// API calls
async function approveUser(userId) {
    const response = await fetch(`/api/admin/users/${userId}/approve`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    if (!response.ok) throw new Error('Failed to approve user');
    return response.json();
}

async function rejectUser(userId) {
    const response = await fetch(`/api/admin/users/${userId}/reject`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    if (!response.ok) throw new Error('Failed to reject user');
    return response.json();
}

async function loadDashboardData() {
    try {
        const [users, jobs, applications, revenue] = await Promise.all([
            fetch('/api/admin/stats/users').then(r => r.json()),
            fetch('/api/admin/stats/jobs').then(r => r.json()),
            fetch('/api/admin/stats/applications').then(r => r.json()),
            fetch('/api/admin/stats/revenue').then(r => r.json())
        ]);

        updateDashboardStats(users, jobs, applications, revenue);
    } catch (error) {
        showError('Failed to load dashboard data');
    }
}

// UI updates
function updateApprovalUI(userId, status) {
    const row = document.querySelector(`tr[data-user-id="${userId}"]`);
    if (row) {
        if (status === 'approved' || status === 'rejected') {
            row.remove();
            updatePendingCount();
        }
    }
}

function updateDashboardStats(users, jobs, applications, revenue) {
    // Update overview cards
    document.querySelector('.users .number').textContent = formatNumber(users.total);
    document.querySelector('.jobs .number').textContent = formatNumber(jobs.total);
    document.querySelector('.applications .number').textContent = formatNumber(applications.total);
    document.querySelector('.revenue .number').textContent = formatCurrency(revenue.total);

    // Update growth indicators
    updateGrowthIndicator('.users .growth', users.growth);
    updateGrowthIndicator('.jobs .growth', jobs.growth);
    updateGrowthIndicator('.applications .growth', applications.growth);
    updateGrowthIndicator('.revenue .growth', revenue.growth);
}

// Utility functions
function formatNumber(num) {
    return new Intl.NumberFormat().format(num);
}

function formatCurrency(num) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(num);
}

function updateGrowthIndicator(selector, growth) {
    const element = document.querySelector(selector);
    if (element) {
        element.textContent = `${growth > 0 ? '+' : ''}${growth}% this month`;
        element.className = `growth ${growth >= 0 ? 'positive' : 'negative'}`;
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showError(message) {
    // Implement your error notification system here
    console.error(message);
}

function confirmReject() {
    return confirm('Are you sure you want to reject this user?');
}

async function searchAdmin(query) {
    if (!query) {
        // Reset search results
        return;
    }

    try {
        const response = await fetch(`/api/admin/search?q=${encodeURIComponent(query)}`);
        const results = await response.json();
        updateSearchResults(results);
    } catch (error) {
        showError('Search failed');
    }
}

function updateSearchResults(results) {
    // Implement search results UI update
    console.log('Search results:', results);
}