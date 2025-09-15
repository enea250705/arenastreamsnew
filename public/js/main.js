// Main JavaScript for ArenaStreams - Streamed.pk API only
document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add loading states to buttons
    document.querySelectorAll('button[type="submit"]').forEach(button => {
        button.addEventListener('click', function() {
            if (this.form && this.form.checkValidity()) {
                this.innerHTML = '⏳ Loading...';
                this.disabled = true;
            }
        });
    });

    // Auto-refresh for live matches (every 30 seconds) - Streamed.pk API only
    if (window.location.pathname === '/') {
        setInterval(function() {
            // Only refresh if user is not interacting with the page
            if (document.hidden) return;
            
            fetch('/api/streamed/matches/live')
                .then(response => response.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        updateMatchCount(data.length);
                    }
                })
                .catch(error => console.log('Auto-refresh failed:', error));
        }, 30000);
    }

    function updateMatchCount(count) {
        const countElement = document.querySelector('[data-match-count]');
        if (countElement) {
            countElement.textContent = count;
        }
    }
});

// Streamed.pk API only - no local data
async function loadSportMatches(sport) {
    try {
        console.log(`🔄 Loading ${sport} matches from Streamed.pk...`);
        
        // Use our proxy API (avoids CORS issues)
        const streamedResponse = await fetch(`/api/streamed/matches/${sport}`);
        const streamedData = await streamedResponse.json();
        
        // Handle the API response structure - data might be wrapped in 'value' array
        let matches = [];
        if (streamedData.value && Array.isArray(streamedData.value)) {
            matches = streamedData.value;
        } else if (Array.isArray(streamedData)) {
            matches = streamedData;
        }
        
        if (matches.length > 0) {
            const processedMatches = matches.map(match => {
                // Handle different match structures
                let homeTeam = 'Team A';
                let awayTeam = 'Team B';
                let teamABadge = '';
                let teamBBadge = '';
                
                if (match.teams && match.teams.home && match.teams.away) {
                    // Proper team structure
                    homeTeam = match.teams.home.name || 'Team A';
                    awayTeam = match.teams.away.name || 'Team B';
                    teamABadge = match.teams.home.badge ? `https://streamed.pk/api/images/badge/${match.teams.home.badge}.webp` : '';
                    teamBBadge = match.teams.away.badge ? `https://streamed.pk/api/images/badge/${match.teams.away.badge}.webp` : '';
                } else if (match.title) {
                    // Handle different title formats
                    if (match.title.includes(' vs ')) {
                        const titleParts = match.title.split(' vs ');
                        if (titleParts.length === 2) {
                            homeTeam = titleParts[0].trim();
                            awayTeam = titleParts[1].trim();
                        } else {
                            homeTeam = match.title;
                            awayTeam = 'vs Opponent';
                        }
                    } else if (match.title.includes(':')) {
                        // Handle format like "WNBA: Team A vs Team B"
                        const colonIndex = match.title.indexOf(':');
                        const afterColon = match.title.substring(colonIndex + 1).trim();
                        if (afterColon.includes(' vs ')) {
                            const parts = afterColon.split(' vs ');
                            if (parts.length === 2) {
                                homeTeam = parts[0].trim();
                                awayTeam = parts[1].trim();
                            } else {
                                homeTeam = afterColon;
                                awayTeam = 'vs Opponent';
                            }
                        } else {
                            homeTeam = afterColon;
                            awayTeam = 'vs Opponent';
                        }
                    } else {
                        // Single team or channel name
                        homeTeam = match.title;
                        awayTeam = 'vs Opponent';
                    }
                }
                
                // Handle date parsing - some matches have date: 0
                let matchDate;
                if (match.date && match.date > 0) {
                    matchDate = new Date(match.date).toISOString();
                } else {
                    // For matches with no date or date: 0, use current date + some hours
                    const now = new Date();
                    now.setHours(now.getHours() + 2); // 2 hours from now
                    matchDate = now.toISOString();
                }
                
                const slug = `${homeTeam}-vs-${awayTeam}-live-${new Date(matchDate).toISOString().split('T')[0]}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
                
                return {
                    id: match.id,
                    teamA: homeTeam,
                    teamB: awayTeam,
                    competition: match.title || `${sport.charAt(0).toUpperCase() + sport.slice(1)} Match`,
                    date: matchDate,
                    slug: slug,
                    teamABadge: teamABadge,
                    teamBBadge: teamBBadge,
                    status: getMatchStatus(match.date),
                    poster: match.poster ? `https://streamed.pk/api/images/poster/${match.poster}` : '',
                    popular: match.popular || false,
                    sources: match.sources || [],
                    category: match.category || sport
                };
            });
            console.log(`📊 Found ${processedMatches.length} ${sport} matches from Streamed.pk`);
            return processedMatches;
        } else {
            console.log(`⚠️ No ${sport} matches found in Streamed.pk`);
            return [];
        }
    } catch (error) {
        console.error(`❌ Error loading ${sport} matches from Streamed.pk:`, error);
        return [];
    }
}

