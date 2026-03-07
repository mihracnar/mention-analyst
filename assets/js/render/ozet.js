/* =====================================================
   render/ozet.js — Özet view
   Özet sheet CSV'sini okur, TF'i -1 kaydırarak
   ilgili dönemi gösterir.

   Sheet sütunları:
   A=Periyot  B=Kategori  C=Değer  D=Değişim
   E=Detay    F=AI Metni  G=Güncelleme

   Periyot formatları:
   - Günlük : "24.2.2026"
   - Haftalık: "23.2.2026 – 1.3.2026"
   - Aylık  : "Şubat 2026"
   ===================================================== */

var OZET_CSV_URL = "OZET_CSV_URL_BURAYA";

var _ozetData   = null;
var _ozetLoaded = false;

var _TR_AYLAR = [
  "Ocak","Şubat","Mart","Nisan","Mayıs","Haziran",
  "Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"
];

/* ── CSV yükle ve grupla ── */
function loadOzet(callback) {
  if (_ozetLoaded) { callback(_ozetData); return; }
  fetch(OZET_CSV_URL)
    .then(function(r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.text(); })
    .then(function(text) {
      var rows = parseCSV(text);
      if (rows.length < 2) { _ozetData = {}; _ozetLoaded = true; callback({}); return; }
      var grouped = {};
      for (var i = 1; i < rows.length; i++) {
        var r = rows[i];
        var periyot = (r[0] || "").trim();
        if (!periyot) continue;
        if (!grouped[periyot]) grouped[periyot] = [];
        grouped[periyot].push({
          kat:     (r[1] || "").trim(),
          deger:   (r[2] || "").trim(),
          degisim: (r[3] || "").trim(),
          detay:   (r[4] || "").trim(),
          ai:      (r[5] || "").trim()
        });
      }
      _ozetData   = grouped;
      _ozetLoaded = true;
      console.log("Özet yüklendi:", Object.keys(grouped).length, "periyot", Object.keys(grouped));
      callback(_ozetData);
    })
    .catch(function(err) {
      console.error("Özet yüklenemedi:", err);
      _ozetData   = {};
      _ozetLoaded = true;
      var el = document.getElementById("ozet-c");
      if (el) el.innerHTML = '<div class="oview"><div class="ozet-empty" style="color:var(--rd)">Veri yüklenemedi: ' + err.message + '</div></div>';
      callback({});
    });
}

/* ── TF'e göre hedef periyot (-1 kaydırma) ── */
function _hedefPeriyot(data) {
  var key = TF.key;
  var gunlukler = [], haftaliklar = [], ayliklar = [];

  Object.keys(data).forEach(function(p) {
    if (p.indexOf(" \u2013 ") >= 0 || p.indexOf(" - ") >= 0) {
      haftaliklar.push(p);
    } else if (_aylikMi(p)) {
      ayliklar.push(p);
    } else {
      var d = _parseTR(p);
      if (d) gunlukler.push({ str: p, date: d });
    }
  });

  gunlukler.sort(function(a,b)  { return b.date - a.date; });
  haftaliklar.sort(function(a,b){ return _haftalikSira(b) - _haftalikSira(a); });
  ayliklar.sort(function(a,b)   { return _aylikSira(b) - _aylikSira(a); });

  /* -1 mantığı */
  if (!key || key === "today" || key === "custom") return gunlukler[0] ? gunlukler[0].str : null;
  if (key === "yesterday")  return gunlukler[1] ? gunlukler[1].str : (gunlukler[0] ? gunlukler[0].str : null);
  if (key === "week")       return haftaliklar[0] || null;
  if (key === "lastweek")   return haftaliklar[1] || haftaliklar[0] || null;
  if (key === "month")      return ayliklar[0] || null;
  if (key === "lastmonth")  return ayliklar[1] || ayliklar[0] || null;
  return gunlukler[0] ? gunlukler[0].str : null;
}

/* ── Ana render ── */
function rOzet() {
  var el = document.getElementById("ozet-c");
  if (!el) return;
  el.innerHTML = '<div class="oview"><div class="ozet-loading">Yükleniyor\u2026</div></div>';
  loadOzet(function(data) { _rOzetIcerik(data); });
}

function _rOzetIcerik(data) {
  var el = document.getElementById("ozet-c");
  if (!el) return;
  var hedef = _hedefPeriyot(data);
  var cards = hedef ? (data[hedef] || []) : [];

  var periodHTML = _buildPeriodRow(data, hedef);

  if (cards.length === 0) {
    el.innerHTML = '<div class="oview">' + periodHTML
      + '<div class="ozet-empty">Bu d\u00f6nem i\u00e7in hen\u00fcz \u00f6zet \u00fcretilmedi.</div></div>';
    return;
  }

  el.innerHTML = '<div class="oview">' + periodHTML
    + '<div class="ozet-period-lbl">' + (hedef || "") + '</div>'
    + cards.map(function(c, i) { return _cardHTML(c, i); }).join("")
    + '</div>';
}

