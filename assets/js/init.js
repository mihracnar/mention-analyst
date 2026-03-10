/* =====================================================
   init.js — DOMContentLoaded bootstrap
   Depends on: config.js · state.js · utils.js ·
               render/feed.js · render/stats.js ·
               render/network.js · render/info.js ·
               actions.js
   ===================================================== */

document.addEventListener("DOMContentLoaded", function() {

  /* logo → reset all filters & go to mentions */
  var logoBtn = document.getElementById("logo-btn");
  if (logoBtn) logoBtn.addEventListener("click", resetToMentions);

  /* time filter */
  initTimeFilter();

  /* ── search input & clear button ── */
  var inp = document.getElementById("si");
  var xb  = document.getElementById("xb");

  inp.addEventListener("input", function() {
    S.q = inp.value;
    xb.style.display = inp.value ? "block" : "none";
    rTabs();
    rFeed();
  });

  xb.addEventListener("click", function() {
    inp.value          = "";
    S.q                = "";
    xb.style.display   = "none";
    rTabs();
    rFeed();
  });

  /* ── initial render ── */
  document.getElementById("feed").innerHTML =
    '<div style="text-align:center;padding:48px 0;color:var(--tx2);font-size:13px">Veriler yükleniyor…</div>';

  loadData(function() {
    if (!DATA_LOADED || D.length === 0) {
      document.getElementById("feed").innerHTML =
        '<div style="text-align:center;padding:48px 0;color:var(--rd);font-size:13px">Veriler yüklenemedi. Sayfayı yenileyin.</div>';
      return;
    }
    rTabs();
    rBar();
    rFeed();
  });

  /* ── global event delegation ──
     All interactive dynamic elements use data-* attributes so
     a single listener covers the whole document efficiently.     */
  document.addEventListener("click", function(e) {
    var el;

    /* sentiment tab */
    if ((el = e.target.closest("[data-tab]"))) {
      sTab(el.getAttribute("data-tab"));
      return;
    }

    /* theme pill */
    if ((el = e.target.closest("[data-th]"))) {
      tTh(el.getAttribute("data-th"));
      return;
    }

    /* keyword tag (in feed cards) or keyword cloud item (in stats) */
    if ((el = e.target.closest("[data-kw]"))) {
      goKw(el.getAttribute("data-kw"));
      return;
    }

    /* user avatar / name / handle in feed → filter by user */
    if ((el = e.target.closest("[data-user]"))) {
      /* only act when inside the feed view, not network */
      if (CV === "mentions") {
        goUser(el.getAttribute("data-user"));
      }
      return;
    }

    /* özet period seçici */
    if ((el = e.target.closest("[data-ozet-p]"))) {
      setOzetPeriod(el.getAttribute("data-ozet-p"));
      return;
    }

    /* özet kart linkleri */
    if ((el = e.target.closest("[data-ozet-user]"))) {
      goUser(el.getAttribute("data-ozet-user"));
      return;
    }
    if ((el = e.target.closest("[data-ozet-sent]"))) {
      goSent(el.getAttribute("data-ozet-sent"));
      return;
    }
    if ((el = e.target.closest("[data-ozet-kw]"))) {
      goKw(el.getAttribute("data-ozet-kw"));
      return;
    }
  });

  /* Desktop: tf-bar'ı sidebar slotuna taşı */
  if (window.matchMedia("(min-width: 768px)").matches) {
    var tfBar  = document.querySelector(".tf-bar");
    var tfSlot = document.getElementById("bnav-tf-slot");
    if (tfBar && tfSlot) tfSlot.appendChild(tfBar);
  }
});