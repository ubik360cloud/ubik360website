/* ═══════════════════════════════════════════════════════════
   UBIK 360 - Main JavaScript
   ═══════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', function() {
  
  // ═══ HEADER SCROLL EFFECT ═══
  const header = document.querySelector('.site-header');
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    
    lastScroll = currentScroll;
  });

  // ═══ MOBILE MENU TOGGLE ═══
  const mobileToggle = document.querySelector('.mobile-menu-toggle');
  const mainNav = document.querySelector('.main-nav');
  
  if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
      mainNav.classList.toggle('active');
      const isOpen = mainNav.classList.contains('active');
      mobileToggle.innerHTML = isOpen ? '✕' : '☰';
    });
  }

  // ═══ FAQ ACCORDION ═══
  const faqQuestions = document.querySelectorAll('.faq-question');
  
  faqQuestions.forEach(question => {
    question.addEventListener('click', () => {
      const item = question.parentElement;
      const answer = item.querySelector('.faq-answer');
      const isOpen = answer.style.display === 'block';
      
      // Close all other answers
      document.querySelectorAll('.faq-answer').forEach(a => {
        a.style.display = 'none';
      });
      
      // Toggle current answer
      if (!isOpen) {
        answer.style.display = 'block';
      }
      
      // Update icon
      const icon = question.querySelector('.faq-icon');
      if (icon) {
        icon.textContent = isOpen ? '+' : '−';
      }
    });
  });

  // ═══ SMOOTH SCROLL FOR ANCHOR LINKS ═══
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // ═══ ACTIVE NAV LINK HIGHLIGHTING ═══
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.nav-links a');
  
  navLinks.forEach(link => {
    if (link.getAttribute('href') === currentPath || 
        (currentPath.includes(link.getAttribute('href')) && link.getAttribute('href') !== '/')) {
      link.classList.add('active');
    }
  });

  // ═══ INTERSECTION OBSERVER FOR ANIMATIONS ═══
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);

  // Observe elements with fade-in class
  document.querySelectorAll('.track-card, .value-item, .service-card, .testimonial').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });

  // ═══ FORM VALIDATION (if contact form exists) ═══
  const contactForm = document.querySelector('#contact-form');
  
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const name = this.querySelector('[name="name"]').value;
      const email = this.querySelector('[name="email"]').value;
      const message = this.querySelector('[name="message"]').value;
      
      if (!name || !email || !message) {
        alert('Please fill in all fields');
        return;
      }
      
      if (!isValidEmail(email)) {
        alert('Please enter a valid email address');
        return;
      }
      
      // Form is valid - you can add actual submission logic here
      alert('Thank you for your message! I will get back to you soon.');
      this.reset();
    });
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // ═══ TRACK CTA CLICK ANALYTICS ═══
  const ctaButtons = document.querySelectorAll('.btn');
  
  ctaButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      const trackData = {
        button: this.textContent.trim(),
        url: this.href || window.location.href,
        timestamp: new Date().toISOString()
      };
      
      // Log to console (you can replace with actual analytics)
      console.log('CTA Clicked:', trackData);
      
      // You can add Google Analytics, Facebook Pixel, etc. here
      // Example: gtag('event', 'cta_click', trackData);
    });
  });
});

// ═══ UTILITY FUNCTIONS ═══

// Debounce function for performance
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Get current language from URL
function getCurrentLanguage() {
  const path = window.location.pathname;
  return path.startsWith('/en/') ? 'en' : 'es';
}

// Toggle language
function toggleLanguage() {
  const currentLang = getCurrentLanguage();
  const newLang = currentLang === 'en' ? 'es' : 'en';
  const currentPath = window.location.pathname;
  
  let newPath;
  if (currentLang === 'en') {
    newPath = currentPath.replace('/en/', '/es/');
  } else {
    newPath = currentPath.replace('/es/', '/en/');
  }
  
  window.location.href = newPath;
}
