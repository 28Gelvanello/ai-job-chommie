// API Helper Functions for AI Job Chommie Frontend
// Handles all communication with Flask backend

class APIClient {
    constructor() {
        // Use localhost:5000 for local development, fallback to same origin for production
        this.baseURL = window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : window.location.origin + '/api';
        this.defaultHeaders = {
            'Content-Type': 'application/json',
        };
    }

    async request(endpoint, options = {}) {
        const url = this.baseURL + endpoint;
        const config = {
            credentials: 'include', // Include cookies for session management
            headers: { ...this.defaultHeaders, ...options.headers },
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                const errorDetail = data.message || data.error || `HTTP error! status: ${response.status}`;
                const error = new Error(errorDetail);
                error.status = response.status;
                error.data = data; // Attach full error response
                throw error;
            }

            return data;
        } catch (error) {
            console.error(`API request failed: ${endpoint}`, error);
            throw error;
        }
    }

    // Authentication methods
    async login(email, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    }

    async register(userData) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async logout() {
        return this.request('/auth/logout', {
            method: 'POST'
        });
    }

    async getCurrentUser() {
        return this.request('/auth/me');
    }

    // Profile methods
    async updateProfile(profileData) {
        return this.request('/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
    }

    async uploadCV(formData) {
        return this.request('/profile/cv', {
            method: 'POST',
            headers: {}, // Remove Content-Type to let browser set it for FormData
            body: formData
        });
    }

    // Job methods
    async searchJobs(searchParams) {
        return this.request('/jobs/search', {
            method: 'POST',
            body: JSON.stringify(searchParams)
        });
    }

    async getJob(jobId) {
        return this.request(`/jobs/${jobId}`);
    }

    async applyToJob(jobId, applicationData = {}) {
        return this.request(`/jobs/${jobId}/apply`, {
            method: 'POST',
            body: JSON.stringify(applicationData)
        });
    }

    async getUserApplications() {
        return this.request('/applications');
    }

    async updateApplicationStatus(appId, status) {
        return this.request(`/applications/${appId}`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
    }

    // AI methods
    async analyzeCV(cvText) {
        return this.request('/analyze-cv', {
            method: 'POST',
            body: JSON.stringify({ cv_text: cvText })
        });
    }

    async matchJobs(preferences) {
        return this.request('/match-jobs', {
            method: 'POST',
            body: JSON.stringify(preferences)
        });
    }

    async generateCoverLetter(jobId) {
        return this.request('/generate-cover-letter', {
            method: 'POST',
            body: JSON.stringify({ job_id: jobId })
        });
    }

    async getSkillRecommendations(targetRole) {
        return this.request('/skill-recommendations', {
            method: 'POST',
            body: JSON.stringify({ target_role: targetRole })
        });
    }

    async generateInterviewQuestions(jobTitle, company) {
        return this.request('/interview-prep', {
            method: 'POST',
            body: JSON.stringify({ job_title: jobTitle, company })
        });
    }

    // Payment methods
    async initializePayment(plan) {
        return this.request('/payment/initialize', {
            method: 'POST',
            body: JSON.stringify({ plan })
        });
    }

    async verifyPayment(reference) {
        return this.request('/payment/verify', {
            method: 'POST',
            body: JSON.stringify({ reference })
        });
    }

    async getPaymentConfig() {
        return this.request('/payment/config');
    }

    async getSubscriptionStatus() {
        return this.request('/subscription/status');
    }

    async cancelSubscription() {
        return this.request('/subscription/cancel', {
            method: 'POST'
        });
    }

    // Job scraping methods (admin/manager only)
    async scrapeJobs(params) {
        return this.request('/scrape/jobs', {
            method: 'POST',
            body: JSON.stringify(params)
        });
    }

    async autoScrapeJobs() {
        return this.request('/scrape/auto-scrape', {
            method: 'POST'
        });
    }

    async getScrapeStatus() {
        return this.request('/scrape/status');
    }

    async getJobMarketInsights() {
        return this.request('/scrape/job-market-insights');
    }

    async getTrendingSkills() {
        return this.request('/scrape/trending-skills');
    }
}

// Create global API client instance
const api = new APIClient();

// Helper functions for common operations
async function handleLogin(email, password) {
    try {
        showLoading('Authenticating...');
        const response = await api.login(email, password);
        
        if (response.user) {
            currentUser = response.user;
            isLoggedIn = true;
            updateUIForLoggedInUser();
            showSuccess('Login successful!');
            navigateToPage('dashboard');
        }
        
        return response;
    } catch (error) {
        showError('Login failed: ' + (error.message || error));
        throw error;
    } finally {
        hideLoading();
    }
}

async function handleRegister(userData) {
    try {
        showLoading('Creating account...');
        const response = await api.register(userData);
        
        if (response.user) {
            currentUser = response.user;
            isLoggedIn = true;
            updateUIForLoggedInUser();
            showSuccess('Account created successfully!');
            navigateToPage('dashboard');
        }
        
        return response;
    } catch (error) {
        showError('Registration failed: ' + (error.message || error));
        throw error;
    } finally {
        hideLoading();
    }
}

async function handleLogout() {
    try {
        await api.logout();
        currentUser = null;
        isLoggedIn = false;
        updateUIForLoggedOutUser();
        showSuccess('Logged out successfully');
        navigateToPage('home');
    } catch (error) {
        console.error('Logout error:', error);
        // Force logout on frontend even if backend fails
        currentUser = null;
        isLoggedIn = false;
        updateUIForLoggedOutUser();
        navigateToPage('home');
    }
}

async function checkAuthState() {
    try {
        const response = await api.getCurrentUser();
        if (response) {
            currentUser = response;
            isLoggedIn = true;
            updateUIForLoggedInUser();
        }
    } catch (error) {
        // User not authenticated
        currentUser = null;
        isLoggedIn = false;
        updateUIForLoggedOutUser();
    }
}

function updateUIForLoggedInUser() {
    const authLinks = document.getElementById('authLinks');
    const navLinks = document.getElementById('navLinks');
    const userAvatar = document.getElementById('userAvatar');
    const userInitials = document.getElementById('userInitials');
    
    if (authLinks) authLinks.style.display = 'none';
    if (navLinks) navLinks.style.display = 'flex';
    
    if (currentUser && userInitials) {
        const initials = (currentUser.first_name?.[0] || '') + (currentUser.last_name?.[0] || '');
        userInitials.textContent = initials || currentUser.email?.[0]?.toUpperCase() || 'U';
    }
}

function updateUIForLoggedOutUser() {
    const authLinks = document.getElementById('authLinks');
    const navLinks = document.getElementById('navLinks');
    
    if (authLinks) authLinks.style.display = 'flex';
    if (navLinks) navLinks.style.display = 'none';
}

// Utility functions for UI feedback
function showLoading(message = 'Loading...') {
    // Implementation depends on your loading UI
    console.log('Loading:', message);
}

function hideLoading() {
    console.log('Loading complete');
}

function showSuccess(message) {
    // Implementation depends on your notification system
    console.log('Success:', message);
    // You could show a toast notification here
}

function showError(message) {
    // Implementation depends on your notification system
    console.error('Error:', message);
    // You could show an error toast notification here
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { APIClient, api };
}

