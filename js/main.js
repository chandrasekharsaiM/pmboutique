/* Main Entry — Initialize All Modules */
var PM = PM || {};
(function () {
  'use strict';
  function init() {
    document.body.style.overflow = 'hidden';
    if (PM.preloader) PM.preloader.init();
    if (PM.navigation) PM.navigation.init();
    if (PM.lightbox) PM.lightbox.init();
    if (PM.form) PM.form.init();
    if (PM.animations) PM.animations.initParallax();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
