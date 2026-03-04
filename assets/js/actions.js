/* =====================================================
   actions.js — all user-triggered state mutations
   ===================================================== */

/** Switch the sentiment tab and reset theme filters. */
function sTab(k) {
  S.tab = k;
  S.th  = {};
  rTabs();
  rBar();
  rFeed();
}

/** Toggle a single theme keyword on/off. */
function tTh(k) {
  S.th[k] = !S.th[k];
  rBar();
  rFeed();
}

/** Clear all active theme filters. */
function cTh() {
  S.th = {};
  rBar();
  rFeed();
}

/**
 * Jump to Mentions and pre-filter by sentiment.
 * @param {string} s — sentiment key ("P" | "N" | "NE")
 */
function goSent(s) {
  goView("mentions");
  sTab(s);
}

/**
 * Jump to Mentions, reset to "All" tab, and activate a single keyword filter.
 * @param {string} k — keyword string
 */
function goKw(k) {
  goView("mentions");
  S.tab    = "T";
  S.th     = {};
  S.th[k]  = true;
  rTabs();
  rBar();
  rFeed();
  window.scrollTo(0, 0);
}

/**
 * Jump to Mentions and pre-fill the search box with a @handle query.
 * @param {string} u — username / handle (without @)
 */
function goUser(u) {
  goView("mentions");
  var inp = document.getElementById("si");
  inp.value = "@" + u;
  S.q = "@" + u;
  document.getElementById("xb").style.display = "block";
  rFeed();
}

/**
 * Switch the top-level view.
 * @param {string} v — view name ("mentions" | "stats" | "network" | "info")
 */
function goView(v) {
  CV = v;
  var names = ["mentions", "stats", "network", "info"];
  names.forEach(function(n) {
    document.getElementById("view-" + n).classList.toggle("on", n === v);
    document.getElementById("nav-" + n).classList.toggle("on",  n === v);
  });
  if (v === "stats")   rStats();
  if (v === "network") rNetwork();
  if (v === "info")    rInfo();
}