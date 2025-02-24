// Load papers for dashboard
async function loadPapers(filters = {}) {
    const token = localStorage.getItem('token');
    if (!token) return [];

    const queryParams = new URLSearchParams(filters).toString();
    const response = await fetch(`${API.papers}?${queryParams}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error('Failed to load papers');
    }

    return await response.json();
}

// Render paper card
function renderPaperCard(paper) {
    return `
        <div class="bg-white shadow rounded-lg p-6 mb-4">
            <div class="flex justify-between items-start">
                <h3 class="text-xl font-semibold mb-2">${paper.title}</h3>
                <button onclick="toggleBookmark(${paper.id})" class="text-gray-400 hover:text-yellow-500">
                    <svg class="w-6 h-6" fill="${paper.bookmarked ? 'currentColor' : 'none'}" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
                    </svg>
                </button>
            </div>
            <p class="text-gray-600 mb-4">${paper.authors}</p>
            <div class="space-y-4">
                <div>
                    <h4 class="font-medium text-gray-700">Observation</h4>
                    <p class="text-gray-600">${paper.summary?.observation || 'Loading...'}</p>
                </div>
                <div>
                    <h4 class="font-medium text-gray-700">Objective</h4>
                    <p class="text-gray-600">${paper.summary?.objective || 'Loading...'}</p>
                </div>
                <div>
                    <h4 class="font-medium text-gray-700">Challenge</h4>
                    <p class="text-gray-600">${paper.summary?.challenge || 'Loading...'}</p>
                </div>
                <div>
                    <h4 class="font-medium text-gray-700">Main Idea</h4>
                    <p class="text-gray-600">${paper.summary?.main_idea || 'Loading...'}</p>
                </div>
            </div>
            <div class="mt-4 flex justify-between items-center">
                <span class="text-sm text-gray-500">${new Date(paper.published_date).toLocaleDateString()}</span>
                <a href="${paper.url}" target="_blank" class="text-blue-600 hover:text-blue-800">View on arXiv</a>
            </div>
        </div>
    `;
}

// Toggle bookmark
async function toggleBookmark(paperId) {
    const token = localStorage.getItem('token');
    if (!token) {
        showAuthModal('login');
        return;
    }

    try {
        const response = await fetch(`${API.papers}/${paperId}/bookmark`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to toggle bookmark');
        }

        // Update UI
        loadContent();
    } catch (error) {
        console.error('Bookmark toggle failed:', error);
        showError('Failed to update bookmark. Please try again.');
    }
}

// Load dashboard content
async function loadDashboard(container) {
    if (!state.user) {
        window.location.href = '/';
        return;
    }

    try {
        const papers = await loadPapers();
        
        container.innerHTML = `
            <div class="space-y-6">
                <div class="flex justify-between items-center">
                    <h2 class="text-2xl font-bold">Latest Papers</h2>
                    <div class="flex space-x-4">
                        <select id="categoryFilter" class="rounded-md border-gray-300">
                            <option value="">All Categories</option>
                            <option value="cs.CV">Computer Vision</option>
                            <option value="cs.AI">Artificial Intelligence</option>
                            <option value="cs.LG">Machine Learning</option>
                        </select>
                        <button onclick="refreshPapers()" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                            Refresh
                        </button>
                    </div>
                </div>
                <div id="papersList" class="space-y-6">
                    ${papers.map(paper => renderPaperCard(paper)).join('')}
                </div>
            </div>
        `;

        // Setup filter listeners
        document.getElementById('categoryFilter').addEventListener('change', async (e) => {
            const papers = await loadPapers({ category: e.target.value });
            document.getElementById('papersList').innerHTML = papers.map(paper => renderPaperCard(paper)).join('');
        });
    } catch (error) {
        console.error('Dashboard loading failed:', error);
        container.innerHTML = '<div class="text-red-600">Failed to load dashboard. Please try again later.</div>';
    }
}

// Refresh papers
async function refreshPapers() {
    const papersList = document.getElementById('papersList');
    const category = document.getElementById('categoryFilter').value;
    
    try {
        showLoading();
        const papers = await loadPapers({ category });
        papersList.innerHTML = papers.map(paper => renderPaperCard(paper)).join('');
    } catch (error) {
        console.error('Paper refresh failed:', error);
        showError('Failed to refresh papers. Please try again.');
    } finally {
        hideLoading();
    }
}