/* ── Period row ── */
function _buildPeriodRow(data, aktif) {
  var gunlukler = [], haftaliklar = [], ayliklar = [];
  Object.keys(data).forEach(function(p) {
    if (p.indexOf(" \u2013 ") >= 0 || p.indexOf(" - ") >= 0) {
      haftaliklar.push(p);
    } else if (_aylikMi(p)) {
      ayliklar.push(p);
    } else {
      var d = _parseTR(p);
      if (d) gunlukler.push({ str: p, date: d });
    }
  });
  gunlukler.sort(function(a,b)  { return b.date - a.date; });
  haftaliklar.sort(function(a,b){ return _haftalikSira(b) - _haftalikSira(a); });
  ayliklar.sort(function(a,b)   { return _aylikSira(b) - _aylikSira(a); });

  var tabs = [];
  if (gunlukler[0])   tabs.push({ key: gunlukler[0].str,   lbl: "Son G\u00fcn" });
  if (haftaliklar[0]) tabs.push({ key: haftaliklar[0],     lbl: "Son Hafta" });
  if (ayliklar[0])    tabs.push({ key: ayliklar[0],        lbl: "Son Ay" });
  if (!tabs.length) return "";

  return '<div class="period-row">'
    + tabs.map(function(t) {
        return '<div class="period-btn' + (t.key === aktif ? " on" : "") + '" data-ozet-p="' + t.key + '">' + t.lbl + '</div>';
      }).join("")
    + '</div>';
}

/* ── Period butonuna tıklama ── */
function setOzetPeriod(periyotStr) {
  if (!_ozetData) return;
  var cards = _ozetData[periyotStr] || [];
  document.querySelectorAll(".period-btn[data-ozet-p]").forEach(function(b) {
    b.classList.toggle("on", b.getAttribute("data-ozet-p") === periyotStr);
  });
  var lbl = document.querySelector(".ozet-period-lbl");
  if (lbl) lbl.textContent = periyotStr;
  var oview = document.querySelector(".oview");
  if (!oview) return;
  /* Mevcut kartları ve label'ı kaldır */
  oview.querySelectorAll(".icard, .ozet-period-lbl").forEach(function(n){ n.remove(); });
  oview.insertAdjacentHTML("beforeend",
    '<div class="ozet-period-lbl">' + periyotStr + '</div>'
    + cards.map(function(c, i){ return _cardHTML(c, i); }).join("")
  );
}

/* ── Kart HTML ── */
function _cardHTML(c, idx) {
  var type = _kartTipi(c.kat, c.degisim);
  var icon = _kartIcon(c.kat);
  var stats = [];
  if (c.deger)   stats.push({ lbl: c.deger,   cls: _statCls(c.deger) });
  if (c.degisim) stats.push({ lbl: c.degisim, cls: _deltaCls(c.degisim) });
  if (c.detay)   stats.push({ lbl: c.detay,   cls: "" });
  var statHTML = stats.map(function(s) {
    return '<span class="stat-pill ' + s.cls + '">' + s.lbl + '</span>';
  }).join("");

  return '<div class="icard ' + type + '" style="animation-delay:' + (idx * 0.07) + 's">'
    + '<div class="icard-icon">' + icon + '</div>'
    + '<div class="icard-body">'
    + '<div class="icard-cat">' + c.kat + '</div>'
    + (c.ai ? '<div class="icard-text">' + c.ai + '</div>' : '')
    + (statHTML ? '<div class="icard-stat">' + statHTML + '</div>' : '')
    + '</div></div>';
}

/* ── Yardımcılar ── */
function _parseTR(s) {
  var m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!m) return null;
  return new Date(+m[3], +m[2]-1, +m[1]);
}
function _aylikMi(s) {
  return _TR_AYLAR.some(function(ay){ return s.indexOf(ay) === 0; });
}
function _haftalikSira(s) {
  var ilk = s.split(/\s[–\-]\s/)[0];
  var d = _parseTR(ilk);
  return d ? d.getTime() : 0;
}
function _aylikSira(s) {
  for (var i = 0; i < _TR_AYLAR.length; i++) {
    if (s.indexOf(_TR_AYLAR[i]) === 0) {
      return (parseInt(s.replace(_TR_AYLAR[i], "").trim()) || 0) * 12 + i;
    }
  }
  return 0;
}
function _kartTipi(kat, degisim) {
  if (kat === "Dikkat Sinyali" || kat === "Duygu Uyarısı") return "negative";
  if (kat === "Duygu Durumu") return degisim && degisim.indexOf("-") === 0 ? "neutral" : "positive";
  if (kat === "Yeni Gündem" || kat === "Yeni Sesler" || kat === "Hızlı Yükselen") return "warning";
  if (kat === "Sessizleşen Sesler") return "neutral";
  return "trend";
}
function _kartIcon(kat) {
  var map = {
    "Genel Trend":"📈","Duygu Durumu":"💬","Duygu Uyarısı":"⚠️",
    "Dikkat Sinyali":"🚨","Baskın Tema":"🔑","Yeni Gündem":"🆕",
    "Öne Çıkan Ses":"👤","Yeni Sesler":"🌱","Sessizleşen Sesler":"🔇",
    "Hızlı Yükselen":"🚀","Platform Dağılımı":"📊"
  };
  return map[kat] || "📌";
}
function _statCls(deger) {
  if (deger.indexOf("Olumlu") >= 0) return "up";
  if (deger.indexOf("Olumsuz") >= 0) return "down";
  return "info";
}
function _deltaCls(delta) {
  if (!delta) return "";
  if (delta.charAt(0) === "+") return "up";
  if (delta.charAt(0) === "-") return "down";
  if (delta === "İlk dönem" || delta === "İlk kez") return "warn";
  return "";
}
function clearOzetCache() {
  _ozetData   = null;
  _ozetLoaded = false;
}