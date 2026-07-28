/* Constellation homepage: scattered project figures around three questions.
   The canvas takes the viewer's screen aspect so the field fills edge to edge. */
(function () {
  var wrap = document.getElementById('cosmos-wrap');
  if (!wrap || window.matchMedia('(max-width: 760px)').matches) return;

  var cosmos = document.getElementById('cosmos');
  var wires = document.getElementById('wires');
  var vw = window.innerWidth, vh = window.innerHeight;

  /* Canvas: fixed design width, height matched to the viewport aspect. */
  var W = 2400;
  var H = Math.round(Math.min(2200, Math.max(1100, W * vh / vw)));
  cosmos.style.width = W + 'px';
  cosmos.style.height = H + 'px';
  wires.setAttribute('width', W);
  wires.setAttribute('height', H);
  wires.setAttribute('viewBox', '0 0 ' + W + ' ' + H);

  /* Everything is placed by fractions of the canvas, like the reference. */
  var anchors = {
    house: { fx: 0.195, fy: 0.565, href: 'house.html', dir: 'house' },
    wind:  { fx: 0.500, fy: 0.240, href: 'wind.html', dir: 'wind' },
    pvt:   { fx: 0.775, fy: 0.590, href: 'pvt.html', dir: 'pvt' }
  };
  Object.keys(anchors).forEach(function (k) {
    var a = anchors[k];
    a.x = a.fx * W; a.y = a.fy * H;
    var el = document.getElementById('q-' + k);
    el.style.left = (a.x - 220) + 'px';
    el.style.top = (a.y - 100) + 'px';
  });
  var giants = document.querySelectorAll('.giant');
  giants[0].style.left = (0.045 * W) + 'px';
  giants[0].style.top = (0.055 * H) + 'px';
  giants[1].style.left = (0.395 * W) + 'px';
  giants[1].style.top = (0.680 * H) + 'px';

  var picks = {
    house: [2, 3, 5, 7, 10, 11, 12, 13, 14, 22, 28, 29, 32, 38, 40, 42],
    wind:  [3, 4, 7, 9, 10, 12, 14, 18, 22, 25, 27, 29, 32, 37, 38, 39, 42],
    pvt:   [2, 3, 5, 6, 13, 16, 25, 30, 32, 33, 36, 37, 41, 43, 44, 61, 62]
  };

  function rand(seed) { var x = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

  /* No-go rectangles measured from the real text blocks (plus breathing room). */
  var keepOut = [];
  var PAD = 34;
  document.querySelectorAll('.q-node, .giant').forEach(function (el) {
    keepOut.push({ x: el.offsetLeft - PAD, y: el.offsetTop - PAD, w: el.offsetWidth + PAD * 2, h: el.offsetHeight + PAD * 2 });
  });

  function hitsKeepOut(cx, cy, half) {
    for (var j = 0; j < keepOut.length; j++) {
      var r = keepOut[j];
      if (cx + half > r.x && cx - half < r.x + r.w && cy + half > r.y && cy - half < r.y + r.h) return true;
    }
    return false;
  }

  var frag = document.createDocumentFragment();
  var lines = [];

  Object.keys(picks).forEach(function (key, ki) {
    var a = anchors[key];
    picks[key].forEach(function (n, i) {
      var count = picks[key].length;
      var angle = (i / count) * Math.PI * 2 + rand(ki * 100 + i) * 0.9 + ki;
      var spread = 0.15 + rand(ki * 37 + i * 7) * 0.18;
      var size = 44 + Math.floor(rand(ki * 53 + i * 13) * 46);
      var cx = a.x + Math.cos(angle) * spread * W * 0.62;
      var cy = a.y + Math.sin(angle) * spread * H * 0.92;
      /* Walk outward along the scatter angle until clear of every text block. */
      var half = size / 2 + 12;
      for (var t = 0; t < 60 && hitsKeepOut(cx, cy, half); t++) {
        cx += Math.cos(angle) * 26;
        cy += Math.sin(angle) * 26 * (H / W) * 1.6;
      }
      cx = Math.max(34, Math.min(W - 120, cx));
      cy = Math.max(38, Math.min(H - 130, cy));
      /* Edge-trapped? Walk toward the canvas centre instead. */
      if (hitsKeepOut(cx, cy, half)) {
        var back = Math.atan2(H / 2 - cy, W / 2 - cx);
        for (var t2 = 0; t2 < 80 && hitsKeepOut(cx, cy, half); t2++) {
          cx += Math.cos(back) * 24;
          cy += Math.sin(back) * 24;
        }
      }

      var tile = document.createElement('a');
      tile.className = 'tile';
      tile.href = a.href;
      tile.dataset.project = key;
      tile.dataset.img = 'assets/img/' + a.dir + '/thumbs/image' + n + '.jpg';
      tile.style.left = (cx - size / 2) + 'px';
      tile.style.top = (cy - size / 2) + 'px';
      tile.style.width = size + 'px';
      tile.style.height = size + 'px';
      tile.setAttribute('aria-label', 'Preview project');
      tile.style.animationDuration = (4.5 + rand(ki * 91 + i * 17) * 4) + 's';
      tile.style.animationDelay = (-rand(ki * 71 + i * 29) * 8) + 's';
      var img = document.createElement('img');
      img.src = tile.dataset.img;
      img.alt = '';
      img.loading = 'lazy';
      tile.appendChild(img);
      frag.appendChild(tile);

      if (rand(i * 3 + ki) > 0.25) lines.push([cx, cy, a.x, a.y]);
    });
  });

  cosmos.appendChild(frag);
  var svgNS = 'http://www.w3.org/2000/svg';
  lines.forEach(function (l) {
    var ln = document.createElementNS(svgNS, 'line');
    ln.setAttribute('x1', l[0]); ln.setAttribute('y1', l[1]);
    ln.setAttribute('x2', l[2]); ln.setAttribute('y2', l[3]);
    wires.appendChild(ln);
  });

  /* ---- pan & zoom: initial view fills the screen exactly ---- */
  var minScale = vw / W;
  var scale = minScale;
  var tx = 0, ty = (vh - H * scale) / 2;
  var maxScale = 1.6;

  function apply() {
    var s = Math.max(minScale * 0.85, Math.min(maxScale, scale));
    scale = s;
    var margin = 120 * s;
    if (W * s <= vw) { tx = (vw - W * s) / 2; }
    else { tx = Math.min(margin, Math.max(vw - W * s - margin, tx)); }
    if (H * s <= vh) { ty = (vh - H * s) / 2; }
    else { ty = Math.min(margin, Math.max(vh - H * s - margin, ty)); }
    cosmos.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + s + ')';
  }
  apply();

  window.addEventListener('resize', function () {
    vw = window.innerWidth; vh = window.innerHeight;
    minScale = vw / W;
    apply();
  });

  function zoomAt(px, py, factor) {
    var ns = Math.max(minScale * 0.85, Math.min(maxScale, scale * factor));
    tx = px - (px - tx) * (ns / scale);
    ty = py - (py - ty) * (ns / scale);
    scale = ns;
    apply();
  }

  /* Wheel does NOT zoom (matches the reference flow) — zoom lives in the buttons only. */
  document.getElementById('z-in').addEventListener('click', function () { zoomAt(vw / 2, vh / 2, 1.28); });
  document.getElementById('z-out').addEventListener('click', function () { zoomAt(vw / 2, vh / 2, 0.78); });

  /* Pinch zoom on touch devices */
  var pinch = null;
  wrap.addEventListener('touchstart', function (e) {
    if (e.touches.length === 2) {
      pinch = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    }
  }, { passive: true });
  wrap.addEventListener('touchmove', function (e) {
    if (pinch && e.touches.length === 2) {
      var d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      var cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      var cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      zoomAt(cx, cy, d / pinch);
      pinch = d;
    }
  }, { passive: true });
  wrap.addEventListener('touchend', function () { pinch = null; });

  var drag = null;
  wrap.addEventListener('pointerdown', function (e) {
    if (e.target.closest('a')) return;
    drag = { x: e.clientX, y: e.clientY, tx: tx, ty: ty };
    wrap.classList.add('dragging');
    wrap.setPointerCapture(e.pointerId);
  });
  wrap.addEventListener('pointermove', function (e) {
    if (!drag) return;
    tx = drag.tx + (e.clientX - drag.x);
    ty = drag.ty + (e.clientY - drag.y);
    apply();
  });
  wrap.addEventListener('pointerup', function () { drag = null; wrap.classList.remove('dragging'); });
  wrap.addEventListener('pointercancel', function () { drag = null; wrap.classList.remove('dragging'); });

  /* ---- click a tile -> preview card (reference flow) ---- */
  var meta = {
    house: { kicker: 'Question 01 — Solar power engineering', title: 'Can a house heat itself?', blurb: 'A passive solar house for London: AutoCAD design, Polysun proof, 64.6% annual solar fraction.', href: 'house.html' },
    wind:  { kicker: 'Question 02 — Wind power engineering', title: 'Can wind pay for an island?', blurb: 'Five Vestas V150s at Quanterness, Orkney: siting to £32.5M NPV, with the real WindPRO layers on a live map.', href: 'wind.html' },
    pvt:   { kicker: 'Question 03 — MSc dissertation', title: 'Why do solar panels hate the sun?', blurb: 'A water-cooled PVT panel designed in SOLIDWORKS and proven with CFD — electricity and heat from the same square metre.', href: 'pvt.html' }
  };
  var card = document.getElementById('preview-card');
  var cardImg = card.querySelector('.pc-img');
  var cardKicker = card.querySelector('.pc-kicker');
  var cardTitle = card.querySelector('.pc-title');
  var cardBlurb = card.querySelector('.pc-blurb');
  var cardGo = card.querySelector('.pc-go');

  function openCard(project, imgSrc) {
    var m = meta[project];
    cardImg.src = imgSrc;
    cardKicker.textContent = m.kicker;
    cardTitle.textContent = m.title;
    cardBlurb.textContent = m.blurb;
    cardGo.href = m.href;
    document.body.classList.add('card-open');
    card.classList.add('open');
    cardGo.focus({ preventScroll: true });
  }
  function closeCard() {
    document.body.classList.remove('card-open');
    card.classList.remove('open');
  }
  cosmos.addEventListener('click', function (e) {
    var tile = e.target.closest('.tile');
    if (!tile) return;
    e.preventDefault();
    openCard(tile.dataset.project, tile.dataset.img);
  });
  card.querySelector('.pc-close').addEventListener('click', closeCard);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeCard(); });
  document.getElementById('card-backdrop').addEventListener('click', closeCard);

  /* gentle drift-in on load — opacity only, so it never fights the CSS float */
  if (window.gsap) {
    gsap.from('.tile', { opacity: 0, duration: 0.8, ease: 'power1.out', stagger: { each: 0.015, from: 'random' }, clearProps: 'opacity' });
    gsap.from('.giant', { opacity: 0, duration: 1.1, ease: 'power1.out', stagger: 0.15, clearProps: 'opacity' });
    gsap.from('.q-node', { opacity: 0, duration: 0.9, delay: 0.3, ease: 'power1.out', stagger: 0.12, clearProps: 'opacity' });
    gsap.from('#wires line', { opacity: 0, duration: 1.2, delay: 0.2, stagger: { each: 0.008, from: 'random' }, clearProps: 'opacity' });
  }
})();
