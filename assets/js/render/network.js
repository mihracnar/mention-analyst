/* =====================================================
   render/network.js — renders the Network view
   ===================================================== */

function _sentLabel(k) {
  return k === "P" ? "Olumlu" : k === "N" ? "Olumsuz" : "Nötr";
}

function _domColor(d) {
  var dom = (d.P >= d.N && d.P >= d.NE) ? "P" : (d.N >= d.P && d.N >= d.NE) ? "N" : "NE";
  return dom === "P" ? "var(--gr)" : dom === "N" ? "var(--rd)" : "var(--am)";
}

function rNetwork() {
  /* ── per-user sentiment totals ── */
  var userMap = {};
  D.forEach(function(t) {
    if (!userMap[t.u]) userMap[t.u] = { nm: t.nm, P: 0, N: 0, NE: 0, total: 0 };
    userMap[t.u][t.s]++;
    userMap[t.u].total++;
  });
  var users = Object.keys(userMap).sort(function(a, b) {
    return userMap[b].total - userMap[a].total;
  });

  var uHTML = "";
  users.forEach(function(u) {
    var d    = userMap[u];
    var dc   = _domColor(d);
    var dots = ["P", "N", "NE"].filter(function(k) { return d[k] > 0; }).map(function(k) {
      return '<span class="sent-dot ' + k + '">' + _sentLabel(k) + " " + d[k] + "</span>";
    }).join("");

    uHTML += '<div class="ucard" data-user="' + u + '">'
      + '<div class="uav" style="background:' + ac(u) + ";box-shadow:0 0 0 2px " + dc + '">' + ini(d.nm) + "</div>"
      + '<div class="ucard-info">'
      + '  <div class="unm">' + d.nm + "</div>"
      + '  <div class="uhn">@' + u + " · " + d.total + " mention</div>"
      + '  <div class="sent-bar">' + dots + "</div>"
      + "</div>"
      + "</div>";
  });

  /* ── theme → user mapping ── */
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

  var thHTML = "";
  themes.forEach(function(kk) {
    var entries = themeMap[kk];
    var total   = entries.length;

    /* dominant sentiment per user for this theme */
    var uSent = {};
    entries.forEach(function(e) {
      if (!uSent[e.u]) uSent[e.u] = { nm: e.nm, P: 0, N: 0, NE: 0 };
      uSent[e.u][e.s]++;
    });

    var avatars = Object.keys(uSent).map(function(u) {
      var d  = uSent[u];
      var dc = _domColor(d);
      return '<div class="theme-avatar-item" data-user="' + u + '">'
        + '<div class="mini-av" style="background:' + ac(u) + ";box-shadow:0 0 0 2px " + dc + '">' + ini(d.nm) + "</div>"
        + '<div class="mini-nm">@' + u + "</div>"
        + "</div>";
    }).join("");

    thHTML += '<div class="theme-block-wrap">'
      + '<div class="theme-user-label">'
      + '  <span class="pill">' + kk + "</span>"
      + '  <span class="count">' + total + " mention</span>"
      + "</div>"
      + '<div class="theme-avatars">' + avatars + "</div>"
      + "</div>";
  });

  document.getElementById("network-c").innerHTML = ""
    + '<div class="sec-title">Kullanıcılar & Duygu Durumu</div>'
    + '<p class="section-hint">Avatar çerçevesi kullanıcının baskın duygusunu renklendirir. Karma duygular etiketlerin tamamında görünür.</p>'
    + uHTML
    + '<div class="sec-title" style="margin-top:12px">Temaya Göre Kullanıcı Dağılımı</div>'
    + '<p class="section-hint">Her tema için mention atan kullanıcılar ve baskın duygu profilleri.</p>'
    + thHTML;
}