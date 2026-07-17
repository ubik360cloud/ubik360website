(function () {
  const path  = window.location.pathname;
  const isEs  = !path.includes('/en/');
  const year  = new Date().getFullYear();

  const data = {
    es: {
      tagline: 'Estrategia, marketing y expansión internacional para empresas en Colombia, EE.UU. y Canadá.',
      col1: { title: 'Marketing Digital', links: [
        { href: '/es/marketing-digital.html',               label: 'Growth Marketing' },
        { href: '/es/marketing-digital.html#go-to-market',  label: 'Estrategia Go-to-Market' },
        { href: '/es/marketing-digital.html#cmo',           label: 'CMO Fraccionario' },
      ]},
      col2: { title: 'Expansión Internacional', links: [
        { href: '/es/expansion-internacional.html#colombia-usa', label: 'Colombia → EE.UU. / Canadá' },
        { href: '/es/expansion-internacional.html#usa-colombia', label: 'EE.UU. / Canadá → Colombia' },
        { href: '/es/expansion-internacional.html#servicios',    label: 'Incorporación de Empresas' },
      ]},
      col3: { title: 'Ubik 360', links: [
        { href: '/es/sobre-mi.html',   label: 'Sobre Mí' },
        { href: '/es/contacto.html',   label: 'Agenda una Consulta' },
        { href: 'mailto:info@ubik360.com', label: 'info@ubik360.com' },
      ]},
      altHref: '/en/index.html', altLabel: 'English',
      copy: `© ${year} Ubik 360. Todos los derechos reservados.`,
    },
    en: {
      tagline: 'Digital marketing strategy and international expansion services for businesses in the US, Canada, and Colombia.',
      col1: { title: 'Digital Marketing', links: [
        { href: '/en/digital-marketing.html',               label: 'Growth Marketing' },
        { href: '/en/digital-marketing.html#go-to-market',  label: 'Go-to-Market Strategy' },
        { href: '/en/digital-marketing.html#fractional-cmo', label: 'Fractional CMO' },
      ]},
      col2: { title: 'International Expansion', links: [
        { href: '/en/international-expansion.html#colombia-usa', label: 'Colombia → US / Canada' },
        { href: '/en/international-expansion.html#usa-colombia', label: 'US / Canada → Colombia' },
        { href: '/en/international-expansion.html#services',     label: 'Company Incorporation' },
      ]},
      col3: { title: 'Ubik 360', links: [
        { href: '/en/about.html',   label: 'About' },
        { href: '/en/contact.html', label: 'Schedule a Call' },
        { href: 'mailto:info@ubik360.com', label: 'info@ubik360.com' },
      ]},
      altHref: '/es/index.html', altLabel: 'Español',
      copy: `© ${year} Ubik 360. All rights reserved.`,
    },
  };

  const d = isEs ? data.es : data.en;

  function colHtml(col) {
    const items = col.links.map(l =>
      `<li><a href="${l.href}" style="color:#9ca3af; font-size:.875rem; text-decoration:none; transition:color .2s;"
        onmouseover="this.style.color='#ffffff'" onmouseout="this.style.color='#9ca3af'">${l.label}</a></li>`
    ).join('');
    return `
      <div>
        <h4 style="color:white; font-family:'Inter',sans-serif; font-size:.875rem; font-weight:600; margin-bottom:1rem;">${col.title}</h4>
        <ul style="list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:.625rem;">${items}</ul>
      </div>`;
  }

  const html = `
<footer style="background-color:#050505; color:white; font-family:'Inter',sans-serif;">
  <div style="max-width:72rem; margin:0 auto; padding:4rem 1.5rem;">

    <!-- Top grid -->
    <div style="display:grid; grid-template-columns:1fr; gap:3rem;">

      <!-- Brand col -->
      <div style="max-width:22rem;">
        <a href="${isEs ? '/es/index.html' : '/en/index.html'}" style="display:inline-block; margin-bottom:1.25rem;">
          <img src="https://ubik360.com/assets/images/ubik360logo.png" alt="Ubik 360"
            style="height:2.25rem; width:auto; filter:brightness(0) invert(1);">
        </a>
        <p style="color:#9ca3af; font-size:.875rem; line-height:1.7;">${d.tagline}</p>
      </div>

      <!-- Link cols wrapper -->
      <div id="footer-cols" style="display:grid; grid-template-columns:1fr; gap:2.5rem;">
        ${colHtml(d.col1)}
        ${colHtml(d.col2)}
        ${colHtml(d.col3)}
      </div>

    </div>

    <!-- Divider -->
    <div style="margin-top:3rem; padding-top:2rem; border-top:1px solid #1f2937; display:flex; flex-direction:column; align-items:center; gap:1rem;">
      <p style="color:#6b7280; font-size:.8125rem; text-align:center;">${d.copy}</p>
      <div style="display:flex; align-items:center; gap:1.5rem;">
        <a href="${d.altHref}" style="color:#6b7280; font-size:.8125rem; text-decoration:none; transition:color .2s;"
          onmouseover="this.style.color='#ffffff'" onmouseout="this.style.color='#6b7280'">${d.altLabel}</a>
        <!-- LinkedIn — replace # with your LinkedIn URL -->
        <a href="#" aria-label="LinkedIn" style="color:#6b7280; transition:color .2s;"
          onmouseover="this.style.color='#ffffff'" onmouseout="this.style.color='#6b7280'">
          <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
        </a>
      </div>
    </div>

  </div>
</footer>`;

  const container = document.getElementById('site-footer');
  if (!container) return;
  container.innerHTML = html;

  // Responsive footer grid
  function applyFooterLayout() {
    const cols = document.getElementById('footer-cols');
    if (!cols) return;
    cols.style.gridTemplateColumns = window.innerWidth >= 768 ? 'repeat(3, 1fr)' : '1fr';
  }
  applyFooterLayout();
  window.addEventListener('resize', applyFooterLayout);
})();