// Load live matches from Streamed.pk API only
async function loadLiveMatches() {
    try {
        console.log('🔴 Loading live matches from Streamed.pk...');
        
        const response = await fetch('/api/streamed/matches/live');
        const data = await response.json();
        
        // Handle the API response structure
        let matches = [];
        if (data.value && Array.isArray(data.value)) {
            matches = data.value;
        } else if (Array.isArray(data)) {
            matches = data;
        }
        
        if (matches.length > 0) {
            const processedMatches = matches.map(match => {
                let homeTeam = 'Team A';
                let awayTeam = 'Team B';
                let teamABadge = '';
                let teamBBadge = '';
                
                if (match.teams && match.teams.home && match.teams.away) {
                    homeTeam = match.teams.home.name || 'Team A';
                    awayTeam = match.teams.away.name || 'Team B';
                    teamABadge = match.teams.home.badge ? `https://streamed.pk/api/images/badge/${match.teams.home.badge}.webp` : '';
                    teamBBadge = match.teams.away.badge ? `https://streamed.pk/api/images/badge/${match.teams.away.badge}.webp` : '';
                } else if (match.title) {
                    const titleParts = match.title.split(' vs ');
                    if (titleParts.length === 2) {
                        homeTeam = titleParts[0].trim();
                        awayTeam = titleParts[1].trim();
                    } else {
                        homeTeam = match.title;
                        awayTeam = 'vs Opponent';
                    }
                }
                
                const slug = `${homeTeam}-vs-${awayTeam}-live-${new Date(match.date).toISOString().split('T')[0]}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
                
                return {
                    id: match.id,
                    teamA: homeTeam,
                    teamB: awayTeam,
                    competition: match.title || 'Live Match',
                    date: new Date(match.date).toISOString(),
                    slug: slug,
                    teamABadge: teamABadge,
                    teamBBadge: teamBBadge,
                    status: 'live',
                    poster: match.poster ? `https://streamed.pk/api/images/poster/${match.poster}` : '',
                    popular: match.popular || false,
                    sources: match.sources || [],
                    category: match.category || 'live'
                };
            });
            console.log(`🔴 Found ${processedMatches.length} live matches from Streamed.pk`);
            return processedMatches;
        } else {
            console.log('⚠️ No live matches found in Streamed.pk');
            return [];
        }
    } catch (error) {
        console.error('❌ Error loading live matches from Streamed.pk:', error);
        return [];
    }
}

