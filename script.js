gsap.registerPlugin(ScrollTrigger);

/* ============ CURSOR ============ */
const cursorDot = document.getElementById('cursorDot');
if (window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
  window.addEventListener('mousemove', (e) => {
    gsap.to(cursorDot, { x: e.clientX, y: e.clientY, duration: 0.5, ease: 'power3.out' });
    /* cursor colour follows the section actually under the pointer */
    const sec = e.target.closest && e.target.closest('[data-theme]');
    cursorDot.classList.toggle('is-dark', !!sec && sec.dataset.theme === 'dark');
  });
  document.querySelectorAll('a, button, .res-tab').forEach(el => {
    el.addEventListener('mouseenter', () => cursorDot.classList.add('is-hover'));
    el.addEventListener('mouseleave', () => cursorDot.classList.remove('is-hover'));
  });
  // dark sections flip cursor to white
  ['.hero', '.manifesto', '.feature--wellness', '.enquire'].forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      ScrollTrigger.create({
        trigger: el, start: 'top 55%', end: 'bottom 55%',
        onEnter: () => cursorDot.classList.add('is-dark'),
        onEnterBack: () => cursorDot.classList.add('is-dark'),
        onLeave: () => cursorDot.classList.remove('is-dark'),
        onLeaveBack: () => cursorDot.classList.remove('is-dark'),
      });
    });
  });
}

/* ============ NAV: hide/show + progress + theme ============ */
const nav = document.getElementById('nav');
const progressFillEl = document.getElementById('progressFill');
let lastY = window.scrollY;
let navHidden = false;
ScrollTrigger.create({
  start: 0, end: 'max',
  onUpdate: (self) => {
    progressFillEl.style.transform = 'scaleY(' + self.progress.toFixed(4) + ')';
    const y = window.scrollY;
    const hide = y > lastY && y > 200;
    if (hide !== navHidden) {
      navHidden = hide;
      nav.style.transform = hide ? 'translateY(-120%)' : 'translateY(0)';
    }
    lastY = y;
  }
});

/* nav theme follows whichever section sits behind it */
document.querySelectorAll('.section[data-theme]').forEach(sec => {
  ScrollTrigger.create({
    trigger: sec, start: 'top 90', end: 'bottom 90',
    onEnter: () => nav.classList.toggle('on-light', sec.dataset.theme === 'light'),
    onEnterBack: () => nav.classList.toggle('on-light', sec.dataset.theme === 'light'),
  });
});

/* mobile menu */
const burger = document.getElementById('navBurger');
const mobileMenu = document.getElementById('mobileMenu');
const mobileLinks = mobileMenu.querySelectorAll('a');
gsap.set(mobileLinks, { opacity: 0, y: 26 });

function openMobileMenu() {
  mobileMenu.classList.add('is-open');
  burger.classList.add('is-active');
  burger.setAttribute('aria-expanded', 'true');
  document.body.classList.add('menu-open');
  nav.classList.remove('on-light'); // keep nav text white against the dark overlay
  gsap.fromTo(mobileLinks, { opacity: 0, y: 26 }, {
    opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.08, delay: 0.15
  });
}

function closeMobileMenu() {
  mobileMenu.classList.remove('is-open');
  burger.classList.remove('is-active');
  burger.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('menu-open');
  gsap.set(mobileLinks, { opacity: 0, y: 26 }); // reset for next open
  // restore correct nav theme for whatever section is currently in view
  const current = [...document.querySelectorAll('.section[data-theme]')]
    .find(sec => {
      const r = sec.getBoundingClientRect();
      return r.top <= 90 && r.bottom >= 90;
    });
  if (current) nav.classList.toggle('on-light', current.dataset.theme === 'light');
}

burger.addEventListener('click', () => {
  mobileMenu.classList.contains('is-open') ? closeMobileMenu() : openMobileMenu();
});
mobileLinks.forEach(a => a.addEventListener('click', closeMobileMenu));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && mobileMenu.classList.contains('is-open')) closeMobileMenu();
});

/* ============ HERO entrance (banner artwork carries its own text) ============ */
gsap.from('#heroImg', { opacity: 0, scale: 1.04, duration: 1.4, ease: 'power2.out', clearProps: 'transform,opacity' });

