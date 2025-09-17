/* Advanced ad handling: detect adblock and adjust ad density.
   - If adblock is ON: inject dense house-ad placements (top sticky, bottom sticky, inline blocks)
   - If adblock is OFF: keep current experience (no extra injection here)
*/
(function() {
  if (window.__advancedAdsInitialized) return; // prevent double-init
  window.__advancedAdsInitialized = true;

  // Basic config
  const MAX_INLINE_ADS_DENSE = 8; // rough "all over" without breaking UX

  function log() {
    try { console.log.apply(console, ['[ads]'].concat([].slice.call(arguments))); } catch(e) {}
  }

  function createStyleOnce() {
    if (document.getElementById('advanced-ads-styles')) return;
    const css = `
      .ad-sticky-top, .ad-sticky-bottom {
        position: fixed; left: 0; right: 0; z-index: 9999;
        background: #111; border: 1px solid #2a2a2a; color: #ddd;
        display: flex; align-items: center; justify-content: center;
        min-height: 60px; padding: 8px; box-shadow: 0 2px 8px rgba(0,0,0,.35);
      }
      .ad-sticky-top { top: 0; }
      .ad-sticky-bottom { bottom: 0; }
      .ad-sticky-close {
        position: absolute; right: 8px; top: 8px; background: #333; color: #fff;
        border: 0; border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 12px;
      }
      .ad-inline {
        background: #111; border: 1px dashed #444; color: #ddd;
        margin: 16px 0; padding: 12px; text-align: center; border-radius: 8px;
      }
      .ad-label { font-size: 12px; color: #aaa; display: block; margin-bottom: 6px; }
      .ad-house-creative { font-weight: 700; color: #ffcc00; }
      body.has-ad-sticky-top { padding-top: 70px; }
      body.has-ad-sticky-bottom { padding-bottom: 70px; }
    `;
    const style = document.createElement('style');
    style.id = 'advanced-ads-styles';
    style.type = 'text/css';
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
  }

  function detectAdblock(timeoutMs = 1200) {
    return new Promise((resolve) => {
      let resolved = false;

      // Bait element test
      const bait = document.createElement('div');
      bait.className = 'ads ad adsbox sponsor advertisement ad-banner';
      bait.style.cssText = 'position:absolute; left:-9999px; width:1px; height:1px;';
      document.body.appendChild(bait);

      // Some blockers also block requests to common ad paths
      const img = new Image();
      img.onerror = function() {
        if (!resolved) { resolved = true; cleanup(); resolve(true); }
      };
      // Request to a common ad path name (served by our static, will 404 quickly if missing)
      img.src = '/ads/ad.gif?ts=' + Date.now();

      setTimeout(function() {
        if (resolved) return;
        const blockedByStyle = getComputedStyle(bait).display === 'none' || bait.offsetParent === null || bait.offsetHeight === 0;
        document.body.removeChild(bait);
        resolved = true;
        resolve(blockedByStyle);
      }, timeoutMs);

      function cleanup() { try { document.body.removeChild(bait); } catch(e) {} }
    });
  }

  function buildHouseAdContent() {
    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <span class="ad-label">Advertisement</span>
      <div class="ad-house-creative">🔥 Exclusive Sports Streams</div>
      <div style="font-size:12px;color:#bbb;margin-top:4px;">Support our platform by whitelisting ads or checking these offers.</div>
    `;
    return wrap;
  }

  function insertSticky(position) {
    const id = position === 'top' ? 'ad-sticky-top' : 'ad-sticky-bottom';
    if (document.getElementById(id)) return;
    const el = document.createElement('div');
    el.id = id;
    el.className = position === 'top' ? 'ad-sticky-top' : 'ad-sticky-bottom';
    const close = document.createElement('button');
    close.className = 'ad-sticky-close';
    close.textContent = 'Close';
    close.addEventListener('click', function() {
      try { document.body.classList.remove(position === 'top' ? 'has-ad-sticky-top' : 'has-ad-sticky-bottom'); } catch(e) {}
      el.remove();
    });
    el.appendChild(buildHouseAdContent());
    el.appendChild(close);
    document.body.appendChild(el);
    document.body.classList.add(position === 'top' ? 'has-ad-sticky-top' : 'has-ad-sticky-bottom');
  }

  function insertInlineDense() {
    const anchors = [];
    // Reasonable anchor points across pages
    document.querySelectorAll('main section, .container > section, .container > div').forEach(n => anchors.push(n));
    if (anchors.length === 0) return;
    let inserted = 0;
    for (let i = 1; i < anchors.length && inserted < MAX_INLINE_ADS_DENSE; i += 2) {
      const ad = document.createElement('div');
      ad.className = 'ad-inline';
      ad.appendChild(buildHouseAdContent());
      anchors[i].insertAdjacentElement('afterend', ad);
      inserted++;
    }
    log('Inserted inline ads:', inserted);
  }

  function applyAdDensityDense() {
    createStyleOnce();
    insertSticky('top');
    insertSticky('bottom');
    insertInlineDense();
  }

  function init() {
    // Expose minimal config
    window.adConfig = window.adConfig || {};
    detectAdblock().then(blocked => {
      window.adConfig.adBlockDetected = !!blocked;
      log('AdBlock detected:', blocked);
      try {
        document.body.classList.remove('adblock-on', 'adblock-off');
        document.body.classList.add(blocked ? 'adblock-on' : 'adblock-off');
      } catch(e) {}
      if (blocked) {
        // Increase ad density only for adblock users (house creatives)
        applyAdDensityDense();

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
      }
    }).catch(() => {});
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();