// Load today's matches from Streamed.pk API only
async function loadTodaysMatches() {
    try {
        console.log('📅 Loading today\'s matches from Streamed.pk...');
        
        const response = await fetch('/api/streamed/matches/all-today');
        const data = await response.json();
        
        // Handle the API response structure
        let matches = [];
        if (data.value && Array.isArray(data.value)) {
            matches = data.value;
        } else if (Array.isArray(data)) {
            matches = data;
        }
        
        if (matches.length > 0) {
            const processedMatches = matches.map(match => {
                let homeTeam = 'Team A';
                let awayTeam = 'Team B';
                let teamABadge = '';
                let teamBBadge = '';
                
                if (match.teams && match.teams.home && match.teams.away) {
                    homeTeam = match.teams.home.name || 'Team A';
                    awayTeam = match.teams.away.name || 'Team B';
                    teamABadge = match.teams.home.badge ? `https://streamed.pk/api/images/badge/${match.teams.home.badge}.webp` : '';
                    teamBBadge = match.teams.away.badge ? `https://streamed.pk/api/images/badge/${match.teams.away.badge}.webp` : '';
                } else if (match.title) {
                    const titleParts = match.title.split(' vs ');
                    if (titleParts.length === 2) {
                        homeTeam = titleParts[0].trim();
                        awayTeam = titleParts[1].trim();
                    } else {
                        homeTeam = match.title;
                        awayTeam = 'vs Opponent';
                    }
                }
                
                const slug = `${homeTeam}-vs-${awayTeam}-live-${new Date(match.date).toISOString().split('T')[0]}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
                
                return {
                    id: match.id,
                    teamA: homeTeam,
                    teamB: awayTeam,
                    competition: match.title || 'Today\'s Match',
                    date: new Date(match.date).toISOString(),
                    slug: slug,
                    teamABadge: teamABadge,
                    teamBBadge: teamBBadge,
                    status: getMatchStatus(match.date),
                    poster: match.poster ? `https://streamed.pk/api/images/poster/${match.poster}` : '',
                    popular: match.popular || false,
                    sources: match.sources || [],
                    category: match.category || 'today'
                };
            });
            console.log(`📅 Found ${processedMatches.length} today's matches from Streamed.pk`);
            return processedMatches;
        } else {
            console.log('⚠️ No today\'s matches found in Streamed.pk');
            return [];
        }
    } catch (error) {
        console.error('❌ Error loading today\'s matches from Streamed.pk:', error);
        return [];
    }
}

// Get match status based on date
function getMatchStatus(matchDate) {
    const now = new Date();
    let match;
    
    // Handle invalid dates (like date: 0)
    if (matchDate && matchDate > 0) {
        match = new Date(matchDate);
    } else {
        // For invalid dates, treat as upcoming
        match = new Date();
        match.setHours(match.getHours() + 2);
    }
    
    const diffMinutes = (match - now) / (1000 * 60);
    
    if (diffMinutes < -90) {
        return 'ended';
    } else if (diffMinutes < 0) {
        return 'live';
    } else if (diffMinutes < 30) {
        return 'starting-soon';
    } else {
        return 'upcoming';
    }
}

// Helper function to truncate team names intelligently for mobile
function truncateTeamName(name, maxLength = 15) {
    if (name.length <= maxLength) return name;
    
    // Try to truncate at a space if possible
    const truncated = name.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    if (lastSpace > maxLength * 0.6) {
        return truncated.substring(0, lastSpace) + '...';
    }
    
    return truncated + '...';
}

// Helper function to get mobile-optimized team name
function getMobileTeamName(name) {
    // For mobile, use shorter truncation
    if (window.innerWidth < 640) { // sm breakpoint
        return truncateTeamName(name, 10);
    }
    return truncateTeamName(name, 18);
}

// Search functionality for teams and matches
let allMatches = [];
let searchTimeout;