/* ============ HORIZON SVG draw (signature moment) ============ */
const horizonTl = gsap.timeline({
  scrollTrigger: { trigger: '.horizon-wrap', start: 'top 85%', once: true }
});
horizonTl
  .to('.horizon-line', { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut' })
  .to('.horizon-sun', { opacity: 1, duration: 0.6 }, '-=0.5');

/* sun rolls back and forth along the horizon line as the page scrolls,
   reversing direction naturally when the user scrolls back up */
const horizonPathEl = document.querySelector('.horizon-line');
const horizonSunEl = document.querySelector('.horizon-sun');
if (horizonPathEl && horizonSunEl) {
  const pathLength = horizonPathEl.getTotalLength();
  const sunRadius = parseFloat(horizonSunEl.getAttribute('r')) || 34;
  const sunLift = sunRadius + 10; // gap between the line and the bottom of the circle
  const baseX = parseFloat(horizonSunEl.getAttribute('cx')) || 600;
  const baseY = parseFloat(horizonSunEl.getAttribute('cy')) || 70;
  /* sample the path once up front: calling getPointAtLength on every scroll
     tick was forcing costly SVG geometry work and made the ball stutter on phones */
  const STEPS = 240, lutX = new Float32Array(STEPS + 1), lutY = new Float32Array(STEPS + 1);
  for (let k = 0; k <= STEPS; k++) {
    const pt = horizonPathEl.getPointAtLength(pathLength * k / STEPS);
    lutX[k] = pt.x - baseX; lutY[k] = pt.y - sunLift - baseY;
  }
  horizonSunEl.style.willChange = 'transform';
  const sunState = { p: 0 };
  function renderSun() {
    const f = Math.min(Math.max(sunState.p, 0), 1) * STEPS, i = Math.min(Math.floor(f), STEPS - 1), t = f - i;
    const x = lutX[i] + (lutX[i + 1] - lutX[i]) * t;
    const y = lutY[i] + (lutY[i + 1] - lutY[i]) * t;
    horizonSunEl.style.transform = 'translate(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px)';
  }
  /* one smoothing tween (eased on the GSAP ticker) instead of scrub lag + attribute writes */
  const sunTo = gsap.quickTo(sunState, 'p', { duration: 0.45, ease: 'power2.out', onUpdate: renderSun });
  ScrollTrigger.create({
    trigger: '.horizon-wrap',
    start: 'top bottom',
    end: 'bottom top',
    onUpdate: (self) => sunTo(self.progress),
    onRefresh: (self) => { sunState.p = self.progress; renderSun(); }
  });
  renderSun();
}

/* ============ GENERIC REVEALS ============ */
const revealTargets = [
  '.manifesto-kicker', '.manifesto-text',
  '.arch-kicker', '.arch-desc', '.arch-stats',
  '.amenity-intro-kicker',
  '.pool-copy',
  '.feature-kicker', '.feature-desc',
  '.pool-more-kicker', '.pool-more-title', '.pool-more-desc', '.img-note',
  '.visit-site-kicker', '.visit-site-title', '.visit-site-desc',
  '.lobby-area-title', '.sunset-view-title', '.floors-kicker', '.floors-sub', '.fp-info',
  '.am-kicker', '.am-group-title',
  '.res-kicker', '.res-tabs',
  '.enquire-kicker', '.enquire-sub', '.enquire-form'
];
revealTargets.forEach(sel => {
  document.querySelectorAll(sel).forEach(el => {
    gsap.fromTo(el, { opacity: 0, y: 34 }, {
      opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%' }
    });
  });
});

/* ============ WORD-BY-WORD TITLE REVEALS ============ */
/* Splits a heading's text into per-word spans (walking text nodes so
   existing <br> line breaks and inline tags like <em> are preserved),
   then reveals each word with a rise + fade, staggered left to right. */
function wrapWordsForStagger(el) {
  function walk(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const parts = node.textContent.split(/(\s+)/);
      const frag = document.createDocumentFragment();
      parts.forEach(part => {
        if (part === '') return;
        if (/^\s+$/.test(part)) {
          frag.appendChild(document.createTextNode(part));
        } else {
          const mask = document.createElement('span');
          mask.className = 'word-mask';
          const inner = document.createElement('span');
          inner.className = 'word-inner';
          inner.textContent = part;
          mask.appendChild(inner);
          frag.appendChild(mask);
        }
      });
      node.parentNode.replaceChild(frag, node);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      Array.from(node.childNodes).forEach(walk);
    }
  }
  Array.from(el.childNodes).forEach(walk);
}

const titleSelectors = [
  '.arch-title', '.amenity-intro-title', '.pool-title',
  '.feature-title', '.am-title', '.res-title', '.floors-title', '.enquire-title'
];
titleSelectors.forEach(sel => {
  document.querySelectorAll(sel).forEach(el => {
    wrapWordsForStagger(el);
    gsap.fromTo(el.querySelectorAll('.word-inner'), { yPercent: 112, opacity: 0 }, {
      yPercent: 0, opacity: 1, duration: 0.7, ease: 'power3.out', stagger: 0.045,
      scrollTrigger: { trigger: el, start: 'top 88%' }
    });
  });
});

/* amenities: staggered rise for icon tiles and list rows */
document.querySelectorAll('.am-icons, .am-list').forEach(group => {
  gsap.fromTo(group.children, { opacity: 0, y: 26 }, {
    opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.06,
    scrollTrigger: { trigger: group, start: 'top 88%' }
  });
});

/* amenity icons only animate while their section is on screen */
ScrollTrigger.create({
  trigger: '.am-section', start: 'top bottom', end: 'bottom top',
  toggleClass: { targets: '.am-section', className: 'is-live' }
});

/* stat counters */
document.querySelectorAll('.arch-stat-num').forEach(el => {
  const target = parseInt(el.dataset.count, 10);
  ScrollTrigger.create({
    trigger: el, start: 'top 85%', once: true,
    onEnter: () => {
      const obj = { val: 0 };
      gsap.to(obj, {
        val: target, duration: 1.4, ease: 'power2.out',
        onUpdate: () => el.textContent = Math.round(obj.val)
      });
    }
  });
});

/* ============ POOL day/dusk wipe (interactive compare-slider) ============ */
ScrollTrigger.create({
  trigger: '.pool-frame',
  start: 'top 70%',
  end: 'bottom 30%',
  scrub: 0.6,
  onUpdate: (self) => {
    const pct = 100 - self.progress * 100;
    document.getElementById('poolDusk').style.clipPath = `inset(0 0 0 ${pct}%)`;
    document.getElementById('poolDivider').style.left = pct + '%';
  }
});

/* ============ FEATURE media parallax ============ */
/* (skips wellness's stacked full images — parallax needs oversized/cropped
   images to shift within, which is incompatible with showing them full-size) */
document.querySelectorAll('.feature-media img:not(.wellness-stack img)').forEach(img => {
  gsap.fromTo(img, { yPercent: -8 }, {
    yPercent: 8, ease: 'none',
    scrollTrigger: { trigger: img.closest('.feature'), start: 'top bottom', end: 'bottom top', scrub: true }
  });
});

/* ============ CLIP-PATH WIPE REVEALS (all images except the hero banner) ============ */
/* Left-to-right wipe: the image starts fully clipped and the visible
   region grows from the left edge outward. Used consistently everywhere
   so every image on the site reveals the same way. */
function wipeReveal(selector, { trigger, stagger = 0, duration = 1.1 } = {}) {
  const els = document.querySelectorAll(selector);
  if (!els.length) return;
  gsap.set(els, { clipPath: 'inset(0% 100% 0% 0%)' });
  gsap.to(els, {
    clipPath: 'inset(0% 0% 0% 0%)',
    duration, stagger, ease: 'power3.inOut',
    scrollTrigger: { trigger: trigger || els[0], start: 'top 85%' }
  });
}

wipeReveal('#archImg', { trigger: '.arch-media', duration: 1.3 });
wipeReveal('.pool-frame', { duration: 1.2 });
if (desktopOnlyMotion()) {
  /* desktop: each wellness image wipes in on its own scroll position */
  document.querySelectorAll('.wellness-stack img').forEach(img => {
    gsap.set(img, { clipPath: 'inset(0% 100% 0% 0%)' });
    gsap.to(img, {
      clipPath: 'inset(0% 0% 0% 0%)', duration: 1, ease: 'power3.inOut',
      scrollTrigger: { trigger: img, start: 'top 85%', once: true }
    });
  });
} else {
  wipeReveal('.wellness-stack img', { trigger: '.wellness-stack', stagger: 0.12, duration: 1 });
}
wipeReveal('.pool-more-item img', { trigger: '.pool-more-gallery', stagger: 0.15, duration: 1.2 });
/* visit-site image: slides in from the right */
(function () {
  const img = document.querySelector('.visit-site-media img');
  if (!img) return;
  if (!desktopOnlyMotion()) return;
  gsap.fromTo(img,
    { x: '22vw', opacity: 0 },
    {
      x: 0, opacity: 1, duration: 1.4, ease: 'power3.out', clearProps: 'transform',
      scrollTrigger: { trigger: '.visit-site-media', start: 'top 85%', once: true }
    });
})();
/* entrance animations for the retail, sunset and visit-site images run on desktop (mouse + wide screen) only,
   never on tablets or phones, and never with reduced motion */
function desktopOnlyMotion() {
  if (!window.matchMedia) return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  return window.matchMedia('(min-width: 1101px) and (hover: hover) and (pointer: fine)').matches;
}

/* "lights on" entrance for the retail and sunset images: fades up from a dim dusk tone to full brightness with a soft rise */
function lightsOn(imgSelector, triggerSelector) {
  const img = document.querySelector(imgSelector);
  if (!img) return;
  if (!desktopOnlyMotion()) return;
  gsap.fromTo(img,
    { opacity: 0, y: 36, scale: 1.03, filter: 'brightness(0.4) saturate(0.65)' },
    {
      opacity: 1, y: 0, scale: 1, filter: 'brightness(1) saturate(1)',
      duration: 1.7, ease: 'power2.out', clearProps: 'filter,transform',
      scrollTrigger: { trigger: triggerSelector, start: 'top 82%', once: true }
    });
}
lightsOn('.retail-podium-media img', '.retail-podium-media');
lightsOn('.sunset-view-media .sv-track', '.sunset-view-media');

wipeReveal('.lobby-area-item img', { trigger: '.lobby-area-gallery', stagger: 0.15, duration: 1.2 });
wipeReveal('.res-panel.is-active .res-panel-media img', { trigger: '.residences', duration: 1.1 });

/* ============ IMAGE LIGHTBOX (zoom / pan) ============ */
(() => {
  const lightbox = document.getElementById('lightbox');
  const stage = document.getElementById('lightboxStage');
  const img = document.getElementById('lightboxImg');
  const closeBtn = document.getElementById('lightboxClose');
  const hint = document.getElementById('lightboxHint');

  const MIN_SCALE = 1;
  const MAX_SCALE = 4;
  let scale = 1, panX = 0, panY = 0;
  let startX = 0, startY = 0, startPanX = 0, startPanY = 0;
  let dragging = false;
  let pinchStartDist = 0, pinchStartScale = 1;

  function applyTransform() {
    img.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
  }

  function clampPan() {
    // don't let the image drag so far its edge leaves the stage
    const stageRect = stage.getBoundingClientRect();
    const imgRect = img.getBoundingClientRect();
    const overflowX = Math.max(0, (imgRect.width - stageRect.width) / 2);
    const overflowY = Math.max(0, (imgRect.height - stageRect.height) / 2);
    panX = Math.min(overflowX, Math.max(-overflowX, panX));
    panY = Math.min(overflowY, Math.max(-overflowY, panY));
  }

  function setScale(next, cx, cy) {
    next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, next));
    if (next === scale) return;
    scale = next;
    if (scale === MIN_SCALE) { panX = 0; panY = 0; }
    applyTransform();
    // re-clamp on next frame once layout reflects new scale
    requestAnimationFrame(() => { clampPan(); applyTransform(); });
    stage.style.cursor = scale > MIN_SCALE ? 'grab' : 'zoom-in';
  }

  function openLightbox(src, alt) {
    img.src = src;
    img.alt = alt || '';
    scale = 1; panX = 0; panY = 0;
    applyTransform();
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('menu-open'); // reuse existing scroll-lock rule
    gsap.fromTo(hint, { opacity: 0 }, { opacity: 1, duration: 0.6, delay: 0.3 });
  }

  function closeLightbox() {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('menu-open');
  }

  window.solaceOpenLightbox = openLightbox;

  document.querySelectorAll('.zoom-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const wrap = btn.closest('.res-panel-media');
      const sourceImg = wrap ? wrap.querySelector('img') : null;
      if (sourceImg) openLightbox(sourceImg.currentSrc || sourceImg.src, sourceImg.alt);
    });
  });
  closeBtn.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
  // the stage covers the full overlay (needed for drag-to-pan), so clicking
  // empty space around the image — while not zoomed — should also close it
  stage.addEventListener('click', (e) => {
    if (e.target === stage && scale === MIN_SCALE) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('is-open')) closeLightbox();
  });

  /* wheel to zoom (desktop) */
  stage.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.35 : 0.35;
    setScale(scale + delta);
  }, { passive: false });

  /* double-click / double-tap to toggle zoom */
  stage.addEventListener('dblclick', () => {
    setScale(scale > MIN_SCALE ? MIN_SCALE : 2.4);
  });

  /* drag to pan (mouse + single touch, via Pointer Events) */
  stage.addEventListener('pointerdown', (e) => {
    if (scale <= MIN_SCALE) return;
    dragging = true;
    stage.classList.add('is-dragging');
    startX = e.clientX; startY = e.clientY;
    startPanX = panX; startPanY = panY;
    stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    panX = startPanX + (e.clientX - startX);
    panY = startPanY + (e.clientY - startY);
    clampPan();
    applyTransform();
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(evt => {
    stage.addEventListener(evt, () => { dragging = false; stage.classList.remove('is-dragging'); });
  });

  /* pinch to zoom (touch) */
  stage.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      const [a, b] = e.touches;
      pinchStartDist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      pinchStartScale = scale;
    }
  }, { passive: true });
  stage.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const [a, b] = e.touches;
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      setScale(pinchStartScale * (dist / pinchStartDist));
    }
  }, { passive: false });
})();

