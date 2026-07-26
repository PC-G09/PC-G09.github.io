(() => {
  "use strict";

  const phoneQuery = window.matchMedia(
    "(max-width: 760px), " +
    "(max-width: 900px) and (max-height: 500px) and (orientation: landscape)"
  );

  if (!phoneQuery.matches) return;
  if (document.documentElement.classList.contains("mobile-redesign-ready")) return;

  const root = document.documentElement;
  const body = document.body;
  const slides = [...document.querySelectorAll(".slide")];
  const footer = document.querySelector(".bottom-frame");
  const overviewButton = document.querySelector("#overview-button");

  if (!slides.length || !footer) return;

  root.classList.add("mobile-redesign-ready");
  body.classList.add("mobile-redesign");

  const pad = (value) => String(value).padStart(2, "0");

  const getCurrentIndex = () => {
    const index = slides.findIndex((slide) => slide.classList.contains("is-active"));
    return index >= 0 ? index : 0;
  };

  const goTo = (index) => {
    const target = Math.max(0, Math.min(slides.length - 1, index));
    if (target === getCurrentIndex()) return;
    window.location.hash = `slide-${target + 1}`;
  };

  const nav = document.createElement("nav");
  nav.className = "mobile-navigation";
  nav.setAttribute("aria-label", "Mobile presentation navigation");
  nav.innerHTML = `
    <button class="mobile-nav-button mobile-previous-button" type="button" aria-label="Previous slide">
      <span class="mobile-nav-icon" aria-hidden="true">‹</span>
      <span>Previous</span>
    </button>
    <button class="mobile-nav-button mobile-overview-button" type="button" aria-label="Open slide overview">
      <strong class="mobile-current-slide">${pad(getCurrentIndex() + 1)}</strong>
      <small>of ${pad(slides.length)}</small>
    </button>
    <button class="mobile-nav-button mobile-next-button" type="button" aria-label="Next slide">
      <span>Next</span>
      <span class="mobile-nav-icon" aria-hidden="true">›</span>
    </button>
  `;
  footer.appendChild(nav);

  const previous = nav.querySelector(".mobile-previous-button");
  const next = nav.querySelector(".mobile-next-button");
  const overview = nav.querySelector(".mobile-overview-button");
  const currentLabel = nav.querySelector(".mobile-current-slide");

  const updateNavigation = (scrollToTop = false) => {
    const current = getCurrentIndex();
    previous.disabled = current === 0;
    next.disabled = current === slides.length - 1;
    currentLabel.textContent = pad(current + 1);

    if (scrollToTop) {
      slides[current]?.scrollTo({ top: 0, behavior: "auto" });
    }
  };

  previous.addEventListener("click", () => goTo(getCurrentIndex() - 1));
  next.addEventListener("click", () => goTo(getCurrentIndex() + 1));
  overview.addEventListener("click", () => overviewButton?.click());

  const observer = new MutationObserver((mutations) => {
    const changed = mutations.some(
      (mutation) =>
        mutation.type === "attributes" &&
        mutation.attributeName === "class" &&
        mutation.target.classList?.contains("slide")
    );

    if (changed) {
      requestAnimationFrame(() => updateNavigation(true));
    }
  });

  slides.forEach((slide) => {
    observer.observe(slide, {
      attributes: true,
      attributeFilter: ["class", "aria-hidden"]
    });
  });

  window.addEventListener("hashchange", () => {
    requestAnimationFrame(() => updateNavigation(true));
  });

  updateNavigation(false);
})();