// Search function to filter matches by team names
function searchMatches(searchTerm, containerId) {
    if (!searchTerm.trim()) {
        // If search is empty, show all matches
        renderMatches(allMatches, containerId);
        return;
    }
    
    const filteredMatches = allMatches.filter(match => {
        const searchLower = searchTerm.toLowerCase();
        const teamA = match.teamA ? match.teamA.toLowerCase() : '';
        const teamB = match.teamB ? match.teamB.toLowerCase() : '';
        const competition = match.competition ? match.competition.toLowerCase() : '';
        const title = match.title ? match.title.toLowerCase() : '';
        
        return teamA.includes(searchLower) || 
               teamB.includes(searchLower) || 
               competition.includes(searchLower) ||
               title.includes(searchLower);
    });
    
    renderMatches(filteredMatches, containerId);
    
    // Show search results count
    const container = document.getElementById(containerId);
    if (container && container.previousElementSibling) {
        const resultsInfo = container.previousElementSibling.querySelector('.search-results-info');
        if (resultsInfo) {
            resultsInfo.textContent = `Found ${filteredMatches.length} match${filteredMatches.length !== 1 ? 'es' : ''} for "${searchTerm}"`;
            resultsInfo.style.display = filteredMatches.length > 0 ? 'block' : 'none';
        }
    }
}

// Create search input component
function createSearchInput(containerId, placeholder = "Search teams or matches...") {
    return `
        <div class="mb-4">
            <div class="relative">
                <input 
                    type="text" 
                    id="search-input-${containerId}" 
                    class="w-full px-4 py-2 pl-10 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-primary focus:outline-none transition-colors"
                    placeholder="${placeholder}"
                    autocomplete="off"
                >
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                </div>
                <button 
                    id="clear-search-${containerId}" 
                    class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors"
                    style="display: none;"
                >
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            <div class="search-results-info text-sm text-gray-400 mt-2" style="display: none;"></div>
        </div>
    `;
}

// Initialize search functionality
function initializeSearch(containerId, placeholder) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Add search input before the container
    const searchHTML = createSearchInput(containerId, placeholder);
    container.insertAdjacentHTML('beforebegin', searchHTML);
    
    const searchInput = document.getElementById(`search-input-${containerId}`);
    const clearButton = document.getElementById(`clear-search-${containerId}`);
    
    if (!searchInput) return;
    
    // Search input event listener
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.trim();
        
        // Show/hide clear button
        clearButton.style.display = searchTerm ? 'flex' : 'none';
        
        // Debounce search
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            searchMatches(searchTerm, containerId);
        }, 300);
    });
    
    // Clear button event listener
    clearButton.addEventListener('click', function() {
        searchInput.value = '';
        this.style.display = 'none';
        searchMatches('', containerId);
        searchInput.focus();
    });
    
    // Store original matches when first loaded
    if (allMatches.length === 0 && container.innerHTML.trim()) {
        // We'll populate allMatches when matches are loaded
    }
}

// Enhanced renderMatches function with search support
function renderMatchesWithSearch(matches, containerId, placeholder = "Search teams or matches...") {
    // Store all matches for search functionality
    allMatches = matches;
    
    // Initialize search if not already done
    const searchInput = document.getElementById(`search-input-${containerId}`);
    if (!searchInput) {
        initializeSearch(containerId, placeholder);
    }
    
    // Render matches
    renderMatches(matches, containerId);
}

// Force re-render on window resize to update mobile layout
let resizeTimeout;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function() {
        // Re-render all match containers on resize
        const containers = ['live-matches', 'upcoming-matches', 'matches-container'];
        containers.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container && container.innerHTML.trim()) {
                // Trigger a re-render by dispatching a custom event
                const event = new CustomEvent('resizeMatches');
                container.dispatchEvent(event);
            }
        });
    }, 250);
});

