// Payment Integration for AI Job Chommie
// Handles Paystack payment processing and subscription management

class PaymentManager {
    constructor() {
        this.paystackConfig = null;
        this.isInitialized = false;
        this.publicKey = null;
        this.loadPaystackConfig();
    }

    async loadPaystackConfig() {
        try {
            const config = await api.getPaymentConfig();
            this.paystackConfig = config;
            this.publicKey = config.paystack_public_key;
            this.isInitialized = true;
            console.log('✅ Payment configuration loaded');
        } catch (error) {
            console.error('Failed to load payment configuration:', error);
        }
    }

    async initializePayment(planType) {
        if (!this.isInitialized) {
            await this.loadPaystackConfig();
        }

        if (!this.paystackConfig) {
            throw new Error('Payment configuration not available');
        }

        try {
            showLoading('Initializing payment...');
            
            const response = await api.initializePayment(planType);
            
            if (response.status === 'success') {
                this.openPaystackPayment({
                    key: this.publicKey,
                    email: currentUser.email,
                    amount: response.amount,
                    currency: 'ZAR',
                    ref: response.reference,
                    callback: (response) => this.handlePaymentSuccess(response),
                    onClose: () => this.handlePaymentClose()
                });
            } else {
                throw new Error(response.message || 'Payment initialization failed');
            }
        } catch (error) {
            hideLoading();
            showError('Payment initialization failed: ' + error.message);
            throw error;
        }
    }

    openPaystackPayment(config) {
        if (typeof PaystackPop === 'undefined') {
            showError('Payment system not loaded. Please refresh the page.');
            return;
        }

        const handler = PaystackPop.setup(config);
        handler.openIframe();
    }

    async handlePaymentSuccess(response) {
        try {
            showLoading('Verifying payment...');
            
            const verification = await api.verifyPayment(response.reference);
            
            if (verification.status === 'success') {
                // Update user subscription status
                currentUser.subscription = 'premium';
                currentUser.subscription_date = new Date().toISOString();
                currentUser.payment_reference = response.reference;
                
                // Update UI
                updateUIForPremiumUser();
                
                showSuccess('🎉 Payment successful! Premium features activated.');
                closeModal();
                navigateToPage('dashboard');
            } else {
                throw new Error('Payment verification failed');
            }
        } catch (error) {
            showError('Payment verification failed: ' + error.message);
        } finally {
            hideLoading();
        }
    }

    handlePaymentClose() {
        hideLoading();
        showError('Payment was cancelled');
    }

    async getSubscriptionStatus() {
        try {
            const status = await api.getSubscriptionStatus();
            return status;
        } catch (error) {
            console.error('Failed to get subscription status:', error);
            return null;
        }
    }

    async cancelSubscription() {
        try {
            showLoading('Cancelling subscription...');
            
            const response = await api.cancelSubscription();
            
            if (response.message) {
                // Update user subscription status
                currentUser.subscription = 'basic';
                currentUser.subscription_date = null;
                currentUser.payment_reference = null;
                
                // Update UI
                updateUIForBasicUser();
                
                showSuccess('Subscription cancelled successfully');
                navigateToPage('subscription');
            }
        } catch (error) {
            showError('Failed to cancel subscription: ' + error.message);
        } finally {
            hideLoading();
        }
    }
}

// Create global payment manager instance
const paymentManager = new PaymentManager();

// Payment-related UI functions
function selectPlan(planType, price) {
    selectedPlanType = planType;
    selectedPlanPrice = price;
    
    document.getElementById('selectedPlan').textContent = planType.charAt(0).toUpperCase() + planType.slice(1);
    
    openModal();
}

