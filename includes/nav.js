(function () {
  const path = window.location.pathname;
  const isEs = !path.includes('/en/');
  const base  = isEs ? '/es/' : '/en/';
  const alt   = isEs ? '/en/' : '/es/';
  const altLabel = isEs ? 'EN' : 'ES';
  const ctaLabel = isEs ? 'Agenda una Llamada' : 'Schedule a Call';
  const ctaHref  = 'https://calendly.com/jose-ubik360/30min';

  const links = isEs ? [
    { href: '/es/index.html',                    label: 'Inicio' },
    { href: '/es/marketing-digital.html',        label: 'Marketing Digital' },
    { href: '/es/expansion-internacional.html',  label: 'Expansión Internacional' },
    { href: '/es/sobre-mi.html',                 label: 'Sobre Mí' },
    { href: '/es/contacto.html',                 label: 'Contacto' },
  ] : [
    { href: '/en/index.html',                    label: 'Home' },
    { href: '/en/digital-marketing.html',        label: 'Digital Marketing' },
    { href: '/en/international-expansion.html',  label: 'International Expansion' },
    { href: '/en/about.html',                    label: 'About' },
    { href: '/en/contact.html',                  label: 'Contact' },
  ];

  const desktopLinks = links.map(l => {
    const active = path === l.href || path.endsWith(l.href);
    return `<a href="${l.href}"
      style="font-size:0.875rem; font-weight:500; transition:color .2s; white-space:nowrap;
             color:${active ? '#931F1D' : '#374151'};"
      onmouseover="if(!this.dataset.active)this.style.color='#050505'"
      onmouseout="if(!this.dataset.active)this.style.color='#374151'"
      ${active ? 'data-active="true"' : ''}>${l.label}</a>`;
  }).join('');

  const mobileLinks = links.map(l =>
    `<a href="${l.href}" style="display:block; padding:.75rem 0; font-size:.9375rem; font-weight:500; color:#050505; border-bottom:1px solid #f3f4f6;">${l.label}</a>`
  ).join('');

  const html = `
<nav id="main-nav" style="
  position:fixed; top:0; left:0; right:0; z-index:50;
  background:rgba(255,255,255,0.97); backdrop-filter:blur(8px);
  border-bottom:1px solid #f3f4f6;
  font-family:'Inter',sans-serif;
  transition:box-shadow .2s;
">
  <div style="max-width:72rem; margin:0 auto; padding:0 1.5rem; height:4rem; display:flex; align-items:center; justify-content:space-between;">

    <!-- Logo -->
    <a href="${base}index.html" style="flex-shrink:0; display:flex; align-items:center;">
      <img src="https://ubik360.com/assets/images/ubik360logo.png" alt="Ubik 360" style="height:2.25rem; width:auto;">
    </a>

    <!-- Desktop links -->
    <div id="nav-desktop-links" style="display:none; align-items:center; gap:2rem;">
      ${desktopLinks}
    </div>

    <!-- Desktop right -->
    <div id="nav-desktop-right" style="display:none; align-items:center; gap:1rem;">
      <a href="${alt}index.html" style="
        font-size:.8125rem; font-weight:500; color:#6b7280;
        border:1px solid #d1d5db; border-radius:.375rem; padding:.25rem .75rem;
        transition:all .2s; text-decoration:none;"
        onmouseover="this.style.borderColor='#050505';this.style.color='#050505';"
        onmouseout="this.style.borderColor='#d1d5db';this.style.color='#6b7280';"
      >${altLabel}</a>
      <a href="${ctaHref}" class="btn-primary" style="font-size:.875rem; white-space:nowrap;" target="_blank" rel="noopener">${ctaLabel}</a>
    </div>

    <!-- Mobile hamburger -->
    <button id="nav-hamburger" aria-label="Menu" style="display:flex; padding:.5rem; background:none; border:none; cursor:pointer; color:#050505;">
      <svg id="icon-open"  width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
      <svg id="icon-close" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="display:none;"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
    </button>

  </div>

  <!-- Mobile menu -->
  <div id="nav-mobile-menu" style="display:none; background:white; padding:0 1.5rem 1.5rem; border-top:1px solid #f3f4f6;">
    ${mobileLinks}
    <div style="display:flex; align-items:center; gap:.75rem; padding-top:1rem;">
      <a href="${alt}index.html" style="
        font-size:.8125rem; font-weight:500; color:#6b7280;
        border:1px solid #d1d5db; border-radius:.375rem; padding:.25rem .875rem; text-decoration:none;">${altLabel}</a>
      <a href="${ctaHref}" class="btn-primary" style="font-size:.875rem;" target="_blank" rel="noopener">${ctaLabel}</a>
    </div>
  </div>
</nav>
<div style="height:4rem;"></div>
`;

  const container = document.getElementById('site-nav');
  if (!container) return;
  container.innerHTML = html;

  // Responsive breakpoint
  function applyBreakpoint() {
    const isDesktop = window.innerWidth >= 1024;
    const dl = document.getElementById('nav-desktop-links');
    const dr = document.getElementById('nav-desktop-right');
    const hb = document.getElementById('nav-hamburger');
    if (dl) dl.style.display = isDesktop ? 'flex' : 'none';
    if (dr) dr.style.display = isDesktop ? 'flex' : 'none';
    if (hb) hb.style.display = isDesktop ? 'none' : 'flex';
  }
  applyBreakpoint();
  window.addEventListener('resize', applyBreakpoint);

  // Hamburger toggle
  const hamburger = document.getElementById('nav-hamburger');
  const mobileMenu = document.getElementById('nav-mobile-menu');
  const iconOpen   = document.getElementById('icon-open');
  const iconClose  = document.getElementById('icon-close');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const open = mobileMenu.style.display === 'none' || mobileMenu.style.display === '';
      mobileMenu.style.display = open ? 'block' : 'none';
      if (iconOpen)  iconOpen.style.display  = open ? 'none'  : 'block';
      if (iconClose) iconClose.style.display = open ? 'block' : 'none';
    });
  }

  // Scroll shadow
  window.addEventListener('scroll', () => {
    const nav = document.getElementById('main-nav');
    if (nav) nav.style.boxShadow = window.scrollY > 8 ? '0 1px 12px rgba(0,0,0,.08)' : 'none';
  });
})();
