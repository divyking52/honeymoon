/* Elysian Escapes — shared page motion */
(function () {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));
  const root = document.documentElement;

  const narrow = window.matchMedia("(max-width: 800px)");
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  let lenis = null;
  function syncLenis() {
    const want = !reduced && !narrow.matches && typeof Lenis === "function";
    if (want && !lenis) {
      lenis = new Lenis({
        autoRaf: false,
        duration: 1.15,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true
      });
    } else if (!want && lenis) {
      try { lenis.destroy(); } catch (_) {}
      lenis = null;
      document.documentElement.classList.remove("lenis", "lenis-smooth");
    }
  }
  syncLenis();
  narrow.addEventListener("change", syncLenis);

  const nav = $("#nav");
  const toggle = $(".nav-toggle", nav);
  const toTop = $("#to-top");

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    $$(".nav-menu a", nav).forEach((a) => {
      a.addEventListener("click", () => {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  const reveals = $$("[data-reveal]");
  const io = "IntersectionObserver" in window
    ? new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" })
    : null;

  if (io && !reduced) reveals.forEach((el) => io.observe(el));
  else reveals.forEach((el) => el.classList.add("is-in"));

  function tick(time) {
    if (lenis) lenis.raf(time);
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const y = lenis ? lenis.scroll : window.scrollY || window.pageYOffset;
    root.style.setProperty("--page", String(Math.min(1, y / max)));
    if (nav) nav.classList.toggle("is-scrolled", y > 24);
    if (toTop) toTop.classList.toggle("is-on", y > 500);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  if (toTop) {
    toTop.addEventListener("click", () => {
      if (lenis) lenis.scrollTo(0, { duration: 1.2 });
      else window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    });
  }

  $$(".magnetic").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      if (reduced) return;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * 0.18;
      const y = (e.clientY - r.top - r.height / 2) * 0.22;
      el.style.transform = `translate(${x}px, ${y}px)`;
    });
    el.addEventListener("pointerleave", () => {
      el.style.transform = "";
    });
  });

  $$("[data-book], [data-tier]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const dest = btn.dataset.book || "";
      const tier = btn.dataset.tier || "";
      const params = new URLSearchParams();
      if (dest) params.set("destination", dest);
      if (tier) params.set("tier", tier);
      const q = params.toString();
      window.location.href = "plan.html" + (q ? "?" + q : "");
    });
  });

  $$(".dest-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.closest("a, button")) return;
      if (!narrow.matches && fine) return;
      card.classList.toggle("is-flipped");
    });
  });

  const planForm = $("#plan-form");
  if (planForm) {
    const params = new URLSearchParams(window.location.search);
    const dest = params.get("destination");
    const tier = params.get("tier");
    const destEl = $("#dest-plan");
    const msg = $("#feel-plan");
    if (dest && destEl) destEl.value = dest;
    if (tier && msg && !msg.value) msg.value = "We are interested in the " + tier + " tier.";

    planForm.addEventListener("submit", (e) => {
      e.preventDefault();
      let ok = true;
      $$(".field", planForm).forEach((field) => {
        const control = $("input, select, textarea", field);
        if (!control) return;
        const valid = control.checkValidity();
        field.classList.toggle("is-invalid", !valid);
        if (!valid) ok = false;
      });
      const live = $("#form-live");
      if (!ok) {
        if (live) live.textContent = "A few fields still need an answer.";
        return;
      }
      planForm.hidden = true;
      const success = $("#form-success");
      if (success) success.hidden = false;
      if (live) live.textContent = "Note sent. A planner will write within one working day.";
    });
  }

  const news = $("#news-form");
  if (news) {
    news.addEventListener("submit", (e) => {
      e.preventDefault();
      const note = $("#news-note");
      if (note) note.textContent = "You are on the quiet list.";
      news.reset();
    });
  }
})();