/* ============ RESIDENCES tabs (+ 3 BHK floor variants) ============ */
const tabs = document.querySelectorAll('.res-tab');
const panels = document.querySelectorAll('.res-panel');
const variantWrap = document.querySelector('.res-variants');
const variantBtns = document.querySelectorAll('.res-variant');
let activeVariant = '3bhk-1109';
let activeTab = '1bhk';

function showPanel(key) {
  panels.forEach(p => {
    if (p.dataset.panel === key) {
      p.classList.add('is-active');
      gsap.fromTo(p, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' });
      const panelImg = p.querySelector('.res-panel-media img');
      if (panelImg) {
        gsap.fromTo(panelImg, { clipPath: 'inset(0% 100% 0% 0%)' }, {
          clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: 'power3.inOut'
        });
      }
    } else {
      p.classList.remove('is-active');
    }
  });
}
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    activeTab = tab.dataset.target;
    tabs.forEach(t => t.classList.remove('is-active'));
    tab.classList.add('is-active');
    if (variantWrap) variantWrap.hidden = activeTab !== '3bhk';
    showPanel(activeTab === '3bhk' ? activeVariant : activeTab);
  });
});
variantBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    activeVariant = btn.dataset.variant;
    variantBtns.forEach(b => b.classList.toggle('is-active', b === btn));
    showPanel(activeVariant);
  });
});

