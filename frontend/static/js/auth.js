// AI Job Chommie - Authentication Module
// Handles all authentication-related functionality

// Login handler
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const loginBtn = document.getElementById('loginBtn');
    
    if (!email || !password) {
        showAlert('Please enter both email and password.', 'error');
        return;
    }
    
    // Disable button and show loading
    loginBtn.disabled = true;
    loginBtn.textContent = 'CONNECTING...';
    
    try {
        // Authentication handled by backend API
        const loginData = await api.login(email, password);
        
        if (loginData && loginData.user) {
            currentUser = loginData.user;
            localStorage.setItem('aiJobChommieUser', JSON.stringify(currentUser));
            
            showAlert('Login successful! Welcome back.', 'success');
            updateUIForLoggedInUser();
            navigateToPage('dashboard');
        } else {
            throw new Error('Invalid login response');
        }
    } catch (error) {
        console.error('Login error:', error);
        showAlert(error.message || 'Login failed. Please check your credentials.', 'error');
    } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = 'CONNECT TO SYSTEM';
    }
}

// Register handler
async function handleRegister(event) {
    event.preventDefault();
    
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const registerBtn = document.getElementById('registerBtn');
    
    if (password !== confirmPassword) {
        showAlert('Passwords do not match!', 'error');
        return;
    }
    
    registerBtn.disabled = true;
    registerBtn.textContent = 'CREATING...';
    
    try {
        const userData = {
            firstName,
            lastName,
            email,
            password
        };
        
        const result = await api.register(userData);
        
        if (result && result.user) {
            currentUser = result.user;
            localStorage.setItem('aiJobChommieUser', JSON.stringify(currentUser));
            
            showAlert('Registration successful! Welcome to AI Job Chommie.', 'success');
            updateUIForLoggedInUser();
            navigateToPage('dashboard');
        } else {
            throw new Error('Registration failed');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showAlert(error.message || 'Registration failed. Please try again.', 'error');
    } finally {
        registerBtn.disabled = false;
        registerBtn.textContent = 'CREATE ACCOUNT';
    }
}

// Logout handler
function handleLogout() {
    currentUser = null;
    localStorage.removeItem('aiJobChommieUser');
    
    // Clear any cached data
    localStorage.removeItem('jobSearchResults');
    localStorage.removeItem('userApplications');
    
    // Reset UI
    const loginElements = document.querySelectorAll('.login-required');
    const logoutElements = document.querySelectorAll('.logout-required');
    
    loginElements.forEach(el => el.style.display = 'none');
    logoutElements.forEach(el => el.style.display = 'block');
    
    showAlert('You have been logged out successfully.', 'info');
    navigateToPage('landing');
}

// Check authentication status
function isAuthenticated() {
    return currentUser && currentUser.email;
}

// Require authentication for protected routes
function requireAuth() {
    if (!isAuthenticated()) {
        showAlert('Please log in to access this feature.', 'warning');
        navigateToPage('login');
        return false;
    }
    return true;
}

// Export authentication functions
window.Auth = {
    handleLogin,
    handleRegister,
    handleLogout,
    isAuthenticated,
    requireAuth
};