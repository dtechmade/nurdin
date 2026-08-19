/* =========================================================
   main.js — shared behaviour for every page
   - Dark mode toggle (persisted in localStorage)
   - Language switcher (persisted in localStorage, uses data-i18n)
   - Side drawer navigation
   - Home hero image slider
   - Active nav link + footer year
   ========================================================= */

(function () {
  "use strict";

  var STORAGE_THEME = "nah_theme";
  var STORAGE_LANG = "nah_lang";
  var DEFAULT_LANG = "en";

  /* ---------------- Theme (dark / light) ---------------- */
  function getPreferredTheme() {
    var saved = localStorage.getItem(STORAGE_THEME);
    if (saved === "dark" || saved === "light") return saved;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function applyTheme(theme) {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.setAttribute("data-theme", theme);
    var btns = document.querySelectorAll("[data-theme-toggle]");
    btns.forEach(function (b) { b.setAttribute("aria-pressed", theme === "dark" ? "true" : "false"); });
  }

  function initTheme() {
    applyTheme(getPreferredTheme());
    document.querySelectorAll("[data-theme-toggle]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var next = document.documentElement.classList.contains("dark") ? "light" : "dark";
        localStorage.setItem(STORAGE_THEME, next);
        applyTheme(next);
      });
    });
  }

  /* ---------------- Language switcher ---------------- */
  function getPreferredLang() {
    return localStorage.getItem(STORAGE_LANG) || DEFAULT_LANG;
  }

  function applyLang(lang) {
    if (typeof TRANSLATIONS === "undefined" || !TRANSLATIONS[lang]) lang = DEFAULT_LANG;
    var dict = TRANSLATIONS[lang];
    document.documentElement.setAttribute("lang", lang);

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      if (dict[key] !== undefined) el.textContent = dict[key];
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-placeholder");
      if (dict[key] !== undefined) el.setAttribute("placeholder", dict[key]);
    });

    document.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-aria");
      if (dict[key] !== undefined) el.setAttribute("aria-label", dict[key]);
    });

    document.querySelectorAll("[data-lang-select]").forEach(function (sel) {
      sel.value = lang;
    });
  }

  function initLang() {
    applyLang(getPreferredLang());
    document.querySelectorAll("[data-lang-select]").forEach(function (sel) {
      sel.addEventListener("change", function () {
        localStorage.setItem(STORAGE_LANG, sel.value);
        applyLang(sel.value);
      });
    });
  }

  /* ---------------- Side drawer nav ---------------- */
  function initDrawer() {
    var drawer = document.querySelector("[data-drawer]");
    var overlay = document.querySelector("[data-overlay]");
    var openBtns = document.querySelectorAll("[data-drawer-open]");
    var closeBtns = document.querySelectorAll("[data-drawer-close]");
    if (!drawer || !overlay) return;

    function open() {
      drawer.classList.add("is-open");
      overlay.classList.add("is-open");
      document.body.style.overflow = "hidden";
    }
    function close() {
      drawer.classList.remove("is-open");
      overlay.classList.remove("is-open");
      document.body.style.overflow = "";
    }
    openBtns.forEach(function (b) { b.addEventListener("click", open); });
    closeBtns.forEach(function (b) { b.addEventListener("click", close); });
    overlay.addEventListener("click", close);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
    });
    drawer.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", close);
    });
  }

  /* ---------------- Active nav highlighting ---------------- */
  function initActiveNav() {
    var page = document.body.getAttribute("data-page");
    if (!page) return;
    document.querySelectorAll("[data-nav-link]").forEach(function (a) {
      if (a.getAttribute("data-nav-link") === page) {
        a.classList.add("active");
        a.setAttribute("aria-current", "page");
      }
    });
  }

  /* ---------------- Home hero slider ---------------- */
  function initSlider() {
    var slider = document.querySelector("[data-slider]");
    if (!slider) return;
    var slides = Array.prototype.slice.call(slider.querySelectorAll(".hero__slide"));
    var dotsWrap = document.querySelector("[data-slider-dots]");
    var idx = 0;
    var timer;

    if (dotsWrap) {
      slides.forEach(function (_, i) {
        var dot = document.createElement("button");
        dot.type = "button";
        dot.setAttribute("aria-label", "Slide " + (i + 1));
        if (i === 0) dot.classList.add("is-active");
        dot.addEventListener("click", function () { goTo(i); restart(); });
        dotsWrap.appendChild(dot);
      });
    }

    function render() {
      slides.forEach(function (s, i) { s.classList.toggle("is-active", i === idx); });
      if (dotsWrap) {
        Array.prototype.forEach.call(dotsWrap.children, function (d, i) {
          d.classList.toggle("is-active", i === idx);
        });
      }
    }
    function goTo(i) { idx = (i + slides.length) % slides.length; render(); }
    function next() { goTo(idx + 1); }
    function prev() { goTo(idx - 1); }
    function restart() {
      clearInterval(timer);
      timer = setInterval(next, 5500);
    }

    var nextBtn = document.querySelector("[data-slider-next]");
    var prevBtn = document.querySelector("[data-slider-prev]");
    if (nextBtn) nextBtn.addEventListener("click", function () { next(); restart(); });
    if (prevBtn) prevBtn.addEventListener("click", function () { prev(); restart(); });

    render();
    restart();
  }

  /* ---------------- Footer year ---------------- */
  function initYear() {
    document.querySelectorAll("[data-year]").forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  }

  /* ---------------- Contact / prayer form demo submit ---------------- */
  function initDemoForms() {
    document.querySelectorAll("[data-demo-form]").forEach(function (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var note = form.querySelector("[data-form-success]");
        if (note) {
          note.hidden = false;
          setTimeout(function () { note.hidden = true; }, 5000);
        }
        form.reset();
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initTheme();
    initLang();
    initDrawer();
    initActiveNav();
    initSlider();
    initYear();
    initDemoForms();
  });
})();