/* ============ ENQUIRE FORM (mailto submission) ============ */
const form = document.getElementById('enquireForm');
const ENQUIRE_EMAIL = 'arsalaan.khan1@gmail.com';
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const note = document.getElementById('enquireNote');
  const name = document.getElementById('fname').value.trim();
  const phone = document.getElementById('fphone').value.trim();
  const email = document.getElementById('femail').value.trim();

  const subject = `Site Visit Request — Solace (${name})`;
  const bodyLines = [
    `Name: ${name}`,
    `Phone: ${phone}`,
    `Email: ${email || 'Not provided'}`,
    '',
    'Requesting a site visit for Solace.'
  ];
  const mailtoUrl =
    `mailto:${ENQUIRE_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join('\n'))}`;

  window.location.href = mailtoUrl;

  form.style.display = 'none';
  note.hidden = false;
});

/* refresh ScrollTrigger after images load (layout shifts) */
window.addEventListener('load', () => ScrollTrigger.refresh());

/* ============ SUNSET-VIEW CAROUSEL (crossfade, autoplay, pauses on hover/touch) ============ */
(function () {
  const root = document.querySelector('.sv-carousel');
  if (!root) return;
  const slides = [...root.querySelectorAll('.sv-slide')];
  const dotsWrap = root.querySelector('.sv-dots');
  let i = 0, timer = null;
  const dots = slides.map((_, n) => {
    const b = document.createElement('button');
    b.type = 'button'; b.setAttribute('aria-label', 'Show image ' + (n + 1));
    b.addEventListener('click', () => { go(n); restart(); });
    dotsWrap.appendChild(b); return b;
  });
  const capText = root.querySelector('.sv-cap-text');
  const capRule = root.querySelector('.sv-cap-rule');
  const calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function showCaption() {
    capText.textContent = slides[i].dataset.title || '';
    if (calm) return;
    gsap.killTweensOf([capText, capRule]);
    gsap.fromTo(capRule, { scaleX: 0, opacity: 0.85 }, { scaleX: 1, opacity: 0.85, duration: 0.8, ease: 'power3.out', delay: 0.35 });
    gsap.fromTo(capText, { yPercent: 115, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.9, ease: 'power3.out', delay: 0.5 });
  }
  function go(n) {
    i = (n + slides.length) % slides.length;
    slides.forEach((s, k) => s.classList.toggle('is-active', k === i));
    dots.forEach((d, k) => d.classList.toggle('is-active', k === i));
    showCaption();
  }
  function start() { stop(); timer = setInterval(() => go(i + 1), 5000); }
  function stop() { if (timer) clearInterval(timer); timer = null; }
  function restart() { start(); }
  root.querySelector('.sv-prev').addEventListener('click', () => { go(i - 1); restart(); });
  root.querySelector('.sv-next').addEventListener('click', () => { go(i + 1); restart(); });
  root.addEventListener('mouseenter', stop);
  root.addEventListener('mouseleave', start);
  let x0 = null;
  root.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
  root.addEventListener('touchend', e => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 40) { go(i + (dx < 0 ? 1 : -1)); restart(); }
  });
  go(0);
  if (!calm) {
    gsap.set([capText, capRule], { opacity: 0 });
    ScrollTrigger.create({ trigger: root, start: 'top 70%', once: true, onEnter: showCaption });
  }
  if (!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) start();
})();

