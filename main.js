(function () {
  'use strict';

  var REVIEWS_URL = 'https://vk.ru/do__english?w=app6326142_-211281053';

  var navTabs = Array.prototype.slice.call(document.querySelectorAll('.nav-tab'));
  var panels = Array.prototype.slice.call(document.querySelectorAll('[data-panel]'));
  var nav = document.getElementById('mainNav');
  var navToggle = document.getElementById('navToggle');

  var currentPanel = null;

  /* Each tab and each opened overlay gets a history entry, so the phone /
     browser "back" button closes the overlay or returns to the previous tab
     instead of leaving the site. mode: 'push' (user click), 'replace' (init), 'none' (popstate) */
  function setHistory(mode, state) {
    if (mode === 'none') return;
    var url = state.panel === 'home' ? window.location.pathname + window.location.search : '#' + state.panel;
    try {
      history[mode === 'push' ? 'pushState' : 'replaceState'](state, '', url);
    } catch (e) { /* file:// in some browsers — the page still works without history */ }
  }

  function showPanel(name, mode) {
    mode = mode || 'push';
    if (mode === 'push' && name === currentPanel) mode = 'none';
    currentPanel = name;
    panels.forEach(function (p) {
      p.hidden = p.getAttribute('data-panel') !== name;
    });
    navTabs.forEach(function (t) {
      var isExternal = t.hasAttribute('data-external');
      t.classList.toggle('active', !isExternal && t.getAttribute('data-tab') === name);
    });
    window.scrollTo({ top: 0, behavior: 'auto' });
    setNavOpen(false);
    setHistory(mode, { panel: name });
  }

  function setNavOpen(open) {
    nav.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    navToggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  }

  navTabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      if (tab.hasAttribute('data-external')) {
        window.open(REVIEWS_URL, '_blank', 'noopener');
        return;
      }
      var target = tab.getAttribute('data-tab');
      if (target) showPanel(target);
    });
  });

  navToggle.addEventListener('click', function () {
    setNavOpen(!nav.classList.contains('open'));
  });

  /* Close the mobile menu on a tap outside of it */
  document.addEventListener('click', function (e) {
    if (nav.classList.contains('open') && !nav.contains(e.target) && !navToggle.contains(e.target)) setNavOpen(false);
  });

  /* Buttons anywhere on the page that switch tabs via data-goto */
  document.querySelectorAll('[data-goto]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      showPanel(btn.getAttribute('data-goto'));
    });
  });

  /* Scroll to lesson flow from hero button */
  var lessonBtn = document.getElementById('lessonFlowBtn');
  var lessonFlow = document.getElementById('lessonFlow');
  if (lessonBtn && lessonFlow) {
    lessonBtn.addEventListener('click', function () {
      lessonFlow.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  /* Mistakes modal */
  var modal = document.getElementById('mistakesModal');
  var openMistakesBtn = document.getElementById('openMistakesBtn');
  var closeMistakesBtn = document.getElementById('closeMistakesBtn');

  function openModal() {
    modal.hidden = false;
    modal.scrollTop = 0;
    document.body.style.overflow = 'hidden';
    setHistory('push', { panel: currentPanel, overlay: true });
  }
  function closeModal() {
    closeOverlay();
  }

  if (openMistakesBtn) openMistakesBtn.addEventListener('click', openModal);
  if (closeMistakesBtn) closeMistakesBtn.addEventListener('click', closeModal);
  if (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal();
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal && !modal.hidden) closeModal();
  });

  /* Lightbox: click a certificate or gallery photo to enlarge it */
  var imgLightbox = document.getElementById('imgLightbox');
  var imgLightboxPic = document.getElementById('imgLightboxPic');
  var imgLightboxClose = document.getElementById('imgLightboxClose');

  function openImgLightbox(src, alt) {
    imgLightboxPic.src = src;
    imgLightboxPic.alt = alt || '';
    imgLightbox.hidden = false;
    document.body.style.overflow = 'hidden';
    setHistory('push', { panel: currentPanel, overlay: true });
  }
  function closeImgLightbox() {
    closeOverlay();
  }

  /* Hide whichever overlay is open, without touching history */
  function hideOverlays() {
    if (modal) modal.hidden = true;
    if (imgLightbox) {
      imgLightbox.hidden = true;
      imgLightboxPic.src = '';
    }
    document.body.style.overflow = '';
  }

  /* Closing from the UI goes through history so the overlay's entry is consumed */
  function closeOverlay() {
    if (history.state && history.state.overlay) {
      history.back();
    } else {
      hideOverlays();
    }
  }

  document.querySelectorAll('.cert-card img, .gallery-item img').forEach(function (img) {
    img.addEventListener('click', function () {
      openImgLightbox(img.getAttribute('src'), img.getAttribute('alt'));
    });
  });

  if (imgLightboxClose) imgLightboxClose.addEventListener('click', closeImgLightbox);
  if (imgLightbox) {
    imgLightbox.addEventListener('click', function (e) {
      if (e.target === imgLightbox) closeImgLightbox();
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && imgLightbox && !imgLightbox.hidden) closeImgLightbox();
  });

  var validNames = panels.map(function (p) { return p.getAttribute('data-panel'); });

  function panelFromHash() {
    var name = (window.location.hash || '').replace('#', '');
    return validNames.indexOf(name) !== -1 ? name : 'home';
  }

  window.addEventListener('popstate', function (e) {
    var state = e.state || { panel: panelFromHash() };
    hideOverlays();
    if (state.overlay) {
      /* "Forward" into a closed overlay — skip past it */
      history.back();
      return;
    }
    if (state.panel !== currentPanel) showPanel(state.panel, 'none');
  });

  /* Init: open panel matching hash, default to home.
     A reload while an overlay was open lands on its entry — drop the overlay flag */
  showPanel(panelFromHash(), 'replace');
})();
