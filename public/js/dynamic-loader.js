// Dynamic Code Loading and Execution
(function() {
    'use strict';
    
    // Encoded function chunks (base64 encoded JavaScript)
    const encodedChunks = [
        // Chunk 1: Mobile menu functionality
        'ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGZ1bmN0aW9uKCkgewogICAgY29uc3QgbW9iaWxlTWVudUJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtb2JpbGUtbWVudS1idG4nKTsKICAgIGNvbnN0IG1vYmlsZU1lbnUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbW9iaWxlLW1lbnUnKTsKICAgIAogICAgaWYgKG1vYmlsZU1lbnVCdG4gJiYgbW9iaWxlTWVudSkgewogICAgICAgIG1vYmlsZU1lbnVCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbigpIHsKICAgICAgICAgICAgbW9iaWxlTWVudS5jbGFzc0xpc3QudG9nZ2xlKCdoaWRkZW4nKTsKICAgICAgICB9KTsKICAgIH0KfSk7',
        
        // Chunk 2: Smooth scrolling
        'ZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnYVtocmVmXj0iIyJdJykuaW5pdGlhbGl6ZShhbmNob3IgPT4gewogICAgYW5jaG9yLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gKGUpIHsKICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7CiAgICAgICAgY29uc3QgdGFyZ2V0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3Rvcih0aGlzLmdldEF0dHJpYnV0ZSgnaHJlZicpKTsKICAgICAgICBpZiAodGFyZ2V0KSB7CiAgICAgICAgICAgIHRhcmdldC5zY3JvbGxJbnRvVmlldyh7CiAgICAgICAgICAgICAgICBiZWhhdmlvcjogJ3Ntb290aCcsCiAgICAgICAgICAgICAgICBibG9jazogJ3N0YXJ0JwogICAgICAgICAgICB9KTsKICAgICAgICB9CiAgICB9KTsKfSk7',
        
        // Chunk 3: Loading states
        'ZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnYnV0dG9uW3R5cGU9InN1Ym1pdCJdJykuaW5pdGlhbGl6ZShidXR0b24gPT4gewogICAgYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oKSB7CiAgICAgICAgaWYgKHRoaXMuZm9ybSAmJiB0aGlzLmZvcm0uY2hlY2tWYWxpZGl0eSgpKSB7CiAgICAgICAgICAgIHRoaXMuSW5uZXJIVE1MID0gJ+KAnCBMb2FkaW5nLi4uJzsKICAgICAgICAgICAgdGhpcy5kaXNhYmxlZCA9IHRydWU7CiAgICAgICAgfQogICAgfSk7Cn0pOw=='
    ];
    
    // Function to decode and execute chunks
    function decodeAndExecute(chunk) {
        try {
            const decoded = atob(chunk);
            const script = document.createElement('script');
            script.textContent = decoded;
            document.head.appendChild(script);
            document.head.removeChild(script);
        } catch (error) {
            console.log('Chunk execution failed:', error);
        }
    }
    
    // Load chunks dynamically with delay
    function loadChunksDynamically() {
        encodedChunks.forEach((chunk, index) => {
            setTimeout(() => {
                decodeAndExecute(chunk);
            }, index * 100); // 100ms delay between chunks
        });
    }
    
    // Load chunks when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadChunksDynamically);
    } else {
        loadChunksDynamically();
    }
    
    // Dynamic function injection
    function injectFunction(functionName, functionCode) {
        try {
            const script = document.createElement('script');
            script.textContent = `window.${functionName} = ${functionCode};`;
            document.head.appendChild(script);
            document.head.removeChild(script);
        } catch (error) {
            console.log('Function injection failed:', error);
        }
    }
    
    // Inject critical functions
    setTimeout(() => {
        injectFunction('ArenaUtils', `{
            truncateText: function(text, maxLength) {
                return text.length <= maxLength ? text : text.substring(0, maxLength) + '...';
            },
            formatDate: function(date) {
                return new Date(date).toLocaleString();
            },
            isValidUrl: function(url) {
                try { new URL(url); return true; } catch { return false; }
            }
        }`);
    }, 500);
    
    // Dynamic CSS injection for additional protection
    function injectProtectionCSS() {
        const style = document.createElement('style');
        style.textContent = `
            /* Disable text selection */
            * {
                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
                user-select: none;
            }
            
            /* Disable drag */
            * {
                -webkit-user-drag: none;
                -khtml-user-drag: none;
                -moz-user-drag: none;
                -o-user-drag: none;
                user-drag: none;
            }
            
            /* Hide source code */
            body::before {
                content: '';
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: transparent;
                z-index: -1;
                pointer-events: none;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Inject CSS protection
    injectProtectionCSS();
    
    // Export dynamic loader functions
    window.ArenaDynamicLoader = {
        decodeAndExecute: decodeAndExecute,
        injectFunction: injectFunction,
        loadChunksDynamically: loadChunksDynamically
    };
    
})();