// Render matches in the UI with improved mobile responsiveness
function renderMatches(matches, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (matches.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8">
                <div class="text-4xl mb-4">🏟️</div>
                <h3 class="text-xl font-semibold mb-2">No matches available</h3>
                <p class="text-gray-400">Check back later for upcoming matches</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = matches.map(match => `
        <div class="bg-dark border border-gray-800 rounded-lg p-3 sm:p-6 hover:border-primary transition-colors">
            <!-- Ultra-compact mobile layout for team names -->
            <div class="mb-3 sm:mb-4">
                ${match.teamB !== 'vs Opponent' ? `
                <!-- Two team match - Horizontal layout: Team A vs Team B -->
                <div class="flex items-center justify-between space-x-2">
                    <!-- Team A -->
                    <div class="flex items-center space-x-2 min-w-0 flex-1">
                        ${match.teamABadge ? `<img src="${match.teamABadge}" alt="${match.teamA}" class="w-5 h-5 sm:w-8 sm:h-8 rounded-full flex-shrink-0" onerror="this.style.display='none'">` : ''}
                        <span class="font-semibold text-xs sm:text-base truncate" title="${match.teamA}">${getMobileTeamName(match.teamA)}</span>
                    </div>
                    
                    <!-- VS separator -->
                    <span class="text-primary font-bold text-xs sm:text-sm flex-shrink-0">VS</span>
                    
                    <!-- Team B -->
                    <div class="flex items-center space-x-2 min-w-0 flex-1 justify-end">
                        <span class="font-semibold text-xs sm:text-base truncate" title="${match.teamB}">${getMobileTeamName(match.teamB)}</span>
                        ${match.teamBBadge ? `<img src="${match.teamBBadge}" alt="${match.teamB}" class="w-5 h-5 sm:w-8 sm:h-8 rounded-full flex-shrink-0" onerror="this.style.display='none'">` : ''}
                    </div>
                </div>
                ` : `
                <!-- Single team/channel - Mobile optimized -->
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-2 min-w-0 flex-1">
                        ${match.teamABadge ? `<img src="${match.teamABadge}" alt="${match.teamA}" class="w-5 h-5 sm:w-8 sm:h-8 rounded-full flex-shrink-0" onerror="this.style.display='none'">` : ''}
                        <span class="font-semibold text-xs sm:text-base truncate" title="${match.teamA}">${getMobileTeamName(match.teamA)}</span>
                    </div>
                    <span class="text-gray-400 text-xs flex-shrink-0">Live</span>
                </div>
                `}
            </div>
            
            <!-- Match info -->
            <div class="text-center mb-4">
                <p class="text-gray-400 text-xs sm:text-sm mb-1">${match.competition}</p>
                <p class="text-gray-300 text-xs sm:text-sm mb-2">${new Date(match.date).toLocaleString()}</p>
                ${match.status === 'live' ? '<span class="inline-block bg-red-500 text-white text-xs px-2 py-1 rounded-full">LIVE</span>' : ''}
                ${match.status === 'starting-soon' ? '<span class="inline-block bg-yellow-500 text-dark text-xs px-2 py-1 rounded-full">Starting Soon</span>' : ''}
                ${match.status === 'ended' ? '<span class="inline-block bg-gray-500 text-white text-xs px-2 py-1 rounded-full">Ended</span>' : ''}
                ${match.status === 'upcoming' ? '<span class="inline-block bg-blue-500 text-white text-xs px-2 py-1 rounded-full">Upcoming</span>' : ''}
            </div>
            
            <!-- Watch button -->
            <a href="/match/${match.slug}" class="block w-full bg-primary text-dark font-bold py-2 sm:py-3 px-3 sm:px-4 rounded-lg text-center hover:bg-yellow-400 transition-colors text-sm sm:text-base">
                ${match.status === 'live' ? 'Watch Live' : match.status === 'starting-soon' ? 'Watch Soon' : 'Watch Stream'}
            </a>
        </div>
    `).join('');
    
    // Update live match count
    updateLiveMatchCount(matches);
}

// Update live match count display
function updateLiveMatchCount(matches) {
    const liveMatches = matches.filter(match => match.status === 'live');
    const liveCount = liveMatches.length;
    
    // Update all live count elements
    document.querySelectorAll('#live-count').forEach(element => {
        element.textContent = liveCount;
    });
    
    // Update totalMatches if it exists
    const totalMatchesElement = document.querySelector('[data-match-count]');
    if (totalMatchesElement) {
        totalMatchesElement.textContent = matches.length;
    }
    
    console.log(`📊 Updated live match count: ${liveCount} live matches, ${matches.length} total matches`);
}

// Search and filter functionality
function setupSearchAndFilter() {
    const searchInput = document.getElementById('search-input');
    const filterSelect = document.getElementById('filter-select');
    
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const matchCards = document.querySelectorAll('.match-card');
            
            matchCards.forEach(card => {
                const text = card.textContent.toLowerCase();
                card.style.display = text.includes(searchTerm) ? 'block' : 'none';
            });
        });
    }
    
    if (filterSelect) {
        filterSelect.addEventListener('change', function() {
            const filterValue = this.value;
            const matchCards = document.querySelectorAll('.match-card');
            
            matchCards.forEach(card => {
                if (filterValue === 'all') {
                    card.style.display = 'block';
                } else {
                    const status = card.querySelector('.status-indicator')?.textContent.toLowerCase();
                    card.style.display = status === filterValue ? 'block' : 'none';
                }
            });
        });
    }
}

