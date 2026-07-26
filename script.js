(() => {
  "use strict";

  const slides = [...document.querySelectorAll(".slide")];
  const total = slides.length;
  const currentNumber = document.querySelector("#slide-current");
  const totalNumber = document.querySelector("#slide-total");
  const chapterIndex = document.querySelector("#chapter-index");
  const chapterTitle = document.querySelector("#chapter-title");
  const topProgress = document.querySelector("#top-progress-bar");
  const bottomProgress = document.querySelector("#bottom-progress-bar");
  const previousButton = document.querySelector("#previous-button");
  const nextButton = document.querySelector("#next-button");
  const fullscreenButton = document.querySelector("#fullscreen-button");
  const overviewButton = document.querySelector("#overview-button");
  const slideMap = document.querySelector("#slide-map");
  const mapList = document.querySelector("#map-list");
  const closeMapButton = document.querySelector("#close-map");
  const imageModal = document.querySelector("#image-modal");
  const modalImage = imageModal?.querySelector("img");
  const modalClose = imageModal?.querySelector(".modal-close");

  let current = 0;
  let isTransitioning = false;
  let queuedTarget = null;
  let wheelTotal = 0;
  let wheelTimer = null;
  let touchStartX = 0;
  let touchStartY = 0;

  const pad = (value) => String(value).padStart(2, "0");

  const parseInitialSlide = () => {
    const hashMatch = window.location.hash.match(/slide-(\d+)/i);
    if (!hashMatch) return 0;
    const parsed = Number(hashMatch[1]) - 1;
    return Number.isInteger(parsed) && parsed >= 0 && parsed < total ? parsed : 0;
  };

  const fitActiveTitle = (slide) => {
    const title = slide?.querySelector(".slide-heading h2");
    if (!title) return;
    title.style.fontSize = "";
    const minimum = 28;
    let size = Number.parseFloat(getComputedStyle(title).fontSize);
    while (title.scrollWidth > title.clientWidth + 1 && size > minimum) {
      size -= 1;
      title.style.fontSize = `${size}px`;
    }
  };

  const updateInterface = () => {
    const slide = slides[current];
    const progress = ((current + 1) / total) * 100;
    const title = slide.dataset.title || `Slide ${current + 1}`;
    const chapter = slide.dataset.chapter || "Presentation";

    fitActiveTitle(slide);

    currentNumber.textContent = pad(current + 1);
    totalNumber.textContent = pad(total);
    chapterIndex.textContent = chapter;
    chapterTitle.textContent = title;
    topProgress.style.width = `${progress}%`;
    bottomProgress.style.width = `${progress}%`;
    if (previousButton) previousButton.disabled = current === 0;
    if (nextButton) nextButton.disabled = current === total - 1;
    document.body.dataset.chapter = chapter.toLowerCase();
    document.title = `${pad(current + 1)} · ${title} | Group G09`;

    [...mapList.querySelectorAll("button")].forEach((button, index) => {
      button.classList.toggle("is-current", index === current);
      button.setAttribute("aria-current", index === current ? "true" : "false");
    });

    history.replaceState(null, "", `#slide-${current + 1}`);
  };

  const activateSlide = (index) => {
    slides.forEach((slide, slideIndex) => {
      const active = slideIndex === index;
      slide.classList.toggle("is-active", active);
      slide.setAttribute("aria-hidden", active ? "false" : "true");
      if (active) slide.scrollTop = 0;
    });
    current = index;
    updateInterface();
  };

  const fallbackTransition = async (index, direction) => {
    const oldSlide = slides[current];
    const distance = direction > 0 ? -18 : 18;
    await oldSlide.animate(
      [
        { opacity: 1, transform: "translateY(0) scale(1)", filter: "blur(0)" },
        { opacity: 0, transform: `translateY(${distance}px) scale(.988)`, filter: "blur(3px)" },
      ],
      { duration: 380, easing: "cubic-bezier(.35,0,.65,1)", fill: "forwards" },
    ).finished.catch(() => {});

    activateSlide(index);
    const newSlide = slides[current];
    await newSlide.animate(
      [
        { opacity: 0, transform: `translateY(${-distance}px) scale(1.012)`, filter: "blur(3px)" },
        { opacity: 1, transform: "translateY(0) scale(1)", filter: "blur(0)" },
      ],
      { duration: 680, easing: "cubic-bezier(.18,.72,.18,1)", fill: "both" },
    ).finished.catch(() => {});
  };

  const goTo = async (index) => {
    const target = Math.max(0, Math.min(total - 1, index));
    if (target === current && !isTransitioning) return;
    if (isTransitioning) {
      queuedTarget = target;
      return;
    }

    isTransitioning = true;
    const direction = target > current ? 1 : -1;

    try {
      if (typeof document.startViewTransition === "function") {
        const transition = document.startViewTransition(() => activateSlide(target));
        await transition.finished;
      } else {
        await fallbackTransition(target, direction);
      }
    } finally {
      isTransitioning = false;
      const nextTarget = queuedTarget;
      queuedTarget = null;
      if (Number.isInteger(nextTarget) && nextTarget !== current) {
        setTimeout(() => goTo(nextTarget), 0);
      }
    }
  };

  const next = () => goTo(current + 1);
  const previous = () => goTo(current - 1);

  const createOverview = () => {
    mapList.innerHTML = slides.map((slide, index) => {
      const chapter = slide.dataset.chapter || "Presentation";
      const title = slide.dataset.title || `Slide ${index + 1}`;
      return `<button type="button" data-slide-index="${index}"><b>${pad(index + 1)}</b><span><small>${chapter}</small><br>${title}</span></button>`;
    }).join("");

    mapList.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-slide-index]");
      if (!button) return;
      closeOverview();
      goTo(Number(button.dataset.slideIndex));
    });
  };

  const openOverview = () => {
    if (!slideMap) return;
    slideMap.classList.add("is-open");
    slideMap.setAttribute("aria-hidden", "false");
    mapList.querySelector("button.is-current")?.scrollIntoView({ block: "center" });
    closeMapButton?.focus();
  };

  const closeOverview = () => {
    if (!slideMap) return;
    slideMap.classList.remove("is-open");
    slideMap.setAttribute("aria-hidden", "true");
  };

  const openImage = (src, alt) => {
    if (!imageModal || !modalImage) return;
    modalImage.src = src;
    modalImage.alt = alt || "Expanded presentation figure";
    imageModal.classList.add("is-open");
    imageModal.setAttribute("aria-hidden", "false");
    modalClose?.focus();
  };

  const closeImage = () => {
    if (!imageModal || !modalImage) return;
    imageModal.classList.remove("is-open");
    imageModal.setAttribute("aria-hidden", "true");
    modalImage.src = "";
  };

  const fullscreenDocument = (() => {
    try {
      return window.parent !== window && window.parent.document
        ? window.parent.document
        : document;
    } catch {
      return document;
    }
  })();

  const toggleFullscreen = async () => {
    try {
      if (!fullscreenDocument.fullscreenElement) {
        await fullscreenDocument.documentElement.requestFullscreen();
      } else {
        await fullscreenDocument.exitFullscreen();
      }
    } catch {
      // Fullscreen can be blocked by the browser or embedding environment.
    }
  };

  document.addEventListener("keydown", (event) => {
    const modalOpen = imageModal?.classList.contains("is-open");
    const overviewOpen = slideMap?.classList.contains("is-open");

    if (event.key === "Escape") {
      if (modalOpen) closeImage();
      else if (overviewOpen) closeOverview();
      else if (fullscreenDocument.fullscreenElement) fullscreenDocument.exitFullscreen().catch(() => {});
      return;
    }

    if (modalOpen || overviewOpen) return;

    const focusedJump = event.target.closest?.("[data-go]");
    if (focusedJump && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      goTo(Number(focusedJump.dataset.go));
      return;
    }

    const nextKeys = ["ArrowRight", "ArrowDown", "PageDown", " "];
    const previousKeys = ["ArrowLeft", "ArrowUp", "PageUp"];

    if (nextKeys.includes(event.key)) {
      event.preventDefault();
      next();
    } else if (previousKeys.includes(event.key)) {
      event.preventDefault();
      previous();
    } else if (event.key === "Home") {
      event.preventDefault();
      goTo(0);
    } else if (event.key === "End") {
      event.preventDefault();
      goTo(total - 1);
    } else if (event.key.toLowerCase() === "f") {
      event.preventDefault();
      toggleFullscreen();
    } else if (event.key.toLowerCase() === "o") {
      event.preventDefault();
      openOverview();
    }
  });

  document.addEventListener("click", (event) => {
    const goLink = event.target.closest("[data-go]");
    if (goLink) {
      event.preventDefault();
      goTo(Number(goLink.dataset.go));
      return;
    }

    const zoomButton = event.target.closest(".zoom-button");
    if (zoomButton) {
      openImage(zoomButton.dataset.image, zoomButton.dataset.alt);
    }
  });

  document.querySelector(".slide-stage")?.addEventListener("wheel", (event) => {
    if (imageModal?.classList.contains("is-open") || slideMap?.classList.contains("is-open")) return;
    wheelTotal += event.deltaY || event.deltaX;
    clearTimeout(wheelTimer);
    wheelTimer = setTimeout(() => { wheelTotal = 0; }, 170);
    if (Math.abs(wheelTotal) < 100) return;
    wheelTotal > 0 ? next() : previous();
    wheelTotal = 0;
  }, { passive: true });

  document.addEventListener("touchstart", (event) => {
    const touch = event.changedTouches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  }, { passive: true });

  document.addEventListener("touchend", (event) => {
    if (
      imageModal?.classList.contains("is-open") ||
      slideMap?.classList.contains("is-open")
    ) return;

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;

    const mobileView = window.matchMedia(
      "(max-width: 760px), " +
      "(max-width: 900px) and (max-height: 500px) and (orientation: landscape)"
    ).matches;

    if (mobileView) {
      /*
        On phones, vertical movement is reserved for scrolling the content.
        A slide changes only after a clear horizontal swipe.
      */
      const horizontalSwipe =
        Math.abs(deltaX) >= 75 &&
        Math.abs(deltaX) > Math.abs(deltaY) * 1.35;

      if (!horizontalSwipe) return;

      deltaX < 0 ? next() : previous();
      return;
    }

    /*
      Preserve the original behaviour outside the mobile layout,
      so the laptop and desktop presentation are not affected.
    */
    const dominant = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY;
    if (Math.abs(dominant) < 55) return;
    dominant < 0 ? next() : previous();
  }, { passive: true });

  previousButton?.addEventListener("click", previous);
  nextButton?.addEventListener("click", next);
  fullscreenButton?.addEventListener("click", toggleFullscreen);
  overviewButton?.addEventListener("click", openOverview);
  closeMapButton?.addEventListener("click", closeOverview);
  modalClose?.addEventListener("click", closeImage);
  slideMap?.addEventListener("mousedown", (event) => { if (event.target === slideMap) closeOverview(); });
  imageModal?.addEventListener("mousedown", (event) => { if (event.target === imageModal) closeImage(); });

  fullscreenDocument.addEventListener("fullscreenchange", () => {
    if (!fullscreenButton) return;
    fullscreenButton.innerHTML = fullscreenDocument.fullscreenElement
      ? "<span>F</span> Exit"
      : "<span>F</span> Fullscreen";
  });

  window.addEventListener("resize", () => fitActiveTitle(slides[current]));

  window.addEventListener("hashchange", () => {
    const target = parseInitialSlide();
    if (target !== current) goTo(target);
  });

  createOverview();
  activateSlide(parseInitialSlide());

  // Preload presentation graphics so transitions remain smooth during delivery.
  [...document.images].forEach((image) => {
    if (image.complete) return;
    const preload = new Image();
    preload.src = image.src;
  });
})();
