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
      /* The English text written in the HTML is the source of truth, so edits
         made directly in the page are never overwritten by the dictionary. */
      if (el.dataset.i18nEn === undefined) el.dataset.i18nEn = el.textContent;
      if (lang === "en") {
        if (el.textContent !== el.dataset.i18nEn) el.textContent = el.dataset.i18nEn;
      } else if (dict[key] !== undefined) {
        el.textContent = dict[key];
      }
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


  /* ---------------- Gallery: filters, show more, lightbox ---------------- */
  function initGallery() {
    var grid = document.getElementById("gallery");
    if (!grid) return;
    var items = Array.prototype.slice.call(grid.querySelectorAll(".gallery__item"));
    var moreBtn = document.getElementById("showMoreBtn");
    var moreWrap = moreBtn ? moreBtn.parentNode : null;
    var filterBtns = document.querySelectorAll("[data-filter]");
    var LIMIT = 12;
    var filter = "all";
    var expanded = false;

    function t(key, fallback) {
      var lang = document.documentElement.getAttribute("lang") || "en";
      var d = (typeof TRANSLATIONS !== "undefined" && TRANSLATIONS[lang]) || {};
      return d[key] !== undefined ? d[key] : fallback;
    }

    function matching() {
      return items.filter(function (it) { return filter === "all" || it.getAttribute("data-cat") === filter; });
    }

    function render() {
      var list = matching();
      items.forEach(function (it) { it.hidden = true; });
      list.forEach(function (it, i) { it.hidden = !(expanded || i < LIMIT); });
      if (moreWrap) moreWrap.hidden = list.length <= LIMIT;
      if (moreBtn) {
        var key = expanded ? "portfolio.less" : "portfolio.more";
        moreBtn.setAttribute("data-i18n", key);
        moreBtn.textContent = t(key, expanded ? "Show Fewer Photos" : "View More Photos");
      }
    }

    filterBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        filter = b.getAttribute("data-filter");
        expanded = false;
        filterBtns.forEach(function (x) {
          var on = x === b;
          x.classList.toggle("is-active", on);
          x.setAttribute("aria-pressed", on ? "true" : "false");
        });
        render();
      });
    });

    if (moreBtn) {
      moreBtn.addEventListener("click", function () {
        expanded = !expanded;
        render();
        if (!expanded) grid.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

    /* ---- Lightbox ---- */
    var lb = document.getElementById("lightbox");
    var lbImg = document.getElementById("lightboxImage");
    var lbCount = document.getElementById("lbCount");
    var lbDl = document.getElementById("downloadImage");
    var lbClose = document.getElementById("lbClose");
    var lbPrev = document.getElementById("lbPrev");
    var lbNext = document.getElementById("lbNext");
    var current = [];
    var pos = 0;
    var lastFocus = null;

    function srcOf(it) { return it.querySelector(".gallery__btn").getAttribute("data-full"); }

    function show(i) {
      pos = (i + current.length) % current.length;
      var src = srcOf(current[pos]);
      lbImg.src = src;
      lbImg.alt = current[pos].querySelector("img").alt || "";
      lbDl.href = src;
      lbDl.setAttribute("download", decodeURIComponent(src.split("/").pop()));
      lbCount.textContent = (pos + 1) + " / " + current.length;
      [pos + 1, pos - 1].forEach(function (n) {
        var im = new Image();
        im.src = srcOf(current[(n + current.length) % current.length]);
      });
    }

    function openLb(item) {
      current = items.filter(function (it) { return !it.hidden; });
      var i = current.indexOf(item);
      if (i < 0) return;
      lastFocus = document.activeElement;
      lb.hidden = false;
      lb.classList.add("is-open");
      document.body.classList.add("lb-lock");
      show(i);
      lbClose.focus();
    }

    function closeLb() {
      lb.classList.remove("is-open");
      lb.hidden = true;
      document.body.classList.remove("lb-lock");
      lbImg.removeAttribute("src");
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    grid.addEventListener("click", function (e) {
      var btn = e.target.closest(".gallery__btn");
      if (btn) openLb(btn.closest(".gallery__item"));
    });
    lbClose.addEventListener("click", closeLb);
    lbPrev.addEventListener("click", function () { show(pos - 1); });
    lbNext.addEventListener("click", function () { show(pos + 1); });
    lb.addEventListener("click", function (e) {
      if (e.target === lb || e.target.classList.contains("lb-stage")) closeLb();
    });
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("is-open")) return;
      if (e.key === "Escape") closeLb();
      else if (e.key === "ArrowLeft") show(pos - 1);
      else if (e.key === "ArrowRight") show(pos + 1);
    });

    var sx = 0, sy = 0;
    lb.addEventListener("touchstart", function (e) {
      sx = e.changedTouches[0].clientX; sy = e.changedTouches[0].clientY;
    }, { passive: true });
    lb.addEventListener("touchend", function (e) {
      var dx = e.changedTouches[0].clientX - sx;
      var dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) show(dx < 0 ? pos + 1 : pos - 1);
    }, { passive: true });

    /* keep the button label right when the language changes */
    document.querySelectorAll("[data-lang-select]").forEach(function (sel) {
      sel.addEventListener("change", function () { setTimeout(render, 0); });
    });

    render();
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
    initGallery();
    initYear();
    initDemoForms();
  });
})();
