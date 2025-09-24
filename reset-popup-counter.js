#!/usr/bin/env node

// Script to reset popup counter for testing
// Run this in browser console or as a Node.js script

console.log('🔄 Resetting popup counters...');

// Reset all popup counters in localStorage
const keys = Object.keys(localStorage);
const popupKeys = keys.filter(key => key.startsWith('arenastreams_popups_'));

popupKeys.forEach(key => {
    localStorage.removeItem(key);
    console.log(`✅ Removed: ${key}`);
});

// Also reset any session-based counters
localStorage.removeItem('arenastreams_popups_current_session');
localStorage.removeItem('arenastreams_popups_page_load');

console.log(`🎉 Reset ${popupKeys.length} popup counters`);
console.log('📝 You can now test the stream buttons again');

// For Node.js usage (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        resetPopupCounters: function() {
            console.log('🔄 Resetting popup counters...');
            const keys = Object.keys(localStorage);
            const popupKeys = keys.filter(key => key.startsWith('arenastreams_popups_'));
            popupKeys.forEach(key => localStorage.removeItem(key));
            console.log(`🎉 Reset ${popupKeys.length} popup counters`);
        }
    };
}
