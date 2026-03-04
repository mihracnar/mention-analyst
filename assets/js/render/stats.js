/* =====================================================
   render/stats.js — Statistics view
   SC : persistent chart state (unit + date range)
   ===================================================== */

var SC = { unit: "day", from: "", to: "" };

function rStats() {
  var c   = counts();
  var tot = c.T || 1;
  function pct(n) { return Math.round(n / tot * 100); }

  /* ── helper ── */
  function toDateStr(d) {
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }

  /* ── date bounds from full dataset ── */
  var allTs = D.map(function(t) { var d = new Date(t.dt); return isNaN(d) ? null : d.getTime(); }).filter(Boolean);
  var minStr = allTs.length ? toDateStr(new Date(Math.min.apply(null, allTs))) : "";
  var maxStr = allTs.length ? toDateStr(new Date(Math.max.apply(null, allTs))) : "";

  /* ── keyword cloud (always full dataset) ── */
  var kwc = {};
  D.forEach(function(t) {
    t.kw.split(",").forEach(function(k) {
      var kk = k.trim();
      if (kk) kwc[kk] = (kwc[kk] || 0) + 1;
    });
  });
  var kws = Object.keys(kwc).sort(function(a, b) { return kwc[b] - kwc[a]; });
  var mx  = kws.length ? kwc[kws[0]] : 1;
  var cloud = '<div class="kwcloud-wrap"><div class="kwcloud">';
  kws.forEach(function(k) {
    var r   = kwc[k] / mx;
    var cls = r >= .8 ? "lg" : r >= .5 ? "md" : "";
    cloud += '<div class="kwitem ' + cls + '" data-kw="' + k + '" style="cursor:pointer">'
      + k + ' <span style="color:var(--bl);font-size:11px">' + kwc[k] + "</span></div>";
  });
  cloud += "</div></div>";

  /* ── filter dataset for time series by date range ── */
  var tsD = D.filter(function(t) {
    if (!SC.from && !SC.to) return true;
    var d = new Date(t.dt);
    if (isNaN(d)) return true;
    var ds = toDateStr(d);
    if (SC.from && ds < SC.from) return false;
    if (SC.to   && ds > SC.to)   return false;
    return true;
  });

  /* ── daily buckets ── */
  var dayMap = {};
  tsD.forEach(function(t) {
    var d = new Date(t.dt);
    if (isNaN(d)) return;
    var key = toDateStr(d);
    if (!dayMap[key]) dayMap[key] = { P: 0, N: 0, NE: 0, total: 0 };
    dayMap[key][t.s]++;
    dayMap[key].total++;
  });
  var days  = Object.keys(dayMap).sort();
  var gMode = SC.unit; /* gün / hafta / ay — user-chosen, no auto */

  /* ── aggregate into chosen buckets ── */
  var buckets = {};
  days.forEach(function(dk) {
    var d = new Date(dk), bk;
    if (gMode === "month") {
      bk = d.getFullYear() + "-" + pad(d.getMonth() + 1);
    } else if (gMode === "week") {
      var dow = d.getDay() || 7;
      var mon = new Date(d);
      mon.setDate(d.getDate() - dow + 1);
      bk = toDateStr(mon);
    } else {
      bk = dk;
    }
    if (!buckets[bk]) buckets[bk] = { P: 0, N: 0, NE: 0, total: 0 };
    buckets[bk].P     += dayMap[dk].P;
    buckets[bk].N     += dayMap[dk].N;
    buckets[bk].NE    += dayMap[dk].NE;
    buckets[bk].total += dayMap[dk].total;
  });

  var bkeys = Object.keys(buckets).sort();
  var bmax  = 0;
  bkeys.forEach(function(k) { if (buckets[k].total > bmax) bmax = buckets[k].total; });
  bmax = bmax || 1;

  var MONTHS = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
  function fmtKey(k) {
    if (gMode === "month") {
      var p = k.split("-"); return MONTHS[parseInt(p[1]) - 1] + " " + p[0].slice(2);
    }
    var p = k.split("-"); return p[2] + "/" + p[1];
  }

  /* ── SVG stacked bar chart ── */
  var n    = bkeys.length || 1;
  var svgW = Math.max(600, n * 20);
  var svgH = 160, padL = 28, padR = 8, padT = 10, padB = 32;
  var cW   = svgW - padL - padR, cH = svgH - padT - padB;
  var bw   = Math.max(4, Math.floor(cW / n) - 2);
  var p    = ['<svg viewBox="0 0 ' + svgW + " " + svgH + '" preserveAspectRatio="none" style="width:100%;height:160px;display:block">'];
  for (var gi = 0; gi <= 4; gi++) {
    var gy = padT + cH - Math.round(gi / 4 * cH);
    var gv = Math.round(gi / 4 * bmax);
    p.push('<line x1="' + padL + '" y1="' + gy + '" x2="' + (svgW - padR) + '" y2="' + gy + '" stroke="#2f3336" stroke-width="1"/>');
    p.push('<text x="' + (padL - 3) + '" y="' + (gy + 4) + '" fill="#71767b" font-size="9" text-anchor="end">' + gv + "</text>");
  }
  bkeys.forEach(function(k, i) {
    var bk   = buckets[k];
    var bx   = padL + Math.round(i * cW / n) + 1;
    var stk  = [{ v: bk.P, col: "#00ba7c" }, { v: bk.N, col: "#f4212e" }, { v: bk.NE, col: "#ffad1f" }];
    var yOff = padT + cH;
    stk.forEach(function(s) {
      var sh = Math.round((s.v / bmax) * cH);
      if (sh < 1 && s.v > 0) sh = 1;
      yOff -= sh;
      if (sh > 0) p.push('<rect x="' + bx + '" y="' + yOff + '" width="' + bw + '" height="' + sh + '" fill="' + s.col + '" opacity="0.85"/>');
    });
    var step = Math.max(1, Math.ceil(n / 12));
    if (i % step === 0) {
      var lbl = fmtKey(k), lx = bx + Math.round(bw / 2);
      p.push('<text x="' + lx + '" y="' + (svgH - 8) + '" fill="#71767b" font-size="9" text-anchor="middle" transform="rotate(-35,' + lx + "," + (svgH - 8) + ')">' + lbl + "</text>");
    }
  });
  p.push("</svg>");
  var svgChart = p.join("");

  /* ── unit buttons ── */
  var unitBtns = [["day","Gün"],["week","Hafta"],["month","Ay"]].map(function(u) {
    return '<button class="chart-unit-btn' + (SC.unit === u[0] ? " on" : "") + '" data-unit="' + u[0] + '">' + u[1] + "</button>";
  }).join("");

  /* ── date range controls ── */
  var hasFilter = SC.from || SC.to;
  var dateCtrl = '<div class="chart-date-range">'
    + '<input type="date" id="chart-from" value="' + (SC.from || "") + '" min="' + minStr + '" max="' + maxStr + '">'
    + '<span class="chart-date-sep">—</span>'
    + '<input type="date" id="chart-to"   value="' + (SC.to   || "") + '" min="' + minStr + '" max="' + maxStr + '">'
    + (hasFilter ? '<button class="chart-reset-btn" id="chart-reset">Tümü</button>' : "")
    + "</div>";

  var controls = '<div class="chart-controls">'
    + '<div class="chart-unit-btns">' + unitBtns + "</div>"
    + dateCtrl
    + "</div>";

  var spanNote = days.length > 0
    ? (SC.from || SC.to
        ? (SC.from || "…") + " – " + (SC.to || "…")
        : fmtKey(bkeys[0]) + " – " + fmtKey(bkeys[bkeys.length - 1]))
    : "";

  /* ── assemble HTML ── */
  document.getElementById("stats-c").innerHTML = ""
    + '<div class="sec-title">Genel İstatistikler</div>'
    + '<div class="sgrid">'
    + '  <div class="sbox"><div class="sbox-n" style="color:var(--bl)">' + c.T + '</div><div class="sbox-l">Toplam Mention</div></div>'
    + '  <div class="sbox"><div class="sbox-n" style="color:var(--gr)">' + c.P + '</div><div class="sbox-l">Olumlu</div></div>'
    + '  <div class="sbox"><div class="sbox-n" style="color:var(--rd)">' + c.N + '</div><div class="sbox-l">Olumsuz</div></div>'
    + '  <div class="sbox"><div class="sbox-n" style="color:var(--am)">' + c.NE + '</div><div class="sbox-l">Nötr</div></div>'
    + "</div>"
    + "<div>"
    + '  <div class="sec-title">Duygu Dağılımı</div>'
    + '  <div style="margin-top:12px">'
    + '    <div class="brow"><span class="blab">Olumlu</span><div class="btrk"><div class="bfil" style="width:' + pct(c.P) + '%;background:var(--gr)"></div></div><span class="bval">%' + pct(c.P) + "</span></div>"
    + '    <div class="brow"><span class="blab">Olumsuz</span><div class="btrk"><div class="bfil" style="width:' + pct(c.N) + '%;background:var(--rd)"></div></div><span class="bval">%' + pct(c.N) + "</span></div>"
    + '    <div class="brow"><span class="blab">Nötr</span><div class="btrk"><div class="bfil" style="width:' + pct(c.NE) + '%;background:var(--am)"></div></div><span class="bval">%' + pct(c.NE) + "</span></div>"
    + "  </div>"
    + "</div>"
    + "<div>"
    + '  <div class="sec-title">Keyword Bulutu</div>'
    + cloud
    + "</div>"
    + "<div>"
    + '  <div class="sec-title">Mention Zaman Serisi'
    + (spanNote ? '<span style="font-size:11px;font-weight:400;color:var(--tx2);margin-left:8px">' + spanNote + "</span>" : "")
    + "  </div>"
    + controls
    + '  <div class="chart-legend">'
    + '    <span><span class="legend-dot" style="background:#00ba7c"></span>Olumlu</span>'
    + '    <span><span class="legend-dot" style="background:#f4212e"></span>Olumsuz</span>'
    + '    <span><span class="legend-dot" style="background:#ffad1f"></span>Nötr</span>'
    + "  </div>"
    + '  <div class="chart-wrap">' + svgChart + "</div>"
    + '  <div class="chart-note">'
    + (tsD.length < 2 ? "Seçilen aralıkta yeterli veri yok." : n + " " + (gMode==="month"?"aylık":gMode==="week"?"haftalık":"günlük") + " dönem")
    + "  </div>"
    + "</div>";

  /* ── bind controls ── */
  document.querySelectorAll(".chart-unit-btn").forEach(function(btn) {
    btn.addEventListener("click", function() { SC.unit = this.getAttribute("data-unit"); rStats(); });
  });
  var fi = document.getElementById("chart-from");
  var ti = document.getElementById("chart-to");
  var rb = document.getElementById("chart-reset");
  if (fi) fi.addEventListener("change", function() { SC.from = this.value; rStats(); });
  if (ti) ti.addEventListener("change", function() { SC.to   = this.value; rStats(); });
  if (rb) rb.addEventListener("click",  function() { SC.from = ""; SC.to = ""; rStats(); });
}