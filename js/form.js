/* Contact Form Module */
var PM = PM || {};
PM.form = (function () {
  function init() {
    var form = document.getElementById('contactForm');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('cfName').value.trim();
      var btn = form.querySelector('button[type="submit"]');
      var orig = btn.innerHTML;

      btn.innerHTML = '<span>Sending...</span><i class="fas fa-spinner fa-spin"></i>';
      btn.disabled = true;

      setTimeout(function () {
        btn.innerHTML = '<span>Sent!</span><i class="fas fa-check"></i>';
        btn.style.background = '#B5C4B1';
        showMsg(form, 'Thank you, ' + name + '! We will reach out shortly.', 'success');
        setTimeout(function () {
          btn.innerHTML = orig;
          btn.disabled = false;
          btn.style.background = '';
          form.reset();
        }, 3000);
      }, 1200);
    });
  }

  function showMsg(parent, text, type) {
    var old = parent.querySelector('.form-msg');
    if (old) old.remove();
    var div = document.createElement('div');
    div.className = 'form-msg';
    div.textContent = text;
    div.style.cssText = 'margin-top:16px;padding:12px 18px;border-radius:12px;font-size:14px;text-align:center;background:' +
      (type === 'success' ? 'rgba(181,196,177,0.2);color:#6B8B6B;border:1px solid rgba(181,196,177,0.3)' : 'rgba(201,169,110,0.15);color:#B08D4F;border:1px solid rgba(201,169,110,0.3)');
    parent.appendChild(div);
    setTimeout(function () { div.style.opacity = '0'; div.style.transition = 'opacity 0.3s'; setTimeout(function () { div.remove(); }, 300); }, 4000);
  }

  return { init: init };
})();
