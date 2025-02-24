// Initialize Stripe
const stripe = Stripe(STRIPE_PUBLISHABLE_KEY);

// Subscription plans
const PLANS = {
    basic: {
        name: 'Basic Plan',
        price: 9.99,
        features: [
            '5 paper summaries per day',
            'Basic categories',
            'Email notifications'
        ]
    },
    premium: {
        name: 'Premium Plan',
        price: 19.99,
        features: [
            'Unlimited paper summaries',
            'All categories',
            'Priority updates',
            'API access',
            'Custom preferences'
        ]
    }
};

// Load subscription page
async function loadSubscriptionPage(container) {
    const subscriptionStatus = await getSubscriptionStatus();
    
    container.innerHTML = `
        <div class="max-w-4xl mx-auto">
            <h2 class="text-3xl font-bold text-center mb-8">Choose Your Plan</h2>
            <div class="grid md:grid-cols-2 gap-8">
                ${renderPlanCards(subscriptionStatus)}
            </div>
            ${renderDiscountSection()}
        </div>
    `;

    setupSubscriptionListeners();
}

// Render plan cards
function renderPlanCards(currentPlan) {
    return Object.entries(PLANS).map(([planId, plan]) => `
        <div class="bg-white rounded-lg shadow-lg p-6">
            <h3 class="text-2xl font-bold mb-4">${plan.name}</h3>
            <p class="text-4xl font-bold mb-6">$${plan.price}<span class="text-gray-500 text-base">/month</span></p>
            <ul class="space-y-3 mb-8">
                ${plan.features.map(feature => `
                    <li class="flex items-center">
                        <svg class="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                        </svg>
                        ${feature}
                    </li>
                `).join('')}
            </ul>
            <button 
                class="w-full py-2 px-4 rounded-md ${currentPlan === planId ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white"
                ${currentPlan === planId ? 'disabled' : `onclick="subscribeToPlan('${planId}')"`}
            >
                ${currentPlan === planId ? 'Current Plan' : 'Subscribe Now'}
            </button>
        </div>
    `).join('');
}

// Render discount section
function renderDiscountSection() {
    return `
        <div class="mt-8 p-6 bg-white rounded-lg shadow-lg">
            <h3 class="text-xl font-bold mb-4">Have a Discount Code?</h3>
            <div class="flex space-x-4">
                <input 
                    type="text" 
                    id="discountCode" 
                    class="flex-1 rounded-md border-gray-300" 
                    placeholder="Enter discount code"
                >
                <button 
                    onclick="applyDiscount()"
                    class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                    Apply
                </button>
            </div>
        </div>
    `;
}

// Get subscription status
async function getSubscriptionStatus() {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
        const response = await fetch(`${API.subscriptions}/subscription-status`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Failed to get subscription status');
        
        const data = await response.json();
        return data.subscription_tier;
    } catch (error) {
        console.error('Failed to get subscription status:', error);
        return null;
    }
}

// Subscribe to plan
async function subscribeToPlan(planId) {
    const token = localStorage.getItem('token');
    if (!token) {
        showAuthModal('login');
        return;
    }

    try {
        showLoading();
        
        // Create subscription session
        const response = await fetch(`${API.subscriptions}/create-subscription`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ plan: planId })
        });

        if (!response.ok) throw new Error('Failed to create subscription');
        
        const { sessionId } = await response.json();
        
        // Redirect to Stripe checkout
        const result = await stripe.redirectToCheckout({
            sessionId
        });

        if (result.error) {
            throw new Error(result.error.message);
        }
    } catch (error) {
        console.error('Subscription failed:', error);
        showError('Failed to process subscription. Please try again.');
    } finally {
        hideLoading();
    }
}

// Apply discount code
async function applyDiscount() {
    const token = localStorage.getItem('token');
    if (!token) {
        showAuthModal('login');
        return;
    }

    const discountCode = document.getElementById('discountCode').value.trim();
    if (!discountCode) {
        showError('Please enter a discount code');
        return;
    }

    try {
        showLoading();
        
        const response = await fetch(`${API.subscriptions}/apply-discount`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ code: discountCode })
        });

        if (!response.ok) throw new Error('Invalid discount code');
        
        const data = await response.json();
        showSuccess(`Discount applied! You'll save ${data.discount_percentage}% on your subscription.`);
        
        // Refresh the page to show updated prices
        setTimeout(() => location.reload(), 2000);
    } catch (error) {
        console.error('Discount application failed:', error);
        showError('Invalid discount code. Please try again.');
    } finally {
        hideLoading();
    }
}

// Setup subscription page listeners
function setupSubscriptionListeners() {
    // Add any necessary event listeners for the subscription page
}
