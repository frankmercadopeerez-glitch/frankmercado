(function () {
  "use strict";

  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".nav-toggle");
  var panel = document.querySelector(".nav-panel");
  var year = document.querySelector("[data-year]");

  if (year) year.textContent = new Date().getFullYear();

  function updateHeader() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 12);
  }

  function closeMenu(returnFocus) {
    if (!toggle || !panel) return;
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", document.documentElement.lang === "es" ? "Abrir navegación" : "Open navigation");
    panel.classList.remove("is-open");
    document.body.classList.remove("menu-open");
    if (returnFocus) toggle.focus();
  }

  if (toggle && panel) {
    toggle.addEventListener("click", function () {
      var willOpen = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", String(willOpen));
      toggle.setAttribute(
        "aria-label",
        willOpen
          ? document.documentElement.lang === "es"
            ? "Cerrar navegación"
            : "Close navigation"
          : document.documentElement.lang === "es"
            ? "Abrir navegación"
            : "Open navigation",
      );
      panel.classList.toggle("is-open", willOpen);
      document.body.classList.toggle("menu-open", willOpen);
    });

    panel.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeMenu(true);
    });

    window.matchMedia("(min-width: 960px)").addEventListener("change", function (event) {
      if (event.matches) closeMenu();
    });
  }

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!reduceMotion && "IntersectionObserver" in window) {
    document.documentElement.classList.add("motion-ready");
    var revealTargets = document.querySelectorAll(
      ".section-head-row, .template-card, .customization-offer, .referral-panel, .venture-media, .venture-copy, .service-panel, .service-item, .about-copy, .about-facts, .note-card, .contact-panel, .detail-preview, .detail-sidebar",
    );

    revealTargets.forEach(function (element, index) {
      element.classList.add("reveal");
      element.style.setProperty("--reveal-delay", String((index % 3) * 80) + "ms");
    });

    var revealObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8%", threshold: 0.08 },
    );

    revealTargets.forEach(function (element) {
      revealObserver.observe(element);
    });
  }

  var precisePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

  if (!reduceMotion && precisePointer.matches) {
    var ring = document.createElement("span");
    var dot = document.createElement("span");
    var pointerX = -80;
    var pointerY = -80;
    var ringX = -80;
    var ringY = -80;

    ring.className = "cursor-ring";
    dot.className = "cursor-dot";
    ring.setAttribute("aria-hidden", "true");
    dot.setAttribute("aria-hidden", "true");
    document.body.appendChild(ring);
    document.body.appendChild(dot);

    function drawCursor() {
      ringX += (pointerX - ringX) * 0.18;
      ringY += (pointerY - ringY) * 0.18;
      ring.style.transform = "translate3d(" + (ringX - 16) + "px," + (ringY - 16) + "px,0)";
      dot.style.transform = "translate3d(" + (pointerX - 2) + "px," + (pointerY - 2) + "px,0)";
      window.requestAnimationFrame(drawCursor);
    }

    document.addEventListener("mousemove", function (event) {
      pointerX = event.clientX;
      pointerY = event.clientY;
      document.documentElement.classList.add("custom-cursor-active");
    });

    document.addEventListener("mouseover", function (event) {
      ring.classList.toggle("is-hovering", Boolean(event.target.closest("a, button, input, select, textarea")));
    });
    document.addEventListener("mousedown", function () { ring.classList.add("is-pressed"); });
    document.addEventListener("mouseup", function () { ring.classList.remove("is-pressed"); });
    document.addEventListener("mouseleave", function () { document.documentElement.classList.remove("custom-cursor-active"); });
    document.addEventListener("mouseenter", function () { document.documentElement.classList.add("custom-cursor-active"); });

    drawCursor();
  }
})();
