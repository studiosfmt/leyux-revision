/* Leyux Abogados · MODO MAQUETA
   Simula el formulario por pasos, el calendario y las redirecciones para poder recorrer TODO el embudo
   desde un solo enlace. En GHL esto NO se usa: allí van los iframes reales del formulario y del calendario. */
(function () {
  'use strict';
  var root = document.getElementById('lyx');
  if (!root) return;
  var $ = function (s, c) { return (c || root).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || root).querySelectorAll(s)); };
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function save(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
  function load(k) { try { return sessionStorage.getItem(k) || ''; } catch (e) { return ''; } }
  var ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>';

  /* ── Etiqueta de maqueta ── */
  var badge = el('div', 'demo-badge', '<b>Maqueta</b><span>formulario y calendario simulados</span><a href="index.html">Reiniciar</a>');
  badge.querySelector('a').addEventListener('click', function () { try { sessionStorage.clear(); } catch (e) {} });
  root.appendChild(badge);

  /* ════════════ FORMULARIO POR PASOS (las 7 preguntas del documento 3.3a) ════════════
     Descarte: no puede ir a Almería · debe menos de 25.000 € · solo Hacienda y/o Seguridad Social.
     Avisos (no descartan): más de 100.000 €, avalista, una sola entidad, parte de vivienda/coche, embargos.
     Vivienda en propiedad: el documento dice que hoy descarta, pero Alex (24/11) indica que no es problema y está
     pendiente de confirmar con José. Mientras tanto NO descarta: cambiar DESCARTA_VIVIENDA a true si se confirma. */
  var DESCARTA_VIVIENDA = false;
  var Q = [
    { id: 'viajar', t: 'La primera consulta es gratuita y en persona, en nuestro despacho de Almería capital, junto al juzgado. ¿Podrías venir?', o: ['Sí, puedo ir a Almería capital', 'No, me queda lejos'] },
    { id: 'deuda', t: 'Sumando todo, ¿cuánto debes más o menos?', hint: 'No hace falta que sea exacto.', o: ['Menos de 25.000 €', 'Entre 25.000 € y 50.000 €', 'Entre 50.000 € y 100.000 €', 'Más de 100.000 €'] },
    { id: 'acreedores', t: '¿Con quién tienes deudas?', hint: 'Marca todas las que tengas.', multi: true, o: ['Préstamos personales o del banco', 'Tarjetas de crédito o revolving', 'Microcréditos o préstamos rápidos', 'Deudas de un negocio que tuve o tengo', 'Hacienda', 'Seguridad Social', 'Avalé a otra persona', 'Otras'] },
    { id: 'entidades', t: '¿Con cuántas entidades tienes deudas?', hint: 'Cada banco, financiera o empresa cuenta como una.', o: ['Solo con una', 'Con 2 a 4', 'Con 5 o más'] },
    { id: 'bienes', t: '¿Tienes algo de esto a tu nombre?', hint: 'Si tienes varias cosas, marca la primera que te corresponda.', o: ['Una vivienda en propiedad (aunque tenga hipoteca)', 'Parte de una vivienda o un terreno', 'Un coche o una moto', 'Nada a mi nombre'] },
    { id: 'situacion', t: '¿Cuál es tu situación ahora mismo?', o: ['Trabajo por cuenta ajena', 'Soy o he sido autónomo', 'Cobro una pensión', 'Estoy en paro o sin ingresos'] },
    { id: 'mes', t: '¿Cómo llegas a final de mes?', o: ['Pago todo, pero llego muy justo', 'Ya me cuesta pagar y tengo algún retraso', 'No puedo pagar la mayoría de las deudas', 'Tengo embargos o reclamaciones de recobro'] },
    { id: 'datos', t: 'Último paso: ¿cómo te llamamos?', contact: true }
  ];

  function buildForm(slot) {
    var title = $('.card__title', slot), note = $('.card__note', slot);
    var titleHTML = title ? title.outerHTML : '', noteHTML = note ? note.outerHTML : '';
    slot.innerHTML = titleHTML;
    var form = el('div', 'demo-form');
    slot.appendChild(form);
    var step = 0, ans = {};
    var prog = el('div', 'demo-prog', '<i></i>'), stepLbl = el('p', 'demo-step'), body = el('div'), err = el('p', 'demo-err'), nav = el('div', 'demo-nav');
    var next = el('button', 'btn btn--solid btn--block'); next.type = 'button';
    var back = el('button', 'demo-back', 'Volver'); back.type = 'button';
    nav.appendChild(next); nav.appendChild(back);
    form.appendChild(prog); form.appendChild(stepLbl); form.appendChild(body); form.appendChild(err); form.appendChild(nav);
    slot.insertAdjacentHTML('beforeend', noteHTML);

    function render() {
      var q = Q[step], last = step === Q.length - 1;
      prog.firstChild.style.width = ((step + 1) / Q.length * 100) + '%';
      stepLbl.textContent = 'Pregunta ' + (step + 1) + ' de ' + Q.length;
      body.innerHTML = ''; err.textContent = '';
      body.appendChild(el('p', 'demo-q', q.t));
      if (q.hint) body.appendChild(el('p', 'demo-hint', q.hint));
      if (q.contact) {
        body.appendChild(el('div', 'demo-fields',
          '<label>Nombre<input name="nombre" autocomplete="given-name" value="' + (ans.nombre || '') + '"></label>' +
          '<label>Móvil (WhatsApp)<input name="tel" type="tel" autocomplete="tel" value="' + (ans.tel || '') + '"></label>' +
          '<label>Correo electrónico<input name="email" type="email" autocomplete="email" value="' + (ans.email || '') + '"></label>' +
          '<label class="demo-check"><input type="checkbox" name="priv"> He leído y acepto la política de privacidad.</label>'));
        next.disabled = false;
      } else {
        var opts = el('div', 'demo-opts');
        if (q.multi && !ans[q.id]) ans[q.id] = [];
        q.o.forEach(function (o) {
          var on = q.multi ? ans[q.id].indexOf(o) > -1 : ans[q.id] === o;
          var b = el('button', 'demo-opt' + (on ? ' is-on' : '') + (q.multi ? ' demo-opt--multi' : ''), o); b.type = 'button';
          b.addEventListener('click', function () {
            if (q.multi) {
              var i = ans[q.id].indexOf(o);
              if (i > -1) ans[q.id].splice(i, 1); else ans[q.id].push(o);
              b.classList.toggle('is-on', i === -1);
              next.disabled = !ans[q.id].length;
            } else {
              ans[q.id] = o; $$('.demo-opt', opts).forEach(function (x) { x.classList.toggle('is-on', x === b); }); next.disabled = false;
            }
            err.textContent = '';
          });
          opts.appendChild(b);
        });
        body.appendChild(opts);
        next.disabled = q.multi ? !(ans[q.id] && ans[q.id].length) : !ans[q.id];
      }
      next.innerHTML = (last ? 'Ver si puedo cancelar mis deudas' : 'Siguiente') + ' ' + ARROW;
      back.style.display = step === 0 ? 'none' : '';
    }

    next.addEventListener('click', function () {
      var q = Q[step];
      if (q.contact) {
        var n = $('[name=nombre]', body).value.trim(), t = $('[name=tel]', body).value.replace(/\s/g, ''), m = $('[name=email]', body).value.trim();
        ans.nombre = n; ans.tel = t; ans.email = m;
        if (n.length < 2) { err.textContent = 'Escribe tu nombre.'; return; }
        if (!/^\+?\d{9,13}$/.test(t)) { err.textContent = 'Revisa el móvil (9 cifras como mínimo).'; return; }
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(m)) { err.textContent = 'Revisa el correo electrónico.'; return; }
        if (!$('[name=priv]', body).checked) { err.textContent = 'Acepta la política de privacidad para continuar.'; return; }
        return finish();
      }
      step++; render();
    });
    back.addEventListener('click', function () { if (step > 0) { step--; render(); } });

    function finish() {
      next.disabled = true; next.textContent = 'Un momento…';
      var motivo = '';
      var ac = ans.acreedores || [];
      var soloPublica = ac.length && ac.every(function (x) { return x === 'Hacienda' || x === 'Seguridad Social'; });
      if (ans.viajar === Q[0].o[1]) motivo = 'lejos';
      else if (ans.deuda === Q[1].o[0]) motivo = 'importe';
      else if (soloPublica) motivo = 'deuda-publica';
      else if (DESCARTA_VIVIENDA && ans.bienes === Q[4].o[0]) motivo = 'general';
      save('lyx_nombre', ans.nombre); save('lyx_form', JSON.stringify(ans));
      setTimeout(function () {
        if (motivo) { window.location.href = 'no-calificado.html?motivo=' + motivo; return; }
        window.location.href = 'cita.html?nombre=' + encodeURIComponent(ans.nombre);
      }, 450);
    }
    render();
  }
  $$('.ghl-slot[data-slot^="form"]').forEach(buildForm);

  /* ════════════ CALENDARIO ════════════ */
  function buildCal(slot) {
    var eyebrow = $('.cal__eyebrow', slot);
    slot.innerHTML = eyebrow ? eyebrow.outerHTML : '';
    var days = [], d = new Date(); d.setHours(0, 0, 0, 0);
    while (days.length < 15) { d = new Date(d.getTime() + 864e5); if (d.getDay() >= 1 && d.getDay() <= 5) days.push(new Date(d)); }
    var sel = { day: null, hour: '' };
    var daysBox = el('div', 'demo-days'), slotsHead = el('p', 'demo-h'), slotsBox = el('div', 'demo-slots');
    var book = el('button', 'btn btn--solid btn--block demo-book', 'Reservar mi consulta ' + ARROW); book.type = 'button'; book.disabled = true;
    slotsHead.hidden = true; slotsBox.hidden = true;
    slot.appendChild(daysBox); slot.appendChild(slotsHead); slot.appendChild(slotsBox); slot.appendChild(book);

    days.forEach(function (dt) {
      var b = el('button', 'demo-day', '<small>' + dt.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '') + '</small><b>' + dt.getDate() + '</b><small>' + dt.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '') + '</small>');
      b.type = 'button';
      b.addEventListener('click', function () {
        sel.day = dt; sel.hour = ''; update();
        $$('.demo-day', daysBox).forEach(function (x) { x.classList.toggle('is-on', x === b); });
        slotsHead.textContent = 'Horas disponibles · ' + dt.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
        slotsHead.hidden = false; slotsBox.hidden = false; slotsBox.innerHTML = '';
        [10, 11, 12, 13, 16, 17, 18].forEach(function (h) {
          var label = (h < 10 ? '0' : '') + h + ':00';
          var s = el('button', 'demo-slot', label); s.type = 'button';
          if ((dt.getDate() * 7 + h) % 4 === 0) s.disabled = true;
          s.addEventListener('click', function () {
            sel.hour = label; update();
            $$('.demo-slot', slotsBox).forEach(function (x) { x.classList.toggle('is-on', x === s); });
          });
          slotsBox.appendChild(s);
        });
      });
      daysBox.appendChild(b);
    });

    function update() { book.disabled = !(sel.day && sel.hour); }
    book.addEventListener('click', function () {
      if (book.disabled) return;
      book.disabled = true; book.textContent = 'Reservando…';
      var nombre = new URLSearchParams(window.location.search).get('nombre') || load('lyx_nombre') || '';
      var dia = sel.day.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }).replace(',', '');
      var p2 = function (n) { return (n < 10 ? '0' : '') + n; };
      var iso = sel.day.getFullYear() + '-' + p2(sel.day.getMonth() + 1) + '-' + p2(sel.day.getDate());
      var qs = '?nombre=' + encodeURIComponent(nombre) + '&dia=' + encodeURIComponent(dia) + '&hora=' + encodeURIComponent(sel.hour) + '&iso=' + iso;
      save('lyx_cita', dia + ' ' + sel.hour);
      setTimeout(function () { window.location.href = 'gracias.html' + qs; }, 500);
    });
  }
  $$('.ghl-slot[data-slot^="calendario"]').forEach(buildCal);

  /* ════════════ ENLACES DE LA CONFIRMACIÓN ════════════
     Cambiar cita: vuelve al calendario. */
  var resched = $('[data-resched]');
  if (resched) resched.setAttribute('href', 'cita.html?nombre=' + encodeURIComponent(new URLSearchParams(window.location.search).get('nombre') || ''));
})();
