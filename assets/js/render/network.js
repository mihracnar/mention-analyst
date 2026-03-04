/* =====================================================
   render/network.js — renders the Network view
   Supports: sentiment tabs · search · top-10 + expand ·
             theme accordion · avatar truncation
   ===================================================== */

/* ── internal state for this view ── */
var NW = {
  tab:      "T",   // sentiment filter: T | P | N | NE
  q:        "",    // search query
  expanded: false, // whether full user list is shown
  openThemes: {}   // { themeKey: bool } accordion open state
};

var NW_PAGE = 10;    // users shown before "show more"
var NW_AVS  = 8;     // avatars shown per theme before truncation

function _sentLabel(k) {
  return k === "P" ? "Olumlu" : k === "N" ? "Olumsuz" : "Nötr";
}
function _domColor(d) {
  var dom = (d.P >= d.N && d.P >= d.NE) ? "P"
          : (d.N >= d.P && d.N >= d.NE)  ? "N" : "NE";
  return dom === "P" ? "var(--gr)" : dom === "N" ? "var(--rd)" : "var(--am)";
}

/* rebuild only the user list section (tabs / search / cards) */
function _rUserList(userMap, container) {
  var q   = NW.q.toLowerCase().trim();
  var all = Object.keys(userMap).sort(function(a, b) {
    return userMap[b].total - userMap[a].total;
  });

  /* sentiment tab filter */
  if (NW.tab !== "T") {
    all = all.filter(function(u) { return userMap[u][NW.tab] > 0; });
  }

  /* search filter */
  if (q) {
    all = all.filter(function(u) {
      return u.toLowerCase().indexOf(q) >= 0
          || userMap[u].nm.toLowerCase().indexOf(q) >= 0;
    });
  }

  var total   = all.length;
  var visible = NW.expanded ? all : all.slice(0, NW_PAGE);

  /* sentiment tab bar */
  var tabs = ["T","P","N","NE"].map(function(k) {
    var label = k === "T" ? "Tümü" : _sentLabel(k);
    var col   = k === "T" ? "var(--bl)"
              : k === "P" ? "var(--gr)"
              : k === "N" ? "var(--rd)" : "var(--am)";
    var active = NW.tab === k;
    return '<div class="nw-stab' + (active ? " on" : "") + '" data-nwtab="' + k + '"'
      + (active ? ' style="color:' + col + ';border-color:' + col + '"' : "")
      + ">" + label + "</div>";
  }).join("");

  /* search input */
  var searchBar = '<div class="nw-search-wrap">'
    + '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>'
    + '<input class="nw-search" id="nw-q" placeholder="Kullanıcı ara…" value="' + NW.q + '"/>'
    + (NW.q ? '<button class="nw-clr" id="nw-clr">✕</button>' : "")
    + "</div>";

  /* user cards */
  var cards = "";
  if (!visible.length) {
    cards = '<div style="padding:24px 0;text-align:center;color:var(--tx2);font-size:14px">Kullanıcı bulunamadı.</div>';
  } else {
    visible.forEach(function(u) {
      var d  = userMap[u];
      var dc = _domColor(d);
      var dots = ["P","N","NE"].filter(function(k){ return d[k]>0; }).map(function(k){
        return '<span class="sent-dot ' + k + '">' + _sentLabel(k) + " " + d[k] + "</span>";
      }).join("");
      cards += '<div class="ucard" data-user="' + u + '">'
        + '<div class="uav" style="background:' + ac(u) + ";box-shadow:0 0 0 2px " + dc + '">' + ini(d.nm) + "</div>"
        + '<div class="ucard-info">'
        + '  <div class="unm">' + d.nm + "</div>"
        + '  <div class="uhn">@' + u + " · " + d.total + " mention</div>"
        + '  <div class="sent-bar">' + dots + "</div>"
        + "</div></div>";
    });
  }

  /* expand / collapse button */
  var more = "";
  if (!NW.expanded && total > NW_PAGE) {
    more = '<button class="nw-more-btn" id="nw-expand">+'
      + (total - NW_PAGE) + " kişi daha göster</button>";
  } else if (NW.expanded && total > NW_PAGE) {
    more = '<button class="nw-more-btn secondary" id="nw-collapse">Daha az göster</button>';
  }

  container.innerHTML = tabs + searchBar + cards + more;

  /* bind search input */
  var inp = document.getElementById("nw-q");
  if (inp) inp.addEventListener("input", function() {
    NW.q = this.value;
    NW.expanded = false;
    _rUserList(userMap, container);
  });
  var clr = document.getElementById("nw-clr");
  if (clr) clr.addEventListener("click", function() {
    NW.q = ""; NW.expanded = false; _rUserList(userMap, container);
  });
  var exp = document.getElementById("nw-expand");
  if (exp) exp.addEventListener("click", function() {
    NW.expanded = true; _rUserList(userMap, container);
  });
  var col = document.getElementById("nw-collapse");
  if (col) col.addEventListener("click", function() {
    NW.expanded = false; _rUserList(userMap, container);
  });
}

