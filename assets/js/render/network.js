/* =====================================================
   render/network.js — Network view
   Fixes:
     - scrollable user list (no pagination)
     - accordion shows ALL users when open (no truncation)
     - +N badge only shown when accordion is closed
   ===================================================== */

var NW = {
  tab:        "T",   // sentiment filter for user list
  q:          "",    // search query for user list
  openThemes: {}     // { themeKey: bool } accordion state
};

var NW_AVS_CLOSED = 6; // avatars visible when accordion is CLOSED

function _sentLabel(k) {
  return k === "P" ? "Olumlu" : k === "N" ? "Olumsuz" : "Nötr";
}
function _domColor(d) {
  var dom = (d.P >= d.N && d.P >= d.NE) ? "P"
          : (d.N >= d.P && d.N >= d.NE)  ? "N" : "NE";
  return dom === "P" ? "var(--gr)" : dom === "N" ? "var(--rd)" : "var(--am)";
}

/* ── USER LIST (tabs + search + scrollable cards) ─── */
function _rUserList(userMap, container) {
  var q   = NW.q.toLowerCase().trim();
  var all = Object.keys(userMap).sort(function(a, b) {
    var key = NW.tab === "T" ? "total" : NW.tab;
    return userMap[b][key] - userMap[a][key];
  });

  if (NW.tab !== "T") {
    all = all.filter(function(u) { return userMap[u][NW.tab] > 0; });
  }
  if (q) {
    all = all.filter(function(u) {
      return u.toLowerCase().indexOf(q) >= 0
          || userMap[u].nm.toLowerCase().indexOf(q) >= 0;
    });
  }

  /* sentiment tabs */
  var tabs = ["T","P","N","NE"].map(function(k) {
    var label  = k === "T" ? "Tümü" : _sentLabel(k);
    var col    = k === "T" ? "var(--bl)"
               : k === "P" ? "var(--gr)"
               : k === "N" ? "var(--rd)" : "var(--am)";
    var active = NW.tab === k;
    return '<div class="nw-stab' + (active ? " on" : "") + '" data-nwtab="' + k + '"'
      + (active ? ' style="color:' + col + ';border-color:' + col + '"' : "")
      + ">" + label + "</div>";
  }).join("");

  /* search */
  var searchBar = '<div class="nw-search-wrap">'
    + '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">'
    + '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>'
    + '<input class="nw-search" id="nw-q" placeholder="Kullanıcı ara…" value="' + NW.q + '"/>'
    + (NW.q ? '<button class="nw-clr" id="nw-clr">✕</button>' : "")
    + "</div>";

  /* cards — all visible, scrollable */
  var cards = "";
  if (!all.length) {
    cards = '<div class="nw-empty">Kullanıcı bulunamadı.</div>';
  } else {
    all.forEach(function(u) {
      var d  = userMap[u];
      var dc = _domColor(d);
      var dots = ["P","N","NE"].filter(function(k){ return d[k] > 0; }).map(function(k){
        return '<span class="sent-dot ' + k + '">' + _sentLabel(k) + " " + d[k] + "</span>";
      }).join("");
      cards += '<div class="ucard" data-user="' + u + '">'
        + '<div class="uav" style="background:' + ac(u) + ";box-shadow:0 0 0 2px " + dc + '">'
        + ini(d.nm) + "</div>"
        + '<div class="ucard-info">'
        + '  <div class="unm">' + d.nm + "</div>"
        + '  <div class="uhn">@' + u + " · " + d.total + " mention</div>"
        + '  <div class="sent-bar">' + dots + "</div>"
        + "</div></div>";
    });
  }

  var count = '<div class="nw-user-count">' + all.length + " kullanıcı</div>";

  container.innerHTML = tabs + searchBar + count
    + '<div class="nw-user-scroll">' + cards + "</div>";

  /* bind search */
  var inp = document.getElementById("nw-q");
  if (inp) inp.addEventListener("input", function() {
    NW.q = this.value;
    _rUserList(userMap, container);
  });
  var clr = document.getElementById("nw-clr");
  if (clr) clr.addEventListener("click", function() {
    NW.q = "";
    _rUserList(userMap, container);
  });
}

