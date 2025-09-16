// ArenaStreams Code Protection System
(function() {
    'use strict';
    
    // Check if device is mobile - don't apply aggressive protection on mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Anti-debugging techniques (only for desktop)
    if (!isMobile) {
        let devtools = {
            open: false,
            orientation: null
        };
        
        const threshold = 160;
        
        // Detect dev tools (only on desktop)
        setInterval(function() {
            if (window.outerHeight - window.innerHeight > threshold || 
                window.outerWidth - window.innerWidth > threshold) {
                if (!devtools.open) {
                    devtools.open = true;
                    console.clear();
                    console.log('%cSTOP!', 'color: red; font-size: 50px; font-weight: bold;');
                    console.log('%cThis is a browser feature intended for developers. If someone told you to copy-paste something here to enable a ArenaStreams feature or "hack" someone\'s account, it is a scam and will give them access to your account.', 'color: red; font-size: 16px;');
                    
                    // Redirect or block access
                    document.body.innerHTML = '<div style="display: flex; justify-content: center; align-items: center; height: 100vh; background: #1a1a1a; color: white; font-family: Arial, sans-serif;"><div style="text-align: center;"><h1 style="color: #ff4444;">Access Restricted</h1><p>Developer tools detected. Please close them to continue.</p></div></div>';
                }
            } else {
                devtools.open = false;
            }
        }, 500);
    }
    
    // Disable right-click context menu
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        return false;
    });
    
    // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U (only on desktop)
    if (!isMobile) {
        document.addEventListener('keydown', function(e) {
            // F12
            if (e.keyCode === 123) {
                e.preventDefault();
                return false;
            }
            // Ctrl+Shift+I (DevTools)
            if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
                e.preventDefault();
                return false;
            }
            // Ctrl+Shift+J (Console)
            if (e.ctrlKey && e.shiftKey && e.keyCode === 74) {
                e.preventDefault();
                return false;
            }
            // Ctrl+U (View Source)
            if (e.ctrlKey && e.keyCode === 85) {
                e.preventDefault();
                return false;
            }
            // Ctrl+S (Save Page)
            if (e.ctrlKey && e.keyCode === 83) {
                e.preventDefault();
                return false;
            }
        });
    }
    
    // Clear console periodically (only on desktop)
    if (!isMobile) {
        setInterval(function() {
            console.clear();
            console.log('%cArenaStreams - Protected Code', 'color: #00ff00; font-size: 20px; font-weight: bold;');
        }, 2000);
        
        // Detect and block common debugging tools
        const detectDevTools = () => {
            let devtools = false;
            const element = new Image();
            Object.defineProperty(element, 'id', {
                get: function() {
                    devtools = true;
                    document.body.innerHTML = '<div style="display: flex; justify-content: center; align-items: center; height: 100vh; background: #1a1a1a; color: white; font-family: Arial, sans-serif;"><div style="text-align: center;"><h1 style="color: #ff4444;">Access Restricted</h1><p>Developer tools detected. Please close them to continue.</p></div></div>';
                    throw new Error('DevTools detected');
                }
            });
            console.log(element);
            console.clear();
        };
        
        // Run detection
        detectDevTools();
    }
    
    // Obfuscate function names and variables
    const obfuscateCode = () => {
        // This will be called to further protect the code
        return true;
    };
    
    // Export protection functions
    window.ArenaProtection = {
        isMobile: isMobile,
        obfuscateCode: obfuscateCode
    };
    
})();
