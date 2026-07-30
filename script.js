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
    } else if ((event.code === "KeyF" || event.key.toLowerCase() === "f")) {
      event.preventDefault();
      toggleFullscreen();
    } else if ((event.code === "KeyO" || event.key.toLowerCase() === "o")) {
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





/* SLIDE20_CORRECT_COMMON_TITLE_JS_START */

(() => {
  "use strict";

  const slideSelector = "#slide-22";

  const summarySelector =
    "#slide-22 .experiment-summary";

  const titleSelector =
    "#slide-22 .experiment-summary > article > h3";

  const expectedTitles = [
    "Randomized Benchmark",
    "One-Factor-at-a-Time Sensitivity"
  ];

  let pendingFrame = 0;
  let calculationInProgress = false;


  function normalizeText(value) {
    return String(value)
      .replace(/\s+/g, " ")
      .trim();
  }


  function findTargetTitles() {
    const availableTitles = Array.from(
      document.querySelectorAll(titleSelector)
    );

    return expectedTitles.map((expectedText) => {
      return (
        availableTitles.find((title) => {
          return (
            normalizeText(title.textContent) ===
            expectedText
          );
        }) || null
      );
    });
  }


  function parsePixelValue(value) {
    const parsedValue = parseFloat(value);

    return Number.isFinite(parsedValue)
      ? parsedValue
      : 0;
  }


  /*
    عرض قابل‌استفاده داخل کارت محاسبه می‌شود.

    اندازه از خود کارت خوانده می‌شود، نه از عنوان؛
    بنابراین nowrap نمی‌تواند روی اندازه کارت اثر بگذارد.
  */
  function getAvailableCardWidth(card) {
    const style = window.getComputedStyle(card);

    const horizontalPadding =
      parsePixelValue(style.paddingLeft) +
      parsePixelValue(style.paddingRight);

    const horizontalBorders =
      parsePixelValue(style.borderLeftWidth) +
      parsePixelValue(style.borderRightWidth);

    return Math.max(
      0,
      card.getBoundingClientRect().width -
        horizontalPadding -
        horizontalBorders -
        4
    );
  }


  /*
    یک عنصر نامرئی برای اندازه‌گیری دقیق عرض متن می‌سازیم.
    چون position: fixed دارد، هیچ تأثیری روی Layout ندارد.
  */
  function createTextMeasurer() {
    const measurer = document.createElement("span");

    measurer.setAttribute("aria-hidden", "true");

    Object.assign(measurer.style, {
      position: "fixed",
      left: "-100000px",
      top: "-100000px",
      width: "max-content",
      maxWidth: "none",
      margin: "0",
      padding: "0",
      border: "0",
      visibility: "hidden",
      pointerEvents: "none",
      whiteSpace: "nowrap"
    });

    document.body.appendChild(measurer);

    return measurer;
  }


  function copyTypography(source, destination) {
    const style = window.getComputedStyle(source);

    destination.style.fontFamily =
      style.fontFamily;

    destination.style.fontWeight =
      style.fontWeight;

    destination.style.fontStyle =
      style.fontStyle;

    destination.style.fontStretch =
      style.fontStretch;

    destination.style.fontVariant =
      style.fontVariant;

    destination.style.fontKerning =
      style.fontKerning;

    destination.style.fontFeatureSettings =
      style.fontFeatureSettings;

    destination.style.letterSpacing =
      style.letterSpacing;

    destination.style.textTransform =
      style.textTransform;
  }


  function measureTextWidth(
    measurer,
    title,
    fontSize
  ) {
    copyTypography(title, measurer);

    measurer.textContent = normalizeText(
      title.textContent
    );

    measurer.style.fontSize =
      `${fontSize}px`;

    return measurer
      .getBoundingClientRect()
      .width;
  }


  function fitSlide20Titles() {
    if (calculationInProgress) {
      return;
    }

    const slide = document.querySelector(
      slideSelector
    );

    const summary = document.querySelector(
      summarySelector
    );

    if (!slide || !summary) {
      return;
    }

    const titles = findTargetTitles();

    if (titles.some((title) => !title)) {
      return;
    }

    const cards = titles.map((title) => {
      return title.closest("article");
    });

    if (cards.some((card) => !card)) {
      return;
    }

    calculationInProgress = true;


    /*
      اندازه inline قبلی پاک می‌شود تا اندازه اصلی طراحی
      از فایل CSS خوانده شود.
    */
    titles.forEach((title) => {
      title.style.removeProperty("font-size");
    });


    /*
      مرورگر Layout اصلی کارت‌ها را تکمیل می‌کند.
    */
    void summary.offsetWidth;


    const availableWidths = cards.map(
      getAvailableCardWidth
    );


    const originalFontSizes = titles.map(
      (title) => {
        return parsePixelValue(
          window
            .getComputedStyle(title)
            .fontSize
        );
      }
    );


    if (
      availableWidths.some(
        (width) => width <= 0
      ) ||
      originalFontSizes.some(
        (size) => size <= 0
      )
    ) {
      calculationInProgress = false;
      return;
    }


    /*
      اندازه هر دو عنوان باید یکسان باشد.

      اندازه اصلی کوچک‌تر بین دو عنوان، سقف طراحی است.
    */
    const designMaximum = Math.min(
      ...originalFontSizes
    );


    const measurer = createTextMeasurer();


    /*
      برای هر عنوان محاسبه می‌شود که با چه فونتی
      در عرض واقعی کارت خودش جا می‌شود.
    */
    const maximumAllowedSizes = titles.map(
      (title, index) => {
        const measuredWidth =
          measureTextWidth(
            measurer,
            title,
            designMaximum
          );

        if (measuredWidth <= 0) {
          return designMaximum;
        }

        return Math.min(
          designMaximum,
          designMaximum *
            availableWidths[index] /
            measuredWidth
        );
      }
    );


    /*
      کوچک‌ترین مقدار مجاز، اندازه مشترک دو عنوان می‌شود.
    */
    let finalSize = Math.min(
      designMaximum,
      ...maximumAllowedSizes
    );


    /*
      حاشیه بسیار کم برای خطای Subpixel مرورگر.
    */
    finalSize *= 0.996;


    if (
      !Number.isFinite(finalSize) ||
      finalSize <= 0
    ) {
      measurer.remove();
      calculationInProgress = false;
      return;
    }


    titles.forEach((title) => {
      title.style.fontSize =
        `${finalSize.toFixed(2)}px`;
    });


    /*
      کنترل نهایی روی عنصر واقعی.

      اگر به‌دلیل گردکردن مرورگر هنوز نیم‌پیکسل
      بیرون‌زدگی وجود داشت، فونت فقط 0.05px کم می‌شود.
    */
    let correctionCount = 0;

    while (
      correctionCount < 30 &&
      titles.some((title) => {
        return (
          title.scrollWidth >
          title.clientWidth + 0.5
        );
      })
    ) {
      finalSize -= 0.05;

      titles.forEach((title) => {
        title.style.fontSize =
          `${finalSize.toFixed(2)}px`;
      });

      correctionCount += 1;
    }


    measurer.remove();
    calculationInProgress = false;
  }


  function scheduleTitleFit() {
    window.cancelAnimationFrame(
      pendingFrame
    );

    pendingFrame =
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(
          fitSlide20Titles
        );
      });
  }


  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      scheduleTitleFit,
      { once: true }
    );
  } else {
    scheduleTitleFit();
  }


  if (
    document.fonts &&
    document.fonts.ready
  ) {
    document.fonts.ready.then(
      scheduleTitleFit
    );
  }


  if (
    window.MathJax &&
    window.MathJax.startup &&
    window.MathJax.startup.promise
  ) {
    window.MathJax.startup.promise.then(
      scheduleTitleFit
    );
  }


  window.addEventListener(
    "resize",
    scheduleTitleFit,
    { passive: true }
  );


  const slide20 = document.querySelector(
    slideSelector
  );

  if (
    slide20 &&
    "MutationObserver" in window
  ) {
    const observer = new MutationObserver(
      scheduleTitleFit
    );

    observer.observe(slide20, {
      attributes: true,
      attributeFilter: [
        "class",
        "aria-hidden"
      ]
    });
  }


  const experimentSummary =
    document.querySelector(
      summarySelector
    );

  if (
    experimentSummary &&
    "ResizeObserver" in window
  ) {
    const observer = new ResizeObserver(
      scheduleTitleFit
    );

    observer.observe(experimentSummary);
  }
})();

