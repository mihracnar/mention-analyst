/* =====================================================
   render/stats.js — renders the Statistics view
   ===================================================== */

function rStats() {
  var c   = counts();
  var tot = c.T || 1;
  function pct(n) { return Math.round(n / tot * 100); }

  /* ── keyword cloud ── */
  var kwc = {};
  D.forEach(function(t) {
    t.kw.split(",").forEach(function(k) {
      var kk = k.trim();
      if (kk) kwc[kk] = (kwc[kk] || 0) + 1;
    });
  });
  var kws = Object.keys(kwc).sort(function(a, b) { return kwc[b] - kwc[a]; });
  var mx  = kws.length ? kwc[kws[0]] : 1;

  var cloud = '<div class="kwcloud">';
  kws.forEach(function(k) {
    var r   = kwc[k] / mx;
    var cls = r >= .8 ? "lg" : r >= .5 ? "md" : "";
    cloud += '<div class="kwitem ' + cls + '" data-kw="' + k + '" style="cursor:pointer">'
      + k + ' <span style="color:var(--bl);font-size:11px">' + kwc[k] + "</span></div>";
  });
  cloud += "</div>";

  /* ── daily buckets for time series ── */
  var dayMap = {};
  D.forEach(function(t) {
    var d = new Date(t.dt);
    if (isNaN(d)) return;
    var key = d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
    if (!dayMap[key]) dayMap[key] = { P: 0, N: 0, NE: 0, total: 0 };
    dayMap[key][t.s]++;
    dayMap[key].total++;
  });
  var days = Object.keys(dayMap).sort();

  var groupMode = "day";
  if (days.length > 60)  groupMode = "week";
  if (days.length > 180) groupMode = "month";

  var buckets = {};
  days.forEach(function(dk) {
    var d = new Date(dk), bk;
    if (groupMode === "month") {
      bk = d.getFullYear() + "-" + pad(d.getMonth() + 1);
    } else if (groupMode === "week") {
      var dow = d.getDay() || 7;
      var mon = new Date(d);
      mon.setDate(d.getDate() - dow + 1);
      bk = mon.getFullYear() + "-" + pad(mon.getMonth() + 1) + "-" + pad(mon.getDate());
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
    if (groupMode === "month") {
      var p = k.split("-"); return MONTHS[parseInt(p[1]) - 1] + " " + p[0].slice(2);
    }
    var p = k.split("-"); return p[2] + "/" + p[1];
  }

  /* ── SVG stacked bar chart ── */
  var n    = bkeys.length || 1;
  var svgW = Math.max(600, n * 20);
  var svgH = 160, padL = 28, padR = 8, padT = 10, padB = 32;
  var cW = svgW - padL - padR, cH = svgH - padT - padB;
  var bw = Math.max(4, Math.floor(cW / n) - 2);
  var p  = [];
  p.push('<svg viewBox="0 0 ' + svgW + ' ' + svgH + '" preserveAspectRatio="none" style="width:100%;height:160px;display:block">');
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

  var gmodeLabel = groupMode === "month" ? "Aylık" : groupMode === "week" ? "Haftalık" : "Günlük";
  var spanLabel  = days.length > 0 ? fmtKey(bkeys[0]) + " – " + fmtKey(bkeys[bkeys.length - 1]) : "";

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
    + '    <span style="font-size:11px;font-weight:400;color:var(--tx2);margin-left:8px;background:var(--bg2);border:1px solid var(--bd);border-radius:8px;padding:2px 8px">' + gmodeLabel + "</span>"
    + (spanLabel ? '<span style="font-size:11px;font-weight:400;color:var(--tx2);margin-left:6px">' + spanLabel + "</span>" : "")
    + "  </div>"
    + '  <div class="chart-legend">'
    + '    <span><span class="legend-dot" style="background:#00ba7c"></span>Olumlu</span>'
    + '    <span><span class="legend-dot" style="background:#f4212e"></span>Olumsuz</span>'
    + '    <span><span class="legend-dot" style="background:#ffad1f"></span>Nötr</span>'
    + "  </div>"
    + '  <div class="chart-wrap">' + svgChart + "</div>"
    + '  <div class="chart-note">'
    + (days.length <= 1 ? "Zaman serisi için en az 2 günlük veri gerekli." : n + " " + gmodeLabel.toLowerCase() + " dönem · Çubuklar istiflenmiş duygu dağılımını gösterir")
    + "  </div>"
    + "</div>";
}