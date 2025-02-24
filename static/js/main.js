// API endpoints
const API = {
    papers: '/api/papers/',
    summary: (paperId) => `/api/papers/${paperId}/summary`
};

// API Key management
function saveApiKey() {
    const apiKey = document.getElementById('apiKey').value;
    if (apiKey) {
        localStorage.setItem('openai_api_key', apiKey);
        document.getElementById('apiKeyStatus').textContent = 'API Key saved!';
        document.getElementById('apiKeyStatus').className = 'mt-2 text-sm text-green-600';
    } else {
        document.getElementById('apiKeyStatus').textContent = 'Please enter an API Key';
        document.getElementById('apiKeyStatus').className = 'mt-2 text-sm text-red-600';
    }
}

function getApiKey() {
    return localStorage.getItem('openai_api_key');
}

// Show/hide loading spinner
function showLoading() {
    document.getElementById('loadingSpinner').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loadingSpinner').classList.add('hidden');
}

// Show error message
function showError(message) {
    const papersContainer = document.getElementById('papers');
    papersContainer.innerHTML = `
        <div class="bg-red-50 border-l-4 border-red-400 p-4">
            <div class="flex">
                <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                    </svg>
                </div>
                <div class="ml-3">
                    <p class="text-sm text-red-700">${message}</p>
                </div>
            </div>
        </div>
    `;
}

// Render paper summary
async function generateSummary(paperId, summaryContainer) {
    const apiKey = getApiKey();
    if (!apiKey) {
        summaryContainer.innerHTML = '<p class="text-red-600">Please enter your OpenAI API Key first</p>';
        return;
    }

    try {
        summaryContainer.innerHTML = '<div class="animate-pulse"><div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div><div class="h-4 bg-gray-200 rounded w-2/3"></div></div>';
        
        const response = await fetch(API.summary(paperId), {
            headers: {
                'X-API-Key': apiKey
            }
        });
        
        if (!response.ok) {
            throw new Error(response.statusText);
        }
        
        const data = await response.json();
        const summary = data.summary;
        
        summaryContainer.innerHTML = `
            <div class="space-y-4">
                <div>
                    <h4 class="font-bold text-gray-900 mb-1">Observation</h4>
                    <p class="text-gray-600">${summary.observation}</p>
                </div>
                <div>
                    <h4 class="font-bold text-gray-900 mb-1">Objective</h4>
                    <p class="text-gray-600">${summary.objective}</p>
                </div>
                <div>
                    <h4 class="font-bold text-gray-900 mb-1">Challenge</h4>
                    <p class="text-gray-600">${summary.challenge}</p>
                </div>
                <div>
                    <h4 class="font-bold text-gray-900 mb-1">Main Idea</h4>
                    <p class="text-gray-600">${summary.main_idea}</p>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error generating summary:', error);
        summaryContainer.innerHTML = '<p class="text-red-600">Failed to generate summary. Please check your API Key and try again.</p>';
    }
}

// Toggle paper summary
function toggleSummary(button, paperId) {
    const paperCard = button.closest('.paper-card');
    const summaryContainer = paperCard.querySelector('.summary-container');
    
    if (summaryContainer.classList.contains('hidden')) {
        summaryContainer.classList.remove('hidden');
        button.textContent = 'Hide Summary';
        button.classList.remove('bg-blue-600', 'hover:bg-blue-700');
        button.classList.add('bg-gray-600', 'hover:bg-gray-700');
        generateSummary(paperId, summaryContainer);
    } else {
        summaryContainer.classList.add('hidden');
        button.textContent = 'Generate Summary';
        button.classList.remove('bg-gray-600', 'hover:bg-gray-700');
        button.classList.add('bg-blue-600', 'hover:bg-blue-700');
        summaryContainer.innerHTML = '';
    }
}

// Render paper card
function renderPaperCard(paper) {
    const paperId = paper.url.split('/').pop();
    return `
        <div class="bg-white shadow rounded-lg p-6 mb-4 hover:shadow-lg transition-shadow duration-200 paper-card">
            <div class="flex justify-between items-start mb-4">
                <div class="flex-1 mr-4">
                    <h3 class="text-xl font-semibold mb-2">${paper.title}</h3>
                    <p class="text-gray-600 mb-2">${paper.authors.join(', ')}</p>
                    <p class="text-sm text-gray-500">${new Date(paper.published).toLocaleDateString()}</p>
                </div>
                <div class="flex flex-col space-y-2 items-end">
                    <button onclick="toggleSummary(this, '${paperId}')" class="w-36 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm">
                        Generate Summary
                    </button>
                    <div class="flex space-x-2">
                        <a href="${paper.url}" target="_blank" class="text-blue-600 hover:text-blue-800 text-sm">arXiv</a>
                        <span class="text-gray-300">|</span>
                        <a href="${paper.pdf_url}" target="_blank" class="text-blue-600 hover:text-blue-800 text-sm">PDF</a>
                    </div>
                </div>
            </div>
            <div class="mb-4">
                <h3 class="text-lg font-bold text-gray-900 mb-2">Abstract</h3>
                <p class="text-gray-600">${paper.abstract}</p>
            </div>
            <div class="summary-container hidden border-t border-gray-200 pt-4 mt-4">
                <!-- Summary will be loaded here -->
            </div>
        </div>
    `;
}

// Fetch papers from API
async function fetchPapers() {
    const categorySelect = document.getElementById('categorySelect');
    const resultsCount = document.getElementById('resultsCount');
    
    if (!categorySelect || !resultsCount) {
        console.error('Required elements not found');
        return;
    }

    const category = categorySelect.value;
    const maxResults = resultsCount.value;
    const papersContainer = document.getElementById('papers');
    
    showLoading();
    
    try {
        const response = await fetch(`${API.papers}?category=${category}&max_results=${maxResults}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const papers = await response.json();
        if (papers.length === 0) {
            papersContainer.innerHTML = `
                <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                            </svg>
                        </div>
                        <div class="ml-3">
                            <p class="text-sm text-yellow-700">No papers found for this category. Try another category or try again later.</p>
                        </div>
                    </div>
                </div>
            `;
            return;
        }
        
        papersContainer.innerHTML = papers.map(paper => renderPaperCard(paper)).join('');
    } catch (error) {
        console.error('Error fetching papers:', error);
        showError('Failed to load papers. Please try again later.');
    } finally {
        hideLoading();
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    // Check for saved API key
    const apiKey = getApiKey();
    if (apiKey) {
        document.getElementById('apiKeyStatus').textContent = 'API Key is set';
        document.getElementById('apiKeyStatus').className = 'mt-2 text-sm text-green-600';
    }

    // Add event listeners
    const categorySelect = document.getElementById('categorySelect');
    const resultsCount = document.getElementById('resultsCount');
    
    if (categorySelect && resultsCount) {
        categorySelect.addEventListener('change', fetchPapers);
        resultsCount.addEventListener('change', fetchPapers);
        // Initial fetch
        fetchPapers();
    } else {
        console.error('Required elements not found during initialization');
    }
});
