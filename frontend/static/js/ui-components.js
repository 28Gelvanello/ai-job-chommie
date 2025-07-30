// AI Job Chommie - UI Components Module
// Handles UI interactions, animations, and component management

// Custom cursor implementation
function initializeCustomCursor() {
    const cursor = document.createElement('div');
    cursor.className = 'cursor';
    document.body.appendChild(cursor);
    
    let mouseX = 0, mouseY = 0;
    
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        cursor.style.left = mouseX + 'px';
        cursor.style.top = mouseY + 'px';
    });
    
    // Hover effects
    const hoverElements = document.querySelectorAll('button, a, .futuristic-card, .job-card');
    hoverElements.forEach(el => {
        el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
    });
}

// Dashboard initialization
function initializeDashboard() {
    if (!requireAuth()) return;
    
    console.log('Initializing dashboard...');
    updateDashboardStats();
    loadRecentApplications();
    loadJobRecommendations();
}

// Update dashboard statistics
async function updateDashboardStats() {
    try {
        const stats = await api.getDashboardStats();
        
        if (stats) {
            document.getElementById('totalApplications').textContent = stats.totalApplications || 0;
            document.getElementById('pendingApplications').textContent = stats.pendingApplications || 0;
            document.getElementById('interviewsScheduled').textContent = stats.interviewsScheduled || 0;
            document.getElementById('jobsMatched').textContent = stats.jobsMatched || 0;
        }
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

// Load recent applications
async function loadRecentApplications() {
    try {
        const applications = await api.getUserApplications(5); // Get last 5
        const container = document.getElementById('recentApplications');
        
        if (container && applications) {
            container.innerHTML = applications.map(app => `
                <div class="application-item">
                    <h4>${app.jobTitle}</h4>
                    <p>${app.company}</p>
                    <span class="status status-${app.status}">${app.status}</span>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading recent applications:', error);
    }
}

// Load job recommendations
async function loadJobRecommendations() {
    try {
        const jobs = await api.getJobRecommendations(3); // Get top 3
        const container = document.getElementById('jobRecommendations');
        
        if (container && jobs) {
            container.innerHTML = jobs.map(job => `
                <div class="job-recommendation" data-job-id="${job.id}">
                    <h4>${job.title}</h4>
                    <p>${job.company}</p>
                    <p class="match-score">Match: ${job.matchScore}%</p>
                    <button onclick="quickApply('${job.id}')" class="btn-quick-apply">Quick Apply</button>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading job recommendations:', error);
    }
}

// Job search functionality
async function handleJobSearch(event) {
    event.preventDefault();
    
    const keywords = document.getElementById('jobKeywords').value;
    const location = document.getElementById('jobLocation').value;
    const jobType = document.getElementById('jobType').value;
    
    if (!keywords.trim()) {
        showAlert('Please enter job keywords to search.', 'warning');
        return;
    }
    
    showLoading('Searching for jobs...');
    
    try {
        const searchParams = {
            keywords: keywords.trim(),
            location: location.trim(),
            jobType,
            page: 1,
            limit: 20
        };
        
        const results = await api.searchJobs(searchParams);
        
        if (results && results.jobs) {
            displayJobResults(results.jobs);
            
            // Cache results
            localStorage.setItem('jobSearchResults', JSON.stringify({
                results: results.jobs,
                searchParams,
                timestamp: Date.now()
            }));
            
            showAlert(`Found ${results.jobs.length} job opportunities!`, 'success');
        } else {
            showAlert('No jobs found. Try different keywords.', 'info');
        }
    } catch (error) {
        console.error('Job search error:', error);
        showAlert(error.message || 'Job search failed. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

// Display job search results
function displayJobResults(jobs) {
    const container = document.getElementById('jobResults');
    if (!container) return;
    
    container.innerHTML = jobs.map(job => `
        <div class="job-card futuristic-card" data-job-id="${job.id}">
            <div class="job-header">
                <h3>${job.title}</h3>
                <span class="company">${job.company}</span>
            </div>
            <div class="job-details">
                <p class="location">${job.location}</p>
                <p class="salary">${job.salary || 'Salary not specified'}</p>
                <p class="job-type">${job.type}</p>
            </div>
            <div class="job-description">
                <p>${job.description?.substring(0, 200)}...</p>
            </div>
            <div class="job-actions">
                <button onclick="viewJobDetails('${job.id}')" class="btn-secondary">View Details</button>
                <button onclick="applyToJob('${job.id}')" class="btn-primary">Apply Now</button>
            </div>
            <div class="job-meta">
                <span class="match-score">Match: ${job.matchScore || 'N/A'}%</span>
                <span class="posted-date">Posted: ${formatDate(job.postedDate)}</span>
            </div>
        </div>
    `).join('');
}

// Auto-apply functionality
async function handleAutoApply() {
    if (!requireAuth()) return;
    
    const confirmApply = confirm('This will automatically apply to matched jobs. Continue?');
    if (!confirmApply) return;
    
    showLoading('AI is applying to jobs for you...');
    
    try {
        const result = await api.autoApplyToJobs();
        
        if (result && result.applicationsSubmitted) {
            showAlert(`Successfully applied to ${result.applicationsSubmitted} jobs!`, 'success');
            
            // Refresh applications list
            loadUserApplications();
        } else {
            showAlert('No suitable jobs found for auto-apply.', 'info');
        }
    } catch (error) {
        console.error('Auto-apply error:', error);
        showAlert(error.message || 'Auto-apply failed. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

// Apply to specific job
async function applyToJob(jobId) {
    if (!requireAuth()) return;
    
    showLoading('Submitting application...');
    
    try {
        const result = await api.applyToJob(jobId);
        
        if (result && result.success) {
            showAlert('Application submitted successfully!', 'success');
            
            // Update UI to show applied status
            const jobCard = document.querySelector(`[data-job-id="${jobId}"]`);
            if (jobCard) {
                const applyBtn = jobCard.querySelector('.btn-primary');
                if (applyBtn) {
                    applyBtn.textContent = 'Applied';
                    applyBtn.disabled = true;
                    applyBtn.classList.add('applied');
                }
            }
        } else {
            throw new Error(result.message || 'Application failed');
        }
    } catch (error) {
        console.error('Apply error:', error);
        showAlert(error.message || 'Application failed. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

// Quick apply function
async function quickApply(jobId) {
    await applyToJob(jobId);
}

// View job details
function viewJobDetails(jobId) {
    // Implementation for job details modal/page
    console.log('Viewing details for job:', jobId);
    showAlert('Job details feature coming soon!', 'info');
}

// Load user profile
async function loadUserProfile() {
    if (!requireAuth()) return;
    
    try {
        const profile = await api.getUserProfile();
        
        if (profile) {
            // Populate profile form
            document.getElementById('profileFirstName').value = profile.firstName || '';
            document.getElementById('profileLastName').value = profile.lastName || '';
            document.getElementById('profileEmail').value = profile.email || '';
            document.getElementById('profilePhone').value = profile.phone || '';
            document.getElementById('profileLocation').value = profile.location || '';
            document.getElementById('profileSkills').value = profile.skills?.join(', ') || '';
            document.getElementById('profileExperience').value = profile.experience || '';
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// Load user applications
async function loadUserApplications() {
    if (!requireAuth()) return;
    
    try {
        const applications = await api.getUserApplications();
        const container = document.getElementById('applicationsContainer');
        
        if (container && applications) {
            container.innerHTML = applications.map(app => `
                <div class="application-card futuristic-card">
                    <div class="application-header">
                        <h3>${app.jobTitle}</h3>
                        <span class="company">${app.company}</span>
                    </div>
                    <div class="application-details">
                        <p class="location">${app.location}</p>
                        <p class="applied-date">Applied: ${formatDate(app.appliedDate)}</p>
                    </div>
                    <div class="application-status">
                        <span class="status status-${app.status}">${app.status}</span>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading applications:', error);
    }
}

// Utility functions
function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

// Export UI functions
window.UIComponents = {
    initializeCustomCursor,
    initializeDashboard,
    handleJobSearch,
    handleAutoApply,
    loadUserProfile,
    loadUserApplications,
    applyToJob,
    quickApply,
    viewJobDetails
};