/* Collection Page — shared product rendering (mobile-first)
   Structure: Collection → Products → Designs (max 6) → Images (max 5 per design)
   Every level has unique stable IDs. Images lazy-loaded per design. */
(function () {
  'use strict';

  var CACHE_V = '20260717b';
  var tagLabels = { new: 'New', bestseller: 'Bestseller', limited: 'Limited', trending: 'Trending' };

  function getCollection() {
    var path = window.location.pathname.toLowerCase();
    if (path.indexOf('mens') !== -1 && path.indexOf('womens') === -1) return 'mens';
    if (path.indexOf('kids') !== -1) return 'kids';
    return 'womens';
  }

  function cb(url) {
    if (!url) return '';
    return url + (url.indexOf('?') === -1 ? '?v=' : '&v=') + CACHE_V;
  }

  function makePicture(jpgSrc, webpSrc, alt, w, h, cls, loadingAttr) {
    var sizes = '(max-width: 480px) 100vw, (max-width: 768px) 50vw, 25vw';
    var html = '<picture>';
    if (webpSrc) {
      html += '<source type="image/webp" srcset="' + cb(webpSrc) + '" sizes="' + sizes + '">';
    }
    html += '<img src="' + cb(jpgSrc) + '" alt="' + (alt || '').replace(/"/g, '&quot;') + '"' +
      ' width="' + (w || 600) + '" height="' + (h || 750) + '"' +
      ' loading="' + (loadingAttr || 'lazy') + '"' +
      ' decoding="async"' +
      (cls ? ' class="' + cls + '"' : '') +
      ' onerror="this.style.display=\'none\'">' +
      '</picture>';
    return html;
  }

  var collection = getCollection();
  var grid = document.getElementById('productGrid');
  if (!grid) return;

  function renderProducts(products) {
    if (!products.length) {
      grid.innerHTML = '<div class="collection-empty">No products found in this collection.</div>';
      return;
    }

    var html = '';
    for (var i = 0; i < products.length; i++) {
      var p = products[i];
      var tagHtml = p.tag ? '<span class="product-tag tag-' + p.tag + '">' + (tagLabels[p.tag] || p.tag) + '</span>' : '';
      var designs = p.designs || [];
      var designCount = designs.length;
      html += '<div class="product-card" data-product-id="' + (p.id || '') + '" data-design-count="' + designCount + '">' +
        '<div class="product-card-image">' +
          makePicture(p.image, p.imageWebp || '', p.name, 600, 750, '', 'lazy') +
          tagHtml +
        '</div>' +
        '<div class="product-card-info">' +
          '<h3 class="product-card-title">' + (p.name || '') + '</h3>' +
          '<p class="product-card-cta">View ' + designCount + ' Designs <i class="fas fa-arrow-right"></i></p>' +
        '</div>' +
      '</div>';
    }
    grid.innerHTML = html;

    var cards = grid.querySelectorAll('.product-card');
    for (var j = 0; j < cards.length; j++) {
      cards[j].addEventListener('click', function () {
        var pid = this.getAttribute('data-product-id');
        var product = products.find(function (x) { return x.id === pid; });
        if (product) openDesignModal(product);
      });
    }
  }

  fetch('data/products.json?v=' + Date.now())
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (data) {
      var products = (data.products || [])
        .filter(function (p) { return p.collection === collection; })
        .sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
      renderProducts(products);
    })
    .catch(function () {
      grid.innerHTML = '<div class="collection-empty" style="color:#c0392b">Failed to load products. Please refresh the page.</div>';
    });

  /* Design Modal — shows up to 6 design thumbnails per product */
  var currentProduct = null;

  window.openDesignModal = function (product) {
    currentProduct = product;
    document.getElementById('designModalTitle').textContent = product.name;
    var modalGrid = document.getElementById('designModalGrid');
    modalGrid.innerHTML = '';

      var designs = (product.designs || []).slice(0, 6);
      for (var i = 0; i < designs.length; i++) {
        var d = designs[i];
        var firstImg = (d.images && d.images.length > 0) ? d.images[0] : {};
        var wrapper = document.createElement('div');
        wrapper.className = 'design-modal-img-wrap';
        wrapper.setAttribute('data-design-id', d.id);
        wrapper.innerHTML = makePicture(
          d.coverImage || firstImg.jpg || '',
          d.coverImageWebp || firstImg.webp || '',
        product.name + ' — ' + (d.name || 'Design ' + (i + 1)),
        400, 500, 'design-modal-img', 'lazy'
      );
      var designLabel = document.createElement('div');
      designLabel.className = 'design-label';
      designLabel.textContent = d.name || 'Design ' + (i + 1);
      wrapper.appendChild(designLabel);
      wrapper.addEventListener('click', (function (design) {
        return function (e) {
          e.stopPropagation();
          openDesignSlideshow(design);
        };
      })(d));
      modalGrid.appendChild(wrapper);
    }

    var subtitle = document.getElementById('designModalSubtitle');
    if (subtitle) {
      var total = (product.designs || []).length;
      subtitle.textContent = designs.length + ' DESIGNS' +
        (total > 6 ? ' · SCROLL TO SEE MORE' : '') +
        ' · TAP TO VIEW SLIDESHOW';
    }

    document.getElementById('designModal').classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  window.closeDesignModal = function () {
    document.getElementById('designModal').classList.remove('active');
    document.body.style.overflow = '';
    currentProduct = null;
  };

  /* Slideshow / Zoom — shows images for a single design, auto-advancing */
  var zoomImages = [], zoomImagesWebp = [], zoomIdx = 0;
  var slideTimer = null, slidePaused = false, slideAutoPlay = true;

  window.openDesignSlideshow = function (design) {
    zoomImages = [];
    zoomImagesWebp = [];
    var images = design.images || [];
    for (var i = 0; i < images.length && i < 5; i++) {
      if (images[i].jpg) zoomImages.push(images[i].jpg);
      if (images[i].webp) zoomImagesWebp.push(images[i].webp);
      else zoomImagesWebp.push('');
    }
    if (zoomImages.length === 0) return;
    zoomIdx = 0;
    slideAutoPlay = true;
    slidePaused = false;
    updateZoomImage();
    renderDots();
    updatePlayBtn();
    document.getElementById('imgZoomOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
    startSlideshow();
  };

  function startSlideshow() {
    stopSlideshow();
    if (!slideAutoPlay || slidePaused || zoomImages.length <= 1) return;
    slideTimer = setInterval(function () {
      zoomIdx = (zoomIdx + 1) % zoomImages.length;
      updateZoomImage();
      updateDots();
    }, 3000);
  }

  function stopSlideshow() {
    if (slideTimer) { clearInterval(slideTimer); slideTimer = null; }
  }

  function resetSlideshow() {
    stopSlideshow();
    startSlideshow();
  }

  function updateZoomImage() {
    var jpgSrc = zoomImages[zoomIdx] || '';
    var webpSrc = zoomImagesWebp[zoomIdx] || '';
    var container = document.getElementById('imgZoomContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'imgZoomContainer';
      container.style.cssText = 'display:flex;align-items:center;justify-content:center;flex:1;min-height:0;';
      var el = document.getElementById('imgZoomSrc');
      if (el) {
        el.parentElement.insertBefore(container, el);
        el.style.display = 'none';
      }
    }
    container.innerHTML = makePicture(jpgSrc, webpSrc, 'Design Image ' + (zoomIdx + 1), 1200, 1500, 'zoom-slide-img', 'eager');
    document.getElementById('imgZoomCounter').textContent = (zoomIdx + 1) + ' / ' + zoomImages.length;
    updateDots();
  }

  function renderDots() {
    var dotsWrap = document.getElementById('imgZoomDots');
    if (!dotsWrap) return;
    var max = Math.min(zoomImages.length, 10);
    var html = '';
    for (var i = 0; i < max; i++) {
      html += '<span class="zoom-dot' + (i === zoomIdx ? ' active' : '') + '" data-i="' + i + '"></span>';
    }
    dotsWrap.innerHTML = html;
    var dots = dotsWrap.querySelectorAll('.zoom-dot');
    for (var d = 0; d < dots.length; d++) {
      dots[d].addEventListener('click', (function (idx) {
        return function (e) {
          e.stopPropagation();
          zoomIdx = idx;
          updateZoomImage();
          updateDots();
          resetSlideshow();
        };
      })(d));
    }
  }

  function updateDots() {
    var dotsWrap = document.getElementById('imgZoomDots');
    if (!dotsWrap) return;
    var dots = dotsWrap.querySelectorAll('.zoom-dot');
    for (var i = 0; i < dots.length; i++) {
      dots[i].classList.toggle('active', i === zoomIdx);
    }
  }

  function updatePlayBtn() {
    var btn = document.getElementById('imgZoomPlay');
    if (!btn) return;
    btn.innerHTML = slidePaused
      ? '<i class="fas fa-play"></i>'
      : '<i class="fas fa-pause"></i>';
  }

  window.toggleSlidePlay = function () {
    slidePaused = !slidePaused;
    updatePlayBtn();
    if (slidePaused) stopSlideshow();
    else startSlideshow();
  };

  window.closeZoom = function () {
    stopSlideshow();
    document.getElementById('imgZoomOverlay').classList.remove('active');
    document.body.style.overflow = '';
  };

  window.zoomPrev = function () {
    zoomIdx = (zoomIdx - 1 + zoomImages.length) % zoomImages.length;
    updateZoomImage();
    resetSlideshow();
  };

  window.zoomNext = function () {
    zoomIdx = (zoomIdx + 1) % zoomImages.length;
    updateZoomImage();
    resetSlideshow();
  };

  /* Keyboard navigation */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (document.getElementById('imgZoomOverlay').classList.contains('active')) closeZoom();
      else if (document.getElementById('designModal').classList.contains('active')) closeDesignModal();
    }
    if (document.getElementById('imgZoomOverlay').classList.contains('active')) {
      if (e.key === 'ArrowLeft') zoomPrev();
      if (e.key === 'ArrowRight') zoomNext();
    }
  });

  /* Touch / Swipe for zoom overlay */
  (function () {
    var overlay = document.getElementById('imgZoomOverlay');
    if (!overlay) return;
    var startX = 0, startY = 0, swiping = false;

    overlay.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      swiping = true;
    }, { passive: true });

    overlay.addEventListener('touchmove', function (e) {
      if (!swiping) return;
      var dx = e.touches[0].clientX - startX;
      var dy = e.touches[0].clientY - startY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
        e.preventDefault();
      }
    }, { passive: false });

    overlay.addEventListener('touchend', function (e) {
      if (!swiping) return;
      swiping = false;
      var endX = e.changedTouches[0].clientX;
      var endY = e.changedTouches[0].clientY;
      var dx = endX - startX;
      var dy = endY - startY;

      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) zoomNext();
        else zoomPrev();
      } else if (dy > 80 && Math.abs(dy) > Math.abs(dx)) {
        closeZoom();
      }
    }, { passive: true });

    overlay.style.touchAction = 'pan-y';
  })();

  /* Touch / Swipe for design modal */
  (function () {
    var modal = document.getElementById('designModal');
    if (!modal) return;
    var content = modal.querySelector('.design-modal-content');
    if (!content) return;

    content.addEventListener('touchstart', function (e) {
      content._touchStartY = e.touches[0].clientY;
    }, { passive: true });

    content.addEventListener('touchend', function (e) {
      var dy = e.changedTouches[0].clientY - (content._touchStartY || 0);
      if (dy > 100 && content.scrollTop <= 0) {
        closeDesignModal();
      }
    }, { passive: true });
  })();
})();
