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
})();
