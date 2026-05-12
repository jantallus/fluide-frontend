/**
 * Script à coller dans WordPress (via Insert Headers and Footers ou bloc HTML).
 * À placer sur les pages contenant l'iframe Fluide.
 *
 * Ce script :
 *  1. Adapte la hauteur de l'iframe au contenu réel (fluide-resize)
 *  2. Envoie le scroll WordPress à l'iframe pour le fake-sticky des dates (fluide-scroll)
 *  3. Scrolle la page WordPress quand l'iframe demande à voir une étape (fluide-scroll-to)
 */
(function () {
  var HEADER_HEIGHT = 90; // hauteur du bandeau WordPress sticky (px)

  function findIframe() {
    return document.querySelector('iframe[src*="reservation.fluide-parapente.fr"]');
  }

  // 1. Écoute les messages de l'iframe
  window.addEventListener('message', function (e) {
    var iframe = findIframe();
    if (!iframe || !iframe.contentWindow) return;

    // Auto-resize
    if (e.data && e.data.type === 'fluide-resize' && typeof e.data.height === 'number') {
      iframe.style.height = e.data.height + 'px';
    }

    // Scroll WordPress vers une étape
    if (e.data && e.data.type === 'fluide-scroll-to' && typeof e.data.offsetY === 'number') {
      var iframeTop = iframe.getBoundingClientRect().top + window.scrollY;
      var targetY = iframeTop + e.data.offsetY - HEADER_HEIGHT;
      window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
    }
  });

  // 2. Envoie le scroll WordPress à l'iframe
  function sendScroll() {
    var iframe = findIframe();
    if (!iframe || !iframe.contentWindow) return;
    var iframeTop = iframe.getBoundingClientRect().top + window.scrollY;
    iframe.contentWindow.postMessage(
      {
        type: 'fluide-scroll',
        scrollY: window.scrollY,
        iframeTop: iframeTop,
        headerHeight: HEADER_HEIGHT,
      },
      'https://reservation.fluide-parapente.fr'
    );
  }

  window.addEventListener('scroll', sendScroll, { passive: true });
  window.addEventListener('resize', sendScroll);
  document.addEventListener('DOMContentLoaded', sendScroll);
  sendScroll();
})();
