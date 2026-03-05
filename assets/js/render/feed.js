/* =====================================================
   render/feed.js — renders the Mentions feed
   ===================================================== */

/* Platform icon + label helpers */
function _platformBtn(pl) {
  if (pl === "IG") {
    return {
      text: "Instagram'da Gör",
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">'
        + '<rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>'
        + '<path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>'
        + '<line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>'
    };
  }
  if (pl === "YT") {
    return {
      text: "YouTube'da İzle",
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">'
        + '<path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46'
        + 'a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33'
        + 'A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46'
        + 'a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>'
        + '<polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>'
    };
  }
  /* default: X / Twitter */
  return {
    text: "X'te Göster",
    icon: '<svg viewBox="0 0 24 24" fill="currentColor">'
      + '<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231'
      + '-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.258 5.63zm-1.161 17.52'
      + 'h1.833L7.084 4.126H5.117z"/></svg>'
  };
}

function rTabs() {
  var c  = counts();
  var tl = ["T", "P", "N", "NE"];
  document.getElementById("tabbar").innerHTML = tl.map(function(k) {
    var f = CF[k], a = S.tab === k;
    return '<div class="titem' + (a ? " on" : "") + '" data-tab="' + k + '"'
      + (a ? ' style="color:' + f.c + '"' : "")
      + ">" + f.l + '<span class="tcnt">' + c[k] + "</span></div>";
  }).join("");
}

function rBar() {
  var bar  = document.getElementById("thbar");
  var clrW = document.getElementById("thbar-clr-wrap");
  /* keywords from tweets matching search + time filter (tab & themes ignored) */
  var q    = S.q.toLowerCase().trim();
  var base = D.filter(function(t) {
    var ms = S.tab === "T" || t.s === S.tab;
    var mq = !q || (t.bd + t.kw + t.nm + " @" + t.u).toLowerCase().indexOf(q) >= 0;
    return ms && mq && tfMatch(t);
  });
  var ks   = allK(base);
  var at   = Object.keys(S.th).filter(function(k) { return S.th[k]; });

  if (!ks.length) { bar.innerHTML = ""; clrW.classList.remove("visible"); return; }

  var h = '<span class="thlbl">Tema</span>';
  ks.forEach(function(k) {
    h += '<div class="thpill' + (S.th[k] ? " on" : "") + '" data-th="' + k + '">' + k + "</div>";
  });
  bar.innerHTML = h;
  clrW.classList.toggle("visible", at.length > 0);
}

function rFeed() {
  var data = gL();
  var at   = Object.keys(S.th).filter(function(k) { return S.th[k]; });
  document.getElementById("ri").textContent =
    (S.q || at.length) ? data.length + " sonuç bulundu" : "";

  var el = document.getElementById("feed");

  if (!data.length) {
    el.innerHTML = '<div class="empty">'
      + '<div class="ei">🔍</div>'
      + '<div class="et">İçerik bulunamadı</div>'
      + '<div class="es">Arama veya filtre kriterini değiştirin</div>'
      + "</div>";
    return;
  }

  var out = "";
  data.forEach(function(t, i) {
    var f   = CF[t.s] || CF.NE;
    var btn = _platformBtn(t.pl);

    var kts = t.kw.split(",").map(function(k) {
      var ck = k.trim();
      return '<span class="ktag' + (S.th[ck] ? " hl" : "") + '" data-kw="' + ck + '" style="cursor:pointer">' + ck + "</span>";
    }).join("");

    var rep = t.rt
      ? '<div class="trep"><small style="color:var(--bl);font-weight:700;margin-right:5px">'
        + t.pl + ":</small> " + t.rt + "</div>"
      : "";

    out += '<div class="tcard" style="animation-delay:' + (i * 0.04) + 's">'
      + '<div class="tavcol">'
      + '  <div class="tav" style="background:' + ac(t.u) + ';cursor:pointer" data-user="' + t.u + '">' + ini(t.nm) + "</div>"
      + (t.rt ? '<div class="tline"></div>' : "")
      + "</div>"
      + '<div class="tright">'
      + '  <div class="thead">'
      + '    <span class="tnm" data-user="' + t.u + '" style="cursor:pointer">' + t.nm + "</span>"
      + '    <span class="thn" data-user="' + t.u + '" style="cursor:pointer">@' + t.u + "</span>"
      + '    <span class="ttm">· ' + fd(t.dt) + "</span>"
      + '    <div class="spill" style="background:' + f.bg + ";color:" + f.c + ";border:1px solid " + f.bd + '">' + f.l + "</div>"
      + "  </div>"
      + rep
      + '  <div class="tbody">' + t.bd + "</div>"
      + '  <div class="ttags">' + kts + "</div>"
      + '  <div class="tact"><a class="talink" href="' + t.lk + '" target="_blank">'
      + btn.icon + " <span>" + btn.text + "</span></a></div>"
      + "</div>"
      + "</div>";
  });
  el.innerHTML = out;
}

function rBadge() {
  document.getElementById("total-n").textContent = D.length;
}