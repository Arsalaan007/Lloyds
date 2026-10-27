gsap.registerPlugin(ScrollTrigger);

/* ============ CURSOR ============ */
const cursorDot = document.getElementById('cursorDot');
if (window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
  window.addEventListener('mousemove', (e) => {
    gsap.to(cursorDot, { x: e.clientX, y: e.clientY, duration: 0.5, ease: 'power3.out' });
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
let lastY = window.scrollY;
ScrollTrigger.create({
  start: 0, end: 'max',
  onUpdate: (self) => {
    document.getElementById('progressFill').style.height = (self.progress * 100) + '%';
    const y = window.scrollY;
    if (y > lastY && y > 200) nav.style.transform = 'translateY(-120%)';
    else nav.style.transform = 'translateY(0)';
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
  ScrollTrigger.create({
    trigger: '.horizon-wrap',
    start: 'top bottom',
    end: 'bottom top',
    scrub: 0.5,
    onUpdate: (self) => {
      const pt = horizonPathEl.getPointAtLength(self.progress * pathLength);
      horizonSunEl.setAttribute('cx', pt.x);
      horizonSunEl.setAttribute('cy', pt.y - sunLift); // rest just above the line, like the logo
    }
  });
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
  '.lobby-area-title',
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
  '.feature-title', '.am-title', '.res-title', '.enquire-title'
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
  function go(n) {
    i = (n + slides.length) % slides.length;
    slides.forEach((s, k) => s.classList.toggle('is-active', k === i));
    dots.forEach((d, k) => d.classList.toggle('is-active', k === i));
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
  if (!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) start();
})();
