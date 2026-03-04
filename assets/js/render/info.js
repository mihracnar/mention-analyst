/* =====================================================
   render/info.js — renders the Info / About view
   ===================================================== */

function rInfo() {
  document.getElementById("info-c").innerHTML = ""
    + '<div class="info-header">'
    + '  <div class="info-header-title">Mention Analist</div>'
    + '  <div class="info-header-sub">Dijital Takip ve Akıllı Analiz Sistemi</div>'
    + "</div>"

    + '<div class="icard">'
    + '  <div style="font-size:14px;color:var(--tx);line-height:1.6">'
    + "    Bu platform; sosyal mecralardaki (X, Instagram, YouTube) kamuoyu yansımalarının merkezi bir noktadan izlenmesi, içeriklerin anlamsal olarak ayrıştırılması ve karar destek süreçleri için veriye dönüştürülmesi amacıyla kurgulanmıştır."
    + "  </div>"
    + "</div>"

    + '<div class="icard">'
    + '  <div class="icard-t">Sistem Metodolojisi</div>'
    + '  <div style="font-size:13px;color:var(--tx2);line-height:1.7">'
    + "    <p>Sistem, veri kalitesini korumak ve anlamlı içgörüler sunmak için iki temel aşamadan geçmektedir:</p>"
    + '    <ul style="margin-top:10px;padding-left:18px">'
    + '      <li style="margin-bottom:12px"><b>Periyodik Veri Toplama ve Filtreleme:</b> Veriler belirlenen odak noktalarına göre periyodik olarak çekilir. Anlamsız ifadeler, reklam içerikleri veya bağlam dışı alakasız mentionlar otomatik filtreleme katmanlarından geçirilerek temizlenir.</li>'
    + '      <li style="margin-bottom:8px"><b>Yapay Zeka Destekli Anlamsal Analiz:</b> Filtrelenen içerikler, gelişmiş dil işleme modelleri (AI) ile değerlendirmeye alınır. Her ileti; <b>Olumlu, Olumsuz</b> veya <b>Nötr</b> duygu durumunun yanı sıra, ilgili olduğu <b>Tema</b> başlıklarıyla otomatik olarak etiketlenir.</li>'
    + "    </ul>"
    + "  </div>"
    + "</div>"

    + '<div class="icard">'
    + '  <div class="icard-t">Platform Modülleri</div>'
    + '  <div style="font-size:13px;color:var(--tx2);line-height:1.6">'
    + '    <div class="module-block"><b>Mentionlar</b> — Temizlenmiş ve etiketlenmiş güncel veri akışının takibi, duygu ve tema bazlı filtreleme.</div>'
    + '    <div class="module-block"><b>İstatistik</b> — Zamansal trendler, keyword bulutu ve duygu yoğunluk dağılımı.</div>'
    + '    <div class="module-block"><b>Network</b> — Kullanıcıların duygu profilleri ve temaya göre kullanıcı haritası.</div>'
    + "  </div>"
    + "</div>"

    + '<div class="info-footer">'
    + "  Sürüm 3.0.0<br>Bağımsız Dijital İzleme Modülü"
    + "</div>";
}