/* SLIDE20_CORRECT_COMMON_TITLE_JS_END */

/* SLIDES3_12_COMMON_TITLE_FIT_JS_START */

(() => {
  "use strict";


  /*
    applySelector:
      تمام عنوان‌هایی که باید یک اندازه شوند.

    constraintSelector:
      عنوان‌هایی که محدودیت نهایی اندازه را تعیین می‌کنند.
  */
  const groups = [
    {
      name: "slide-3",
      slideSelector: "#slide-3",
      containerSelector:
        "#slide-3 .evolution-flow",

      applySelector:
        "#slide-3 .evolution-flow > article > h3",

      constraintSelector:
        "#slide-3 .evolution-flow > article > h3",

      expectedApplyCount: 3,
      expectedConstraintCount: 3
    },

    {
      name: "slide-14",
      slideSelector: "#slide-14",
      containerSelector:
        "#slide-14 .audit-grid",

      applySelector:
        "#slide-14 .audit-grid > article > h3",

      constraintSelector:
        "#slide-14 .audit-grid " +
        "> article:nth-of-type(2) > h3, " +
        "#slide-14 .audit-grid " +
        "> article:nth-of-type(3) > h3",

      expectedApplyCount: 3,
      expectedConstraintCount: 2
    }
  ];


  let pendingFrame = 0;
  let calculationInProgress = false;


  function parsePixelValue(value) {
    const parsed = parseFloat(value);

    return Number.isFinite(parsed)
      ? parsed
      : 0;
  }


  function normalizeText(value) {
    return String(value)
      .replace(/\s+/g, " ")
      .trim();
  }


  /*
    عرض واقعی فضای داخلی کارت.

    عرض از خود article خوانده می‌شود، نه از h3؛
    بنابراین متن nowrap نمی‌تواند اندازه کارت را تغییر دهد.
  */
  function getAvailableCardWidth(card) {
    const style = window.getComputedStyle(card);

    const padding =
      parsePixelValue(style.paddingLeft) +
      parsePixelValue(style.paddingRight);

    const borders =
      parsePixelValue(style.borderLeftWidth) +
      parsePixelValue(style.borderRightWidth);

    return Math.max(
      0,
      card.getBoundingClientRect().width -
        padding -
        borders -
        4
    );
  }


  /*
    عنصر اندازه‌گیری خارج از Layout سایت قرار می‌گیرد.
  */
  function createTextMeasurer() {
    const measurer = document.createElement("span");

    measurer.setAttribute(
      "aria-hidden",
      "true"
    );

    Object.assign(measurer.style, {
      position: "fixed",
      left: "-100000px",
      top: "-100000px",

      width: "max-content",
      maxWidth: "none",

      margin: "0",
      padding: "0",
      border: "0",

      visibility: "hidden",
      pointerEvents: "none",

      whiteSpace: "nowrap"
    });

    document.body.appendChild(measurer);

    return measurer;
  }


  function copyTypography(source, destination) {
    const style = window.getComputedStyle(source);

    destination.style.fontFamily =
      style.fontFamily;

    destination.style.fontWeight =
      style.fontWeight;

    destination.style.fontStyle =
      style.fontStyle;

    destination.style.fontStretch =
      style.fontStretch;

    destination.style.fontVariant =
      style.fontVariant;

    destination.style.fontKerning =
      style.fontKerning;

    destination.style.fontFeatureSettings =
      style.fontFeatureSettings;

    destination.style.letterSpacing =
      style.letterSpacing;

    destination.style.wordSpacing =
      style.wordSpacing;

    destination.style.textTransform =
      style.textTransform;
  }


  function measureTextWidth(
    measurer,
    title,
    fontSize
  ) {
    copyTypography(title, measurer);

    measurer.textContent = normalizeText(
      title.textContent
    );

    measurer.style.fontSize =
      `${fontSize}px`;

    return measurer
      .getBoundingClientRect()
      .width;
  }


  function fitOneGroup(group) {
    const slide = document.querySelector(
      group.slideSelector
    );

    const container = document.querySelector(
      group.containerSelector
    );

    if (!slide || !container) {
      return;
    }


    const applyTitles = Array.from(
      document.querySelectorAll(
        group.applySelector
      )
    );

    const constraintTitles = Array.from(
      document.querySelectorAll(
        group.constraintSelector
      )
    );


    if (
      applyTitles.length !==
        group.expectedApplyCount ||
      constraintTitles.length !==
        group.expectedConstraintCount
    ) {
      return;
    }


    const constraintCards =
      constraintTitles.map((title) => {
        return title.closest("article");
      });


    if (
      constraintCards.some(
        (card) => !card
      )
    ) {
      return;
    }


    /*
      اندازه‌های محاسبه‌شده قبلی حذف می‌شوند تا
      اندازه اصلی طراحی از CSS خوانده شود.
    */
    applyTitles.forEach((title) => {
      title.style.removeProperty(
        "font-size"
      );
    });


    /*
      تکمیل Layout اصلی کارت‌ها.
    */
    void container.offsetWidth;


    /*
      سقف اندازه، کوچک‌ترین اندازه اصلی میان تمام
      عنوان‌های همان اسلاید است.
    */
    const originalFontSizes =
      applyTitles.map((title) => {
        return parsePixelValue(
          window
            .getComputedStyle(title)
            .fontSize
        );
      });


    if (
      originalFontSizes.some(
        (size) => size <= 0
      )
    ) {
      return;
    }


    const designMaximum = Math.min(
      ...originalFontSizes
    );


    const availableWidths =
      constraintCards.map(
        getAvailableCardWidth
      );


    if (
      availableWidths.some(
        (width) => width <= 0
      )
    ) {
      return;
    }


    const measurer = createTextMeasurer();


    /*
      برای هر عنوان محدودکننده مشخص می‌شود
      حداکثر چه اندازه‌ای در کارت خودش جا می‌شود.
    */
    const permittedSizes =
      constraintTitles.map(
        (title, index) => {
          const measuredWidth =
            measureTextWidth(
              measurer,
              title,
              designMaximum
            );


          if (measuredWidth <= 0) {
            return designMaximum;
          }


          return Math.min(
            designMaximum,

            designMaximum *
              availableWidths[index] /
              measuredWidth
          );
        }
      );


    /*
      کوچک‌ترین اندازه مجاز، اندازه مشترک تمام
      عنوان‌های همان اسلاید می‌شود.
    */
    let finalSize = Math.min(
      designMaximum,
      ...permittedSizes
    );


    /*
      حاشیه بسیار کم برای خطاهای Subpixel.
    */
    finalSize *= 0.996;


    if (
      !Number.isFinite(finalSize) ||
      finalSize <= 0
    ) {
      measurer.remove();
      return;
    }


    applyTitles.forEach((title) => {
      title.style.fontSize =
        `${finalSize.toFixed(2)}px`;
    });


    /*
      کنترل نهایی فقط روی عنوان‌های محدودکننده.

      اگر به‌علت گردکردن مرورگر هنوز بیرون‌زدگی
      وجود داشته باشد، اندازه با گام 0.05px کم می‌شود.
    */
    let correctionCount = 0;

    while (
      correctionCount < 40 &&
      constraintTitles.some((title) => {
        return (
          title.scrollWidth >
          title.clientWidth + 0.5
        );
      })
    ) {
      finalSize -= 0.05;

      applyTitles.forEach((title) => {
        title.style.fontSize =
          `${finalSize.toFixed(2)}px`;
      });

      correctionCount += 1;
    }


    measurer.remove();
  }


  function fitAllGroups() {
    if (calculationInProgress) {
      return;
    }

    calculationInProgress = true;

    try {
      groups.forEach(fitOneGroup);
    } finally {
      calculationInProgress = false;
    }
  }


  function scheduleFit() {
    window.cancelAnimationFrame(
      pendingFrame
    );

    pendingFrame =
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(
          fitAllGroups
        );
      });
  }


  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      scheduleFit,
      { once: true }
    );
  } else {
    scheduleFit();
  }


  /*
    محاسبه مجدد پس از بارگذاری فونت‌ها.
  */
  if (
    document.fonts &&
    document.fonts.ready
  ) {
    document.fonts.ready.then(
      scheduleFit
    );
  }


  /*
    محاسبه مجدد پس از MathJax.
  */
  if (
    window.MathJax &&
    window.MathJax.startup &&
    window.MathJax.startup.promise
  ) {
    window.MathJax.startup.promise.then(
      scheduleFit
    );
  }


  window.addEventListener(
    "resize",
    scheduleFit,
    { passive: true }
  );


  /*
    وقتی هر اسلاید فعال می‌شود، اندازه‌گیری تکرار می‌شود.
  */
  groups.forEach((group) => {
    const slide = document.querySelector(
      group.slideSelector
    );

    if (
      slide &&
      "MutationObserver" in window
    ) {
      const mutationObserver =
        new MutationObserver(
          scheduleFit
        );

      mutationObserver.observe(slide, {
        attributes: true,
        attributeFilter: [
          "class",
          "aria-hidden"
        ]
      });
    }
  });


  /*
    فقط تغییر عرض containerها بررسی می‌شود.

    تغییر ارتفاع ناشی از فونت باعث حلقه محاسباتی نمی‌شود.
  */
  if ("ResizeObserver" in window) {
    const lastWidths = new WeakMap();

    const resizeObserver =
      new ResizeObserver((entries) => {
        let widthChanged = false;

        entries.forEach((entry) => {
          const newWidth =
            entry.contentRect.width;

          const oldWidth =
            lastWidths.get(entry.target);

          if (
            oldWidth === undefined ||
            Math.abs(newWidth - oldWidth) > 0.5
          ) {
            lastWidths.set(
              entry.target,
              newWidth
            );

            widthChanged = true;
          }
        });


        if (widthChanged) {
          scheduleFit();
        }
      });


    groups.forEach((group) => {
      const container =
        document.querySelector(
          group.containerSelector
        );

      if (container) {
        resizeObserver.observe(container);
      }
    });
  }
})();

