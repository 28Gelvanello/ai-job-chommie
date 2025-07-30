// AI Job Chommie - Main Application JavaScript
// Extracted from index.html for better maintainability

// Global variables
let currentUser = null;
let currentPage = 'landing';
let isLoading = false;
let api = null;

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 AI Job Chommie App initializing...');
    
    // Initialize API client
    api = new APIClient();
    
    // Initialize app components
    initializeApp();
    initializeAuthEvents();
    initializeNavigationEvents();
    initializeJobSearchEvents();
    
    console.log('✅ App initialized successfully');
});

// Main app initialization
function initializeApp() {
    // Check for existing user session
    const savedUser = localStorage.getItem('aiJobChommieUser');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            if (currentUser && currentUser.email) {
                console.log('Restored user session:', currentUser.email);
                updateUIForLoggedInUser();
            }
        } catch (e) {
            console.error('Error parsing saved user data:', e);
            localStorage.removeItem('aiJobChommieUser');
        }
    }
    
    // Initialize custom cursor
    initializeCustomCursor();
    
    // Initialize Three.js background
    setTimeout(initializeThreeJSBackground, 1000);
    
    // Remove loading screen
    setTimeout(removeLoadingScreen, 2000);
}

// Authentication event handlers
function initializeAuthEvents() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Logout functionality
    const logoutBtns = document.querySelectorAll('.logout-btn');
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', handleLogout);
    });
}

// Navigation event handlers
function initializeNavigationEvents() {
    // Page navigation
    const navLinks = document.querySelectorAll('[data-page]');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPage = link.getAttribute('data-page');
            navigateToPage(targetPage);
        });
    });
}

// Job search event handlers
function initializeJobSearchEvents() {
    // Job search form
    const jobSearchForm = document.getElementById('jobSearchForm');
    if (jobSearchForm) {
        jobSearchForm.addEventListener('submit', handleJobSearch);
    }
    
    // Auto-apply functionality
    const autoApplyBtn = document.getElementById('autoApplyBtn');
    if (autoApplyBtn) {
        autoApplyBtn.addEventListener('click', handleAutoApply);
    }
}

// Page navigation function
function navigateToPage(pageName) {
    if (isLoading) return;
    
    console.log(`Navigating to: ${pageName}`);
    
    // Hide all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.classList.remove('active');
    });
    
    // Show target page
    const targetPage = document.getElementById(`${pageName}Page`);
    if (targetPage) {
        targetPage.classList.add('active');
        currentPage = pageName;
        
        // Update URL without reload
        history.pushState({ page: pageName }, '', `#${pageName}`);
        
        // Page-specific initialization
        switch(pageName) {
            case 'dashboard':
                initializeDashboard();
                break;
            case 'jobs':
                loadJobListings();
                break;
            case 'profile':
                loadUserProfile();
                break;
            case 'applications':
                loadUserApplications();
                break;
        }
    } else {
        console.error(`Page not found: ${pageName}`);
    }
}

// Show loading state
function showLoading(message = 'Loading...') {
    isLoading = true;
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.style.display = 'flex';
        const loadingText = loadingScreen.querySelector('.loading-text');
        if (loadingText) {
            loadingText.textContent = message;
        }
    }
}

// Hide loading state
function hideLoading() {
    isLoading = false;
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.style.display = 'none';
    }
}

// Remove initial loading screen
function removeLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            console.log('✅ Loading screen removed');
        }, 500);
    }
}

// Show alert messages
function showAlert(message, type = 'info') {
    console.log(`Alert [${type}]: ${message}`);
    
    // Create alert element
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
        <div class="alert-content">
            <span>${message}</span>
            <button class="alert-close">&times;</button>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(alert);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (alert.parentNode) {
            alert.parentNode.removeChild(alert);
        }
    }, 5000);
    
    // Close button functionality
    alert.querySelector('.alert-close').addEventListener('click', () => {
        if (alert.parentNode) {
            alert.parentNode.removeChild(alert);
        }
    });
}

// Update UI for logged in user
function updateUIForLoggedInUser() {
    const userInitials = document.getElementById('userInitials');
    if (userInitials && currentUser) {
        const initials = currentUser.firstName?.[0] + currentUser.lastName?.[0];
        userInitials.textContent = initials || currentUser.email?.[0]?.toUpperCase() || 'U';
    }
    
    // Show/hide appropriate UI elements
    const loginElements = document.querySelectorAll('.login-required');
    const logoutElements = document.querySelectorAll('.logout-required');
    
    loginElements.forEach(el => el.style.display = 'block');
    logoutElements.forEach(el => el.style.display = 'none');
}

// Global error handler
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    showAlert('An unexpected error occurred. Please refresh the page.', 'error');
});

// Export for other modules
window.AppCore = {
    navigateToPage,
    showLoading,
    hideLoading,
    showAlert,
    currentUser,
    currentPage
};