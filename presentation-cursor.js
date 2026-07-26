(() => {
    "use strict";

    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (!finePointer.matches) return;
    if (document.querySelector(".presentation-pointer")) return;

    const root = document.documentElement;

    const pointer = document.createElement("div");
    pointer.className = "presentation-pointer";
    pointer.setAttribute("aria-hidden", "true");

    const glow = document.createElement("div");
    glow.className = "presentation-pointer-glow";
    glow.setAttribute("aria-hidden", "true");

    document.body.append(glow, pointer);
    root.classList.add("presentation-pointer-ready");

    const palettes = {
        opening: "255, 84, 112",
        problem: "255, 106, 64",
        model: "118, 89, 255",
        method: "39, 174, 255",
        evidence: "25, 201, 151",
        assessment: "255, 184, 59",
        closing: "196, 110, 255",
        default: "255, 84, 112"
    };

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let pointerX = targetX;
    let pointerY = targetY;
    let glowX = targetX;
    let glowY = targetY;
    let pointerSize = 10;
    let glowSize = 68;
    let visible = false;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function normalizeChapter(value) {
        return String(value || "")
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9_-]+/g, "");
    }

    function findCurrentChapter() {
        const candidates = [
            root.dataset.chapter,
            document.body.dataset.chapter,
            document.querySelector(".slide.active, .slide.is-active, [data-active='true'], [aria-hidden='false'][data-chapter]")?.dataset.chapter,
            document.querySelector(".slide.active, .slide.is-active, [data-active='true']")?.closest("[data-chapter]")?.dataset.chapter
        ];

        for (const candidate of candidates) {
            const chapter = normalizeChapter(candidate);
            if (chapter && palettes[chapter]) return chapter;
        }

        return "default";
    }

    function applyPalette() {
        const chapter = findCurrentChapter();
        root.style.setProperty("--pointer-rgb", palettes[chapter] || palettes.default);
    }

    function setVisible(state) {
        visible = state;
        pointer.classList.toggle("is-visible", state);
        glow.classList.toggle("is-visible", state);
    }

    function isInteractive(target) {
        if (!(target instanceof Element)) return false;

        return Boolean(
            target.closest(
                "a, button, input, select, textarea, summary, label, [role='button'], [role='link'], [tabindex]:not([tabindex='-1']), .clickable, .interactive"
            )
        );
    }

    function isTextual(target) {
        if (!(target instanceof Element)) return false;

        const textElement = target.closest(
            "p, span, li, dt, dd, blockquote, cite, small, strong, em, code, pre, figcaption, h1, h2, h3, h4, h5, h6, td, th, .caption, .label, .text, .subtitle"
        );

        if (!textElement) return false;
        if (isInteractive(target)) return false;

        return true;
    }

    function onMove(event) {
        if (event.pointerType && event.pointerType !== "mouse") return;

        targetX = event.clientX;
        targetY = event.clientY;

        if (!visible) {
            pointerX = targetX;
            pointerY = targetY;
            glowX = targetX;
            glowY = targetY;
            setVisible(true);
        }

        const interactive = isInteractive(event.target);
        const overText = isTextual(event.target);

        pointer.classList.toggle("is-interactive", interactive);
        pointer.classList.toggle("is-over-text", overText);

        glow.classList.toggle("is-pressed", false);
        glow.classList.toggle("is-over-text", overText);
    }

    function onDown(event) {
        if (event.pointerType && event.pointerType !== "mouse") return;
        pointer.classList.add("is-pressed");
        glow.classList.add("is-pressed");
    }

    function onUp() {
        pointer.classList.remove("is-pressed");
        glow.classList.remove("is-pressed");
    }

    function onLeave() {
        setVisible(false);
        onUp();
        pointer.classList.remove("is-interactive", "is-over-text");
        glow.classList.remove("is-over-text");
    }

    function readSizes() {
        pointerSize = pointer.getBoundingClientRect().width || 10;
        glowSize = glow.getBoundingClientRect().width || 68;
    }

    function animate() {
        const pointerEase = reducedMotion ? 1 : 0.54;
        const glowEase = reducedMotion ? 1 : 0.15;

        pointerX += (targetX - pointerX) * pointerEase;
        pointerY += (targetY - pointerY) * pointerEase;
        glowX += (targetX - glowX) * glowEase;
        glowY += (targetY - glowY) * glowEase;

        readSizes();

        pointer.style.transform =
            `translate3d(${pointerX - pointerSize / 2}px, ${pointerY - pointerSize / 2}px, 0)`;

        glow.style.transform =
            `translate3d(${glowX - glowSize / 2}px, ${glowY - glowSize / 2}px, 0)`;

        requestAnimationFrame(animate);
    }

    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerdown", onDown, { passive: true });
    document.addEventListener("pointerup", onUp, { passive: true });
    document.addEventListener("pointercancel", onUp, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave, { passive: true });

    window.addEventListener("blur", onLeave);
    window.addEventListener("resize", readSizes, { passive: true });

    const observer = new MutationObserver(applyPalette);
    observer.observe(root, {
        attributes: true,
        attributeFilter: ["data-chapter"],
        childList: true,
        subtree: true
    });

    observer.observe(document.body, {
        attributes: true,
        attributeFilter: ["data-chapter"]
    });

    applyPalette();
    readSizes();
    requestAnimationFrame(animate);
})();