/* SLIDES3_12_COMMON_TITLE_FIT_JS_END */

/* SLIDE13_EVENT_RULES_COMMON_TITLE_JS_START */

(() => {
  "use strict";

  const slideSelector = "#slide-15";

  const rulesSelector =
    "#slide-15 .event-rules";

  const textSelector =
    "#slide-15 .event-rules > div > strong";

  const expectedTexts = [
    "Highest proficiency in the required skill",
    "Earliest-finishing task completes and releases resources",
    "Latest-finishing task and its latest-finishing skill"
  ];

  let pendingFrame = 0;
  let calculationInProgress = false;


  function normalizeText(value) {
    return String(value)
      .replace(/\s+/g, " ")
      .trim();
  }


  function parsePixelValue(value) {
    const parsed = parseFloat(value);

    return Number.isFinite(parsed)
      ? parsed
      : 0;
  }


  function findTargetTexts() {
    const candidates = Array.from(
      document.querySelectorAll(textSelector)
    );

    return expectedTexts.map((expectedText) => {
      return (
        candidates.find((element) => {
          return (
            normalizeText(element.textContent) ===
            expectedText
          );
        }) || null
      );
    });
  }


  /*
    عرض داخلی هر سلول نوار از خود والد خوانده می‌شود.
    بنابراین اندازه ذاتی متن nowrap روی محاسبه اثر نمی‌گذارد.
  */
  function getAvailableWidth(element) {
    const cell = element.parentElement;

    if (!cell) {
      return 0;
    }

    const style = window.getComputedStyle(cell);

    const horizontalPadding =
      parsePixelValue(style.paddingLeft) +
      parsePixelValue(style.paddingRight);

    const horizontalBorders =
      parsePixelValue(style.borderLeftWidth) +
      parsePixelValue(style.borderRightWidth);

    return Math.max(
      0,
      cell.getBoundingClientRect().width -
        horizontalPadding -
        horizontalBorders -
        3
    );
  }


  /*
    عنصر اندازه‌گیری کاملاً خارج از Layout قرار می‌گیرد.
  */
  function createMeasurer() {
    const measurer = document.createElement("span");

    measurer.setAttribute("aria-hidden", "true");

    Object.assign(measurer.style, {
      position: "fixed",
      left: "-100000px",
      top: "-100000px",

      width: "max-content",
      maxWidth: "none",

      margin: "0",
      padding: "0",
      border: "0",

      visibility: "hidden",
      pointerEvents: "none",
      whiteSpace: "nowrap"
    });

    document.body.appendChild(measurer);

    return measurer;
  }


  function copyTypography(source, destination) {
    const style = window.getComputedStyle(source);

    destination.style.fontFamily =
      style.fontFamily;

    destination.style.fontWeight =
      style.fontWeight;

    destination.style.fontStyle =
      style.fontStyle;

    destination.style.fontStretch =
      style.fontStretch;

    destination.style.fontVariant =
      style.fontVariant;

    destination.style.fontKerning =
      style.fontKerning;

    destination.style.fontFeatureSettings =
      style.fontFeatureSettings;

    destination.style.letterSpacing =
      style.letterSpacing;

    destination.style.wordSpacing =
      style.wordSpacing;

    destination.style.textTransform =
      style.textTransform;
  }


  function measureTextWidth(
    measurer,
    source,
    fontSize
  ) {
    copyTypography(source, measurer);

    measurer.textContent = normalizeText(
      source.textContent
    );

    measurer.style.fontSize =
      `${fontSize}px`;

    return measurer
      .getBoundingClientRect()
      .width;
  }


  function fitSlide13EventRuleTexts() {
    if (calculationInProgress) {
      return;
    }

    const slide = document.querySelector(
      slideSelector
    );

    const rules = document.querySelector(
      rulesSelector
    );

    if (!slide || !rules) {
      return;
    }

    const elements = findTargetTexts();

    if (elements.some((element) => !element)) {
      return;
    }

    calculationInProgress = true;


    /*
      اندازه محاسبه‌شده قبلی حذف می‌شود تا اندازه اصلی
      طراحی برای viewport فعلی خوانده شود.
    */
    elements.forEach((element) => {
      element.style.removeProperty("font-size");
    });


    void rules.offsetWidth;


    const originalSizes = elements.map((element) => {
      return parsePixelValue(
        window
          .getComputedStyle(element)
          .fontSize
      );
    });


    const availableWidths = elements.map(
      getAvailableWidth
    );


    if (
      originalSizes.some((size) => size <= 0) ||
      availableWidths.some((width) => width <= 0)
    ) {
      calculationInProgress = false;
      return;
    }


    /*
      سقف طراحی، کوچک‌ترین اندازه اصلی میان سه متن است.
    */
    const designMaximum = Math.min(
      ...originalSizes
    );


    const measurer = createMeasurer();


    /*
      حداکثر اندازه مجاز برای هر متن محاسبه می‌شود.
    */
    const permittedSizes = elements.map(
      (element, index) => {
        const measuredWidth = measureTextWidth(
          measurer,
          element,
          designMaximum
        );

        if (measuredWidth <= 0) {
          return designMaximum;
        }

        return Math.min(
          designMaximum,
          designMaximum *
            availableWidths[index] /
            measuredWidth
        );
      }
    );


    /*
      کوچک‌ترین محدودیت، اندازه مشترک هر سه متن است.
    */
    let finalSize = Math.min(
      designMaximum,
      ...permittedSizes
    );


    /*
      حاشیه بسیار کم برای خطای Subpixel مرورگر.
    */
    finalSize *= 0.997;


    if (
      !Number.isFinite(finalSize) ||
      finalSize <= 0
    ) {
      measurer.remove();
      calculationInProgress = false;
      return;
    }


    elements.forEach((element) => {
      element.style.fontSize =
        `${finalSize.toFixed(2)}px`;
    });


    /*
      کنترل نهایی روی عناصر واقعی؛ بدون تغییر ابعاد باکس.
    */
    let correctionCount = 0;

    while (
      correctionCount < 40 &&
      elements.some((element) => {
        return (
          element.scrollWidth >
          element.clientWidth + 0.5
        );
      })
    ) {
      finalSize -= 0.05;

      elements.forEach((element) => {
        element.style.fontSize =
          `${finalSize.toFixed(2)}px`;
      });

      correctionCount += 1;
    }


    measurer.remove();
    calculationInProgress = false;
  }


  function scheduleFit() {
    window.cancelAnimationFrame(
      pendingFrame
    );

    pendingFrame =
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(
          fitSlide13EventRuleTexts
        );
      });
  }


  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      scheduleFit,
      { once: true }
    );
  } else {
    scheduleFit();
  }


  if (
    document.fonts &&
    document.fonts.ready
  ) {
    document.fonts.ready.then(
      scheduleFit
    );
  }


  window.addEventListener(
    "resize",
    scheduleFit,
    { passive: true }
  );


  const slide13 = document.querySelector(
    slideSelector
  );

  if (
    slide13 &&
    "MutationObserver" in window
  ) {
    const mutationObserver =
      new MutationObserver(
        scheduleFit
      );

    mutationObserver.observe(slide13, {
      attributes: true,
      attributeFilter: [
        "class",
        "aria-hidden"
      ]
    });
  }


  const eventRules = document.querySelector(
    rulesSelector
  );

  if (
    eventRules &&
    "ResizeObserver" in window
  ) {
    let previousWidth = 0;

    const resizeObserver =
      new ResizeObserver((entries) => {
        const currentWidth =
          entries[0]?.contentRect.width || 0;

        if (
          Math.abs(
            currentWidth - previousWidth
          ) > 0.5
        ) {
          previousWidth = currentWidth;
          scheduleFit();
        }
      });

    resizeObserver.observe(eventRules);
  }
})();

/* SLIDE13_EVENT_RULES_COMMON_TITLE_JS_END */
