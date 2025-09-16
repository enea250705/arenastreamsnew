// Advanced Anti-Debugging and Code Protection
(function() {
    'use strict';
    
    // Anti-debugging techniques
    let debuggerDetected = false;
    
    // Method 1: Console.log detection
    let devtools = {
        open: false,
        orientation: null
    };
    
    const threshold = 160;
    
    // Method 2: Debugger statement detection
    function detectDebugger() {
        const start = new Date().getTime();
        debugger;
        const end = new Date().getTime();
        if (end - start > 100) {
            debuggerDetected = true;
            blockAccess();
        }
    }
    
    // Method 3: Function toString detection
    function detectDevTools() {
        let devtools = false;
        const element = new Image();
        Object.defineProperty(element, 'id', {
            get: function() {
                devtools = true;
                blockAccess();
                throw new Error('DevTools detected');
            }
        });
        console.log(element);
        console.clear();
    }
    
    // Method 4: Window size detection
    function checkWindowSize() {
        if (window.outerHeight - window.innerHeight > threshold || 
            window.outerWidth - window.innerWidth > threshold) {
            if (!devtools.open) {
                devtools.open = true;
                blockAccess();
            }
        } else {
            devtools.open = false;
        }
    }
    
    // Method 5: Performance timing detection
    function detectPerformanceDebug() {
        const start = performance.now();
        debugger;
        const end = performance.now();
        if (end - start > 1) {
            debuggerDetected = true;
            blockAccess();
        }
    }
    
    // Method 6: Stack trace detection
    function detectStackTrace() {
        const stack = new Error().stack;
        if (stack.includes('eval') || stack.includes('Function')) {
            debuggerDetected = true;
            blockAccess();
        }
    }
    
    // Block access when debugging detected
    function blockAccess() {
        document.body.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: #000;
                color: #fff;
                display: flex;
                justify-content: center;
                align-items: center;
                font-family: Arial, sans-serif;
                z-index: 9999;
            ">
                <div style="text-align: center;">
                    <h1 style="color: #ff4444; font-size: 2rem; margin-bottom: 1rem;">⚠️ Access Restricted</h1>
                    <p style="font-size: 1.2rem; margin-bottom: 0.5rem;">Developer tools detected</p>
                    <p style="color: #888;">Please close developer tools to continue</p>
                </div>
            </div>
        `;
        
        // Clear console
        console.clear();
        console.log('%cSTOP!', 'color: red; font-size: 50px; font-weight: bold;');
        console.log('%cThis is a browser feature intended for developers. If someone told you to copy-paste something here to enable a ArenaStreams feature or "hack" someone\'s account, it is a scam and will give them access to your account.', 'color: red; font-size: 16px;');
    }
    
    // Run all detection methods
    function runDetection() {
        detectDebugger();
        detectDevTools();
        checkWindowSize();
        detectPerformanceDebug();
        detectStackTrace();
    }
    
    // Continuous monitoring
    setInterval(runDetection, 1000);
    setInterval(checkWindowSize, 500);
    
    // Disable common debugging shortcuts
    document.addEventListener('keydown', function(e) {
        // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+S
        if (e.keyCode === 123 || // F12
            (e.ctrlKey && e.shiftKey && e.keyCode === 73) || // Ctrl+Shift+I
            (e.ctrlKey && e.shiftKey && e.keyCode === 74) || // Ctrl+Shift+J
            (e.ctrlKey && e.keyCode === 85) || // Ctrl+U
            (e.ctrlKey && e.keyCode === 83)) { // Ctrl+S
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    });
    
    // Disable right-click
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        return false;
    });
    
    // Disable text selection
    document.addEventListener('selectstart', function(e) {
        e.preventDefault();
        return false;
    });
    
    // Disable drag
    document.addEventListener('dragstart', function(e) {
        e.preventDefault();
        return false;
    });
    
    // Clear console periodically
    setInterval(function() {
        console.clear();
        console.log('%cArenaStreams - Protected Code', 'color: #00ff00; font-size: 20px; font-weight: bold;');
        console.log('%cUnauthorized access is prohibited', 'color: #ff4444; font-size: 14px;');
    }, 2000);
    
    // Export protection functions
    window.ArenaAntiDebug = {
        detectDebugger: detectDebugger,
        detectDevTools: detectDevTools,
        checkWindowSize: checkWindowSize,
        blockAccess: blockAccess,
        runDetection: runDetection
    };
    
    // Run initial detection
    runDetection();
    
})();
