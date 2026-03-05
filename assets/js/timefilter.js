/* =====================================================
   timefilter.js — global time filter (TF state)
   Depends on: state.js (TF), utils.js (pad), all render/*
   ===================================================== */

var TR_MONTHS = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];

function _tfFmt(d) {
  return d.getDate() + " " + TR_MONTHS[d.getMonth()];
}
function _tfISO(d) {
  return d.getFullYear() + "-" + pad(d.getMonth()+1) + "-" + pad(d.getDate());
}
function _startOfWeek(d) {
  var r = new Date(d); var dw = r.getDay() || 7;
  r.setDate(r.getDate() - dw + 1); r.setHours(0,0,0,0); return r;
}
function _endOfWeek(d) {
  var r = _startOfWeek(d); r.setDate(r.getDate() + 6); r.setHours(23,59,59,999); return r;
}
function _startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1, 0,0,0,0); }
function _endOfMonth(d)   { return new Date(d.getFullYear(), d.getMonth()+1, 0, 23,59,59,999); }

function _buildPresets() {
  var now = new Date(); now.setHours(0,0,0,0);
  var yesterday = new Date(now); yesterday.setDate(now.getDate()-1);
  var lw = new Date(now); lw.setDate(now.getDate()-7);
  var lm = new Date(now.getFullYear(), now.getMonth()-1, 1);
  return {
    today:     { lbl:"Bugün",        from: new Date(now), to: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23,59,59,999) },
    yesterday: { lbl:"Dün",          from: yesterday,     to: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23,59,59,999) },
    week:      { lbl:"Bu Hafta",     from: _startOfWeek(now),  to: _endOfWeek(now) },
    lastweek:  { lbl:"Geçen Hafta",  from: _startOfWeek(lw),   to: _endOfWeek(lw) },
    month:     { lbl:"Bu Ay",        from: _startOfMonth(now),  to: _endOfMonth(now) },
    lastmonth: { lbl:"Geçen Ay",     from: _startOfMonth(lm),   to: _endOfMonth(lm) }
  };
}

/** Returns true if tweet t passes the active time filter */
function tfMatch(t) {
  if (!TF.from && !TF.to) return true;
  var d = new Date(t.dt);
  if (isNaN(d)) return true;
  if (TF.from && d < TF.from) return false;
  if (TF.to   && d > TF.to)   return false;
  return true;
}

/** Update the trigger button label/sub */
function _tfUpdateTrigger(lbl, sub) {
  var el = document.getElementById("tf-label");
  var es = document.getElementById("tf-sub");
  if (el) el.textContent = lbl;
  if (es) { es.textContent = sub; es.style.display = sub ? "" : "none"; }
}

/** Re-render all views that depend on TF */
function _tfRefreshAll() {
  rTabs(); rBar(); rFeed();
  if (CV === "stats")   rStats();
  if (CV === "network") rNetwork();
}

/** Initialise the time filter UI (call once from init.js after DOM ready) */
function initTimeFilter() {
  var presets = _buildPresets();

  /* fill preset sub-labels */
  Object.keys(presets).forEach(function(k) {
    var el = document.getElementById("tf-sub-" + k);
    if (!el) return;
    var p = presets[k];
    var fs = _tfFmt(p.from), ts = _tfFmt(p.to);
    el.textContent = (fs === ts) ? fs : fs + " – " + ts;
  });

  /* trigger toggle */
  document.getElementById("tf-trigger").addEventListener("click", function(e) {
    e.stopPropagation();
    var panel   = document.getElementById("tf-panel");
    var trigger = this;
    var open    = panel.classList.contains("open");
    panel.classList.toggle("open",   !open);
    trigger.classList.toggle("open", !open);
  });

  /* close on outside click */
  document.addEventListener("click", function(e) {
    if (!e.target.closest("#tf-trigger") && !e.target.closest("#tf-panel")) {
      document.getElementById("tf-panel").classList.remove("open");
      document.getElementById("tf-trigger").classList.remove("open");
    }
  });

  /* preset buttons */
  document.querySelectorAll(".tf-preset").forEach(function(btn) {
    btn.addEventListener("click", function() {
      var key = this.getAttribute("data-key");
      var p   = presets[key];
      TF.key  = key; TF.from = p.from; TF.to = p.to;

      document.querySelectorAll(".tf-preset").forEach(function(b){ b.classList.remove("on"); });
      this.classList.add("on");

      document.getElementById("tf-from").value = "";
      document.getElementById("tf-to").value   = "";
      document.getElementById("tf-apply").disabled = true;

      var sub = document.getElementById("tf-sub-" + key).textContent;
      _tfUpdateTrigger(p.lbl, sub);
      _tfClose();
      _tfRefreshAll();
    });
  });

  /* custom inputs */
  function onCustomChange() {
    var f = document.getElementById("tf-from").value;
    var t = document.getElementById("tf-to").value;
    document.getElementById("tf-apply").disabled = !(f && t && f <= t);
    if (f || t) {
      document.querySelectorAll(".tf-preset").forEach(function(b){ b.classList.remove("on"); });
    }
  }
  document.getElementById("tf-from").addEventListener("change", onCustomChange);
  document.getElementById("tf-to").addEventListener("change",   onCustomChange);

  /* apply custom */
  document.getElementById("tf-apply").addEventListener("click", function() {
    var f = document.getElementById("tf-from").value;
    var t = document.getElementById("tf-to").value;
    if (!f || !t) return;
    var df = new Date(f + "T00:00:00");
    var dt = new Date(t + "T23:59:59");
    TF.key = "custom"; TF.from = df; TF.to = dt;
    var sub = _tfFmt(df) === _tfFmt(dt) ? _tfFmt(df) : _tfFmt(df) + " – " + _tfFmt(dt);
    _tfUpdateTrigger("Özel Aralık", sub);
    _tfClose();
    _tfRefreshAll();
  });

  /* clear */
  document.getElementById("tf-clear").addEventListener("click", function() {
    TF.key = null; TF.from = null; TF.to = null;
    document.querySelectorAll(".tf-preset").forEach(function(b){ b.classList.remove("on"); });
    document.getElementById("tf-from").value = "";
    document.getElementById("tf-to").value   = "";
    document.getElementById("tf-apply").disabled = true;
    _tfUpdateTrigger("Tüm Zamanlar", "");
    _tfClose();
    _tfRefreshAll();
  });
}

function _tfClose() {
  document.getElementById("tf-panel").classList.remove("open");
  document.getElementById("tf-trigger").classList.remove("open");
}
