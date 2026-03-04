// ── SHARED NAV ──
// Injected synchronously so the nav is present before page content renders.
document.write(`
<nav>
  <div class="nav-inner">
    <a href="index.html" class="nav-logo">
      <img src="Motionprint-full.png" alt="Motionprint" style="height:26px;display:block;">
    </a>
    <ul class="nav-links">
      <li><a href="index.html#ergo">Motionprint Ergo</a></li>
      <li><a href="index.html#custom">Custom Solutions</a></li>
      <li><a href="index.html#pricing">Pricing</a></li>
      <li><a href="resources.html">Resources</a></li>
      <li><a href="about.html">About</a></li>
    </ul>
    <div class="nav-cta">
      <a href="download.html" class="nav-download">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Download
      </a>
      <a href="#contact" class="nav-demo">Request demo</a>
    </div>
    <button class="nav-hamburger" aria-label="Open menu">
      <svg viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
    </button>
  </div>
</nav>

<div class="mobile-nav" id="mnav">
  <a href="index.html#ergo">Motionprint Ergo</a>
  <a href="index.html#custom">Custom Solutions</a>
  <a href="index.html#pricing">Pricing</a>
  <a href="resources.html">Resources</a>
  <a href="about.html">About</a>
  <a href="#contact" class="btn btn-primary">Request demo</a>
</div>
`);

document.addEventListener('DOMContentLoaded', function () {
  // Set active nav link based on current page
  var path = window.location.pathname;
  document.querySelectorAll('.nav-links a').forEach(function (link) {
    var href = link.getAttribute('href');
    if (path.indexOf('resources') !== -1 && href === 'resources.html') {
      link.classList.add('active');
    } else if (path.indexOf('about') !== -1 && href === 'about.html') {
      link.classList.add('active');
    }
  });

  // Hamburger toggle
  var hamburger = document.querySelector('.nav-hamburger');
  var mnav = document.getElementById('mnav');
  if (hamburger && mnav) {
    hamburger.addEventListener('click', function () {
      mnav.classList.toggle('open');
    });
  }

  // Close mobile nav when a link is clicked
  if (mnav) {
    mnav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mnav.classList.remove('open');
      });
    });
  }

  // Close mobile nav on outside click
  document.addEventListener('click', function (e) {
    if (mnav && mnav.classList.contains('open') && !mnav.contains(e.target) && !hamburger.contains(e.target)) {
      mnav.classList.remove('open');
    }
  });
});
