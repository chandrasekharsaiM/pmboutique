/* Collection Page — shared product rendering */
(function () {
  'use strict';

  var tagLabels = { new: 'New', bestseller: 'Bestseller', limited: 'Limited', trending: 'Trending' };

  function getCollection() {
    var path = window.location.pathname.toLowerCase();
    if (path.indexOf('mens') !== -1 && path.indexOf('womens') === -1) return 'mens';
    if (path.indexOf('kids') !== -1) return 'kids';
    return 'womens';
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
      html += '<div class="product-card" data-images=\'' + JSON.stringify(allImages).replace(/'/g, '&#39;') + '\' data-name="' + (p.name || '').replace(/"/g, '&quot;') + '">' +
        '<div class="product-card-image">' +
          '<img src="' + p.image + '" alt="' + (p.name || '') + '" loading="lazy" onerror="this.style.display=\'none\'">' +
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
        try { imgs = JSON.parse(this.getAttribute('data-images')); } catch (e) { imgs = []; }
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
    for (var i = 0; i < imgs.length; i++) {
      var imgEl = document.createElement('img');
      imgEl.src = imgs[i];
      imgEl.alt = name + ' Design ' + (i + 1);
      imgEl.loading = 'lazy';
      imgEl.setAttribute('data-index', i);
      imgEl.onerror = function () { this.style.display = 'none'; };
      imgEl.onclick = (function (idx) { return function (e) { e.stopPropagation(); openZoom(imgs, idx); }; })(i);
      modalGrid.appendChild(imgEl);
    }
    document.getElementById('designModal').classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  window.closeDesignModal = function () {
    document.getElementById('designModal').classList.remove('active');
    document.body.style.overflow = '';
  };

  /* Zoom */
  var zoomImages = [], zoomIdx = 0;

  window.openZoom = function (imgs, idx) {
    zoomImages = imgs;
    zoomIdx = idx;
    document.getElementById('imgZoomSrc').src = imgs[idx];
    document.getElementById('imgZoomCounter').textContent = (idx + 1) + ' / ' + imgs.length;
    document.getElementById('imgZoomOverlay').classList.add('active');
  };

  window.closeZoom = function () {
    document.getElementById('imgZoomOverlay').classList.remove('active');
  };

  window.zoomPrev = function () {
    zoomIdx = (zoomIdx - 1 + zoomImages.length) % zoomImages.length;
    document.getElementById('imgZoomSrc').src = zoomImages[zoomIdx];
    document.getElementById('imgZoomCounter').textContent = (zoomIdx + 1) + ' / ' + zoomImages.length;
  };

  window.zoomNext = function () {
    zoomIdx = (zoomIdx + 1) % zoomImages.length;
    document.getElementById('imgZoomSrc').src = zoomImages[zoomIdx];
    document.getElementById('imgZoomCounter').textContent = (zoomIdx + 1) + ' / ' + zoomImages.length;
  };

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (document.getElementById('imgZoomOverlay').classList.contains('active')) closeZoom();
      else closeDesignModal();
    }
    if (document.getElementById('imgZoomOverlay').classList.contains('active')) {
      if (e.key === 'ArrowLeft') zoomPrev();
      if (e.key === 'ArrowRight') zoomNext();
    }
  });
})();