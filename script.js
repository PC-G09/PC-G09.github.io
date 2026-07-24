(() => {
  "use strict";

  const data = window.GPS_EXPLORER_DATA;
  if (!data) return;

  const progressBar = document.querySelector(".reading-progress");
  const chapterLabel = document.querySelector(".presentation-rail strong");

  const updateProgress = () => {
    if (!progressBar) return;
    const height = document.documentElement.scrollHeight - window.innerHeight;
    const progress = height > 0 ? Math.min(100, (window.scrollY / height) * 100) : 0;
    progressBar.style.width = `${progress}%`;
  };

  window.addEventListener("scroll", updateProgress, { passive: true });
  updateProgress();

  if (chapterLabel && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible) {
          chapterLabel.textContent = visible.target.getAttribute("data-label") || "Introduction";
        }
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.2, 0.6] },
    );

    document.querySelectorAll("[data-label]").forEach((section) => observer.observe(section));
  }

  const escapeHtml = (value) =>
    String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const experimentButtons = [...document.querySelectorAll(".experiment-tabs button")];
  const experimentPanel = document.querySelector("#experiment-panel");

  const renderExperiment = (experiment) => {
    if (!experimentPanel) return;

    const figures = [
      `<figure><img src="${escapeHtml(experiment.image)}" alt="${escapeHtml(experiment.alt)}"></figure>`,
    ];

    if (experiment.extraImage) {
      figures.push(
        `<figure><img src="${escapeHtml(experiment.extraImage)}" alt="${escapeHtml(experiment.extraAlt || "")}"></figure>`,
      );
    }

    experimentPanel.innerHTML = `
      <div class="experiment-copy">
        <p>Experiment ${escapeHtml(experiment.id)}</p>
        <h3>${escapeHtml(experiment.factor)}</h3>
        <dl>
          <div><dt>Fixed</dt><dd>The other five scheduling factors</dd></div>
          <div><dt>Observed trend</dt><dd>${escapeHtml(experiment.trend)}</dd></div>
          <div><dt>Performance gap</dt><dd>${escapeHtml(experiment.gap)}</dd></div>
          <div><dt>Authors’ explanation</dt><dd>${escapeHtml(experiment.reason)}</dd></div>
        </dl>
      </div>
      <div class="experiment-figures${experiment.extraImage ? " has-two" : ""}">
        ${figures.join("")}
      </div>
    `;
  };

  experimentButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
      experimentButtons.forEach((item) => item.setAttribute("aria-selected", "false"));
      button.setAttribute("aria-selected", "true");
      const experiment = data.experiments[index];
      if (experiment) renderExperiment(experiment);
    });
  });

  const algorithmButtons = [
    ...document.querySelectorAll(".algorithm-card .algorithm-image-wrap button"),
  ];

  let activeModal = null;

  const closeModal = () => {
    if (!activeModal) return;
    activeModal.remove();
    activeModal = null;
  };

  const openModal = (algorithm) => {
    closeModal();

    const modal = document.createElement("div");
    modal.className = "algorithm-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", `${algorithm.title} pseudocode`);
    modal.innerHTML = `
      <div class="algorithm-modal-card">
        <div>
          <p>Algorithm ${escapeHtml(algorithm.number)}</p>
          <h2>${escapeHtml(algorithm.title)}</h2>
          <button type="button" aria-label="Close pseudocode">×</button>
        </div>
        <img src="${escapeHtml(algorithm.image)}" alt="${escapeHtml(algorithm.title)} pseudocode from the paper at full size">
      </div>
    `;

    modal.addEventListener("mousedown", (event) => {
      if (event.target === modal) closeModal();
    });
    modal.querySelector("button")?.addEventListener("click", closeModal);

    document.body.appendChild(modal);
    activeModal = modal;
    modal.querySelector("button")?.focus();
  };

  algorithmButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
      const algorithm = data.algorithms[index];
      if (algorithm) openModal(algorithm);
    });
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeModal();
  });
})();
