/* ═══════════════════════════════════════════════════════════════
   BIOCONTROL — Control de plagas · script.js
   ───────────────────────────────────────────────────────────────
   Módulos (todos independientes y con degradación elegante):
    01 Utilidades y estado        10 Marquee reactivo al scroll
    02 Enlaces de WhatsApp        11 Método: timeline con scroll
    03 Smooth scroll (Lenis)      12 Explorador de plagas (tabs)
    04 Preloader                  13 Carrusel de promos + lightbox
    05 Navegación / menú / spy    14 Mapa de cobertura (canvas)
    06 Reveal + split de texto    15 FAQ (acordeón)
    07 Contadores + parallax      16 Formulario → WhatsApp
    08 Hero: ciclo, partículas    17 Cursor, spotlight, tilt, magnetic
    09 Hero: radar de plagas      18 Arranque
    19 Scroll FX: cortinas, rise escalonado, profundidad, texto que se enciende,
       palabras gigantes, anillo de progreso (todo ligado al scroll)
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ───────── 01 · UTILIDADES Y ESTADO ───────── */
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var lerp  = function (a, b, t) { return a + (b - a) * t; };
  var TAU = Math.PI * 2;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer  = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var body = document.body;
  var lenis = null;

  // Cola de tareas que esperan a que termine el preloader
  var isReady = false, readyQueue = [];
  function onReady(fn) { isReady ? fn() : readyQueue.push(fn); }
  function setReady() {
    if (isReady) return;
    isReady = true;
    body.classList.add('is-ready');
    readyQueue.forEach(function (fn) { fn(); });
    readyQueue = [];
  }

  // Un solo listener de scroll (throttled con rAF) para todos los módulos
  var scrollFns = [], scrollTick = false;
  function onScroll(fn) { scrollFns.push(fn); }
  function runScroll() {
    scrollTick = false;
    var y = window.scrollY || window.pageYOffset;
    for (var i = 0; i < scrollFns.length; i++) scrollFns[i](y);
  }
  window.addEventListener('scroll', function () {
    if (!scrollTick) { scrollTick = true; requestAnimationFrame(runScroll); }
  }, { passive: true });

  // Ejecuta fn cuando el elemento entra/sale de pantalla (para pausar animaciones)
  function whenVisible(el, fn) {
    if (!('IntersectionObserver' in window)) { fn(true); return; }
    new IntersectionObserver(function (e) { fn(e[0].isIntersecting); }, { rootMargin: '80px' }).observe(el);
  }
  function debounce(fn, ms) { var t; return function () { clearTimeout(t); t = setTimeout(fn, ms); }; }
  function watchSize(el, fn) {
    if ('ResizeObserver' in window) new ResizeObserver(debounce(fn, 120)).observe(el);
    else window.addEventListener('resize', debounce(fn, 150));
  }

  /* ───────── 02 · ENLACES DE WHATSAPP ───────── */
  var WA_NUMBER = '5218112739975'; // +52 1 81 1273 9975
  function waURL(msg) { return 'https://wa.me/' + WA_NUMBER + (msg ? '?text=' + encodeURIComponent(msg) : ''); }
  function initWhatsApp() {
    $$('[data-wa]').forEach(function (a) { a.href = waURL(a.getAttribute('data-wa')); });

    // Burbuja del botón flotante: aparece unos segundos una vez
    var tip = $('.wa-tip'), float = $('#waFloat');
    if (!tip || !float) return;
    onReady(function () {
      setTimeout(function () { tip.classList.add('is-show'); }, 5200);
      setTimeout(function () { tip.classList.remove('is-show'); }, 11500);
    });
    float.addEventListener('mouseenter', function () { tip.classList.add('is-show'); });
    float.addEventListener('mouseleave', function () { tip.classList.remove('is-show'); });
  }

  /* ───────── 03 · SMOOTH SCROLL (Lenis) ───────── */
  function initSmoothScroll() {
    if (!reduceMotion && typeof window.Lenis !== 'undefined') {
      lenis = new window.Lenis({ lerp: 0.085, wheelMultiplier: 0.95, smoothWheel: true });
      (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(performance.now());
    }

    // Anclas internas con offset de la barra flotante
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute('href');
      var target = id.length > 1 ? document.querySelector(id) : document.body;
      if (!target) return;
      e.preventDefault();
      setMenu(false);
      if (lenis) {
        lenis.scrollTo(id.length > 1 ? target : 0, { offset: id === '#inicio' ? 0 : -64, duration: 1.7, easing: function (t) { return 1 - Math.pow(1 - t, 4); } });
      } else {
        target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      }
      if (id.length > 1 && history.replaceState) history.replaceState(null, '', id);
    });
  }

  /* ───────── 04 · PRELOADER ───────── */
  function initLoader() {
    var loader = $('#loader');
    if (!loader || reduceMotion) { if (loader) loader.remove(); setReady(); return; }

    var num = $('#ldNum'), bar = $('#ldBar'), ring = $('#ldRing'), mark = $('#ldMark'), status = $('#ldStatus');
    var phases = [
      [0,  'Inicializando protocolo'],
      [24, 'Calibrando nebulizadores'],
      [50, 'Verificando certificaciones'],
      [76, 'Cargando cobertura'],
      [97, 'Sistema listo']
    ];
    var MIN_TIME = 2400;           // duración mínima para que la animación se aprecie
    var start = performance.now(), p = 0, loaded = document.readyState === 'complete', finished = false, lastPhase = -1;

    body.classList.add('is-locked');
    if (lenis) lenis.stop();
    window.addEventListener('load', function () { loaded = true; });

    function render(v) {
      var n = Math.round(v);
      num.textContent = n;
      bar.style.transform = 'scaleX(' + (v / 100) + ')';
      ring.style.strokeDashoffset = (100 - v).toFixed(2);
      mark.style.setProperty('--p', v.toFixed(1) + '%');
      for (var i = phases.length - 1; i >= 0; i--) {
        if (v >= phases[i][0]) { if (i !== lastPhase) { lastPhase = i; status.textContent = phases[i][1]; } break; }
      }
    }

    function finish() {
      if (finished) return;
      finished = true;
      render(100);
      loader.classList.add('is-out');                                   // desvanece el centro + línea de corte
      setTimeout(function () { loader.classList.add('is-leaving'); }, 520);   // las dos mitades se abren
      setTimeout(setReady, 900);                                         // el hero empieza a animarse
      setTimeout(function () {
        loader.classList.add('is-done');
        body.classList.remove('is-locked');
        if (lenis) lenis.start();
      }, 2000);
    }

    (function tick(now) {
      var t = now - start;
      var timeP = clamp(t / MIN_TIME, 0, 1);
      var eased = 1 - Math.pow(1 - timeP, 3);
      var target = (loaded && t >= MIN_TIME) || t > 8000 ? 100 : Math.min(93, eased * 93);
      p += (target - p) * 0.09;
      if (target === 100 && p > 99.3) p = 100;
      render(p);
      if (p < 100) requestAnimationFrame(tick); else finish();
    })(start);
  }

  /* ───────── 05 · NAVEGACIÓN / MENÚ / SCROLL SPY ───────── */
  var menu, burger, menuOpen = false;
  function setMenu(open) {
    if (!menu || open === menuOpen) return;
    menuOpen = open;
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    menu.classList.toggle('is-open', open);
    var navEl = document.getElementById('nav'); if (navEl) navEl.classList.toggle('is-menu', open);
    menu.setAttribute('aria-hidden', String(!open));
    body.classList.toggle('is-locked', open);
    if (lenis) open ? lenis.stop() : lenis.start();
  }

  function initNav() {
    var nav = $('#nav'), progress = $('#scrollProgress i');
    menu = $('#menu'); burger = $('#burger');
    if (burger) burger.addEventListener('click', function () { setMenu(!menuOpen); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
    window.matchMedia('(min-width: 1024px)').addEventListener('change', function (m) { if (m.matches) setMenu(false); });

    var links = $$('.nav-links a[data-spy]');
    var lastY = 0;
    onScroll(function (y) {
      nav.classList.toggle('is-scrolled', y > 24);
      if (y < 300) links.forEach(function (l) { l.classList.remove('is-active'); });
      // Se oculta al bajar, reaparece al subir
      if (y > 700 && y > lastY + 6 && !menuOpen) nav.classList.add('is-hidden');
      else if (y < lastY - 6 || y <= 700) nav.classList.remove('is-hidden');
      lastY = y;

      var max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = 'scaleX(' + (max > 0 ? clamp(y / max, 0, 1) : 0) + ')';
    });

    // Scroll-spy: resalta el link de la sección visible
    if ('IntersectionObserver' in window && links.length) {
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          links.forEach(function (l) { l.classList.toggle('is-active', l.getAttribute('data-spy') === en.target.id); });
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      links.forEach(function (l) { var s = document.getElementById(l.getAttribute('data-spy')); if (s) spy.observe(s); });
    }
  }

  /* ───────── 06 · REVEAL + SPLIT DE TEXTO ───────── */
  function initSplit() {
    $$('.split').forEach(function (el) {
      var text = el.textContent.trim().replace(/\s+/g, ' ');
      el.setAttribute('aria-label', text);
      el.innerHTML = text.split(' ').map(function (w, i) {
        return '<span class="w" aria-hidden="true"><span style="--wi:' + i + '">' + w + '</span></span>';
      }).join(' ');
    });
  }

  function initReveal() {
    var items = $$('[data-reveal], .split');
    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (i) { i.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        el.classList.add('is-in');
        io.unobserve(el);
        if (el.hasAttribute('data-reveal')) {
          // Al terminar, quitamos el atributo para devolver el control de transiciones al componente (hover, etc.)
          var done = function () { el.removeAttribute('data-reveal'); };
          el.addEventListener('transitionend', function te(ev) {
            if (ev.target === el && ev.propertyName === 'opacity') { el.removeEventListener('transitionend', te); done(); }
          });
          setTimeout(done, 2600);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });

    items.forEach(function (el) {
      // lo que está dentro del hero espera a que el preloader termine
      if (el.closest('.hero')) onReady(function () { setTimeout(function () { io.observe(el); }, 700); });
      else io.observe(el);
    });
  }

  /* ───────── 07 · CONTADORES + PARALLAX ───────── */
  function initCounters() {
    var els = $$('.count');
    function run(el) {
      var to = parseFloat(el.getAttribute('data-to')) || 0, dur = 1900, t0 = performance.now();
      (function step(now) {
        var k = clamp((now - t0) / dur, 0, 1);
        var e = k === 1 ? 1 : 1 - Math.pow(2, -10 * k);       // easeOutExpo
        el.textContent = Math.round(to * e);
        if (k < 1) requestAnimationFrame(step);
      })(t0);
    }
    if (reduceMotion || !('IntersectionObserver' in window)) return;   // se queda con el valor final del HTML
    els.forEach(function (el) { el.textContent = '0'; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        run(en.target);
      });
    }, { threshold: 0.6 });
    els.forEach(function (el) {
      if (el.closest('.hero')) onReady(function () { setTimeout(function () { io.observe(el); }, 1100); });
      else io.observe(el);
    });
  }

  function initParallax() {
    if (reduceMotion) return;
    var items = [
      { sel: '.hero .orb--1', s: -0.16 }, { sel: '.hero .orb--2', s: 0.12 }, { sel: '.hero .orb--3', s: -0.08 },
      { sel: '.method .orb--m1', s: 0.1 }, { sel: '.method .orb--m2', s: -0.12 },
      { sel: '.coverage .orb--m1', s: 0.1 }, { sel: '.contact .orb--m1', s: 0.1 }, { sel: '.contact .orb--m2', s: -0.1 }
    ].map(function (o) { return { el: $(o.sel), s: o.s }; }).filter(function (o) { return o.el; });
    var hero = $('.hero-visual');
    onScroll(function (y) {
      items.forEach(function (o) {
        var r = o.el.parentElement.getBoundingClientRect();
        if (r.bottom < -200 || r.top > window.innerHeight + 200) return;
        o.el.style.translate = '0 ' + ((-r.top) * o.s).toFixed(1) + 'px';
      });
      if (hero && y < window.innerHeight * 1.3) hero.style.translate = '0 ' + (y * 0.06).toFixed(1) + 'px';
    });
  }

  /* ───────── 08 · HERO: CICLO DE PALABRAS + PARTÍCULAS ───────── */
  function initHeroCycle() {
    var el = $('#cycle');
    if (!el || reduceMotion) return;
    var words = el.getAttribute('data-words').split('|'), i = 0, busy = false;
    var glyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&@+*/';

    function scramble(to) {
      if (busy) return; busy = true;
      var frame = 0, resolveAt = to.split('').map(function (_, k) { return 5 + k * 2 + Math.floor(Math.random() * 7); });
      var timer = setInterval(function () {
        frame++;
        var out = '', done = 0;
        for (var k = 0; k < to.length; k++) {
          if (frame >= resolveAt[k]) { out += to[k]; done++; }
          else out += glyphs[Math.floor(Math.random() * glyphs.length)];
        }
        el.textContent = out;
        if (done === to.length) { clearInterval(timer); busy = false; }
      }, 34);
    }
    onReady(function () {
      setTimeout(function () {
        setInterval(function () { if (!document.hidden) { i = (i + 1) % words.length; scramble(words[i]); } }, 2800);
      }, 2600);
    });
  }

  function initHeroParticles() {
    var c = $('#fxCanvas'), hero = $('#inicio');
    if (!c || !hero || reduceMotion) return;
    var ctx = c.getContext('2d'), w = 0, h = 0, parts = [], running = false;
    var mouse = { x: -999, y: -999 };

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = hero.clientWidth; h = hero.clientHeight;
      c.width = w * dpr; c.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = clamp(Math.round(w * h / 15000), 26, 84);
      parts = [];
      for (var k = 0; k < n; k++) {
        parts.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .34, vy: (Math.random() - .5) * .34, r: Math.random() * 1.7 + .8, g: Math.random() < .38 });
      }
    }
    function frame() {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      var i, j, a, b, dx, dy, d, MAX = 128;
      for (i = 0; i < parts.length; i++) {
        a = parts[i];
        a.x += a.vx; a.y += a.vy;
        dx = a.x - mouse.x; dy = a.y - mouse.y; d = Math.sqrt(dx * dx + dy * dy);
        if (d < 150 && d > 0) { var f = (150 - d) / 150; a.x += dx / d * f * 2.4; a.y += dy / d * f * 2.4; }   // las "plagas" huyen del cursor
        if (a.x < -10) a.x = w + 10; else if (a.x > w + 10) a.x = -10;
        if (a.y < -10) a.y = h + 10; else if (a.y > h + 10) a.y = -10;
        for (j = i + 1; j < parts.length; j++) {
          b = parts[j]; dx = a.x - b.x; dy = a.y - b.y; d = dx * dx + dy * dy;
          if (d < MAX * MAX) {
            ctx.strokeStyle = (a.g && b.g ? 'rgba(25,195,125,' : 'rgba(10,13,11,') + ((1 - Math.sqrt(d) / MAX) * .15).toFixed(3) + ')';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        ctx.fillStyle = a.g ? 'rgba(25,195,125,.6)' : 'rgba(10,13,11,.34)';
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, TAU); ctx.fill();
      }
      requestAnimationFrame(frame);
    }
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    }, { passive: true });
    hero.addEventListener('pointerleave', function () { mouse.x = mouse.y = -999; });

    resize(); watchSize(hero, resize);
    whenVisible(hero, function (v) { if (v && !running) { running = true; frame(); } else if (!v) running = false; });
  }

  function initHeroParallax() {
    var hero = $('#inicio'), vis = $('.hero-visual');
    if (!hero || !vis || reduceMotion || !finePointer) return;
    $$('.fcard', vis).forEach(function (c) { c.style.setProperty('--depth', c.getAttribute('data-depth') || 20); });
    var raf = 0, tx = 0, ty = 0;
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - .5) * 2; ty = ((e.clientY - r.top) / r.height - .5) * 2;
      if (!raf) raf = requestAnimationFrame(function () { raf = 0; vis.style.setProperty('--mx', tx.toFixed(3)); vis.style.setProperty('--my', ty.toFixed(3)); });
    }, { passive: true });
  }

  /* ───────── 09 · HERO: RADAR DE DETECCIÓN Y ELIMINACIÓN ───────── */
  function initRadar() {
    var c = $('#radarCanvas'), countEl = $('#radarCount');
    if (!c) return;
    var ctx = c.getContext('2d'), size = 0, R = 0, cx = 0, cy = 0;
    var angle = -1.2, last = 0, running = false, shown = -1;
    var pests = [], bursts = [], respawn = [];
    var TARGET = 7, TRAIL = 1.05;
    var hasConic = typeof ctx.createConicGradient === 'function';

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2), r = c.getBoundingClientRect();
      size = r.width; R = size / 2; cx = cy = R;
      c.width = c.height = Math.round(size * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function spawn(ahead) {
      var a = ahead ? angle + 0.8 + Math.random() * 4.6 : Math.random() * TAU;
      pests.push({ a: a, rad: R * (.2 + Math.random() * .7), da: (Math.random() - .5) * .00012, dr: Math.random() * TAU, s: .85 + Math.random() * .4, rot: Math.random() * TAU, spin: (Math.random() - .5) * .002, dying: 0 });
    }
    function norm(v) { return ((v % TAU) + TAU) % TAU; }

    function drawBug(x, y, s, rot, alpha, color) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha = alpha;
      ctx.fillStyle = color; ctx.strokeStyle = color; ctx.lineWidth = 1.05 * s; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.ellipse(0, 0, 2.6 * s, 4.2 * s, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(0, -4.7 * s, 1.5 * s, 0, TAU); ctx.fill();
      ctx.beginPath();
      [-1.7, 0, 1.7].forEach(function (yy) {
        ctx.moveTo(-2.2 * s, yy * s); ctx.lineTo(-6.2 * s, (yy * 1.9 + .3) * s);
        ctx.moveTo(2.2 * s, yy * s);  ctx.lineTo(6.2 * s, (yy * 1.9 + .3) * s);
      });
      ctx.moveTo(-.8 * s, -5.9 * s); ctx.lineTo(-3 * s, -9.2 * s);
      ctx.moveTo(.8 * s, -5.9 * s);  ctx.lineTo(3 * s, -9.2 * s);
      ctx.stroke(); ctx.restore();
    }

    function frame(now) {
      if (!running) return;
      var dt = Math.min(50, now - (last || now)); last = now;
      angle += dt * 0.00115;
      ctx.clearRect(0, 0, size, size);

      // Anillos, cruz y marcas
      ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(10,13,11,.10)';
      [.25, .5, .75, 1].forEach(function (k) { ctx.beginPath(); ctx.arc(cx, cy, R * k - .5, 0, TAU); ctx.stroke(); });
      ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, size); ctx.moveTo(0, cy); ctx.lineTo(size, cy); ctx.stroke();
      ctx.strokeStyle = 'rgba(10,13,11,.3)';
      for (var t = 0; t < 72; t++) {
        var ta = t * TAU / 72, len = t % 6 === 0 ? 9 : 4.5;
        ctx.beginPath(); ctx.moveTo(cx + Math.cos(ta) * (R - 2), cy + Math.sin(ta) * (R - 2)); ctx.lineTo(cx + Math.cos(ta) * (R - 2 - len), cy + Math.sin(ta) * (R - 2 - len)); ctx.stroke();
      }

      // Pulso desde el centro
      var pulse = (now % 3600) / 3600;
      ctx.strokeStyle = 'rgba(25,195,125,' + ((1 - pulse) * .28).toFixed(3) + ')'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(cx, cy, R * (.12 + pulse * .88), 0, TAU); ctx.stroke();

      // Barrido
      if (hasConic) {
        var g = ctx.createConicGradient(angle - TRAIL, cx, cy), f = TRAIL / TAU;
        g.addColorStop(0, 'rgba(25,195,125,0)'); g.addColorStop(f, 'rgba(25,195,125,.36)');
        g.addColorStop(Math.min(f + .003, 1), 'rgba(25,195,125,0)'); g.addColorStop(1, 'rgba(25,195,125,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R - 1, 0, TAU); ctx.fill();
      } else {
        for (var q = 0; q < 26; q++) {
          ctx.strokeStyle = 'rgba(25,195,125,' + (.3 * (1 - q / 26)).toFixed(3) + ')'; ctx.lineWidth = 3;
          var qa = angle - q * .04; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(qa) * R, cy + Math.sin(qa) * R); ctx.stroke();
        }
      }
      ctx.save(); ctx.shadowColor = 'rgba(25,195,125,.9)'; ctx.shadowBlur = 10;
      ctx.strokeStyle = 'rgba(12,143,86,.95)'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(angle) * (R - 1), cy + Math.sin(angle) * (R - 1)); ctx.stroke(); ctx.restore();

      // Plagas
      var s0 = R / 150;
      for (var i = pests.length - 1; i >= 0; i--) {
        var p = pests[i];
        if (p.dying) {
          p.dying -= dt;
          if (p.dying <= 0) { pests.splice(i, 1); continue; }
        } else {
          p.a += p.da * dt; p.rot += p.spin * dt;
          p.dr += dt * .0011;
        }
        var rr = p.rad + Math.sin(p.dr) * 4;
        var px = cx + Math.cos(p.a) * rr, py = cy + Math.sin(p.a) * rr;

        if (!p.dying) {
          var diff = norm(angle - p.a);
          if (diff < .06) {                                  // el barrido la alcanza → eliminada
            p.dying = 420; bursts.push({ x: px, y: py, t: 0 });
            respawn.push(now + 700 + Math.random() * 1700);
          } else if (diff > TAU - .7) {                      // a punto de ser alcanzada → "lock"
            var lk = (diff - (TAU - .7)) / .7, bs = 11 * s0 * (1.5 - lk * .5);
            ctx.strokeStyle = 'rgba(12,143,86,' + (lk * .9).toFixed(2) + ')'; ctx.lineWidth = 1.4;
            ctx.beginPath();
            [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function (k) {
              ctx.moveTo(px + k[0] * bs, py + k[1] * (bs - 5 * s0)); ctx.lineTo(px + k[0] * bs, py + k[1] * bs); ctx.lineTo(px + k[0] * (bs - 5 * s0), py + k[1] * bs);
            });
            ctx.stroke();
          }
          drawBug(px, py, p.s * s0 * 1.25, p.rot, .88, '#0A0D0B');
        } else {
          var fade = p.dying / 420;
          drawBug(px, py, p.s * s0 * 1.25 * (.6 + fade * .4), p.rot + (1 - fade) * 2, fade * .7, '#0C8F56');
        }
      }

      // Destellos de eliminación
      for (var b = bursts.length - 1; b >= 0; b--) {
        var bu = bursts[b]; bu.t += dt;
        var k2 = bu.t / 650;
        if (k2 >= 1) { bursts.splice(b, 1); continue; }
        ctx.strokeStyle = 'rgba(25,195,125,' + (1 - k2).toFixed(2) + ')'; ctx.lineWidth = 2 * (1 - k2) + .5;
        ctx.beginPath(); ctx.arc(bu.x, bu.y, 4 + k2 * 30 * s0, 0, TAU); ctx.stroke();
        ctx.strokeStyle = 'rgba(160,220,30,' + (1 - k2).toFixed(2) + ')';
        ctx.beginPath();
        for (var sp = 0; sp < 8; sp++) {
          var sa = sp * TAU / 8 + .4;
          ctx.moveTo(bu.x + Math.cos(sa) * (6 + k2 * 14) * s0, bu.y + Math.sin(sa) * (6 + k2 * 14) * s0);
          ctx.lineTo(bu.x + Math.cos(sa) * (10 + k2 * 26) * s0, bu.y + Math.sin(sa) * (10 + k2 * 26) * s0);
        }
        ctx.stroke();
      }

      // Reaparecen nuevas plagas
      for (var r = respawn.length - 1; r >= 0; r--) if (now >= respawn[r]) { respawn.splice(r, 1); spawn(true); }

      // Contador HUD
      var alive = pests.filter(function (x) { return !x.dying; }).length;
      if (alive !== shown && countEl) { shown = alive; countEl.textContent = (alive < 10 ? '0' : '') + alive; }

      requestAnimationFrame(frame);
    }

    resize();
    for (var k = 0; k < TARGET; k++) spawn(false);
    watchSize(c, resize);
    if (reduceMotion) { running = true; frame(performance.now()); running = false; return; }
    whenVisible(c, function (v) { if (v && !running) { running = true; last = 0; requestAnimationFrame(frame); } else if (!v) running = false; });
  }

  /* ───────── 10 · MARQUEE REACTIVO AL SCROLL ───────── */
  function initMarquee() {
    var rows = $$('.mq-row');
    if (!rows.length) return;
    var st = rows.map(function (row) {
      return { row: row, dir: parseFloat(row.getAttribute('data-dir')) || -1, pos: 0, tracks: [$('.mq-track', row)], base: row.classList.contains('mq-row--big') ? 62 : 38 };
    });
    function fill() {
      st.forEach(function (o) {
        var w = o.tracks[0].offsetWidth;
        while (w && o.tracks.length * w < window.innerWidth + w) {
          var cl = o.tracks[0].cloneNode(true); cl.setAttribute('aria-hidden', 'true');
          o.row.appendChild(cl); o.tracks.push(cl);
        }
      });
    }
    fill(); window.addEventListener('resize', debounce(fill, 200)); window.addEventListener('load', fill);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fill);
    if (reduceMotion) return;

    var running = false, last = 0, lastY = window.scrollY, vel = 0;
    function frame(now) {
      if (!running) return;
      var dt = Math.min(50, now - (last || now)) / 1000; last = now;
      var y = window.scrollY; vel = lerp(vel, y - lastY, .12); lastY = y;
      var boost = Math.min(Math.abs(vel) * 14, 520);
      st.forEach(function (o) {
        var w = o.tracks[0].offsetWidth; if (!w) return;
        o.pos = (o.pos + (o.base + boost) * dt) % w;
        var x = o.dir < 0 ? -o.pos : o.pos - w;
        var tr = 'translate3d(' + x.toFixed(1) + 'px,0,0)';
        o.tracks.forEach(function (t) { t.style.transform = tr; });
        o.row.style.transform = 'skewX(' + clamp(-vel * .16 * (o.dir < 0 ? 1 : -1), -7, 7).toFixed(2) + 'deg)';
      });
      requestAnimationFrame(frame);
    }
    whenVisible($('.marquee'), function (v) { if (v && !running) { running = true; last = 0; requestAnimationFrame(frame); } else if (!v) running = false; });
  }

  /* ───────── 11 · MÉTODO: TIMELINE CON SCROLL ───────── */
  function initMethod() {
    var list = $('#steps'), fill = $('#mringFill'), label = $('#mringStep');
    if (!list) return;
    var steps = $$('.step', list);
    function update() {
      var vh = window.innerHeight, r = list.getBoundingClientRect();
      var p = clamp((vh * .62 - r.top) / r.height, 0, 1);
      list.style.setProperty('--sp', p.toFixed(3));
      if (fill) fill.style.strokeDashoffset = (100 - p * 100).toFixed(1);
      var idx = -1;
      steps.forEach(function (s, i) { if (s.getBoundingClientRect().top < vh * .64) idx = i; });
      steps.forEach(function (s, i) { s.classList.toggle('is-active', i === idx); });
      if (label && idx >= 0) label.textContent = 'Paso 0' + (idx + 1) + ' / 0' + steps.length;
    }
    onScroll(update); update();
  }

  /* ───────── 12 · EXPLORADOR DE PLAGAS ───────── */
  function initPests() {
    var tabsWrap = $('#ptabs');
    if (!tabsWrap) return;
    var tabs = $$('.ptab', tabsWrap), panels = $$('.ppanel'), frame = $('.pvis-frame');
    var nm = $('#pvName'), pr = $('#pvPrice'), ix = $('#pvIdx');

    function select(i, focus) {
      tabs.forEach(function (t, k) {
        var on = k === i;
        t.classList.toggle('is-active', on); t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1;
      });
      panels.forEach(function (p, k) { p.hidden = k !== i; p.classList.toggle('is-active', k === i); });
      var p = panels[i];
      nm.textContent = p.getAttribute('data-name'); pr.textContent = p.getAttribute('data-price');
      ix.textContent = p.getAttribute('data-idx') + ' / ' + (panels.length < 10 ? '0' : '') + panels.length;
      frame.classList.remove('is-switch'); void frame.offsetWidth; frame.classList.add('is-switch');
      if (tabsWrap.scrollWidth > tabsWrap.clientWidth && tabsWrap.scrollHeight <= tabsWrap.clientHeight + 14) {   // tabs en horizontal (móvil)
        var t = tabs[i];
        tabsWrap.scrollTo({ left: t.offsetLeft - (tabsWrap.clientWidth - t.offsetWidth) / 2, behavior: reduceMotion ? 'auto' : 'smooth' });
      }
      if (focus) tabs[i].focus({ preventScroll: true });
    }
    tabs.forEach(function (t, i) { t.addEventListener('click', function () { select(i); }); });
    tabsWrap.addEventListener('keydown', function (e) {
      var cur = tabs.indexOf(document.activeElement); if (cur < 0) return;
      var n = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (cur + 1) % tabs.length;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (cur - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') n = 0; else if (e.key === 'End') n = tabs.length - 1;
      if (n !== null) { e.preventDefault(); select(n, true); }
    });
  }

  /* ───────── 13 · CARRUSEL DE PROMOS + LIGHTBOX ───────── */
  function initCarousel() {
    var track = $('#carTrack'), prev = $('#carPrev'), next = $('#carNext'), bar = $('#carBar');
    if (!track) return;

    function update() {
      var max = track.scrollWidth - track.clientWidth, p = max > 0 ? track.scrollLeft / max : 0;
      bar.style.transform = 'scaleX(' + (0.16 + p * 0.84).toFixed(3) + ')';
      prev.disabled = track.scrollLeft < 4; next.disabled = track.scrollLeft > max - 4;
    }
    function step() { var card = $('.promo', track); return card ? card.offsetWidth + 16 : 380; }
    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', debounce(update, 150));
    prev.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: 'smooth' }); });
    next.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: 'smooth' }); });
    update();

    // Arrastrar con el mouse
    var down = false, moved = false, sx = 0, sl = 0;
    track.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true; moved = false; sx = e.clientX; sl = track.scrollLeft;
    });
    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - sx;
      if (!moved && Math.abs(dx) > 6) { moved = true; track.classList.add('is-drag'); }
      if (moved) track.scrollLeft = sl - dx;
    });
    window.addEventListener('pointerup', function () {
      if (!down) return;
      down = false; track.classList.remove('is-drag');
    });
    track.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);

    // Lightbox
    var lb = $('#lightbox'), lbImg = $('#lightboxImg');
    if (!lb) return;
    $$('[data-lightbox]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (typeof lb.showModal !== 'function') { window.open(b.getAttribute('data-lightbox'), '_blank', 'noopener'); return; }
        lbImg.src = b.getAttribute('data-lightbox'); lbImg.alt = b.getAttribute('data-alt') || '';
        lb.showModal(); if (lenis) lenis.stop();
      });
    });
    lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
    $('#lightboxClose').addEventListener('click', function () { lb.close(); });
    lb.addEventListener('close', function () { if (lenis && !menuOpen) lenis.start(); });
  }

  /* ───────── 14 · MAPA DE COBERTURA (canvas de puntos) ───────── */
  // Contorno simplificado de México (lon, lat) — silueta estilizada, no cartográfica
  var MX = [
    [-117.12,32.53],[-114.72,32.72],[-114.81,32.49],[-112.9,31.84],[-111.07,31.33],[-108.21,31.33],[-108.21,31.78],[-106.53,31.78],
    [-105.0,30.65],[-104.5,29.65],[-103.15,28.97],[-102.7,29.75],[-101.4,29.77],[-100.5,28.65],[-99.52,27.55],[-99.1,26.4],[-97.15,25.96],
    [-97.5,24.0],[-97.8,22.5],[-97.4,21.3],[-97.2,20.6],[-96.4,19.5],[-95.9,18.8],[-94.7,18.15],[-93.6,18.4],[-92.3,18.65],[-91.0,18.9],
    [-90.7,19.4],[-90.4,20.6],[-89.6,21.25],[-88.2,21.55],[-87.0,21.5],[-86.8,20.8],[-87.4,19.6],[-87.6,18.3],[-88.3,18.5],[-89.15,17.82],
    [-90.98,17.82],[-91.4,17.25],[-91.4,16.1],[-92.2,15.25],[-92.2,14.55],[-93.5,15.6],[-94.7,16.2],[-95.9,15.65],[-97.5,15.85],[-98.7,16.5],
    [-99.9,16.7],[-101.0,17.3],[-102.2,18.0],[-103.5,18.85],[-104.4,19.2],[-105.3,20.4],[-105.55,20.75],[-105.25,21.8],[-105.8,22.5],
    [-106.4,23.2],[-107.5,24.4],[-108.5,25.2],[-109.4,26.0],[-110.5,27.5],[-111.2,28.1],[-112.2,28.9],[-112.8,29.9],[-113.5,31.0],[-114.8,31.75],
    [-114.75,31.0],[-114.5,30.0],[-113.7,29.0],[-112.9,28.0],[-112.0,26.7],[-111.35,25.9],[-110.5,24.3],[-109.65,23.3],[-109.45,22.9],
    [-110.05,22.85],[-110.3,23.6],[-111.2,24.2],[-112.1,24.7],[-112.1,25.6],[-112.8,26.4],[-113.4,26.9],[-114.0,27.7],[-115.0,27.8],
    [-114.5,28.4],[-115.2,29.2],[-115.8,29.9],[-116.1,30.6],[-116.6,31.8]
  ];

  function initMap() {
    var map = $('#map'), cv = $('#mapCanvas'), arcs = $('#mapArcs');
    if (!map || !cv) return;
    var ctx = cv.getContext('2d'), pins = $$('#mapPins li'), cityItems = $$('.cities li');
    var LON0 = -117.9, LON1 = -86.2, LAT0 = 14.0, LAT1 = 33.1, K = Math.cos(24 * Math.PI / 180);
    var W = 0, H = 0, dots = [], hq = null, running = false, hot = null;
    var NS = 'http://www.w3.org/2000/svg';

    function project(lon, lat) {
      var wu = (LON1 - LON0) * K, hu = LAT1 - LAT0, sc = Math.min(W / wu, H / hu) * .97;
      return [(W - wu * sc) / 2 + (lon - LON0) * K * sc, (H - hu * sc) / 2 + (LAT1 - lat) * sc];
    }

    function build() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = map.clientWidth; H = map.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var path = new Path2D();
      MX.forEach(function (pt, i) { var q = project(pt[0], pt[1]); i ? path.lineTo(q[0], q[1]) : path.moveTo(q[0], q[1]); });
      path.closePath();

      // Pines
      var coords = {};
      pins.forEach(function (li) {
        var q = project(parseFloat(li.getAttribute('data-lon')), parseFloat(li.getAttribute('data-lat')));
        li.style.setProperty('--x', (q[0] / W * 100).toFixed(2) + '%'); li.style.setProperty('--y', (q[1] / H * 100).toFixed(2) + '%');
        coords[li.getAttribute('data-city')] = q;
      });
      hq = coords.monterrey;

      // Puntos dentro de México
      var step = Math.max(6.5, W / 74); dots = [];
      var maxD = 0;
      for (var y = step / 2; y < H; y += step) {
        for (var x = step / 2; x < W; x += step) {
          if (ctx.isPointInPath(path, x, y)) {
            var d = Math.hypot(x - hq[0], y - hq[1]); maxD = Math.max(maxD, d);
            dots.push({ x: x, y: y, d: d });
          }
        }
      }
      dots.forEach(function (o) { o.d /= maxD || 1; });

      // Arcos desde Monterrey
      arcs.setAttribute('viewBox', '0 0 ' + W + ' ' + H); arcs.innerHTML = '';
      Object.keys(coords).forEach(function (k) {
        if (k === 'monterrey') return;
        var t = coords[k], mx = (hq[0] + t[0]) / 2, my = (hq[1] + t[1]) / 2, dx = t[0] - hq[0], dy = t[1] - hq[1];
        var c1 = [mx - dy * .22, my + dx * .22], c2 = [mx + dy * .22, my - dx * .22];
        var c = c1[1] < c2[1] ? c1 : c2;
        var p = document.createElementNS(NS, 'path');
        p.setAttribute('d', 'M' + hq[0].toFixed(1) + ' ' + hq[1].toFixed(1) + ' Q' + c[0].toFixed(1) + ' ' + c[1].toFixed(1) + ' ' + t[0].toFixed(1) + ' ' + t[1].toFixed(1));
        arcs.appendChild(p);
      });
      draw(performance.now());
    }

    function draw(now) {
      ctx.clearRect(0, 0, W, H);
      var wave = reduceMotion ? 2 : (now * .00028) % 1.7, sig = .075;
      for (var i = 0; i < dots.length; i++) {
        var o = dots[i], dl = o.d - wave, g = Math.exp(-(dl * dl) / (2 * sig * sig));
        var a = .27 + g * .7, r = 1.35 + g * 1.1;
        ctx.fillStyle = g > .3 ? 'rgba(200,255,77,' + a.toFixed(2) + ')' : 'rgba(255,255,255,' + a.toFixed(2) + ')';
        ctx.fillRect(o.x - r / 2, o.y - r / 2, r, r);
      }
    }
    function loop(now) { if (!running) return; draw(now); requestAnimationFrame(loop); }

    // Interacción lista ↔ mapa
    function setHot(city) {
      hot = city;
      cityItems.forEach(function (li) { li.classList.toggle('is-hot', li.getAttribute('data-city') === city); });
      pins.forEach(function (li) { li.classList.toggle('is-hot', li.getAttribute('data-city') === city); });
    }
    cityItems.concat(pins).forEach(function (li) {
      li.addEventListener('mouseenter', function () { setHot(li.getAttribute('data-city')); });
      li.addEventListener('mouseleave', function () { setHot(null); });
    });

    build(); watchSize(map, build);
    if (!reduceMotion) whenVisible(map, function (v) { if (v && !running) { running = true; requestAnimationFrame(loop); } else if (!v) running = false; });
  }

  /* ───────── 15 · FAQ (ACORDEÓN) ───────── */
  function initFAQ() {
    var items = $$('.acc-item');
    function toggle(item, open) {
      item.classList.toggle('is-open', open);
      $('.acc-q', item).setAttribute('aria-expanded', String(open));
    }
    items.forEach(function (item) {
      $('.acc-q', item).addEventListener('click', function () {
        var open = !item.classList.contains('is-open');
        items.forEach(function (o) { if (o !== item) toggle(o, false); });
        toggle(item, open);
      });
    });
    if (items[0]) toggle(items[0], true);
  }

  /* ───────── 16 · FORMULARIO → WHATSAPP ───────── */
  function initForm() {
    var form = $('#contactForm');
    if (!form) return;
    var name = $('#f-name'), phone = $('#f-phone'), ok = $('#formOk');

    function setErr(input, errId, msg) {
      var field = input.closest('.field');
      field.classList.toggle('has-err', !!msg);
      $('#' + errId).textContent = msg || '';
      input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    }
    [[name, 'e-name'], [phone, 'e-phone']].forEach(function (p) { p[0].addEventListener('input', function () { setErr(p[0], p[1], ''); }); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var n = name.value.trim(), ph = phone.value.trim(), digits = ph.replace(/\D/g, '');
      var bad = false;
      if (n.length < 2) { setErr(name, 'e-name', 'Escribe tu nombre para poder atenderte.'); bad = true; }
      if (digits.length < 8) { setErr(phone, 'e-phone', 'Escribe un número de 10 dígitos para contactarte.'); bad = true; }
      if (bad) { (n.length < 2 ? name : phone).focus(); return; }

      var msg = $('#f-msg').value.trim().replace(/[.\s]+$/, '');
      var text = 'Hola Biocontrol, soy ' + n + '. Quiero cotizar: ' + $('#f-service').value +
        '. Ciudad: ' + $('#f-city').value + '. ' + (msg ? 'Detalle: ' + msg + '. ' : '') + 'Mi teléfono: ' + ph + '.';
      ok.hidden = false;
      var w = window.open(waURL(text), '_blank', 'noopener');
      if (!w) window.location.href = waURL(text);          // si el navegador bloquea la pestaña nueva
      setTimeout(function () { ok.hidden = true; form.reset(); }, 6000);
    });
  }

  /* ───────── 17 · CURSOR, SPOTLIGHT, TILT, MAGNETIC ───────── */
  function initCursor() {
    var cur = $('#cursor');
    if (!cur || !finePointer || reduceMotion) return;
    var dot = $('.cursor-dot', cur), ring = $('.cursor-ring', cur);
    var x = 0, y = 0, rx = 0, ry = 0, on = false;
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      x = e.clientX; y = e.clientY;
      if (!on) { on = true; rx = x; ry = y; cur.classList.add('is-on'); }
      var link = e.target.closest && e.target.closest('a, button, [role="tab"], input, select, textarea, label');
      cur.classList.toggle('is-link', !!link);
    }, { passive: true });
    document.addEventListener('pointerleave', function () { cur.classList.remove('is-on'); on = false; });
    window.addEventListener('pointerdown', function () { cur.classList.add('is-down'); });
    window.addEventListener('pointerup', function () { cur.classList.remove('is-down'); });
    (function loop() {
      rx = lerp(rx, x, .17); ry = lerp(ry, y, .17);
      dot.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
      ring.style.transform = 'translate3d(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px,0)';
      requestAnimationFrame(loop);
    })();
  }

  function initInteractions() {
    if (!finePointer || reduceMotion) return;

    // Spotlight que sigue al cursor dentro de las tarjetas
    $$('.spot').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--sx', (e.clientX - r.left) + 'px'); el.style.setProperty('--sy', (e.clientY - r.top) + 'px');
      }, { passive: true });
    });

    // Tilt 3D en las tarjetas de promoción
    $$('.promo').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse') return;
        var r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
        el.style.transform = 'perspective(1000px) rotateX(' + (-py * 7).toFixed(2) + 'deg) rotateY(' + (px * 9).toFixed(2) + 'deg) translateY(-6px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });

    // Botones magnéticos
    $$('.magnetic').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.translate = ((e.clientX - r.left - r.width / 2) * .18).toFixed(1) + 'px ' + ((e.clientY - r.top - r.height / 2) * .3).toFixed(1) + 'px';
      });
      el.addEventListener('pointerleave', function () { el.style.translate = ''; });
    });
  }

  /* ───────── 19 · SCROLL FX (animaciones ligadas al scroll) ─────────
     Todo se calcula en un único bucle por scroll. Funciona igual con rueda
     (escritorio) y con el dedo (móvil) porque solo lee la posición de scroll.
     Usa translate / scale / rotate (propiedades individuales) para no chocar
     con los hover ni con las entradas, que usan transform.                   */
  function initScrollFX() {
    if (reduceMotion || !window.CSS || !CSS.supports || !CSS.supports('translate', '0 0')) return;

    var vw = window.innerWidth, vh = window.innerHeight, maxScroll = 0, heroH = 1;
    var easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };
    var K_MOBILE = function () { return vw < 720 ? 0.7 : 1; };

    /* — Qué se anima y cómo — */
    var RISE = [               // sube + crece + gira un poco al entrar (se escalonan por fila)
      ['.bcard',                       { y: 80, s: .09, r: 1.8 }],
      ['.vs-card--old',                { y: 44, x: -80, s: .05, r: -2.6 }],
      ['.vs-card--new',                { y: 44, x: 80, s: .05, r: 2.6 }],
      ['.health',                      { y: 56, s: .05 }],
      ['.center-cta',                  { y: 44, s: .04 }],
      ['.step',                        { y: 50, s: .04 }],
      ['.pstage',                      { y: 80, s: .06 }],
      ['.promo',                       { y: 70, s: .08, r: 1.4 }],
      ['.cities li',                   { y: 30, s: .07 }],
      ['.acc-item',                    { y: 38 }],
      ['.ccards li',                   { y: 26, x: -46 }],
      ['.form-card',                   { y: 90, s: .06 }],
      ['.footer-brand, .footer-col',   { y: 40 }]
    ];
    var DRIFT = [              // se desplazan a otra velocidad que el resto (profundidad)
      ['.promo-media img',                     { speed: -.11, max: 24, scale: 1.16 }],
      ['.bcard-ico',                           { speed: .07, max: 14 }],
      ['.section-head:not(.faq-head) .h2',     { speed: .065, max: 30 }]
    ];
    var BGWORDS = { servicios: 'Servicios', metodo: 'Método', plagas: 'Plagas', promos: 'Promos', cobertura: 'Cobertura', faq: 'Dudas', contacto: 'Contacto' };

    var items = [], drifts = [], texts = [], curtains = [], bgs = [], eyebrows = [];

    /* — Construcción — */
    RISE.forEach(function (def, k) {
      $$(def[0]).forEach(function (el) { items.push({ el: el, o: def[1], k: k, d: 0, last: -1 }); });
    });
    DRIFT.forEach(function (def) {
      $$(def[0]).forEach(function (el) {
        if (def[1].scale) el.style.scale = def[1].scale;
        drifts.push({ el: el, o: def[1], last: 1e9 });
      });
    });
    $$('.eyebrow').forEach(function (el) { eyebrows.push({ el: el, last: -1 }); });
    $$('.section--dark, .footer').forEach(function (el) { curtains.push({ el: el, last: -1 }); });

    var bgIndex = 0;
    Object.keys(BGWORDS).forEach(function (id) {
      var sec = document.getElementById(id); if (!sec) return;
      var w = document.createElement('div'); w.className = 'bgword'; w.setAttribute('aria-hidden', 'true');
      w.textContent = BGWORDS[id]; sec.insertBefore(w, sec.firstChild);
      bgs.push({ el: w, sec: sec, dir: bgIndex++ % 2 ? 1 : -1, last: 1e9 });
    });

    // Texto que se enciende palabra por palabra
    $$('.lead:not(.hero-lead), .health p').forEach(function (el) {
      if (el.children.length) return;
      var words = el.textContent.trim().split(/\s+/), spans = [];
      el.textContent = '';
      words.forEach(function (w, i) {
        var s = document.createElement('span'); s.className = 'sw'; s.textContent = w; s.style.opacity = '.14';
        el.appendChild(s); spans.push(s);
        if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
      });
      texts.push({ el: el, spans: spans, last: -1 });
    });

    var hero = $('#inicio'), heroCopy = $('.hero-copy'), radar = $('.radar'), cue = $('.scroll-cue');
    var fcards = $$('.fcard'), ringA = $('.radar-ring--a'), ringB = $('.radar-ring--b');
    var mdash = $('.mring-dash'), mSec = $('#metodo');
    var giant = $('.footer-giant span'), giantBox = $('.footer-giant');
    var fab = $('#fab'), fabFill = $('#fabFill');
    var mSecO = mSec ? { el: mSec } : null, giantO = giantBox ? { el: giantBox } : null;

    /* — Medición (posición real en el documento, sin contar transforms) — */
    function pos(el) { var t = 0, l = 0; while (el) { t += el.offsetTop; l += el.offsetLeft; el = el.offsetParent; } return [t, l]; }
    function measure() {
      vw = window.innerWidth; vh = window.innerHeight;
      maxScroll = Math.max(0, document.documentElement.scrollHeight - vh);
      heroH = hero ? hero.offsetHeight : 1;
      [items, drifts, texts, curtains, bgs, eyebrows].forEach(function (list) {
        list.forEach(function (o) { var src = o.sec || o.el, p = pos(src); o.top = p[0]; o.left = p[1]; o.h = src.offsetHeight; });
      });
      [mSecO, giantO].forEach(function (o) { if (o) { var p = pos(o.el); o.top = p[0]; o.h = o.el.offsetHeight; } });
      // Escalonado: los elementos de la misma fila entran en cascada de izquierda a derecha
      var groups = {};
      items.forEach(function (it) { var key = it.k + '|' + Math.round(it.top / 14); (groups[key] = groups[key] || []).push(it); });
      Object.keys(groups).forEach(function (key) {
        var g = groups[key].sort(function (a, b) { return a.left - b.left; });
        g.forEach(function (it, i) { it.d = Math.min(i * .13, .5); });
      });
      // Fuerza el recálculo de todo en el siguiente frame
      items.forEach(function (o) { o.last = -1; });
      [texts, curtains, eyebrows].forEach(function (l) { l.forEach(function (o) { o.last = -1; }); });
      drifts.forEach(function (o) { o.last = 1e9; });
      bgs.forEach(function (o) { o.last = 1e9; });
    }

    /* Progreso 0→1 mientras el borde superior del elemento va de startF a endF (fracción del alto de pantalla).
       Si el elemento está tan abajo en la página que nunca llegaría a endF, se ajusta para que llegue al final del scroll. */
    function prog(o, y, startF, endF) {
      var start = vh * startF, end = vh * endF, floor = o.top - maxScroll;
      if (floor > end - 6) { end = floor + 6; start = Math.max(start, end + vh * (startF - endF)); }
      return clamp((start - (o.top - y)) / (start - end), 0, 1);
    }

    /* — Efectos — */
    function applyRise(it, y) {
      var raw = prog(it, y, .97, .63), p = it.d ? clamp((raw - it.d) / (1 - it.d), 0, 1) : raw;
      var q = 1 - easeOut(p), key = Math.round(q * 400);
      if (key === it.last) return; it.last = key;
      var el = it.el, o = it.o;
      if (key === 0) { el.style.translate = ''; el.style.scale = ''; el.style.rotate = ''; return; }   // estado final limpio
      var k = K_MOBILE();
      el.style.translate = ((o.x || 0) * q * k).toFixed(1) + 'px ' + ((o.y || 0) * q).toFixed(1) + 'px';
      if (o.s) el.style.scale = (1 - o.s * q).toFixed(4);
      if (o.r) el.style.rotate = (o.r * q).toFixed(2) + 'deg';
    }

    function applyDrift(d, y) {
      var c = d.top + d.h / 2 - y;
      var v = clamp((c - vh / 2) * d.o.speed, -d.o.max, d.o.max);
      if (Math.abs(v - d.last) < .25) return; d.last = v;
      d.el.style.translate = '0 ' + v.toFixed(1) + 'px';
    }

    function applyText(t, y) {
      var p = prog(t, y, .93, .5), key = Math.round(p * 500);
      if (key === t.last) return; t.last = key;
      var n = t.spans.length, f = p * (n + 4);
      for (var i = 0; i < n; i++) t.spans[i].style.opacity = (.14 + .86 * clamp(f - i, 0, 1)).toFixed(2);
    }

    function applyCurtain(c, y) {
      var p = prog(c, y, 1, .22), max = vw < 720 ? 28 : 56, key = Math.round(p * 200);
      if (key === c.last) return; c.last = key;
      c.el.style.setProperty('--cr', (max * (1 - easeOut(p))).toFixed(1) + 'px');
    }

    function applyEyebrow(e, y) {
      var p = prog(e, y, .98, .76), key = Math.round(p * 100);
      if (key === e.last) return; e.last = key;
      e.el.style.setProperty('--ep', p.toFixed(2));
    }

    function applyBgword(b, y) {
      var sp = clamp((y + vh - b.top) / (vh + b.h), 0, 1);
      var x = (sp - .5) * -b.dir * vw * .6;
      if (Math.abs(x - b.last) < .4) return; b.last = x;
      b.el.style.translate = x.toFixed(1) + 'px 0';
    }

    var heroDone = false;
    function applyHero(y) {
      if (!hero) return;
      if (y > heroH * 1.15) { if (heroDone) return; heroDone = true; } else heroDone = false;
      var p = clamp(y / (heroH * .85), 0, 1);
      if (heroCopy) {
        heroCopy.style.translate = p ? '0 ' + (-p * 80).toFixed(1) + 'px' : '';
        heroCopy.style.opacity = p ? Math.max(0, 1 - p * 1.35).toFixed(3) : '';
      }
      if (radar) radar.style.scale = p ? (1 - p * .16).toFixed(4) : '';
      if (ringA) ringA.style.rotate = (y * .06).toFixed(1) + 'deg';
      if (ringB) ringB.style.rotate = (-y * .1).toFixed(1) + 'deg';
      if (cue) cue.style.opacity = Math.max(0, 1 - p * 5).toFixed(2);
      fcards.forEach(function (c) { c.style.setProperty('--sy', (-y * (parseFloat(c.getAttribute('data-depth')) || 20) / 190).toFixed(1)); });
    }

    function applyMisc(y) {
      if (mSecO && mdash) {
        var sp = clamp((y + vh - mSecO.top) / (vh + mSecO.h), 0, 1);
        mdash.style.rotate = (sp * 260).toFixed(1) + 'deg';
      }
      if (giant && giantO) {
        var p = prog(giantO, y, 1, .66), q = 1 - easeOut(p);
        giant.style.translate = '0 ' + (q * giantO.h * .6).toFixed(1) + 'px';
        giant.style.opacity = p.toFixed(2);
      }
      if (fab) {
        fab.classList.toggle('is-show', y > 700 && y < maxScroll - 170);   // se oculta al final: el footer ya tiene su propio enlace
        fabFill.style.strokeDashoffset = (100 - (maxScroll > 0 ? clamp(y / maxScroll, 0, 1) : 0) * 100).toFixed(1);
      }
    }

    function frame(y) {
      var i;
      for (i = 0; i < items.length; i++) applyRise(items[i], y);
      for (i = 0; i < drifts.length; i++) applyDrift(drifts[i], y);
      for (i = 0; i < texts.length; i++) applyText(texts[i], y);
      for (i = 0; i < curtains.length; i++) applyCurtain(curtains[i], y);
      for (i = 0; i < eyebrows.length; i++) applyEyebrow(eyebrows[i], y);
      for (i = 0; i < bgs.length; i++) applyBgword(bgs[i], y);
      applyHero(y); applyMisc(y);
    }

    // Botón volver arriba
    if (fab) fab.addEventListener('click', function () {
      if (lenis) lenis.scrollTo(0, { duration: 1.8, easing: function (t) { return 1 - Math.pow(1 - t, 4); } });
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    /* — Arranque y re-medición (fuentes, imágenes, resize, cambios de alto) — */
    function refresh() { measure(); frame(window.scrollY || window.pageYOffset); }
    refresh();
    onScroll(frame);
    window.addEventListener('load', refresh);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
    setTimeout(refresh, 1800); setTimeout(refresh, 4500);
    var lastW = vw, lastH = document.documentElement.scrollHeight;
    var onResize = debounce(function () {
      var h = document.documentElement.scrollHeight;
      if (window.innerWidth !== lastW || Math.abs(h - lastH) > 2) { lastW = window.innerWidth; lastH = h; refresh(); }
    }, 180);
    window.addEventListener('resize', onResize);
    if ('ResizeObserver' in window) new ResizeObserver(onResize).observe(document.body);
  }

  /* ───────── 18 · ARRANQUE ───────── */
  function init() {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    if (!location.hash) window.scrollTo(0, 0);
    var y = $('#year'); if (y) y.textContent = new Date().getFullYear();

    initWhatsApp();
    initSmoothScroll();
    initSplit();
    initNav();
    initLoader();
    initReveal();
    initCounters();
    initParallax();
    initHeroCycle();
    initHeroParticles();
    initHeroParallax();
    initRadar();
    initMarquee();
    initMethod();
    initPests();
    initCarousel();
    initMap();
    initFAQ();
    initForm();
    initCursor();
    initInteractions();
    initScrollFX();

    // Limpieza: tras la intro, el hero libera sus transiciones de entrada
    onReady(function () {
      setTimeout(function () { $$('[data-hero]').forEach(function (el) { el.removeAttribute('data-hero'); }); }, 4200);
    });
    runScroll();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