/* ============ FLOOR BY FLOOR EXPLORER ============ */
(function () {
  const stage = document.getElementById('fpStage');
  if (!stage) return;
  const plansWrap = stage.querySelector('.fp-plans');
  const plans = [...stage.querySelectorAll('.fp-plan')];
  const rail = document.querySelector('.fp-rail');
  const btns = [...rail.querySelectorAll('.fp-floor')];
  const cabin = rail.querySelector('.fp-cabin');
  const levelEl = document.querySelector('.fp-level');
  const nameEl = document.querySelector('.fp-name-text');
  const tagEl = document.querySelector('.fp-tag');
  const featsEl = document.querySelector('.fp-feats');
  const upBtn = document.querySelector('.fp-up');
  const downBtn = document.querySelector('.fp-down');
  const rideBtn = document.querySelector('.fp-ride');
  const rideLabel = rideBtn.querySelector('.fp-ride-label');
  const calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const N = plans.length;
  const isStacked = () => window.matchMedia('(max-width: 900px)').matches;
  let cur = 0, ride = null, swiped = false;
  /* plans load on demand (keeps phones from decoding eight huge images at once) */
  const ensure = (k) => { const p = plans[k]; if (p && p.dataset.src) { p.src = p.dataset.src; delete p.dataset.src; } };
  window.addEventListener('load', () => { for (let k = 1; k < N; k++) setTimeout(() => ensure(k), 900 * k); });

  function setInfo(n, dir, animate) {
    const d = btns[n].dataset;
    const apply = () => {
      nameEl.textContent = d.name;
      tagEl.textContent = d.tag;
      levelEl.textContent = 'Level ' + (n + 1) + ' of ' + N;
      featsEl.innerHTML = '';
      d.feats.split('|').forEach(t => { const li = document.createElement('li'); li.textContent = t; featsEl.appendChild(li); });
    };
    if (!animate || calm) { apply(); return; }
    gsap.killTweensOf([nameEl, tagEl, featsEl, featsEl.children]);
    gsap.to(nameEl, { yPercent: -dir * 110, duration: 0.3, ease: 'power2.in', onComplete: () => {
      apply();
      gsap.fromTo(nameEl, { yPercent: dir * 110 }, { yPercent: 0, duration: 0.7, ease: 'power3.out' });
      gsap.fromTo(featsEl.children, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out', stagger: 0.06 });
      gsap.fromTo(tagEl, { opacity: 0 }, { opacity: 1, duration: 0.6 });
    } });
  }

  const cable = rail.querySelector('.fp-cable');
  let doorTimer = null;

  /* lift "bing": a small synthesised bell, played as the doors open */
  const soundBtn = document.querySelector('.fp-sound');
  let actx = null, soundOn = true;
  try { if (localStorage.getItem('solaceLiftSound') === 'off') soundOn = false; } catch (e) {}
  const syncSoundBtn = () => { soundBtn.setAttribute('aria-pressed', soundOn ? 'true' : 'false'); soundBtn.setAttribute('aria-label', soundOn ? 'Lift sound on' : 'Lift sound off'); };
  syncSoundBtn();
  function unlockAudio() {
    if (!actx) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) { try { actx = new AC(); } catch (e) {} } }
    if (actx && actx.state === 'suspended') actx.resume();
  }
  ['pointerdown', 'touchstart', 'keydown'].forEach(ev => document.getElementById('floors').addEventListener(ev, unlockAudio, { passive: true }));
  function bing() {
    if (!soundOn || !actx || actx.state !== 'running') return;
    const r = stage.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    const t = actx.currentTime, out = actx.createGain();
    out.gain.value = 0.22; out.connect(actx.destination);
    [[1318.5, 1, 1.9], [2637, 0.32, 1.1], [3638, 0.1, 0.55]].forEach(([f, v, d]) => {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(v, t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g); g.connect(out); o.start(t); o.stop(t + d + 0.05);
    });
  }
  soundBtn.addEventListener('click', () => {
    soundOn = !soundOn; syncSoundBtn();
    try { localStorage.setItem('solaceLiftSound', soundOn ? 'on' : 'off'); } catch (e) {}
    unlockAudio(); if (soundOn) setTimeout(bing, 60);
  });

  function placeCabin(animate) {
    const track = rail.querySelector('.fp-track');
    const b = btns[cur].getBoundingClientRect(), r = track.getBoundingClientRect();
    const cw = cabin.offsetWidth, ch = cabin.offsetHeight;
    const dur = animate && !calm ? 1.05 : 0;
    const t = { duration: dur, ease: 'power3.inOut', overwrite: true };
    clearTimeout(doorTimer); cabin.classList.remove('is-open');
    const arrive = () => {
      cabin.classList.add('is-open');
      if (animate) bing();
      doorTimer = setTimeout(() => cabin.classList.remove('is-open'), 1500);
    };
    if (isStacked()) {
      const x = b.left + b.width / 2 - r.left - cw / 2;
      gsap.to(cabin, Object.assign({ x, y: 0, onComplete: arrive }, t));
      gsap.to(cable, Object.assign({ width: x + cw / 2, height: 1.5 }, t));
    } else {
      const y = b.top + b.height / 2 - r.top - ch / 2;
      gsap.to(cabin, Object.assign({ y, x: 0, onComplete: arrive }, t));
      gsap.to(cable, Object.assign({ height: y + ch / 2, width: 1.5 }, t));
    }
  }

  function go(n, userInitiated) {
    n = Math.max(0, Math.min(N - 1, n));
    if (n === cur) return;
    if (userInitiated) stopRide();
    const dir = n > cur ? 1 : -1;
    const out = plans[cur], inn = plans[n];
    ensure(n); ensure(n + 1); ensure(n - 1);
    const shift = isStacked() ? 4 : 7;
    gsap.killTweensOf([out, inn]);
    plans.forEach((p, k) => { if (k !== cur && k !== n) gsap.set(p, { opacity: 0, clearProps: 'transform,visibility' }); });
    if (calm) {
      gsap.set(out, { opacity: 0 }); gsap.set(inn, { opacity: 1 });
    } else {
      gsap.set(inn, { zIndex: 2 }); gsap.set(out, { zIndex: 1, visibility: 'visible' });
      gsap.fromTo(inn, { opacity: 0, yPercent: dir * shift, scale: 0.985 },
        { opacity: 1, yPercent: 0, scale: 1, duration: 1, ease: 'power3.out', clearProps: 'zIndex' });
      gsap.to(out, { opacity: 0, yPercent: -dir * shift, scale: 0.985, duration: 0.75, ease: 'power2.in',
        onComplete: () => gsap.set(out, { clearProps: 'transform,zIndex,visibility' }) });
    }
    plans[cur].classList.remove('is-active'); inn.classList.add('is-active');
    btns.forEach((b, k) => { b.classList.toggle('is-active', k === n); b.setAttribute('aria-selected', k === n ? 'true' : 'false'); b.tabIndex = k === n ? 0 : -1; });
    cur = n;
    upBtn.disabled = cur === N - 1; downBtn.disabled = cur === 0;
    setInfo(n, dir, true);
    placeCabin(true);
  }

  /* safety net: if a browser fails to give the stage its height, set it from the image ratio */
  function fixStageHeight() {
    stage.style.height = '';
    if (stage.offsetWidth && stage.offsetHeight < stage.offsetWidth * 0.3) stage.style.height = (stage.offsetWidth * 1449 / 2576) + 'px';
  }
  fixStageHeight();
  window.addEventListener('resize', fixStageHeight);
  window.addEventListener('load', fixStageHeight);

  /* controls */
  btns.forEach((b, k) => { b.tabIndex = k === 0 ? 0 : -1; b.addEventListener('click', () => go(k, true)); });
  upBtn.addEventListener('click', () => go(cur + 1, true));
  downBtn.addEventListener('click', () => go(cur - 1, true));
  downBtn.disabled = true;
  function key(e) {
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') { e.preventDefault(); go(cur + 1, true); }
    else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') { e.preventDefault(); go(cur - 1, true); }
    else if (e.key === 'Home') { e.preventDefault(); go(0, true); }
    else if (e.key === 'End') { e.preventDefault(); go(N - 1, true); }
  }
  stage.addEventListener('keydown', key);
  rail.addEventListener('keydown', (e) => { key(e); const b = btns[cur]; if (b) b.focus(); });

  /* ride the lift: ascends floor by floor, stops at the top */
  function stopRide() {
    if (ride) { clearInterval(ride); ride = null; }
    rideBtn.setAttribute('aria-pressed', 'false'); rideLabel.textContent = 'Take the lift';
  }
  rideBtn.addEventListener('click', () => {
    if (ride) { stopRide(); return; }
    rideBtn.setAttribute('aria-pressed', 'true'); rideLabel.textContent = 'Stop';
    if (cur === N - 1) go(0, false);
    ride = setInterval(() => {
      if (cur >= N - 1) { stopRide(); return; }
      go(cur + 1, false);
      if (cur >= N - 1) stopRide();
    }, 3400);
  });

  /* zoom (reuses the site lightbox) and swipe */
  function openZoom() {
    if (swiped) return;
    if (window.solaceOpenLightbox) window.solaceOpenLightbox(plans[cur].currentSrc || plans[cur].src, plans[cur].alt);
  }
  stage.addEventListener('click', (e) => { if (e.target.closest('.fp-zoom') || e.target === stage || stage.contains(e.target)) openZoom(); });
  let x0 = null, y0 = null;
  stage.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; swiped = false; }, { passive: true });
  stage.addEventListener('touchend', (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { swiped = true; go(cur + (dx < 0 ? 1 : -1), true); setTimeout(() => { swiped = false; }, 350); }
  });

  /* desktop: gentle 3D tilt + light that follows the cursor */
  if (desktopOnlyMotion()) {
    const rx = gsap.quickTo(plansWrap, 'rotationX', { duration: 0.8, ease: 'power3.out' });
    const ry = gsap.quickTo(plansWrap, 'rotationY', { duration: 0.8, ease: 'power3.out' });
    gsap.set(plansWrap, { transformPerspective: 1400, transformOrigin: '50% 50%' });
    stage.addEventListener('mousemove', (e) => {
      const r = stage.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width, ny = (e.clientY - r.top) / r.height;
      ry((nx - 0.5) * 5); rx(-(ny - 0.5) * 3.2);
      stage.style.setProperty('--mx', (nx * 100) + '%'); stage.style.setProperty('--my', (ny * 100) + '%');
      stage.classList.add('is-hover');
    });
    stage.addEventListener('mouseleave', () => { rx(0); ry(0); stage.classList.remove('is-hover'); });
  }

  /* entrance (desktop only, like the other image entrances) */
  lightsOn('.fp-plans', '.fp-stage');

  /* keep the cabin on the right tick when layout changes */
  let rt;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => placeCabin(false), 150); });
  window.addEventListener('load', () => { placeCabin(false); ScrollTrigger.refresh(); });
  setInfo(0, 1, false); placeCabin(false);
})();
