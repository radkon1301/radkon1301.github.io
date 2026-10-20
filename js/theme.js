// js/theme.js — light/dark theme. Loaded in <head> on every page so the saved choice is applied before first paint.
// No saved choice => follow the OS (shared.css handles that with prefers-color-scheme). Choosing with the toggle
// stores 'light' or 'dark' in localStorage under me_theme and sets <html data-theme>.
(function () {
  var KEY = 'me_theme', root = document.documentElement;
  function stored() { try { var v = localStorage.getItem(KEY); return v === 'dark' || v === 'light' ? v : null; } catch (e) { return null; } }
  function systemDark() { return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches); }
  function effective() { return stored() || (systemDark() ? 'dark' : 'light'); }
  var saved = stored();
  if (saved) root.setAttribute('data-theme', saved);

  function sync() {
    var dark = effective() === 'dark';
    var btns = document.querySelectorAll('[data-theme-toggle]');
    for (var i = 0; i < btns.length; i++) {
      btns[i].setAttribute('aria-pressed', dark ? 'true' : 'false');
      var icon = btns[i].querySelector('.theme-icon');
      if (icon) icon.textContent = dark ? '\u2600' : '\u263E';          // ☀ / ☾
    }
  }
  function toggle() {
    var next = effective() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem(KEY, next); } catch (e) {}
    sync();
  }
  document.addEventListener('DOMContentLoaded', function () {
    var btns = document.querySelectorAll('[data-theme-toggle]');
    for (var i = 0; i < btns.length; i++) btns[i].addEventListener('click', toggle);
    sync();
  });
  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    if (mq.addEventListener) mq.addEventListener('change', sync);
  }
  window.MEtheme = { toggle: toggle, effective: effective };
})();
