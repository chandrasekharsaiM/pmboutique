/* Collection Page — handles BOTH old format (id/image/gallery) and new format (productId/mainImage/designs)
   Flow: Product card → Design modal (6 thumbnails) → Slideshow (5 images, auto-play) */
(function () {
  'use strict';

  var CACHE_V = '20260717d';
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

  function esc(s) {
    return (s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function img(src, alt, w, h, cls, loading) {
    if (!src) return '';
    return '<img src="' + cb(src) + '" alt="' + esc(alt) + '"' +
      ' width="' + (w || 600) + '" height="' + (h || 750) + '"' +
      ' loading="' + (loading || 'lazy') + '"' +
      ' decoding="async"' +
      (cls ? ' class="' + cls + '"' : '') +
      ' onerror="this.style.display=\'none\'">';
  }

  /* ===== Normalize any format into canonical shape ===== */
  function normalizeProduct(p) {
    var pid = p.productId || p.id || '';
    var mainImg = p.mainImage || p.image || '';
    var designs = [];

    if (p.designs && p.designs.length > 0) {
      for (var i = 0; i < p.designs.length; i++) {
        var d = p.designs[i];
        var images = [];
        if (d.images && d.images.length > 0) {
          for (var j = 0; j < d.images.length; j++) {
            var item = d.images[j];
            if (typeof item === 'string') {
              images.push(item);
            } else if (item && item.jpg) {
              images.push(item.jpg);
            }
          }
        }
        designs.push({ designId: d.designId || d.id || ('d-' + i), name: d.name || ('Design ' + (i + 1)), images: images });
      }
    } else if (p.gallery && p.gallery.length > 0) {
      var allImages = [mainImg].concat(p.gallery);
      var allWebp = [(p.imageWebp || '')].concat(p.galleryWebp || []);
      var idx = 0;
      for (var dIdx = 0; dIdx < 6; dIdx++) {
        var dImages = [];
        for (var k = 0; k < 5; k++) {
          var imgIdx = idx % allImages.length;
          if (allImages[imgIdx]) dImages.push(allImages[imgIdx]);
          idx++;
        }
        if (dImages.length > 0) {
          designs.push({ designId: 'design_' + (dIdx + 1), name: 'Design ' + (dIdx + 1), images: dImages });
        }
      }
    }

    while (designs.length < 6) {
      var lastImg = mainImg || (designs.length > 0 && designs[0].images.length > 0 ? designs[0].images[0] : '');
      var padImages = [];
      for (var p2 = 0; p2 < 5; p2++) padImages.push(lastImg);
      designs.push({ designId: 'design_' + (designs.length + 1), name: 'Design ' + (designs.length + 1), images: padImages });
    }

    return {
      productId: pid,
      name: p.name || '',
      collection: p.collection || '',
      tag: p.tag || null,
      order: p.order || 0,
      mainImage: mainImg,
      designs: designs.slice(0, 6)
    };
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
      var p = normalizeProduct(products[i]);
      var tagHtml = p.tag ? '<span class="product-tag tag-' + p.tag + '">' + (tagLabels[p.tag] || p.tag) + '</span>' : '';
      html += '<div class="product-card" data-pid="' + esc(p.productId) + '">' +
        '<div class="product-card-image">' +
          img(p.mainImage, p.name, 600, 750, '', 'lazy') +
          tagHtml +
        '</div>' +
        '<div class="product-card-info">' +
          '<h3 class="product-card-title">' + esc(p.name) + '</h3>' +
          '<p class="product-card-cta">View ' + p.designs.length + ' Designs <i class="fas fa-arrow-right"></i></p>' +
        '</div>' +
      '</div>';
    }
    grid.innerHTML = html;

    var cards = grid.querySelectorAll('.product-card');
    for (var j = 0; j < cards.length; j++) {
      cards[j].addEventListener('click', function () {
        var pid = this.getAttribute('data-pid');
        var raw = products.find(function (x) { return (x.productId || x.id) === pid; });
        if (raw) {
          var normalized = normalizeProduct(raw);
          openDesignModal(normalized);
        }
      });
    }
  }

  fetch('data/products.json?v=' + Date.now())
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (data) {
      var products = (data.products || [])
        .filter(function (p) { return p.collection === collection; })
        .sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
      renderProducts(products);
    })
    .catch(function () {
      grid.innerHTML = '<div class="collection-empty" style="color:#c0392b">Failed to load products. Please refresh the page.</div>';
    });

  /* ===== DESIGN MODAL ===== */
  var currentProduct = null;

  window.openDesignModal = function (product) {
    currentProduct = product;
    var modalGrid = document.getElementById('designModalGrid');
    modalGrid.innerHTML = '';
    document.getElementById('designModalTitle').textContent = product.name;

    var designs = product.designs.slice(0, 6);
    for (var i = 0; i < designs.length; i++) {
      var d = designs[i];
      var cover = d.images.length > 0 ? d.images[0] : '';

      var wrap = document.createElement('div');
      wrap.className = 'design-modal-img-wrap';
      wrap.setAttribute('data-di', String(i));
      wrap.innerHTML = img(cover, d.name, 400, 500, 'design-modal-img', 'lazy');

      var label = document.createElement('div');
      label.className = 'design-label';
      label.textContent = d.name;
      wrap.appendChild(label);

      wrap.addEventListener('click', (function (design) {
        return function (e) { e.stopPropagation(); openDesignSlideshow(design); };
      })(d));

      modalGrid.appendChild(wrap);
    }

    var sub = document.getElementById('designModalSubtitle');
    if (sub) sub.textContent = designs.length + ' DESIGNS · TAP TO VIEW SLIDESHOW';

    document.getElementById('designModal').classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  window.closeDesignModal = function () {
    document.getElementById('designModal').classList.remove('active');
    document.body.style.overflow = '';
    currentProduct = null;
  };

  /* ===== SLIDESHOW / ZOOM ===== */
  var slides = [], slideIdx = 0;
  var slideTimer = null, slidePaused = false;

  window.openDesignSlideshow = function (design) {
    slides = (design.images || []).slice(0, 5);
    if (slides.length === 0) return;
    slideIdx = 0;
    slidePaused = false;
    renderZoomImage();
    renderDots();
    updatePlayBtn();
    document.getElementById('imgZoomOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
    startAutoPlay();
  };

  function startAutoPlay() {
    stopAutoPlay();
    if (slidePaused || slides.length <= 1) return;
    slideTimer = setInterval(function () {
      slideIdx = (slideIdx + 1) % slides.length;
      renderZoomImage();
      updateDots();
    }, 3000);
  }

  function stopAutoPlay() { if (slideTimer) { clearInterval(slideTimer); slideTimer = null; } }
  function resetAutoPlay() { stopAutoPlay(); startAutoPlay(); }

  function renderZoomImage() {
    var src = slides[slideIdx] || '';
    var container = document.getElementById('imgZoomContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'imgZoomContainer';
      container.style.cssText = 'display:flex;align-items:center;justify-content:center;flex:1;min-height:0;';
      var old = document.getElementById('imgZoomSrc');
      if (old && old.parentElement) { old.parentElement.insertBefore(container, old); old.style.display = 'none'; }
    }
    container.innerHTML = img(src, 'Image ' + (slideIdx + 1), 1200, 1500, 'zoom-slide-img', 'eager');
    document.getElementById('imgZoomCounter').textContent = (slideIdx + 1) + ' / ' + slides.length;
    updateDots();
  }

  function renderDots() {
    var wrap = document.getElementById('imgZoomDots');
    if (!wrap) return;
    var html = '';
    for (var i = 0; i < slides.length; i++) {
      html += '<span class="zoom-dot' + (i === slideIdx ? ' active' : '') + '" data-i="' + i + '"></span>';
    }
    wrap.innerHTML = html;
    var dots = wrap.querySelectorAll('.zoom-dot');
    for (var d = 0; d < dots.length; d++) {
      dots[d].addEventListener('click', (function (idx) {
        return function (e) { e.stopPropagation(); slideIdx = idx; renderZoomImage(); updateDots(); resetAutoPlay(); };
      })(d));
    }
  }

  function updateDots() {
    var wrap = document.getElementById('imgZoomDots');
    if (!wrap) return;
    var dots = wrap.querySelectorAll('.zoom-dot');
    for (var i = 0; i < dots.length; i++) dots[i].classList.toggle('active', i === slideIdx);
  }

  function updatePlayBtn() {
    var btn = document.getElementById('imgZoomPlay');
    if (!btn) return;
    btn.innerHTML = slidePaused ? '<i class="fas fa-play"></i>' : '<i class="fas fa-pause"></i>';
  }

  window.toggleSlidePlay = function () { slidePaused = !slidePaused; updatePlayBtn(); if (slidePaused) stopAutoPlay(); else startAutoPlay(); };
  window.closeZoom = function () { stopAutoPlay(); document.getElementById('imgZoomOverlay').classList.remove('active'); document.body.style.overflow = ''; };
  window.zoomPrev = function () { slideIdx = (slideIdx - 1 + slides.length) % slides.length; renderZoomImage(); resetAutoPlay(); };
  window.zoomNext = function () { slideIdx = (slideIdx + 1) % slides.length; renderZoomImage(); resetAutoPlay(); };

  document.addEventListener('keydown', function (e) {
    var z = document.getElementById('imgZoomOverlay').classList.contains('active');
    var m = document.getElementById('designModal').classList.contains('active');
    if (e.key === 'Escape') { if (z) closeZoom(); else if (m) closeDesignModal(); }
    if (z) { if (e.key === 'ArrowLeft') zoomPrev(); if (e.key === 'ArrowRight') zoomNext(); }
  });

  (function () {
    var overlay = document.getElementById('imgZoomOverlay');
    if (!overlay) return;
    var sx = 0, sy = 0, sw = false;
    overlay.addEventListener('touchstart', function (e) { if (e.touches.length !== 1) return; sx = e.touches[0].clientX; sy = e.touches[0].clientY; sw = true; }, { passive: true });
    overlay.addEventListener('touchmove', function (e) { if (!sw) return; var dx = e.touches[0].clientX - sx; if (Math.abs(dx) > Math.abs(e.touches[0].clientY - sy) && Math.abs(dx) > 10) e.preventDefault(); }, { passive: false });
    overlay.addEventListener('touchend', function (e) { if (!sw) return; sw = false; var dx = e.changedTouches[0].clientX - sx; var dy = e.changedTouches[0].clientY - sy; if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) { dx < 0 ? zoomNext() : zoomPrev(); } else if (dy > 80 && Math.abs(dy) > Math.abs(dx)) { closeZoom(); } }, { passive: true });
    overlay.style.touchAction = 'pan-y';
  })();

  (function () {
    var modal = document.getElementById('designModal');
    if (!modal) return;
    var content = modal.querySelector('.design-modal-content');
    if (!content) return;
    content.addEventListener('touchstart', function (e) { content._ty = e.touches[0].clientY; }, { passive: true });
    content.addEventListener('touchend', function (e) { if (e.changedTouches[0].clientY - (content._ty || 0) > 100 && content.scrollTop <= 0) closeDesignModal(); }, { passive: true });
  })();
})();
