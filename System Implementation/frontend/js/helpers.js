/* ============================================================
   CMTS — helpers.js
   Offline banner detection only.
   All icons, utilities, toast, badges are in icons.js (loaded after).
   ============================================================ */

window.addEventListener('offline', () => {
  const b = document.getElementById('net-banner');
  if (b) { b.style.display = ''; b.classList.add('show'); }
});
window.addEventListener('online', () => {
  const b = document.getElementById('net-banner');
  if (b) b.classList.remove('show');
});
