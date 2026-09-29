(() => {
  const TRANSITION_MS = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 120 : 680;
  let isTransitioning = false;

  const styles = document.createElement("style");
  styles.textContent = `
    .karch-page-transition {
      position: fixed;
      inset: 0;
      z-index: 99999;
      display: grid;
      place-items: center;
      padding: 24px;
      overflow: hidden;
      color: #f1ede4;
      background:
        radial-gradient(circle at 50% 42%, rgba(198, 161, 91, 0.16), transparent 30%),
        linear-gradient(145deg, #08080a, #111113 58%, #09090b);
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      transition: opacity 280ms ease, visibility 0s linear 280ms;
    }

    .karch-page-transition::before {
      content: "";
      position: absolute;
      inset: 18px;
      border: 1px solid rgba(198, 161, 91, 0.24);
      pointer-events: none;
    }

    .karch-page-transition.is-active {
      opacity: 1;
      visibility: visible;
      pointer-events: auto;
      transition: opacity 280ms ease, visibility 0s;
    }

    .karch-page-transition__content {
      position: relative;
      display: grid;
      justify-items: center;
      gap: 18px;
      text-align: center;
      transform: translateY(12px);
      transition: transform 500ms cubic-bezier(0.22, 1, 0.36, 1);
    }

    .karch-page-transition.is-active .karch-page-transition__content {
      transform: translateY(0);
    }

    .karch-page-transition__mark {
      display: grid;
      place-items: center;
      width: 76px;
      height: 76px;
      border: 1px solid rgba(224, 192, 136, 0.68);
      border-radius: 50%;
      font-family: "Bodoni Moda", Georgia, serif;
      font-size: 2.3rem;
      line-height: 1;
      color: #e0c088;
      box-shadow: 0 0 0 10px rgba(198, 161, 91, 0.05);
    }

    .karch-page-transition__name {
      margin: 0;
      font-family: "Manrope", Arial, sans-serif;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.28em;
      text-transform: uppercase;
      color: rgba(241, 237, 228, 0.82);
    }

    .karch-page-transition__message {
      margin: -4px 0 0;
      font-family: "Bodoni Moda", Georgia, serif;
      font-size: clamp(1.65rem, 5vw, 2.45rem);
      line-height: 1.15;
      color: #f1ede4;
    }

    .karch-page-transition__line {
      width: 112px;
      height: 1px;
      overflow: hidden;
      background: rgba(198, 161, 91, 0.2);
    }

    .karch-page-transition__line::after {
      content: "";
      display: block;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, #e0c088, transparent);
      transform: translateX(-100%);
    }

    .karch-page-transition.is-active .karch-page-transition__line::after {
      animation: karch-transition-line 640ms ease-out forwards;
    }

    @keyframes karch-transition-line {
      to { transform: translateX(100%); }
    }

    @media (prefers-reduced-motion: reduce) {
      .karch-page-transition,
      .karch-page-transition__content {
        transition-duration: 80ms;
      }

      .karch-page-transition.is-active .karch-page-transition__line::after {
        animation: none;
        transform: none;
      }
    }
  `;
  document.head.appendChild(styles);

  const overlay = document.createElement("div");
  overlay.className = "karch-page-transition";
  overlay.setAttribute("aria-hidden", "true");
  overlay.innerHTML = `
    <div class="karch-page-transition__content">
      <div class="karch-page-transition__mark" aria-hidden="true">K</div>
      <p class="karch-page-transition__name">KARCH Luxury Travel</p>
      <p class="karch-page-transition__message">Your journey awaits…</p>
      <div class="karch-page-transition__line" aria-hidden="true"></div>
    </div>
  `;

  const mountOverlay = () => {
    if (!overlay.isConnected) document.body.appendChild(overlay);
  };

  const resetTransition = () => {
    isTransitioning = false;
    overlay.classList.remove("is-active");
    overlay.setAttribute("aria-hidden", "true");
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountOverlay, { once: true });
  } else {
    mountOverlay();
  }

  window.addEventListener("pageshow", resetTransition);

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (!link || event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (link.target && link.target.toLowerCase() !== "_self") return;
    if (link.hasAttribute("download") || link.hasAttribute("data-no-transition")) return;

    const href = link.getAttribute("href").trim();
    if (!href || href.startsWith("#") || /^(mailto:|tel:|sms:|javascript:)/i.test(href)) return;

    const destination = new URL(link.href, window.location.href);
    const currentHost = window.location.hostname.replace(/^www\./, "");
    const destinationHost = destination.hostname.replace(/^www\./, "");
    const isInternal = /^https?:$/.test(destination.protocol) && currentHost === destinationHost;
    const isCurrentPage = destination.pathname === window.location.pathname &&
      destination.search === window.location.search;

    if (!isInternal || (isCurrentPage && destination.hash) || destination.href === window.location.href) return;

    event.preventDefault();
    if (isTransitioning) return;

    isTransitioning = true;
    mountOverlay();
    overlay.setAttribute("aria-hidden", "false");
    overlay.classList.add("is-active");

    window.setTimeout(() => {
      window.location.assign(destination.href);
    }, TRANSITION_MS);
  });
})();
