/* =====================================================
   data.js — loads D[] from Google Sheets CSV
   ===================================================== */

var D = [];
var DATA_LOADED = false;

var SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR6P6W-kknhNa7CSvbRJZJMssYtw6serLjumcX-K1DQ6Pn-wr5lOuqDyzjQqQtb9Sf6W1xXcQAAK1S0/pub?gid=1495608512&single=true&output=csv";

/**
 * Parse raw CSV text into an array of row arrays.
 * Handles quoted fields with commas and newlines.
 */
function parseCSV(text) {
  var rows = [], row = [], field = "", inQ = false;
  for (var i = 0; i < text.length; i++) {
    var c = text[i];
    if (inQ) {
      if (c === '"' && text[i+1] === '"') { field += '"'; i++; }
      else if (c === '"') { inQ = false; }
      else { field += c; }
    } else {
      if (c === '"') { inQ = true; }
      else if (c === ',') { row.push(field); field = ""; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ""; }
      else if (c === '\r') { /* skip */ }
      else { field += c; }
    }
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

/**
 * Derive platform code from tweet link.
 * X/Twitter → "X", Instagram → "IG", YouTube → "YT"
 */
function _pl(link) {
  if (!link) return "X";
  var l = link.toLowerCase();
  if (l.indexOf("instagram") >= 0) return "IG";
  if (l.indexOf("youtube") >= 0 || l.indexOf("youtu.be") >= 0) return "YT";
  return "X";
}

/**
 * Map Turkish sentiment label to code.
 * Olumlu → P, Olumsuz → N, Nötr/Notr → NE
 */
function _s(val) {
  if (!val) return "NE";
  var v = val.trim().toLowerCase();
  if (v === "olumlu")          return "P";
  if (v === "olumsuz")         return "N";
  return "NE";
}

/**
 * Fetch CSV from Google Sheets, parse, populate D[].
 * Calls callback() when done (or on error with empty D).
 */
function loadData(callback) {
  fetch(SHEET_CSV_URL)
    .then(function(r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.text();
    })
    .then(function(text) {
      var rows = parseCSV(text);
      if (rows.length < 2) { callback(); return; }
      /* skip header row (index 0) */
      var out = [];
      for (var i = 1; i < rows.length; i++) {
        var r = rows[i];
        /* skip empty rows */
        if (!r[0] && !r[6]) continue;
        /*
          A(0)=Tweet ID, B(1)=Yanıtlanan Tweet ID, C(2)=Yanıtlanan Tweet Metni
          D(3)=Tarih,    E(4)=Kullanıcı Adı,       F(5)=Ad Soyad
          G(6)=Tweet İçeriği, H(7)=Tweet Linki,    I(8)=Eklenme Tarihi
          J(9)=Etiket,   K(10)=Tweet Duygusu,      L(11)=Keyword
        */
        out.push({
          id:  (r[0]  || "").trim(),
          rt:  (r[1]  || "").trim(),   /* yanıtlanan tweet id */
          rtt: (r[2]  || "").trim(),   /* yanıtlanan tweet metni */
          dt:  (r[3]  || "").trim(),
          u:   (r[4]  || "").trim().replace(/^@/, ""),
          nm:  (r[5]  || "").trim(),
          bd:  (r[6]  || "").trim(),
          lk:  (r[7]  || "").trim(),
          pl:  _pl(r[7]),
          tag: (r[9]  || "").trim(),
          s:   _s(r[10]),
          kw:  (r[11] || "").trim()
        });
      }
      /* emoji, mention, noktalama temizlenince 5 kelime altındakileri ele */
      function _hasEnoughWords(text) {
        var clean = text
          .replace(/@\w+/g, "")                          /* @mention */
          .replace(/https?:\/\/\S+/g, "")               /* URL */
          .replace(/[\u{1F000}-\u{1FFFF}]/gu, "")       /* emoji (geniş) */
          .replace(/[\u2600-\u27BF]/g, "")              /* misc semboller */
          .replace(/[#.,!?;:'"(){}\[\]\/\\|<>@~`^*%$&=+\-_]/g, " ")
          .trim();
        var words = clean.split(/\s+/).filter(function(w) { return w.length > 0; });
        return words.length >= 5;
      }

      D = out.filter(function(t) {
        return t.tag !== "Toplu Etiket" && _hasEnoughWords(t.bd);
      }).sort(function(a, b) {
        return new Date(b.dt) - new Date(a.dt);
      });
      DATA_LOADED = true;
      callback();
    })
    .catch(function(err) {
      console.error("Veri yüklenemedi:", err);
      DATA_LOADED = false;
      callback();
    });
}