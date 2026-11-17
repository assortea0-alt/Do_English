(function () {
  'use strict';

  var STORAGE_KEY = 'doEnglishQuizData';
  var TOTAL_STEPS = 4;
  var currentStep = 1;
  var submitted = false;

  /* Анкета уходит в Google Apps Script (папка google-apps-script), а уже он
     пересылает её в Telegram — токен бота хранится только в Google.
     Сюда вставляется адрес веб-приложения, который Google выдаёт после «Развернуть». */
  var SEND_URL = 'https://script.google.com/macros/s/AKfycbw25u2H-VAd0fIpIvsI2XaGEDHAT0M0FIInYy5Q25YyEIFe4zHKGDafmnb5B4dMJah9tg/exec';

  var hero = document.getElementById('hero');
  var wizard = document.getElementById('wizard');
  var successSection = document.getElementById('success');
  var privacySection = document.getElementById('privacy');

  var startBtn = document.getElementById('startBtn');
  var homeBtn = document.getElementById('homeBtn');
  var prevBtn = document.getElementById('prevBtn');
  var nextBtn = document.getElementById('nextBtn');
  var submitBtn = document.getElementById('submitBtn');
  var form = document.getElementById('quizForm');
  var progressText = document.getElementById('progressText');
  var progressFill = document.getElementById('progressFill');
  var privacyLink = document.getElementById('privacyLink');
  var closePrivacyBtn = document.getElementById('closePrivacyBtn');

  var phoneInput = document.getElementById('phone');
  var emailInput = document.getElementById('email');
  var levelDetailsField = document.getElementById('levelDetailsField');
  var levelDetailsInput = document.getElementById('levelDetails');

  var steps = Array.prototype.slice.call(document.querySelectorAll('.step'));

  function showSection(section) {
    [hero, wizard, successSection, privacySection].forEach(function (s) {
      s.hidden = s !== section;
    });
  }

  function getStepEl(n) {
    return document.querySelector('.step[data-step="' + n + '"]');
  }

  function updateProgress() {
    progressText.textContent = 'Шаг ' + currentStep + ' из ' + TOTAL_STEPS;
    progressFill.style.width = (currentStep / TOTAL_STEPS * 100) + '%';
  }

  var stepTimer = null;

  function renderStep(newStep) {
    var oldEl = getStepEl(currentStep);
    var newEl = getStepEl(newStep);

    /* Cancel a transition still in flight (fast repeated "back" presses)
       and make sure no other step is left visible */
    clearTimeout(stepTimer);
    steps.forEach(function (el) {
      if (el !== oldEl) el.hidden = true;
      el.classList.remove('leaving');
    });

    if (oldEl && oldEl !== newEl && !oldEl.hidden) {
      oldEl.classList.add('leaving');
      stepTimer = setTimeout(function () {
        oldEl.hidden = true;
        oldEl.classList.remove('leaving');
        newEl.hidden = false;
      }, 220);
    } else {
      if (oldEl && oldEl !== newEl) oldEl.hidden = true;
      newEl.hidden = false;
    }

    currentStep = newStep;
    updateProgress();

    prevBtn.hidden = currentStep === 1;
    nextBtn.hidden = currentStep === TOTAL_STEPS;
    submitBtn.hidden = currentStep !== TOTAL_STEPS;

    window.scrollTo({ top: wizard.offsetTop - 20, behavior: 'smooth' });
  }

  function setError(fieldName, message) {
    var el = document.querySelector('[data-error-for="' + fieldName + '"]');
    if (el) el.textContent = message || '';
  }

  function clearStepErrors(stepEl) {
    Array.prototype.forEach.call(stepEl.querySelectorAll('.error-msg'), function (el) {
      el.textContent = '';
    });
    Array.prototype.forEach.call(stepEl.querySelectorAll('.invalid'), function (el) {
      el.classList.remove('invalid');
    });
  }

  function markInvalid(input, fieldName, message) {
    if (input) input.classList.add('invalid');
    setError(fieldName, message);
  }

  var NAME_RE = /^[A-Za-zА-Яа-яЁё\- ]{2,40}$/;
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function validateStep(n) {
    var stepEl = getStepEl(n);
    clearStepErrors(stepEl);
    var valid = true;

    if (n === 1) {
      var parentFirstName = document.getElementById('parentFirstName');
      var parentLastName = document.getElementById('parentLastName');
      var childFirstName = document.getElementById('childFirstName');
      var childLastName = document.getElementById('childLastName');
      var age = document.getElementById('age');

      if (!NAME_RE.test(parentFirstName.value.trim())) {
        markInvalid(parentFirstName, 'parentFirstName', 'Введите корректное имя (от 2 букв)');
        valid = false;
      }
      if (!NAME_RE.test(parentLastName.value.trim())) {
        markInvalid(parentLastName, 'parentLastName', 'Введите корректную фамилию (от 2 букв)');
        valid = false;
      }
      if (!NAME_RE.test(childFirstName.value.trim())) {
        markInvalid(childFirstName, 'childFirstName', 'Введите корректное имя (от 2 букв)');
        valid = false;
      }
      if (!NAME_RE.test(childLastName.value.trim())) {
        markInvalid(childLastName, 'childLastName', 'Введите корректную фамилию (от 2 букв)');
        valid = false;
      }
      var ageVal = Number(age.value);
      if (!age.value || isNaN(ageVal) || ageVal < 5) {
        markInvalid(age, 'age', 'Введите возраст от 5 лет');
        valid = false;
      }
      var gender = form.querySelector('input[name="gender"]:checked');
      if (!gender) {
        setError('gender', 'Выберите пол ребёнка');
        valid = false;
      }
    }

    if (n === 2) {
      var phoneDigits = phoneInput.value.replace(/\D/g, '');
      if (phoneDigits.length !== 11) {
        markInvalid(phoneInput, 'phone', 'Введите полный номер телефона');
        valid = false;
      }
      if (emailInput.value.trim() && !EMAIL_RE.test(emailInput.value.trim())) {
        markInvalid(emailInput, 'email', 'Введите корректный email');
        valid = false;
      }
    }

    if (n === 3) {
      var level = form.querySelector('input[name="level"]:checked');
      var format = form.querySelector('input[name="format"]:checked');
      var purposeChecked = form.querySelectorAll('input[name="purpose"]:checked');

      if (!level) { setError('level', 'Выберите уровень английского'); valid = false; }
      if (!purposeChecked.length) { setError('purpose', 'Выберите хотя бы один вариант'); valid = false; }
      if (!format) { setError('format', 'Выберите формат обучения'); valid = false; }
    }

    if (n === 4) {
      var consent = document.getElementById('consent');
      if (!consent.checked) {
        setError('consent', 'Необходимо согласие на обработку персональных данных');
        valid = false;
      }
    }

    return valid;
  }

  /* ---------- Phone mask ---------- */
  function formatPhone(raw) {
    var digits = raw.replace(/\D/g, '');
    if (digits.charAt(0) === '7' || digits.charAt(0) === '8') {
      digits = digits.slice(1);
    }
    digits = digits.slice(0, 10);

    var result = '+7';
    if (digits.length > 0) result += ' (' + digits.slice(0, 3);
    if (digits.length >= 3) result += ')';
    if (digits.length > 3) result += ' ' + digits.slice(3, 6);
    if (digits.length > 6) result += '-' + digits.slice(6, 8);
    if (digits.length > 8) result += '-' + digits.slice(8, 10);
    return result;
  }

  phoneInput.addEventListener('focus', function () {
    if (!phoneInput.value) phoneInput.value = '+7 (';
  });
  phoneInput.addEventListener('input', function () {
    phoneInput.value = formatPhone(phoneInput.value);
  });
  phoneInput.addEventListener('blur', function () {
    var digits = phoneInput.value.replace(/\D/g, '');
    if (digits === '7' || digits === '') phoneInput.value = '';
  });

  /* ---------- Autosave ---------- */
  function collectFormData() {
    var data = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name) return;
      if (el.type === 'checkbox') {
        if (el.name === 'consent') return;
        if (!data[el.name]) data[el.name] = [];
        if (el.checked) data[el.name].push(el.value);
      } else if (el.type === 'radio') {
        if (el.checked) data[el.name] = el.value;
      } else {
        data[el.name] = el.value;
      }
    });
    return data;
  }

  function saveProgress() {
    try {
      var data = collectFormData();
      data.__step = currentStep;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) { /* storage unavailable */ }
  }

  function restoreProgress() {
    var raw;
    try {
      raw = localStorage.getItem(STORAGE_KEY);
    } catch (e) { return; }
    if (!raw) return;

    var data;
    try { data = JSON.parse(raw); } catch (e) { return; }

    Object.keys(data).forEach(function (key) {
      if (key === '__step') return;
      var value = data[key];
      if (Array.isArray(value)) {
        value.forEach(function (v) {
          var el = form.querySelector('input[name="' + key + '"][value="' + cssEscape(v) + '"]');
          if (el) el.checked = true;
        });
      } else {
        var els = form.querySelectorAll('[name="' + key + '"]');
        Array.prototype.forEach.call(els, function (el) {
          if (el.type === 'radio') {
            if (el.value === value) el.checked = true;
          } else {
            el.value = value;
          }
        });
      }
    });
  }

  function cssEscape(str) {
    return String(str).replace(/["\\]/g, '\\$&');
  }

  function clearSavedProgress() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* noop */ }
  }

  /* ---------- Sending ---------- */
  function sendForm(data) {
    data.consent = true;
    /* text/plain — чтобы браузер не делал предварительный CORS-запрос, который Google не поддерживает */
    return fetch(SEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(data)
    }).then(function (res) {
      return res.json();
    }).then(function (result) {
      if (!result || !result.ok) {
        var err = new Error('form error: ' + (result && result.error));
        err.code = result && result.error;
        throw err;
      }
      return result;
    });
  }

  function updateLevelDetailsVisibility() {
    var checked = form.querySelector('input[name="level"]:checked');
    var show = !!checked && checked.value === 'Изучал дополнительно';
    levelDetailsField.hidden = !show;
    if (!show) levelDetailsInput.value = '';
  }

  Array.prototype.forEach.call(form.querySelectorAll('input[name="level"]'), function (input) {
    input.addEventListener('change', updateLevelDetailsVisibility);
  });

  form.addEventListener('input', saveProgress);
  form.addEventListener('change', saveProgress);

  /* ---------- Browser history ----------
     Every step (and the privacy page) gets its own history entry, so the
     browser / phone "back" button returns to the previous step instead of
     leaving the form. The entry with no state is the intro screen. */
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  function pushView(state) {
    try {
      history.pushState(state, '', state.view === 'step' ? '#step-' + state.step : '#' + state.view);
    } catch (e) { /* file:// in some browsers — navigation still works without history */ }
  }

  function applyView(state) {
    if (submitted) {
      window.location.href = 'index.html';
      return;
    }
    if (!state || !state.view) {
      showSection(hero);
      window.scrollTo(0, 0);
    } else if (state.view === 'privacy') {
      showSection(privacySection);
      window.scrollTo(0, 0);
    } else if (state.view === 'step') {
      var target = Math.min(Math.max(1, state.step | 0), TOTAL_STEPS);
      /* "Forward" may skip ahead only through steps that are still valid */
      if (currentStep < target && !wizard.hidden && !validateStep(currentStep)) {
        history.go(currentStep - target);
        return;
      }
      showSection(wizard);
      renderStep(target);
    }
  }

  window.addEventListener('popstate', function (e) {
    applyView(e.state);
  });

  /* ---------- Navigation ---------- */
  startBtn.addEventListener('click', function () {
    showSection(wizard);
    renderStep(1);
    pushView({ view: 'step', step: 1 });
  });

  nextBtn.addEventListener('click', function () {
    if (!validateStep(currentStep)) return;
    if (currentStep < TOTAL_STEPS) {
      renderStep(currentStep + 1);
      pushView({ view: 'step', step: currentStep });
      saveProgress();
    }
  });

  prevBtn.addEventListener('click', function () {
    if (currentStep <= 1) return;
    /* Go through history so the on-screen button and the browser button stay in sync */
    if (history.state && history.state.view === 'step' && history.state.step === currentStep) {
      history.back();
    } else {
      renderStep(currentStep - 1);
    }
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (submitted) return;
    if (!validateStep(4)) return;

    submitted = true;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Отправка...';

    var data = collectFormData();

    sendForm(data)
      .then(function () {
        clearSavedProgress();
        try { history.replaceState({ view: 'success' }, '', '#done'); } catch (e) { /* noop */ }
        showSection(successSection);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      })
      .catch(function (err) {
        console.error(err);
        submitted = false;
        submitBtn.disabled = false;
        submitBtn.textContent = 'Отправить анкету';
        setError('consent', (err.code === 'rate' || err.code === 'busy')
          ? 'Слишком много попыток подряд. Попробуйте через 10 минут или позвоните нам: +7 (995) 160-12-49.'
          : 'Не удалось отправить анкету. Проверьте интернет-соединение и попробуйте ещё раз или позвоните нам: +7 (995) 160-12-49.');
      });
  });

  homeBtn.addEventListener('click', function () {
    window.location.href = 'index.html';
  });

  privacyLink.addEventListener('click', function (e) {
    e.preventDefault();
    showSection(privacySection);
    pushView({ view: 'privacy' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  closePrivacyBtn.addEventListener('click', function () {
    if (history.state && history.state.view === 'privacy') {
      history.back();
    } else {
      showSection(wizard);
    }
  });

  /* ---------- Init ---------- */
  restoreProgress();
  updateProgress();
  updateLevelDetailsVisibility();

  /* After a page reload the browser keeps the history entry — reopen the same step */
  var initialState = history.state;
  if (initialState && initialState.view === 'step') {
    showSection(wizard);
    renderStep(Math.min(Math.max(1, initialState.step | 0), TOTAL_STEPS));
  } else if (initialState && initialState.view === 'privacy') {
    showSection(privacySection);
  } else if (/^#(step-\d|privacy|done)$/.test(window.location.hash)) {
    /* A bare hash without our state (e.g. a copied link) — start from the intro */
    try { history.replaceState(null, '', window.location.pathname + window.location.search); } catch (e) { /* noop */ }
  }
})();
