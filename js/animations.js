/* Animations Module */
var PM = PM || {};
PM.animations = (function () {
  function initReveal() {
    var els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
      for (var i = 0; i < els.length; i++) els[i].classList.add('visible');
      return;
    }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (el) { obs.observe(el); });
  }

  function initCounters() {
    if (!('IntersectionObserver' in window)) return;
    var nums = document.querySelectorAll('.stat-num[data-target]');
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { countUp(e.target, parseInt(e.target.dataset.target), 2000); obs.unobserve(e.target); }
      });
    }, { threshold: 0.5 });
    nums.forEach(function (n) { obs.observe(n); });
  }

  function countUp(el, end, dur) {
    var start = performance.now();
    function tick(now) {
      var p = Math.min((now - start) / dur, 1);
      el.textContent = Math.floor(end * (1 - Math.pow(1 - p, 3))).toLocaleString();
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function initTimeline() {
    var steps = document.querySelectorAll('.t-step');
    var fill = document.getElementById('timelineFill');
    if (!steps.length) return;
    if (!('IntersectionObserver' in window)) {
      steps.forEach(function (s) { s.classList.add('active'); });
      return;
    }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          steps.forEach(function (s, i) { setTimeout(function () { s.classList.add('active'); }, i * 250); });
          if (fill) setTimeout(function () { fill.style.width = '100%'; }, steps.length * 250);
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.3 });
    var timeline = document.querySelector('.timeline');
    if (timeline) obs.observe(timeline);
  }

  function initParallax() {
    var img = document.querySelector('.hero-bg-img');
    if (!img) return;
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(function () {
          if (window.scrollY < window.innerHeight) {
            img.style.transform = 'translateY(' + (window.scrollY * 0.25) + 'px) scale(1.04)';
          }
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  return { initReveal: initReveal, initCounters: initCounters, initTimeline: initTimeline, initParallax: initParallax };
})();
