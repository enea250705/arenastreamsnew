// ArenaStreams Advanced Ad System
// Optimized for maximum revenue and user experience

class ArenaStreamsAds {
    constructor() {
        this.adNetworks = {
            propeller: {
                zoneId: '9879600',
                enabled: true,
                types: ['banner', 'popup', 'video']
            },
            googleAdSense: {
                enabled: false, // Configure when you have AdSense approval
                clientId: 'ca-pub-XXXXXXXXXX'
            }
        };
        
        this.adPlacements = {
            header: { selector: '#header-ad', priority: 'high' },
            sidebar: { selector: '#sidebar-ad', priority: 'medium' },
            footer: { selector: '#footer-ad', priority: 'low' },
            inContent: { selector: '#content-ad', priority: 'high' }
        };
        
        this.init();
    }
    
    init() {
        console.log('🚀 ArenaStreams Ad System Initializing...');
        this.detectAdBlock();
        this.loadAds();
        this.setupAdRefresh();
    }
    
    detectAdBlock() {
        // Create a test ad element
        const testAd = document.createElement('div');
        testAd.innerHTML = '&nbsp;';
        testAd.className = 'adsbox';
        testAd.style.cssText = 'position:absolute;left:-10000px;top:-1000px;width:1px;height:1px;';
        
        document.body.appendChild(testAd);
        
        // Check if ad was blocked
        setTimeout(() => {
            const isBlocked = testAd.offsetHeight === 0;
            if (isBlocked) {
                console.log('🛡️ Ad blocker detected');
                this.handleAdBlock();
            } else {
                console.log('✅ No ad blocker detected');
            }
            document.body.removeChild(testAd);
        }, 100);
    }
    
    handleAdBlock() {
        // Show ad block notice
        const notice = document.createElement('div');
        notice.id = 'adblock-notice';
        notice.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: #ff6b6b;
                color: white;
                padding: 10px;
                text-align: center;
                z-index: 10000;
                font-family: Arial, sans-serif;
                font-size: 14px;
            ">
                🚫 Ad blocker detected! Please disable it to support ArenaStreams and enjoy uninterrupted streaming.
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: white;
                    color: #ff6b6b;
                    border: none;
                    padding: 5px 10px;
                    margin-left: 10px;
                    border-radius: 3px;
                    cursor: pointer;
                ">✕</button>
            </div>
        `;
        document.body.appendChild(notice);
        
        // Add top margin to body to account for notice
        document.body.style.marginTop = '50px';
    }
    
    loadAds() {
        // Load Propeller Ads
        if (this.adNetworks.propeller.enabled) {
            this.loadPropellerAds();
        }
        
        // Load Google AdSense (when configured)
        if (this.adNetworks.googleAdSense.enabled) {
            this.loadGoogleAdSense();
        }
        
        // Create ad containers
        this.createAdContainers();
    }
    
    loadPropellerAds() {
        console.log('📊 Loading Propeller Ads...');
        
        // Load Propeller script
        const script = document.createElement('script');
        script.src = '//x7i0.com/tag.min.js';
        script.setAttribute('data-zone', this.adNetworks.propeller.zoneId);
        script.setAttribute('data-cfasync', 'false');
        script.async = true;
        script.onerror = () => console.log('❌ Propeller Ads failed to load');
        script.onload = () => console.log('✅ Propeller Ads loaded successfully');
        
        document.head.appendChild(script);
    }
    
    loadGoogleAdSense() {
        console.log('📊 Loading Google AdSense...');
        
        // Load AdSense script
        const script = document.createElement('script');
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${this.adNetworks.googleAdSense.clientId}`;
        script.async = true;
        script.crossOrigin = 'anonymous';
        
        document.head.appendChild(script);
    }
    
    createAdContainers() {
        // Create header ad container
        const headerAd = document.createElement('div');
        headerAd.id = 'header-ad';
        headerAd.className = 'ad-container';
        headerAd.innerHTML = `
            <div style="
                background: #f8f9fa;
                border: 1px solid #dee2e6;
                padding: 20px;
                text-align: center;
                margin: 20px 0;
                border-radius: 8px;
                min-height: 90px;
                display: flex;
                align-items: center;
                justify-content: center;
            ">
                <div style="color: #6c757d; font-size: 14px;">
                    📺 Advertisement Space
                </div>
            </div>
        `;
        
        // Insert header ad after main navigation
        const nav = document.querySelector('nav') || document.querySelector('.navbar');
        if (nav) {
            nav.parentNode.insertBefore(headerAd, nav.nextSibling);
        }
        
        // Create sidebar ad container
        const sidebarAd = document.createElement('div');
        sidebarAd.id = 'sidebar-ad';
        sidebarAd.className = 'ad-container';
        sidebarAd.innerHTML = `
            <div style="
                background: #f8f9fa;
                border: 1px solid #dee2e6;
                padding: 20px;
                text-align: center;
                margin: 20px 0;
                border-radius: 8px;
                min-height: 250px;
                display: flex;
                align-items: center;
                justify-content: center;
            ">
                <div style="color: #6c757d; font-size: 14px;">
                    📺 Sidebar Advertisement
                </div>
            </div>
        `;
        
        // Insert sidebar ad
        const sidebar = document.querySelector('#sidebar') || document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.appendChild(sidebarAd);
        }
        
        // Create footer ad container
        const footerAd = document.createElement('div');
        footerAd.id = 'footer-ad';
        footerAd.className = 'ad-container';
        footerAd.innerHTML = `
            <div style="
                background: #f8f9fa;
                border: 1px solid #dee2e6;
                padding: 20px;
                text-align: center;
                margin: 20px 0;
                border-radius: 8px;
                min-height: 90px;
                display: flex;
                align-items: center;
                justify-content: center;
            ">
                <div style="color: #6c757d; font-size: 14px;">
                    📺 Footer Advertisement
                </div>
            </div>
        `;
        
        // Insert footer ad before footer
        const footer = document.querySelector('footer') || document.querySelector('.footer');
        if (footer) {
            footer.parentNode.insertBefore(footerAd, footer);
        }
    }
    
    setupAdRefresh() {
        // Refresh ads every 30 seconds
        setInterval(() => {
            this.refreshAds();
        }, 30000);
    }
    
    refreshAds() {
        console.log('🔄 Refreshing ads...');
        
        // Trigger Propeller ad refresh
        if (window._oafxwg) {
            window._oafxwg();
        }
        
        // Refresh ad containers
        const adContainers = document.querySelectorAll('.ad-container');
        adContainers.forEach(container => {
            // Add a subtle animation to indicate refresh
            container.style.opacity = '0.7';
            setTimeout(() => {
                container.style.opacity = '1';
            }, 500);
        });
    }
    
    // Method to manually refresh ads
    refresh() {
        this.refreshAds();
    }
    
    // Method to disable ads (for premium users)
    disable() {
        const adContainers = document.querySelectorAll('.ad-container');
        adContainers.forEach(container => {
            container.style.display = 'none';
        });
        console.log('🚫 Ads disabled');
    }
    
    // Method to enable ads
    enable() {
        const adContainers = document.querySelectorAll('.ad-container');
        adContainers.forEach(container => {
            container.style.display = 'block';
        });
        console.log('✅ Ads enabled');
    }
}

// Initialize the ad system when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.arenaStreamsAds = new ArenaStreamsAds();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ArenaStreamsAds;
}
