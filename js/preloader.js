/* Preloader Module */
var PM = PM || {};
PM.preloader = (function () {
  function init() {
    var el = document.getElementById('preloader');
    if (!el) return;
    document.body.classList.add('preloading');
    function hide() {
      if (el.classList.contains('hidden')) return;
      el.classList.add('hidden');
      document.body.classList.remove('preloading');
      document.body.style.overflow = '';
      if (PM.animations) PM.animations.initReveal();
      if (PM.animations) PM.animations.initCounters();
      if (PM.animations) PM.animations.initTimeline();
    }
    document.addEventListener('DOMContentLoaded', function () { setTimeout(hide, 400); });
    setTimeout(hide, 1200);
  }
  return { init: init };
})();
