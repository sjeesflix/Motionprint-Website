// Motionprint — GDPR Cookie Consent
// Manages GA4 analytics_storage consent for EU visitors.
(function () {
  var KEY = 'mp_cookie_consent';
  var stored = localStorage.getItem(KEY);

  function updateGA(state) {
    if (typeof gtag === 'function') {
      gtag('consent', 'update', { analytics_storage: state });
    }
  }

  function removeBanner() {
    var el = document.getElementById('mp-cookie-banner');
    if (el) el.parentNode.removeChild(el);
  }

  function accept() {
    localStorage.setItem(KEY, 'granted');
    updateGA('granted');
    removeBanner();
  }

  function deny() {
    localStorage.setItem(KEY, 'denied');
    removeBanner();
  }

  // Already decided — apply and exit
  if (stored === 'granted') { updateGA('granted'); return; }
  if (stored === 'denied') { return; }

  // First visit — show banner
  function showBanner() {
    var banner = document.createElement('div');
    banner.id = 'mp-cookie-banner';
    banner.setAttribute('style', [
      'position:fixed',
      'bottom:0',
      'left:0',
      'right:0',
      'background:#111827',
      'color:#f9fafb',
      'padding:16px 24px',
      'display:flex',
      'align-items:center',
      'justify-content:space-between',
      'gap:16px',
      'z-index:9999',
      'font-family:inherit',
      'font-size:14px',
      'line-height:1.6',
      'box-shadow:0 -2px 16px rgba(0,0,0,0.18)'
    ].join(';'));

    banner.innerHTML =
      '<span style="flex:1;max-width:680px">' +
        'We use cookies to understand how visitors use this site (Google Analytics). ' +
        'No ads, no personal data sold.' +
      '</span>' +
      '<div style="display:flex;gap:10px;flex-shrink:0">' +
        '<button id="mp-cookie-deny" style="background:transparent;border:1px solid rgba(255,255,255,0.35);color:#f9fafb;padding:8px 18px;border-radius:6px;cursor:pointer;font-size:14px;white-space:nowrap">Decline</button>' +
        '<button id="mp-cookie-accept" style="background:#ffffff;border:none;color:#111827;padding:8px 18px;border-radius:6px;cursor:pointer;font-size:14px;font-weight:600;white-space:nowrap">Accept</button>' +
      '</div>';

    document.body.appendChild(banner);
    document.getElementById('mp-cookie-accept').addEventListener('click', accept);
    document.getElementById('mp-cookie-deny').addEventListener('click', deny);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showBanner);
  } else {
    showBanner();
  }
})();