// Initialize search and filter
document.addEventListener('DOMContentLoaded', function() {
    setupSearchAndFilter();
});

// Setup auto-refresh for sport pages
async function setupAutoRefresh(sport, containerId, noMatchesId) {
    try {
        console.log(`🔄 Setting up auto-refresh for ${sport}...`);
        console.log(`📊 Container ID: ${containerId}, No Matches ID: ${noMatchesId}`);
        
        // Check if container exists
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`❌ Container ${containerId} not found!`);
            return;
        }
        console.log(`✅ Container ${containerId} found`);
        
        // Load initial matches
        await loadAndRenderSportMatches(sport, containerId, noMatchesId);
        
        // Set up auto-refresh every 2 minutes
        setInterval(async () => {
            if (!document.hidden) {
                console.log(`🔄 Auto-refreshing ${sport} matches...`);
                await loadAndRenderSportMatches(sport, containerId, noMatchesId);
            }
        }, 120000); // 2 minutes
        
    } catch (error) {
        console.error(`❌ Error setting up auto-refresh for ${sport}:`, error);
    }
}

// Load and render sport matches
async function loadAndRenderSportMatches(sport, containerId, noMatchesId) {
    try {
        console.log(`🔄 Loading ${sport} matches...`);
        
        const matches = await loadSportMatches(sport);
        console.log(`📊 Loaded ${matches.length} matches for ${sport}`);
        
        if (matches.length > 0) {
            console.log(`🎯 Rendering ${matches.length} matches in container ${containerId}`);
            renderMatchesWithSearch(matches, containerId, `Search ${sport} matches...`);
            // Hide no matches message
            const noMatchesEl = document.getElementById(noMatchesId);
            if (noMatchesEl) {
                noMatchesEl.classList.add('hidden');
                console.log(`✅ Hidden no-matches message`);
            }
        } else {
            console.log(`⚠️ No matches found, showing no-matches message`);
            // Show no matches message
            const noMatchesEl = document.getElementById(noMatchesId);
            if (noMatchesEl) {
                noMatchesEl.classList.remove('hidden');
                console.log(`✅ Showed no-matches message`);
            }
        }
        
    } catch (error) {
        console.error(`❌ Error loading ${sport} matches:`, error);
    }
}

// Export functions for global use
window.ArenaStreams = {
    loadSportMatches,
    loadLiveMatches,
    loadTodaysMatches,
    renderMatches,
    renderMatchesWithSearch,
    searchMatches,
    initializeSearch,
    getMatchStatus,
    setupAutoRefresh,
    loadAndRenderSportMatches
};