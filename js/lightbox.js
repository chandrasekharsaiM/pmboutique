/* Lightbox Module */
var PM = PM || {};
PM.lightbox = (function () {
  var lightbox, lbImg, lbCaption, items, idx;

  function init() {
    lightbox = document.getElementById('lightbox');
    lbImg = document.getElementById('lbImg');
    lbCaption = document.getElementById('lbCaption');
    items = document.querySelectorAll('.g-item');
    if (!items.length || !lightbox) return;
    idx = 0;

    for (var i = 0; i < items.length; i++) {
      (function (i) {
        items[i].addEventListener('click', function () { idx = i; open(items[i]); });
      })(i);
    }

    lightbox.querySelector('.lb-close').addEventListener('click', close);
    lightbox.addEventListener('click', function (e) { if (e.target === lightbox) close(); });
    lightbox.querySelector('.lb-prev').addEventListener('click', function () { idx = (idx - 1 + items.length) % items.length; open(items[idx]); });
    lightbox.querySelector('.lb-next').addEventListener('click', function () { idx = (idx + 1) % items.length; open(items[idx]); });

    document.addEventListener('keydown', function (e) {
      if (!lightbox.classList.contains('active')) return;
      if (e.key === 'ArrowLeft') { idx = (idx - 1 + items.length) % items.length; open(items[idx]); }
      if (e.key === 'ArrowRight') { idx = (idx + 1) % items.length; open(items[idx]); }
    });
  }

  function open(item) {
    var img = item.querySelector('img');
    var cap = item.dataset.caption;
    if (img) { lbImg.src = img.src; lbImg.alt = img.alt; }
    if (cap) lbCaption.textContent = cap;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    if (!lightbox) return;
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }

  return { init: init, close: close };
})();
