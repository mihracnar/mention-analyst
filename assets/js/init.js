/* =====================================================
   init.js — DOMContentLoaded bootstrap
   Depends on: config.js · state.js · utils.js ·
               render/feed.js · render/stats.js ·
               render/network.js · render/info.js ·
               actions.js
   ===================================================== */

document.addEventListener("DOMContentLoaded", function() {

  /* ── populate top badge ── */
  rBadge();

  /* ── search input & clear button ── */
  var inp = document.getElementById("si");
  var xb  = document.getElementById("xb");

  inp.addEventListener("input", function() {
    S.q = inp.value;
    xb.style.display = inp.value ? "block" : "none";
    rFeed();
  });

  xb.addEventListener("click", function() {
    inp.value          = "";
    S.q                = "";
    xb.style.display   = "none";
    rFeed();
  });

  /* ── initial render ── */
  rTabs();
  rBar();
  rFeed();

  /* ── global event delegation ──
     All interactive dynamic elements use data-* attributes so
     a single listener covers the whole document efficiently.     */
  document.addEventListener("click", function(e) {
    var el;

    /* sentiment tab */
    if ((el = e.target.closest("[data-tab]"))) {
      sTab(el.getAttribute("data-tab"));
      return;
    }

    /* theme pill */
    if ((el = e.target.closest("[data-th]"))) {
      tTh(el.getAttribute("data-th"));
      return;
    }

    /* keyword tag (in feed cards) or keyword cloud item (in stats) */
    if ((el = e.target.closest("[data-kw]"))) {
      goKw(el.getAttribute("data-kw"));
      return;
    }

    /* user row (in network) */
    if ((el = e.target.closest("[data-user]"))) {
      goUser(el.getAttribute("data-user"));
      return;
    }
  });
});