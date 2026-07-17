/* Collection Page — shared product rendering (mobile-first) */
(function () {
  'use strict';

  var CACHE_V = '20260717';
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

  function isWebpSupported() {
    if (typeof window._webpCheck !== 'undefined') return window._webpCheck;
    try {
      var c = document.createElement('canvas');
      window._webpCheck = c.toDataURL && c.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    } catch (e) { window._webpCheck = false; }
    return window._webpCheck;
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
      var allImages = [p.image].concat(p.gallery || []);
      var allImagesWebp = [p.imageWebp || ''].concat(p.galleryWebp || []);
      var imgData = { jpg: allImages, webp: allImagesWebp };
      html += '<div class="product-card" data-images=\'' + JSON.stringify(imgData).replace(/'/g, '&#39;') + '\' data-name="' + (p.name || '').replace(/"/g, '&quot;') + '">' +
        '<div class="product-card-image">' +
          makePicture(p.image, p.imageWebp || '', p.name, 600, 750, '', 'lazy') +
          tagHtml +
        '</div>' +
        '<div class="product-card-info">' +
          '<h3 class="product-card-title">' + (p.name || '') + '</h3>' +
          '<p class="product-card-cta">View Latest Designs <i class="fas fa-arrow-right"></i></p>' +
        '</div>' +
      '</div>';
    }
    grid.innerHTML = html;

    var cards = grid.querySelectorAll('.product-card');
    for (var j = 0; j < cards.length; j++) {
      cards[j].addEventListener('click', function () {
        var name = this.getAttribute('data-name');
        var imgs;
        try { imgs = JSON.parse(this.getAttribute('data-images')); } catch (e) { imgs = { jpg: [], webp: [] }; }
        openDesignModal(name, imgs);
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

  /* Design Modal */
  window.openDesignModal = function (name, imgs) {
    document.getElementById('designModalTitle').textContent = name;
    var modalGrid = document.getElementById('designModalGrid');
    modalGrid.innerHTML = '';
    var jpgs = imgs.jpg || [];
    var webps = imgs.webp || [];
    for (var i = 0; i < jpgs.length; i++) {
      var wrapper = document.createElement('div');
      wrapper.className = 'design-modal-img-wrap';
      wrapper.innerHTML = makePicture(jpgs[i], webps[i] || '', name + ' Design ' + (i + 1), 400, 500, 'design-modal-img', 'lazy');
      var imgEl = wrapper.querySelector('img');
      imgEl.setAttribute('data-index', i);
      imgEl.onclick = (function (idx) { return function (e) { e.stopPropagation(); openZoom(jpgs, webps, idx); }; })(i);
      modalGrid.appendChild(wrapper);
    }
    document.getElementById('designModal').classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  window.closeDesignModal = function () {
    document.getElementById('designModal').classList.remove('active');
    document.body.style.overflow = '';
  };

  /* Zoom */
  var zoomImages = [], zoomImagesWebp = [], zoomIdx = 0;

  window.openZoom = function (imgs, webps, idx) {
    zoomImages = imgs;
    zoomImagesWebp = webps || [];
    zoomIdx = idx;
    updateZoomImage();
    document.getElementById('imgZoomOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  function updateZoomImage() {
    var jpgSrc = zoomImages[zoomIdx] || '';
    var webpSrc = zoomImagesWebp[zoomIdx] || '';
    var el = document.getElementById('imgZoomSrc');
    var parent = el.parentElement;
    var newImg = makePicture(jpgSrc, webpSrc, 'Zoom', 1200, 1500, '', 'eager');
    var container = document.getElementById('imgZoomContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'imgZoomContainer';
      container.style.cssText = 'display:flex;align-items:center;justify-content:center;flex:1;min-height:0;';
      parent.insertBefore(container, el);
      el.style.display = 'none';
    }
    container.innerHTML = newImg;
    document.getElementById('imgZoomCounter').textContent = (zoomIdx + 1) + ' / ' + zoomImages.length;
  }

  window.closeZoom = function () {
    document.getElementById('imgZoomOverlay').classList.remove('active');
    document.body.style.overflow = '';
  };

  window.zoomPrev = function () {
    zoomIdx = (zoomIdx - 1 + zoomImages.length) % zoomImages.length;
    updateZoomImage();
  };

  window.zoomNext = function () {
    zoomIdx = (zoomIdx + 1) % zoomImages.length;
    updateZoomImage();
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
