/* =====================================================
   utils.js — pure, stateless helper functions
   ===================================================== */

/**
 * Formats a date string into a short relative or absolute label (Turkish).
 * @param {string} s — date string (e.g. Twitter date format)
 * @returns {string}
 */
function fd(s) {
  var d = new Date(s);
  if (isNaN(d)) return s;
  var diff = (Date.now() - d) / 1000;
  if (diff < 60)    return Math.floor(diff) + "s";
  if (diff < 3600)  return Math.floor(diff / 60) + "dk";
  if (diff < 86400) return Math.floor(diff / 3600) + "sa";
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "short" });
}

/**
 * Returns a deterministic HSL background colour for a username.
 * @param {string} u — username / handle
 * @returns {string} CSS colour
 */
function ac(u) {
  var h = 0;
  for (var i = 0; i < u.length; i++) h = (h + u.charCodeAt(i)) % 360;
  return "hsl(" + h + ",50%,35%)";
}

/**
 * Creates 1–2 character initials from a display name.
 * @param {string} n — display name
 * @returns {string}
 */
function ini(n) {
  return n.split(" ")
    .map(function(w) { return w[0] || ""; })
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/**
 * Returns the subset of D that matches the current sentiment tab.
 * @returns {Array}
 */
function pool() {
  return S.tab === "T" ? D : D.filter(function(t) { return t.s === S.tab; });
}

/**
 * Returns a sorted, de-duplicated list of all keywords in a tweet array.
 * @param {Array} p — tweet array
 * @returns {string[]}
 */
function allK(p) {
  var counts = {};
  p.forEach(function(t) {
    t.kw.split(",").forEach(function(k) {
      var kk = k.trim().toLocaleLowerCase("tr");
      if (kk) counts[kk] = (counts[kk] || 0) + 1;
    });
  });
  return Object.keys(counts).sort(function(a, b) {
    var diff = counts[b] - counts[a];
    return diff !== 0 ? diff : a.localeCompare(b, "tr");
  });
}

/* İlk harfi büyük, geri kalanı küçük (Türkçe uyumlu) */
function proper(s) {
  if (!s) return s;
  return s.charAt(0).toLocaleUpperCase("tr") + s.slice(1).toLocaleLowerCase("tr");
}

/**
 * Returns tweets that pass the current state filters (tab + themes + search).
 * @returns {Array}
 */
function _kwMatch(kwStr, k) {
  var needle = k.toLocaleLowerCase("tr");
  return kwStr.split(",").some(function(w) {
    return w.trim().toLocaleLowerCase("tr") === needle;
  });
}

function gL() {
  var q  = S.q.toLowerCase().trim();
  var at = Object.keys(S.th).filter(function(k) { return S.th[k]; });
  return pool().filter(function(t) {
    var mq = !q || (t.bd + t.kw + t.nm + " @" + t.u).toLowerCase().indexOf(q) >= 0;
    var mt = at.length === 0 || at.some(function(k) { return _kwMatch(t.kw, k); });
    return mq && mt && tfMatch(t);
  });
}

function counts() {
  var q  = S.q.toLowerCase().trim();
  var at = Object.keys(S.th).filter(function(k) { return S.th[k]; });
  var c  = { T: 0, P: 0, N: 0, NE: 0 };
  D.forEach(function(t) {
    var mq = !q || (t.bd + t.kw + t.nm + " @" + t.u).toLowerCase().indexOf(q) >= 0;
    var mt = at.length === 0 || at.some(function(k) { return _kwMatch(t.kw, k); });
    if (mq && mt && tfMatch(t)) {
      c.T++;
      if (c[t.s] !== undefined) c[t.s]++;
    }
  });
  return c;
}

/**
 * Pads a number to a given length with leading zeros.
 * Used when building ISO-style date keys.
 * @param {number|string} n
 * @param {number}        len
 * @returns {string}
 */
function pad(n, len) {
  return String(n).padStart(len || 2, "0");
}