/* main render */
function rNetwork() {
  /* ── build userMap ── */
  var userMap = {};
  D.forEach(function(t) {
    if (!userMap[t.u]) userMap[t.u] = { nm: t.nm, P: 0, N: 0, NE: 0, total: 0 };
    userMap[t.u][t.s]++;
    userMap[t.u].total++;
  });

  /* ── build themeMap ── */
  var themeMap = {};
  D.forEach(function(t) {
    t.kw.split(",").forEach(function(k) {
      var kk = k.trim();
      if (!kk) return;
      if (!themeMap[kk]) themeMap[kk] = [];
      themeMap[kk].push({ u: t.u, nm: t.nm, s: t.s });
    });
  });
  var themes = Object.keys(themeMap).sort(function(a, b) {
    return themeMap[b].length - themeMap[a].length;
  });

  /* ── theme accordion HTML ── */
  var thHTML = themes.map(function(kk) {
    var entries = themeMap[kk];
    var total   = entries.length;
    var isOpen  = !!NW.openThemes[kk];

    /* de-dup users, keep dominant sentiment per theme */
    var uSent = {};
    entries.forEach(function(e) {
      if (!uSent[e.u]) uSent[e.u] = { nm: e.nm, P: 0, N: 0, NE: 0 };
      uSent[e.u][e.s]++;
    });
    var uKeys   = Object.keys(uSent);
    var visible = uKeys.slice(0, NW_AVS);
    var hidden  = uKeys.length - NW_AVS;

    var avatars = visible.map(function(u) {
      var d  = uSent[u];
      var dc = _domColor(d);
      return '<div class="theme-avatar-item" data-user="' + u + '">'
        + '<div class="mini-av" style="background:' + ac(u) + ";box-shadow:0 0 0 2px " + dc + '">' + ini(d.nm) + "</div>"
        + '<div class="mini-nm">@' + u + "</div>"
        + "</div>";
    }).join("");

    var moreAv = (hidden > 0 && isOpen)
      ? avatars + uKeys.slice(NW_AVS).map(function(u) {
          var d  = uSent[u];
          var dc = _domColor(d);
          return '<div class="theme-avatar-item" data-user="' + u + '">'
            + '<div class="mini-av" style="background:' + ac(u) + ";box-shadow:0 0 0 2px " + dc + '">' + ini(d.nm) + "</div>"
            + '<div class="mini-nm">@' + u + "</div>"
            + "</div>";
        }).join("")
      : avatars + (hidden > 0
          ? '<div class="av-more-badge" data-theme-expand="' + kk + '">+' + hidden + "</div>"
          : "");

    /* sentiment summary pills for the header */
    var sentTotals = { P:0, N:0, NE:0 };
    entries.forEach(function(e){ sentTotals[e.s]++; });
    var sentPills = ["P","N","NE"].filter(function(k){ return sentTotals[k]>0; }).map(function(k){
      return '<span class="th-sent-pill ' + k + '">' + sentTotals[k] + "</span>";
    }).join("");

    return '<div class="theme-block-wrap' + (isOpen ? " open" : "") + '" id="thblock-' + kk + '">'
      + '<div class="theme-accordion-head" data-theme-toggle="' + kk + '">'
      + '  <div class="theme-head-left">'
      + '    <span class="th-pill">' + kk + "</span>"
      + '    <span class="th-count">' + total + " mention</span>"
      + '    <div class="th-sent-pills">' + sentPills + "</div>"
      + "  </div>"
      + '  <svg class="th-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 9 6 6 6-6"/></svg>'
      + "</div>"
      + '<div class="theme-accordion-body">'
      + '  <div class="theme-avatars">' + moreAv + "</div>"
      + "</div>"
      + "</div>";
  }).join("");

  /* ── scaffold ── */
  document.getElementById("network-c").innerHTML =
    '<div class="sec-title">Kullanıcılar & Duygu Durumu</div>'
    + '<p class="section-hint">Avatar çerçevesi baskın duyguyu, etiketler karma durumları gösterir.</p>'
    + '<div id="nw-user-list"></div>'
    + '<div class="sec-title" style="margin-top:20px">Temaya Göre Kullanıcı Dağılımı</div>'
    + '<p class="section-hint">Her tema tıklanınca açılır. Kesilen avatarlar +N rozeti ile gösterilir.</p>'
    + '<div id="nw-theme-list">' + thHTML + "</div>";

  /* ── fill user list ── */
  _rUserList(userMap, document.getElementById("nw-user-list"));

  /* ── bind accordion + avatar-expand via delegation ── */
  document.getElementById("nw-theme-list").addEventListener("click", function(e) {
    /* accordion toggle */
    var hd = e.target.closest("[data-theme-toggle]");
    if (hd) {
      var kk = hd.getAttribute("data-theme-toggle");
      NW.openThemes[kk] = !NW.openThemes[kk];
      rNetwork(); /* re-render preserves open state via NW.openThemes */
      return;
    }
    /* avatar expand (+N badge) */
    var badge = e.target.closest("[data-theme-expand]");
    if (badge) {
      var kk = badge.getAttribute("data-theme-expand");
      NW.openThemes[kk] = true;
      rNetwork();
      return;
    }
    /* user click → go to mentions */
    var el = e.target.closest("[data-user]");
    if (el) goUser(el.getAttribute("data-user"));
  });

  /* ── bind sentiment tabs via delegation on user list ── */
  document.getElementById("nw-user-list").addEventListener("click", function(e) {
    var tab = e.target.closest("[data-nwtab]");
    if (tab) {
      NW.tab = tab.getAttribute("data-nwtab");
      NW.expanded = false;
      _rUserList(userMap, document.getElementById("nw-user-list"));
      return;
    }
    var el = e.target.closest("[data-user]");
    if (el) goUser(el.getAttribute("data-user"));
  });
}