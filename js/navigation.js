/* Navigation Module */
var PM = PM || {};
PM.navigation = (function () {
  function init() {
    var nav = document.getElementById('nav');
    var toggle = document.getElementById('navToggle');
    var menu = document.getElementById('mobileMenu');
    var scrollProgress = document.getElementById('scrollProgress');
    var btt = document.getElementById('btt');

    if (!nav) return;

    // Scroll
    function onScroll() {
      var y = window.scrollY;
      nav.classList.toggle('scrolled', y > 50);
      if (btt) btt.classList.toggle('visible', y > 500);
      if (scrollProgress) {
        var pct = (y / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
        scrollProgress.style.width = pct + '%';
      }
      updateActiveLink();
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Back to top
    if (btt) {
      btt.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // Mobile toggle
    if (toggle && menu) {
      toggle.addEventListener('click', function () {
        toggle.classList.contains('active') ? closeMenu() : openMenu();
      });

      function openMenu() {
        toggle.classList.add('active');
        toggle.setAttribute('aria-expanded', 'true');
        menu.classList.add('open');
        document.body.style.overflow = 'hidden';
      }
      function closeMenu() {
        toggle.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
        menu.classList.remove('open');
        document.body.style.overflow = '';
      }

      var mobileLinks = menu.querySelectorAll('.mobile-link:not(.mobile-dropdown-trigger)');
      for (var i = 0; i < mobileLinks.length; i++) {
        mobileLinks[i].addEventListener('click', closeMenu);
      }

      // Mobile dropdown toggle
      var dropdownTriggers = menu.querySelectorAll('.mobile-dropdown-trigger');
      for (var j = 0; j < dropdownTriggers.length; j++) {
        dropdownTriggers[j].addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          var content = this.nextElementSibling;
          this.classList.toggle('open');
          content.classList.toggle('open');
        });
      }

      var subLinks = menu.querySelectorAll('.mobile-dropdown-links a');
      for (var k = 0; k < subLinks.length; k++) {
        subLinks[k].addEventListener('click', closeMenu);
      }

      window.PM_closeMenu = closeMenu;
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        if (window.PM_closeMenu) window.PM_closeMenu();
        if (PM.lightbox) PM.lightbox.close();
      }
    });

    // Active link
    function updateActiveLink() {
      var current = '';
      var sections = document.querySelectorAll('section[id]');
      for (var i = 0; i < sections.length; i++) {
        if (window.scrollY >= sections[i].offsetTop - 180) {
          current = sections[i].id;
        }
      }
      var links = document.querySelectorAll('.nav-link');
      for (var j = 0; j < links.length; j++) {
        var href = links[j].getAttribute('href');
        links[j].classList.toggle('active', href === '#' + current);
      }
    }
  }
  return { init: init };
})();