function openModal() {
    const modal = document.getElementById('paymentModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeModal() {
    const modal = document.getElementById('paymentModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

async function processPayment() {
    if (!isLoggedIn) {
        showError('Please log in to subscribe');
        navigateToPage('login');
        return;
    }

    if (!selectedPlanType) {
        showError('Please select a plan');
        return;
    }

    try {
        await paymentManager.initializePayment(selectedPlanType);
    } catch (error) {
        console.error('Payment processing error:', error);
    }
}

function updateUIForPremiumUser() {
    // Update navigation to show premium features
    const premiumFeatures = document.querySelectorAll('.premium-feature');
    premiumFeatures.forEach(feature => {
        feature.style.display = 'block';
    });

    // Hide premium ads
    const premiumAds = document.querySelectorAll('.premium-ad-banner');
    premiumAds.forEach(ad => {
        ad.style.display = 'none';
    });

    // Update subscription status indicators
    const subscriptionStatus = document.querySelectorAll('.subscription-status');
    subscriptionStatus.forEach(status => {
        status.textContent = 'Premium';
        status.style.color = '#00ff00';
    });
}

function updateUIForBasicUser() {
    // Hide premium features
    const premiumFeatures = document.querySelectorAll('.premium-feature');
    premiumFeatures.forEach(feature => {
        feature.style.display = 'none';
    });

    // Show premium ads
    const premiumAds = document.querySelectorAll('.premium-ad-banner');
    premiumAds.forEach(ad => {
        ad.style.display = 'block';
    });

    // Update subscription status indicators
    const subscriptionStatus = document.querySelectorAll('.subscription-status');
    subscriptionStatus.forEach(status => {
        status.textContent = 'Basic';
        status.style.color = '#ffff00';
    });
}

// Subscription management functions
async function loadSubscriptionPage() {
    try {
        const status = await paymentManager.getSubscriptionStatus();
        
        if (status) {
            // Update subscription page with current status
            const statusElement = document.getElementById('currentSubscription');
            if (statusElement) {
                statusElement.textContent = status.subscription;
            }

            const daysRemainingElement = document.getElementById('daysRemaining');
            if (daysRemainingElement && status.days_remaining !== undefined) {
                daysRemainingElement.textContent = status.days_remaining;
            }

            const subscriptionDateElement = document.getElementById('subscriptionDate');
            if (subscriptionDateElement && status.subscription_date) {
                const date = new Date(status.subscription_date);
                subscriptionDateElement.textContent = date.toLocaleDateString();
            }

            // Show/hide cancel button based on subscription status
            const cancelButton = document.getElementById('cancelSubscriptionBtn');
            if (cancelButton) {
                cancelButton.style.display = status.is_active ? 'block' : 'none';
            }
        }
    } catch (error) {
        console.error('Failed to load subscription status:', error);
    }
}

// Auto-apply and premium features
async function startAIJobSearch() {
    if (!isLoggedIn) {
        showError('Please log in to use AI job search');
        navigateToPage('login');
        return;
    }

    try {
        showLoading('Starting AI job search...');
        
        // Check if user has premium subscription for unlimited searches
        const status = await paymentManager.getSubscriptionStatus();
        
        if (!status || !status.is_active) {
            // Show premium upgrade prompt for basic users
            showPremiumUpgradePrompt();
            return;
        }

        // Start AI job search for premium users
        const searchResults = await api.autoScrapeJobs();
        
        if (searchResults) {
            showSuccess(`🎯 AI search complete! Found ${searchResults.total_found} new opportunities`);
            
            // Navigate to jobs page to show results
            navigateToPage('jobs');
        }
    } catch (error) {
        showError('AI job search failed: ' + error.message);
    } finally {
        hideLoading();
    }
}

function showPremiumUpgradePrompt() {
    const upgradeModal = `
        <div class="modal" style="display: block;">
            <div class="modal-content">
                <h2 style="color: #00ffff;">🚀 Upgrade to Premium</h2>
                <p>Unlock unlimited AI job searches and auto-apply features!</p>
                <div style="margin: 20px 0;">
                    <h3>Premium Features:</h3>
                    <ul style="text-align: left; margin: 10px 0;">
                        <li>✅ Unlimited AI job searches</li>
                        <li>✅ Auto-apply to jobs</li>
                        <li>✅ Advanced CV analysis</li>
                        <li>✅ Priority support</li>
                    </ul>
                </div>
                <button class="futuristic-btn primary" onclick="selectPlan('premium', 299); closeUpgradeModal();">
                    Upgrade Now - R299/month
                </button>
                <button class="futuristic-btn" onclick="closeUpgradeModal();">
                    Maybe Later
                </button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', upgradeModal);
}

function closeUpgradeModal() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (modal.style.display === 'block') {
            modal.remove();
        }
    });
}

// Initialize payment system when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Load payment configuration
    paymentManager.loadPaystackConfig();
    
    // Update UI based on current user subscription
    if (currentUser) {
        if (currentUser.subscription === 'premium') {
            updateUIForPremiumUser();
        } else {
            updateUIForBasicUser();
        }
    }
});

// Export for global use
window.paymentManager = paymentManager;
window.selectPlan = selectPlan;
window.processPayment = processPayment;
window.startAIJobSearch = startAIJobSearch;

