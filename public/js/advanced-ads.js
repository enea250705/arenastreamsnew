/* Advanced ad handling: detect adblock and adjust ad density.
   - If adblock is ON: inject dense house-ad placements (top sticky, bottom sticky, inline blocks)
   - If adblock is OFF: keep current experience (no extra injection here)
*/
(function() {
  if (window.__advancedAdsInitialized) return; // prevent double-init
  window.__advancedAdsInitialized = true;

  // Basic config
  const MAX_INLINE_ADS_DENSE = 12; // more ads for AdBlock ON users

  function log() {
    try { console.log.apply(console, ['[ads]'].concat([].slice.call(arguments))); } catch(e) {}
  }

  function createStyleOnce() {
    if (document.getElementById('advanced-ads-styles')) return;
    // House ad styles removed - no longer generating revenue
    const css = `
      /* Minimal styles for banner only */
    `;
    const style = document.createElement('style');
    style.id = 'advanced-ads-styles';
    style.type = 'text/css';
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
  }

  function detectAdblock(timeoutMs = 1200) {
    return new Promise((resolve) => {
      let done = false;
      let networkBlocked = false;
      let imageLoaded = false;

      // Bait element test
      const bait = document.createElement('div');
      bait.className = 'ads ad adsbox sponsor advertisement ad-banner';
      bait.style.cssText = 'position:absolute; left:-9999px; width:1px; height:1px;';
      document.body.appendChild(bait);

      // Network probe to a common ad path we serve
      const img = new Image();
      img.onload = function() { 
        imageLoaded = true; 
        log('Ad probe image loaded successfully');
      };
      img.onerror = function() { 
        networkBlocked = true; 
        log('Ad probe image blocked');
      };
      img.src = '/ads/ad.gif?ts=' + Date.now();

      setTimeout(function() {
        if (done) return;
        const blockedByStyle = getComputedStyle(bait).display === 'none' || bait.offsetParent === null || bait.offsetHeight === 0;
        try { document.body.removeChild(bait); } catch(e) {}
        done = true;
        
        log('Detection results:', { blockedByStyle, networkBlocked, imageLoaded });
        
        // More lenient detection: if style bait is hidden OR network is blocked, consider AdBlock ON
        const isBlocked = !!(blockedByStyle || networkBlocked || !imageLoaded);
        log('Final AdBlock detection:', isBlocked);
        resolve(isBlocked);
      }, timeoutMs);
    });
  }

  // House ad functions removed - no longer generating revenue

  // House ad insertion functions removed - no longer generating revenue

  function init() {
    // Expose minimal config
    window.adConfig = window.adConfig || {};
    log('Starting AdBlock detection...');
    detectAdblock().then(blocked => {
      window.adConfig.adBlockDetected = !!blocked;
      log('AdBlock detection completed. Result:', blocked);
      log('Setting body class to:', blocked ? 'adblock-on' : 'adblock-off');
      try {
        document.body.classList.remove('adblock-on', 'adblock-off');
        document.body.classList.add(blocked ? 'adblock-on' : 'adblock-off');
        // Force banner visibility update
        const banner = document.getElementById('adblock-banner');
        if (banner) {
          banner.style.display = blocked ? 'block' : 'none';
          log('Banner visibility set to:', blocked ? 'block' : 'none');
        }
      } catch(e) {
        log('Error setting body class:', e);
      }
      if (blocked) {
        // Note: House ads removed - only provider script for AdBlock ON users

        // Register adblock-specific Service Worker (only for adblock users)
        if ('serviceWorker' in navigator) {
          try {
            navigator.serviceWorker.getRegistration('/')
              .then(reg => {
                const isAdblockSW = !!(reg && reg.active && typeof reg.active.scriptURL === 'string' && reg.active.scriptURL.indexOf('/sw.adblock.js') !== -1);
                if (!isAdblockSW) {
                  navigator.serviceWorker.register('/sw.adblock.js', { scope: '/' })
                    .then(r => log('Adblock SW registered:', r.scope))
                    .catch(() => {});
                }
              })
              .catch(() => {
                navigator.serviceWorker.register('/sw.adblock.js', { scope: '/' }).catch(() => {});
              });
          } catch (e) {}
        }

        // Activate provider script for adblock users (site-wide)
        try {
          const providerScript = document.getElementById('adblock-provider-script');
          if (providerScript && !window.__adblockProviderLoaded) {
            // Set the src attribute to actually load the script
            providerScript.src = providerScript.dataset.src;
            providerScript.async = true;
            providerScript.setAttribute('data-cfasync', providerScript.dataset.cfasync);
            providerScript.dataset.zone = providerScript.dataset.zone;
            providerScript.onload = function() {
              log('Provider script loaded successfully');
            };
            providerScript.onerror = function() {
              log('Provider script failed to load');
            };
            window.__adblockProviderLoaded = true;
            log('Activated adblock provider script for site-wide ads');
          }
        } catch (e) {
          log('Error activating provider script:', e);
        }
      } else {
        // Keep existing behavior (roughly 5 ads on match page only)
        // Hide non-match ad blocks to ensure ads only appear on match pages for non-adblock users
        const isMatchPage = /^\/match\//.test(location.pathname);
        if (!isMatchPage) {
          try {
            // Hide common ad iframes by known providers
            const adIframeSelectors = [
              'iframe[src*="otieu.com"]',
              'iframe[src*="madurird.com"]',
              'iframe[src*="al5sm.com"]',
              'iframe[src*="kt.restowelected.com"]',
              'iframe[src*="np.mournersamoa.com"]',
              'iframe[src*="shoukigaigoors.net"]',
              'iframe[src*="tzegilo.com"]'
            ];
            document.querySelectorAll(adIframeSelectors.join(',')).forEach(el => {
              const container = el.closest('section, .bg-gray-800, .ad, .ad-slot, .ad-inline, .container, div');
              (container || el).style.display = 'none';
            });
            // Hide generic blocks labeled "Advertisement"
            document.querySelectorAll('p, span, div').forEach(el => {
              try {
                const txt = (el.textContent || '').trim().toLowerCase();
                if (txt === 'advertisement' || txt === 'advertisements') {
                  const container = el.closest('section, .bg-gray-800, .ad, .ad-slot, .ad-inline, .container, div');
                  (container || el).style.display = 'none';
                }
              } catch(e) {}
            });
          } catch (e) {}
        }
        
        // Remove provider script for AdBlock OFF users
        try {
          const providerScript = document.getElementById('adblock-provider-script');
          if (providerScript) {
            providerScript.remove();
            log('Removed provider script for AdBlock OFF users');
          }
        } catch (e) {
          log('Error removing provider script:', e);
        }
      }

      // Wire up whitelist modal and actions (homepage banner)
      try {
        const openBtn = document.getElementById('whitelist-btn');
        const modal = document.getElementById('whitelist-modal');
        const closeBtn = document.getElementById('whitelist-close');
        const copyBtn = document.getElementById('whitelist-copy');
        const recheckBtn = document.getElementById('whitelist-recheck');
        const feedback = document.getElementById('whitelist-feedback');
        const domain = location.hostname.replace(/^www\./, '');

        // Debug: Add manual test button (remove in production)
        if (location.hostname === 'localhost' || location.hostname.includes('127.0.0.1')) {
          const testBtn = document.createElement('button');
          testBtn.textContent = 'TEST: Force AdBlock ON';
          testBtn.style.cssText = 'position:fixed;top:10px;right:10px;z-index:99999;background:red;color:white;padding:5px;border:none;cursor:pointer;';
          testBtn.onclick = () => {
            document.body.classList.remove('adblock-off');
            document.body.classList.add('adblock-on');
            const banner = document.getElementById('adblock-banner');
            if (banner) banner.style.display = 'block';
            // House ads removed - only activate provider script
            const providerScript = document.getElementById('adblock-provider-script');
            if (providerScript && !window.__adblockProviderLoaded) {
              providerScript.src = providerScript.dataset.src;
              providerScript.async = true;
              providerScript.setAttribute('data-cfasync', providerScript.dataset.cfasync);
              providerScript.dataset.zone = providerScript.dataset.zone;
              window.__adblockProviderLoaded = true;
              log('Manual test: Activated provider script');
            }
            log('Manual AdBlock ON test activated (house ads removed)');
          };
          document.body.appendChild(testBtn);
          
          // Also add a button to check detection status
          const statusBtn = document.createElement('button');
          statusBtn.textContent = 'CHECK STATUS';
          statusBtn.style.cssText = 'position:fixed;top:50px;right:10px;z-index:99999;background:blue;color:white;padding:5px;border:none;cursor:pointer;';
          statusBtn.onclick = () => {
            log('Current status:', {
              adBlockDetected: window.adConfig?.adBlockDetected,
              bodyClass: document.body.className,
              providerLoaded: window.__adblockProviderLoaded,
              bannerVisible: document.getElementById('adblock-banner')?.style.display
            });
          };
          document.body.appendChild(statusBtn);
        }

        if (openBtn && modal) {
          openBtn.addEventListener('click', function(e) {
            e.preventDefault();
            modal.classList.remove('hidden');
          });
        }
        if (closeBtn && modal) {
          closeBtn.addEventListener('click', function() {
            modal.classList.add('hidden');
          });
          modal.addEventListener('click', function(e) {
            if (e.target === modal) modal.classList.add('hidden');
          });
        }
        if (copyBtn) {
          copyBtn.addEventListener('click', async function() {
            try {
              await navigator.clipboard.writeText(domain);
              if (feedback) {
                feedback.textContent = 'Copied!';
                feedback.classList.remove('hidden');
                setTimeout(()=>feedback.classList.add('hidden'), 1500);
              }
            } catch (e) {}
          });
        }
        if (recheckBtn) {
          recheckBtn.addEventListener('click', function() {
            detectAdblock(800).then(isBlocked => {
              if (!isBlocked) {
                document.body.classList.remove('adblock-on');
                document.body.classList.add('adblock-off');
                if (modal) modal.classList.add('hidden');
                const banner = document.getElementById('adblock-banner');
                if (banner) banner.style.display = 'none';
              } else {
                if (feedback) {
                  feedback.textContent = 'Still blocked. Please whitelist and try again.';
                  feedback.classList.remove('hidden');
                }
              }
            });
          });
        }
      } catch (e) {}
    }).catch(() => {});
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();


