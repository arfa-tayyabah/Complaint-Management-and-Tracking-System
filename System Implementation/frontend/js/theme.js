/* ============================================================
   CMTS — Theme controller (additive: dark mode + login polish)
   Does NOT change any application workflow, routing or data.
   ============================================================ */
(function () {
  var KEY = "cmts_theme_v1";
  var root = document.documentElement;

  function preferred() {
    try {
      var saved = localStorage.getItem(KEY);
      if (saved) return saved;
    } catch (e) {}
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function apply(theme) {
    root.setAttribute("data-theme", theme);
    try { localStorage.setItem(KEY, theme); } catch (e) {}
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#0b1411" : "#0D7A43");
    updateButtons(theme);
  }

  var SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ic"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>';
  var MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ic"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';

  function updateButtons(theme) {
    var glyph = theme === "dark" ? SUN : MOON;
    ["theme-toggle", "theme-toggle-login"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.innerHTML = glyph;
    });
  }

  function toggle() {
    var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    apply(next);
  }

  // Apply ASAP to avoid flash
  apply(preferred());

  document.addEventListener("DOMContentLoaded", function () {
    var loginScreen = document.getElementById("login-screen");
    var savedTheme = preferred();
    if (loginScreen) {
      loginScreen.setAttribute("data-theme", savedTheme);
    }

    updateButtons(root.getAttribute("data-theme"));

    // App shell theme toggle
    var appToggle = document.getElementById("theme-toggle");
    if (appToggle) {
      appToggle.addEventListener("click", toggle);
    }

    // Login screen theme toggle — updates root theme (form card uses CSS vars from root)
    // Background/overlay are hardcoded colors so they are unaffected by root theme changes
    var loginToggle = document.getElementById("theme-toggle-login");
    if (loginToggle) {
      var currentLoginTheme = loginScreen ? loginScreen.getAttribute("data-theme") : savedTheme;
      loginToggle.innerHTML = currentLoginTheme === "dark" ? SUN : MOON;

      loginToggle.addEventListener("click", function () {
        var currentTheme = root.getAttribute("data-theme");
        var next = currentTheme === "dark" ? "light" : "dark";
        apply(next); // sets root data-theme + updates localStorage + updates all toggle icons
        if (loginScreen) {
          loginScreen.setAttribute("data-theme", next);
        }
      });
    }

    // Login crest mark (decorative)
    var mark = document.getElementById("login-mark");
    if (mark && typeof icon === "function") {
      if (!mark.querySelector("img")) {
        mark.innerHTML = icon("shieldCheck");
      }
    }

    var forgot = document.getElementById("forgot-link");
    if (forgot) forgot.addEventListener("click", function (e) {
      e.preventDefault();
      if (typeof toast === "function") toast("Password reset", "Contact the Software Operator to reset your university password.", "success");
    });
  });
})();