/* ── MAIN RENDER ─────────────────────────────────── */
function rNetwork() {
  /* build userMap */
  var userMap = {};
  D.forEach(function(t) {
    if (!userMap[t.u]) userMap[t.u] = { nm: t.nm, P: 0, N: 0, NE: 0, total: 0 };
    userMap[t.u][t.s]++;
    userMap[t.u].total++;
  });

  /* build themeMap */
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

  /* theme accordions */
  var thHTML = themes.map(function(kk) {
    var entries = themeMap[kk];
    var total   = entries.length;
    var isOpen  = !!NW.openThemes[kk];

    /* de-dup users, dominant sentiment per theme */
    var uSent = {};
    entries.forEach(function(e) {
      if (!uSent[e.u]) uSent[e.u] = { nm: e.nm, P: 0, N: 0, NE: 0 };
      uSent[e.u][e.s]++;
    });
    var uKeys = Object.keys(uSent);

    /* when OPEN → show everyone; when CLOSED → show NW_AVS_CLOSED + badge */
    var avatarHTML;
    if (isOpen) {
      /* all avatars, no truncation */
      avatarHTML = uKeys.map(function(u) {
        var d  = uSent[u];
        var dc = _domColor(d);
        return '<div class="theme-avatar-item" data-user="' + u + '">'
          + '<div class="mini-av" style="background:' + ac(u) + ";box-shadow:0 0 0 2px " + dc + '">'
          + ini(d.nm) + "</div>"
          + '<div class="mini-nm">@' + u + "</div>"
          + "</div>";
      }).join("");
    } else {
      /* closed: show up to NW_AVS_CLOSED, then +N hint */
      var visible = uKeys.slice(0, NW_AVS_CLOSED);
      var hidden  = uKeys.length - NW_AVS_CLOSED;
      avatarHTML  = visible.map(function(u) {
        var d  = uSent[u];
        var dc = _domColor(d);
        return '<div class="theme-avatar-item">'
          + '<div class="mini-av" style="background:' + ac(u) + ";box-shadow:0 0 0 2px " + dc + '">'
          + ini(d.nm) + "</div>"
          + '<div class="mini-nm">@' + u + "</div>"
          + "</div>";
      }).join("");
      if (hidden > 0) {
        avatarHTML += '<div class="av-more-badge" data-theme-toggle="' + kk + '">+'
          + hidden + "</div>";
      }
    }

    /* sentiment summary for header */
    var sentTotals = { P:0, N:0, NE:0 };
    entries.forEach(function(e){ sentTotals[e.s]++; });
    var sentPills = ["P","N","NE"].filter(function(k){ return sentTotals[k] > 0; }).map(function(k){
      return '<span class="th-sent-pill ' + k + '">' + sentTotals[k] + "</span>";
    }).join("");

    return '<div class="theme-block-wrap' + (isOpen ? " open" : "") + '">'
      + '<div class="theme-accordion-head" data-theme-toggle="' + kk + '">'
      + '  <div class="theme-head-left">'
      + '    <span class="th-pill">' + kk + "</span>"
      + '    <span class="th-count">' + total + " mention · " + uKeys.length + " kişi</span>"
      + '    <div class="th-sent-pills">' + sentPills + "</div>"
      + "  </div>"
      + '  <svg class="th-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">'
      + '<path d="m6 9 6 6 6-6"/></svg>'
      + "</div>"
      + '<div class="theme-accordion-body">'
      + '  <div class="theme-avatars">' + avatarHTML + "</div>"
      + "</div>"
      + "</div>";
  }).join("");

  /* scaffold */
  document.getElementById("network-c").innerHTML =
    '<div class="sec-title">Kullanıcılar & Duygu Durumu</div>'
    + '<p class="section-hint">Avatar çerçevesi baskın duyguyu gösterir. Karma duygular etiketlerde ayrıca listelenir.</p>'
    + '<div id="nw-user-list"></div>'
    + '<div class="sec-title" style="margin-top:20px">Temaya Göre Kullanıcı Dağılımı</div>'
    + '<p class="section-hint">Başlığa tıklayarak açın — açık temada tüm kullanıcılar gösterilir.</p>'
    + '<div class="nw-theme-scroll"><div id="nw-theme-list">' + thHTML + "</div></div>";

  /* fill user list */
  _rUserList(userMap, document.getElementById("nw-user-list"));

  /* event delegation: theme list */
  document.getElementById("nw-theme-list").addEventListener("click", function(e) {
    var toggle = e.target.closest("[data-theme-toggle]");
    if (toggle) {
      var kk = toggle.getAttribute("data-theme-toggle");
      NW.openThemes[kk] = !NW.openThemes[kk];
      rNetwork();
      return;
    }
    var el = e.target.closest("[data-user]");
    if (el) goUser(el.getAttribute("data-user"));
  });

  /* event delegation: user list */
  document.getElementById("nw-user-list").addEventListener("click", function(e) {
    var tab = e.target.closest("[data-nwtab]");
    if (tab) {
      NW.tab = tab.getAttribute("data-nwtab");
      _rUserList(userMap, document.getElementById("nw-user-list"));
      return;
    }
    var el = e.target.closest("[data-user]");
    if (el) goUser(el.getAttribute("data-user"));
  });
}