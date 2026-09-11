(function () {
  "use strict";

  var data = window.__BRAND__ || {};
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fineHover = matchMedia("(hover: hover) and (pointer: fine)").matches;

  function $(sel, scope) { return (scope || document).querySelector(sel); }
  function $$(sel, scope) { return Array.from((scope || document).querySelectorAll(sel)); }
  function escHTML(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function safe(fn, name) {
    try { fn(); } catch (e) { console.warn("[" + name + "] failed:", e); }
  }

  /* -----------------------------------------------------------
     Splash
  ----------------------------------------------------------- */
  function initSplash() {
    var splash = $("[data-splash]");
    if (!splash) return;
    var hide = function () { splash.classList.add("is-out"); };
    if (document.readyState === "complete") setTimeout(hide, 550);
    else window.addEventListener("load", function () { setTimeout(hide, 350); });
    setTimeout(hide, 3600);
  }

  /* -----------------------------------------------------------
     Nav (scroll state + mobile menu + year)
  ----------------------------------------------------------- */
  function initNav() {
    var nav = $("[data-nav]");
    if (nav) {
      var onScroll = function () {
        if (window.scrollY > 60) nav.classList.add("is-scrolled");
        else nav.classList.remove("is-scrolled");
      };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
    }

    var burger = $("[data-nav-burger]");
    var mobile = $("[data-nav-mobile]");
    if (burger && mobile) {
      var toggle = function (open) {
        mobile.setAttribute("aria-hidden", open ? "false" : "true");
        burger.setAttribute("aria-expanded", open ? "true" : "false");
        document.body.style.overflow = open ? "hidden" : "";
      };
      burger.addEventListener("click", function () {
        toggle(mobile.getAttribute("aria-hidden") !== "false");
      });
      $$("[data-nav-mobile-link]", mobile).forEach(function (a) {
        a.addEventListener("click", function () { toggle(false); });
      });
    }

    var yearEl = $("[data-year]");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  }

  /* -----------------------------------------------------------
     Smooth anchors (native scroll)
  ----------------------------------------------------------- */
  function initSmoothAnchors() {
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute("href");
      if (!id || id === "#") return;
      var el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      var navOffset = 84;
      window.scrollTo({
        top: el.getBoundingClientRect().top + window.scrollY - navOffset,
        behavior: reduced ? "auto" : "smooth",
      });
    });
  }

  /* -----------------------------------------------------------
     Cursor (two clean circles, desktop only)
  ----------------------------------------------------------- */
  function initCursor() {
    var root = $("[data-cursor-root]");
    if (!root || !fineHover) return;
    document.documentElement.classList.add("has-cursor");
    var ring = $(".cursor-ring", root);
    var dot = $(".cursor-dot", root);
    var tx = 0, ty = 0, rx = 0, ry = 0, firstMove = false;

    window.addEventListener("mousemove", function (e) {
      tx = e.clientX; ty = e.clientY;
      if (dot) dot.style.transform = "translate3d(" + tx + "px," + ty + "px,0)";
      if (!firstMove) {
        firstMove = true; rx = tx; ry = ty;
        if (ring) ring.style.transform = "translate3d(" + rx + "px," + ry + "px,0)";
        root.classList.add("is-ready");
      }
    }, { passive: true });

    function tick() {
      rx += (tx - rx) * 0.18; ry += (ty - ry) * 0.18;
      if (ring) ring.style.transform = "translate3d(" + rx + "px," + ry + "px,0)";
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    var HOVERABLES = "a, button, .show-card, .tier-card, .option-card";
    document.addEventListener("mouseover", function (e) {
      if (e.target.closest && e.target.closest(HOVERABLES)) root.classList.add("is-interactive");
    });
    document.addEventListener("mouseout", function (e) {
      var related = e.relatedTarget;
      if (e.target.closest && e.target.closest(HOVERABLES) && !(related && related.closest && related.closest(HOVERABLES))) {
        root.classList.remove("is-interactive");
      }
    });
  }

  /* -----------------------------------------------------------
     Magnetic buttons
  ----------------------------------------------------------- */
  function initMagnetic() {
    if (!fineHover) return;
    $$("[data-magnetic]").forEach(function (el) {
      var strength = parseFloat(el.dataset.magneticStrength || "0.3");
      var inner = document.createElement("span");
      inner.className = "magnetic-inner";
      while (el.firstChild) inner.appendChild(el.firstChild);
      el.appendChild(inner);
      el.classList.add("has-magnetic");
      var tx = 0, ty = 0, cx = 0, cy = 0, raf = null;
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        tx = ((e.clientX - r.left) - r.width / 2) * strength;
        ty = ((e.clientY - r.top) - r.height / 2) * strength;
        if (!raf) raf = requestAnimationFrame(loop);
      });
      el.addEventListener("mouseleave", function () {
        tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(loop);
      });
      function loop() {
        cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2;
        inner.style.transform = "translate3d(" + cx + "px," + cy + "px,0)";
        raf = (Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1) ? requestAnimationFrame(loop) : null;
      }
    });
  }

  /* -----------------------------------------------------------
     Tilt 3D on cards
  ----------------------------------------------------------- */
  function initTilt() {
    if (!fineHover) return;
    $$(".tier-card").forEach(function (card) {
      var MAX = 6;
      var tx = 0, ty = 0, cx = 0, cy = 0, raf = null;
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        tx = -py * MAX; ty = px * MAX;
        if (!raf) raf = requestAnimationFrame(loop);
      });
      card.addEventListener("mouseleave", function () {
        tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(loop);
      });
      function loop() {
        cx += (tx - cx) * 0.15; cy += (ty - cy) * 0.15;
        card.style.setProperty("--rx", cx.toFixed(2) + "deg");
        card.style.setProperty("--ry", cy.toFixed(2) + "deg");
        raf = (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) ? requestAnimationFrame(loop) : null;
      }
    });
  }

  /* -----------------------------------------------------------
     Reveal on scroll
  ----------------------------------------------------------- */
  function initReveals() {
    var els = $$("[data-reveal]");
    if (!els.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-revealed"); io.unobserve(e.target); }
      });
    }, { threshold: 0.01, rootMargin: "0px 0px -2% 0px" });
    els.forEach(function (el) { io.observe(el); });

    setTimeout(function () {
      $$("[data-reveal]:not(.is-revealed)").forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("is-revealed");
      });
    }, 6000);
  }

  /* -----------------------------------------------------------
     Split text (chars/words) + GSAP reveal
  ----------------------------------------------------------- */
  function splitChars(el) {
    el.setAttribute("aria-label", el.textContent.trim());
    var html = Array.from(el.childNodes).map(function (node) {
      if (node.nodeType === 3) {
        return Array.from(node.textContent).map(function (ch) {
          return ch === " " ? " " : '<span class="split-char" aria-hidden="true">' + escHTML(ch) + "</span>";
        }).join("");
      }
      if (node.nodeName === "BR") return "<br>";
      if (node.nodeType === 1) {
        var tag = node.tagName.toLowerCase();
        var inner = Array.from(node.textContent).map(function (ch) {
          return ch === " " ? " " : '<span class="split-char" aria-hidden="true">' + escHTML(ch) + "</span>";
        }).join("");
        return "<" + tag + ">" + inner + "</" + tag + ">";
      }
      return "";
    }).join("");
    el.innerHTML = html;
    return $$(".split-char", el);
  }

  function splitWords(el) {
    el.setAttribute("aria-label", el.textContent.trim().replace(/\s+/g, " "));
    var wrap = function (text) {
      return text.split(/(\s+)/).map(function (w) {
        return /^\s+$/.test(w) ? w : '<span class="split-word" aria-hidden="true">' + escHTML(w) + "</span>";
      }).join("");
    };
    var html = Array.from(el.childNodes).map(function (node) {
      if (node.nodeType === 3) return wrap(node.textContent);
      if (node.nodeName === "BR") return "<br>";
      if (node.nodeType === 1) {
        var tag = node.tagName.toLowerCase();
        return "<" + tag + ">" + wrap(node.textContent) + "</" + tag + ">";
      }
      return "";
    }).join("");
    el.innerHTML = html;
    return $$(".split-word", el);
  }

  function initSplitText() {
    $$("[data-split]").forEach(function (el) {
      if (el.dataset.splitDone) return;
      el.dataset.splitDone = "1";
      var mode = el.dataset.split;
      var parts = mode === "chars" ? splitChars(el) : splitWords(el);

      if (window.gsap && window.ScrollTrigger) {
        gsap.set(parts, { y: 22, opacity: 0 });
        gsap.to(parts, {
          y: 0, opacity: 1,
          duration: mode === "chars" ? 0.7 : 0.9,
          stagger: mode === "chars" ? 0.018 : 0.035,
          ease: "expo.out",
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
        });
      } else {
        parts.forEach(function (p) { p.style.opacity = 1; });
      }
    });
  }

  /* -----------------------------------------------------------
     Count-up
  ----------------------------------------------------------- */
  function initCountUp() {
    $$("[data-count-to]").forEach(function (el) {
      var target = parseFloat(el.dataset.countTo);
      var decimals = (el.dataset.countTo.split(".")[1] || "").length;
      var trigger = function () {
        if (window.gsap) {
          var obj = { v: 0 };
          gsap.to(obj, {
            v: target, duration: 1.5, ease: "power2.out",
            onUpdate: function () { el.textContent = obj.v.toFixed(decimals); },
          });
        } else {
          el.textContent = target.toFixed(decimals);
        }
      };
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { trigger(); io.unobserve(e.target); } });
      }, { threshold: 0.05 });
      io.observe(el);
    });

    setTimeout(function () {
      $$("[data-count-to]").forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight && parseFloat(el.textContent) === 0) {
          el.textContent = el.dataset.countTo;
        }
      });
    }, 6000);
  }

  /* -----------------------------------------------------------
     Showcase pinned horizontal (desktop only)
  ----------------------------------------------------------- */
  function initShowcasePinned() {
    if (!window.gsap || !window.ScrollTrigger) return;
    var sec = $(".showcase");
    var track = $("[data-showcase]");
    if (!sec || !track) return;

    var setup = function () {
      ScrollTrigger.getAll().forEach(function (s) { if (s.vars.id === "showcase-pin") s.kill(); });
      gsap.set(track, { x: 0 });
      var isDesktop = window.innerWidth >= 1024;
      sec.classList.toggle("is-pinned", isDesktop);
      if (!isDesktop) return;
      var distance = track.scrollWidth - window.innerWidth + 96;
      if (distance <= 0) return;

      gsap.to(track, {
        x: function () { return -distance; }, ease: "none",
        scrollTrigger: {
          id: "showcase-pin",
          trigger: sec, start: "top top+=76",
          end: function () { return "+=" + (distance + window.innerHeight * 0.35); },
          pin: true, scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1,
        },
      });
    };

    setup();
    var to;
    window.addEventListener("resize", function () {
      clearTimeout(to);
      to = setTimeout(function () { ScrollTrigger.refresh(); setup(); }, 250);
    });
  }

  /* -----------------------------------------------------------
     Hero parallax
  ----------------------------------------------------------- */
  function initHeroParallax() {
    if (!window.gsap || !window.ScrollTrigger) return;
    var bg = $(".hero-bg img");
    if (bg) {
      gsap.to(bg, {
        yPercent: 12, scale: 1.14, ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
      });
    }
  }

  /* -----------------------------------------------------------
     Scroll progress bar
  ----------------------------------------------------------- */
  function initScrollProgress() {
    var bar = $("[data-scroll-progress]");
    if (!bar) return;
    var raf = null;
    function update() {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var pct = max > 0 ? window.scrollY / max : 0;
      bar.style.transform = "scaleX(" + pct + ")";
      raf = null;
    }
    window.addEventListener("scroll", function () { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
    update();
  }

  /* -----------------------------------------------------------
     Lead-capture wizard -> WhatsApp handoff
  ----------------------------------------------------------- */
  function initWizard() {
    var form = $("[data-wizard]");
    if (!form) return;

    var steps = $$("[data-wizard-step]", form);
    var total = steps.length;
    var current = 1;
    var answers = { proyecto: "", "tipo-evento": "", presupuesto: "" };

    var bar = $("[data-wizard-bar]", form);
    var currentLabel = $("[data-wizard-current]", form);
    var backBtn = $("[data-wizard-back]", form);
    var nextBtn = $("[data-wizard-next]", form);
    var submitBtn = $("[data-wizard-submit]", form);

    function render() {
      steps.forEach(function (step) {
        step.classList.toggle("is-active", parseInt(step.dataset.wizardStep, 10) === current);
      });
      if (bar) bar.style.width = (current / total * 100) + "%";
      if (currentLabel) currentLabel.textContent = String(current);
      if (backBtn) backBtn.hidden = current === 1;
      if (nextBtn) nextBtn.hidden = current === total;
      if (submitBtn) submitBtn.hidden = current !== total;
    }

    $$(".option-card", form).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var group = btn.closest("[data-option-group]");
        if (!group) return;
        var key = group.dataset.optionGroup;
        $$(".option-card", group).forEach(function (b) { b.classList.remove("is-selected"); });
        btn.classList.add("is-selected");
        answers[key] = btn.dataset.value;
      });
    });

    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        var stepEl = steps[current - 1];
        var requiredInputs = $$("input[required]", stepEl);
        for (var i = 0; i < requiredInputs.length; i++) {
          if (!requiredInputs[i].reportValidity()) return;
        }
        if (current < total) { current++; render(); }
      });
    }
    if (backBtn) {
      backBtn.addEventListener("click", function () {
        if (current > 1) { current--; render(); }
      });
    }

    render();

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (form.classList.contains("is-sending")) return;
      if (!form.reportValidity()) return;

      if (submitBtn) { submitBtn.classList.add("is-sending"); submitBtn.disabled = true; }
      form.classList.add("is-sending");

      var nombre = (form.elements["nombre"] && form.elements["nombre"].value.trim()) || "";
      var whatsapp = (form.elements["whatsapp"] && form.elements["whatsapp"].value.trim()) || "";
      var fecha = (form.elements["fecha"] && form.elements["fecha"].value) || "Sin definir";
      var detalle = (form.elements["detalle"] && form.elements["detalle"].value.trim()) || "";

      var lines = [
        "Hola La Fête, quiero cotizar un pastel:",
        "• Proyecto: " + (answers["proyecto"] || "Sin especificar"),
        "• Tipo de evento: " + (answers["tipo-evento"] || "Sin especificar"),
        "• Fecha del evento: " + fecha,
        "• Presupuesto aproximado: " + (answers["presupuesto"] || "Sin especificar"),
        "• Mi nombre: " + nombre,
        "• Mi WhatsApp: " + whatsapp,
      ];
      if (detalle) lines.push("• Idea: " + detalle);

      var phone = (data.phoneWa || "525536564680");
      var url = "https://wa.me/" + phone + "?text=" + encodeURIComponent(lines.join("\n"));

      setTimeout(function () {
        window.open(url, "_blank", "noopener");
        if (submitBtn) { submitBtn.classList.remove("is-sending"); submitBtn.disabled = false; }
        form.classList.remove("is-sending");
      }, 650);
    });
  }

  /* -----------------------------------------------------------
     Boot
  ----------------------------------------------------------- */
  function boot() {
    safe(initSplash, "initSplash");
    safe(initNav, "initNav");
    safe(initSmoothAnchors, "initSmoothAnchors");
    safe(initCursor, "initCursor");
    safe(initMagnetic, "initMagnetic");
    safe(initTilt, "initTilt");
    safe(initReveals, "initReveals");
    safe(initCountUp, "initCountUp");
    safe(initScrollProgress, "initScrollProgress");
    safe(initWizard, "initWizard");

    if (window.gsap && window.ScrollTrigger) {
      try { gsap.registerPlugin(ScrollTrigger); } catch (_) {}
      safe(initSplitText, "initSplitText");
      safe(initHeroParallax, "initHeroParallax");
      safe(initShowcasePinned, "initShowcasePinned");
    } else {
      $$("[data-split]").forEach(function (el) { el.style.opacity = 1; });
    }

    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
