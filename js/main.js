/* Despídete de tus deudas · Landing v2 · animaciones y comportamiento (sin dependencias) */
(function () {
  'use strict';
  var root = document.getElementById('lyx');
  if (!root) return;
  var $ = function (s, c) { return (c || root).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || root).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canIO = 'IntersectionObserver' in window;
  var animate = !reduce && canIO;

  document.documentElement.classList.add('js');

  /* ── Titulares: palabra a palabra ── */
  function split(el) {
    var i = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span'); w.className = 'w';
            var s = document.createElement('span'); s.textContent = part; s.style.setProperty('--i', i++);
            w.appendChild(s); frag.appendChild(w);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1) { walk(n); }
      });
    })(el);
    el.classList.add('is-split');
  }
  $$('[data-split]').forEach(function (el) { if (animate) split(el); else el.classList.add('is-split'); });

  /* ── Entrada de la página ── */
  function loaded() { root.classList.add('is-loaded'); document.documentElement.classList.add('is-loaded'); }
  var heroImg = $('.hero__img');
  if (!animate) loaded();
  else if (heroImg && !heroImg.complete) { heroImg.addEventListener('load', loaded); heroImg.addEventListener('error', loaded); setTimeout(loaded, 1800); }
  else setTimeout(loaded, 80);

  /* ── Revelado al hacer scroll ── */
  var els = $$('.reveal, [data-stagger], [data-reveal-img], [data-split]');
  $$('[data-stagger]').forEach(function (p) { Array.prototype.forEach.call(p.children, function (c, i) { c.style.setProperty('--i', i); }); });
  if (animate) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { threshold: .18, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (el) { io.observe(el); });
  } else { els.forEach(function (el) { el.classList.add('is-in'); }); }

  /* ── Historia: cambia la imagen según la frase ── */
  var story = $('[data-story]');
  if (story) {
    var imgs = $$('.story__stage img', story), items = $$('.story__item', story), cur = 0;
    var set = function (i) {
      if (i === cur) return; cur = i;
      imgs.forEach(function (im, k) { im.classList.toggle('is-on', k === i); });
      items.forEach(function (it, k) { it.classList.toggle('is-on', k === i); });
    };
    items.forEach(function (it, k) {
      it.addEventListener('click', function () { set(k); });
      it.addEventListener('mouseenter', function () { if (window.matchMedia('(hover: hover)').matches) set(k); });
    });
    if (canIO) {
      var so = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) set(items.indexOf(e.target)); });
      }, { rootMargin: '-45% 0px -45% 0px' });
      items.forEach(function (it) { so.observe(it); });
    }
  }

  /* ── Parallax suave en las imágenes a sangre ── */
  var para = $$('[data-parallax]');
  if (animate && para.length) {
    var ticking = false;
    var upd = function () {
      var vh = window.innerHeight;
      para.forEach(function (im) {
        var r = im.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        var p = (r.top + r.height / 2 - vh / 2) / vh;
        im.style.transform = 'translate3d(0,' + (p * -40).toFixed(1) + 'px,0)';
      });
      ticking = false;
    };
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }, { passive: true });
    upd();
  }

  /* ── CTA fijo en móvil: aparece tras el hero y se oculta en el cierre ── */
  var sticky = $('.sticky-cta'), hero = $('.hero'), fin = $('.final');
  if (sticky && hero && fin && canIO) {
    var vis = { hero: true, fin: false };
    var sync = function () { sticky.classList.toggle('is-on', !vis.hero && !vis.fin); };
    new IntersectionObserver(function (e) { vis.hero = e[0].isIntersecting; sync(); }, { threshold: 0, rootMargin: '-60% 0px 0px 0px' }).observe(hero);
    new IntersectionObserver(function (e) { vis.fin = e[0].isIntersecting; sync(); }, { threshold: .15 }).observe(fin);
  }

  /* ── FAQ: una abierta a la vez ── */
  var det = $$('.faq details');
  det.forEach(function (d) {
    d.addEventListener('toggle', function () { if (d.open) det.forEach(function (o) { if (o !== d) o.open = false; }); });
  });

  /* ── WhatsApp: el número vive en UN solo sitio (aquí) ── */
  var WA_NUMBER = ''; /* ⚠ PENDIENTE: número en formato internacional sin '+', p. ej. 34600000000 */
  var q = new URLSearchParams(window.location.search);
  /* ── Página "no encaja": muestra solo el bloque del motivo (?motivo=lejos | importe | deuda-publica | general; sin motivo → general) ── */
  var whys = $$('.why');
  if (whys.length) {
    var mot = (q.get('motivo') || '').toLowerCase().trim();
    if (!whys.some(function (w) { return w.getAttribute('data-motivo') === mot; })) mot = 'general';
    whys.forEach(function (w) { w.hidden = w.getAttribute('data-motivo') !== mot; });
    var tagged = $('.why:not([hidden])');
    if (tagged) root.setAttribute('data-crm-tag', tagged.getAttribute('data-tag'));
  }
  /* Un valor solo cuenta si es real: vacío, o con llaves sin sustituir ({{...}}, {día}), se descarta. */
  function real(k) { var v = (q.get(k) || '').trim(); return (!v || /[{}]|undefined|null/i.test(v)) ? '' : v; }
  var vars = { nombre: real('nombre'), dia: real('dia'), hora: real('hora') };
  /* Datos de la reserva: si llegan por URL (?nombre=&dia=&hora=) se rellenan; en GHL pueden venir de los valores del contacto/cita */
  /* Fecha y hora de la cita. Orden de prioridad:
     1) ?dia=&hora=  (texto ya formateado)
     2) ?fecha= o ?start=  (fecha ISO o texto que el navegador entienda; se pasa a hora de Madrid)
     3) ?iso=AAAA-MM-DD&hora=HH:MM
     Si no llega nada, la línea de fecha se oculta (no se muestran {día}/{hora} sueltos). */
  function p2(n) { return (n < 10 ? '0' : '') + n; }
  var start = ''; /* AAAAMMDDTHHMM00, hora local de Madrid */
  var raw = real('fecha') || real('start');
  if (raw) {
    var d = new Date(raw.replace(' ', 'T'));
    if (!isNaN(d)) {
      var pt = {};
      new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
        .formatToParts(d).forEach(function (x) { pt[x.type] = x.value; });
      start = pt.year + pt.month + pt.day + 'T' + pt.hour + pt.minute + '00';
      if (!vars.dia) vars.dia = d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Madrid' }).replace(',', '');
      if (!vars.hora) vars.hora = pt.hour + ':' + pt.minute;
    }
  } else if (real('iso') && /^\d{1,2}:\d{2}$/.test(vars.hora)) {
    var hp = vars.hora.split(':');
    start = q.get('iso').replace(/-/g, '') + 'T' + p2(parseInt(hp[0], 10)) + hp[1] + '00';
  }
  $$('[data-var]').forEach(function (el) { var v = vars[el.getAttribute('data-var')]; if (v) el.textContent = v; });
  var when = $('.ok__when');
  var hasWhen = !!(vars.dia && vars.hora);
  if (when) when.hidden = !hasWhen;
  $$('[data-if-nodate]').forEach(function (el) { el.hidden = hasWhen; });
  $$('[data-if-date]').forEach(function (el) { el.hidden = !hasWhen; });
  var addcal = $('[data-addcal]');
  if (addcal) {
    addcal.hidden = !start;
    if (start) addcal.addEventListener('click', function (e) {
      e.preventDefault();
      var h = parseInt(start.slice(9, 11), 10), m = start.slice(11, 13);
      var endH = m === '30' ? p2(h + 1) + '00' : p2(h) + '30';
      var end = start.slice(0, 9) + endH + '00', sede = root.getAttribute('data-sede') || '';
      var ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Leyux Abogados//ES', 'BEGIN:VEVENT',
        'UID:cita-' + start + '-' + sede + '@leyux.es', 'DTSTAMP:' + start,
        'DTSTART;TZID=Europe/Madrid:' + start, 'DTEND;TZID=Europe/Madrid:' + end,
        'SUMMARY:Consulta en Leyux Abogados', 'LOCATION:Leyux Abogados, Calle Doctor Martínez Oña, 2, Almería',
        'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
      var a = document.createElement('a');
      a.href = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(ics); a.download = 'cita.ics';
      document.body.appendChild(a); a.click(); a.remove();
    });
  }
  var baseMsg = root.getAttribute('data-wa-msg') || '';
  var msg = baseMsg.replace('{nombre}', vars.nombre || '{nombre}').replace('{día}', vars.dia || '{día}').replace('{hora}', vars.hora || '{hora}');
  $$('[data-wa]').forEach(function (a) {
    if (!WA_NUMBER) { a.hidden = true; return; }
    a.hidden = false;
    a.href = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(msg);
    a.target = '_blank'; a.rel = 'noopener';
  });
  /* GHL: sustituir el href de estos dos por {{appointment.add_to_google_calendar}} y {{appointment.reschedule_link}} */
  $$('[data-resched]').forEach(function (a) { a.addEventListener('click', function (e) { if (a.getAttribute('href') === '#') e.preventDefault(); }); });

  /* ── Vídeo del equipo (marcador hasta que esté grabado) ── */
  var vid = $('.video');
  if (vid) vid.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); vid.click(); } });

  /* ── Medición: cada botón lleva su id (GHL/GTM leen estos eventos) ── */
  $$('a[id], [id="video-equipo"]').forEach(function (a) {
    if (!/^(cta-|cambio-sede|wa-|cambiar-cita|video-equipo|add-calendario|volver-formulario)/.test(a.id)) return;
    a.addEventListener('click', function () {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: 'cta_click', cta_id: a.id });
    });
  });

  /* -- Linea de tiempo: se llena al bajar y presenta cada paso -- */
  var tl = $('[data-tl]');
  if (tl) {
    var items = $$('.tl__i', tl);
    var tick = function () {
      var vh = window.innerHeight, r = tl.getBoundingClientRect(), mark = vh * 0.55;
      var p = Math.max(0, Math.min(1, (mark - r.top) / r.height));
      tl.style.setProperty('--tlp', (p * 100).toFixed(1) + '%');
      items.forEach(function (it) {
        var d = it.querySelector('.tl__dot').getBoundingClientRect();
        it.classList.toggle('is-on', d.top + d.height / 2 < mark + 40);
      });
    };
    window.addEventListener('scroll', tick, { passive: true });
    window.addEventListener('resize', tick);
    tick();
  }

  /* -- Video del hero: entra suave cuando carga; si no hay archivo, queda la foto -- */
  var hv = $('.hero__vid');
  if (hv && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    hv.addEventListener('canplay', function () {
      var pr = hv.play();
      if (pr && pr.then) pr.then(function () { hv.classList.add('is-on'); }, function () {});
    });
    hv.load();
  }
})();
