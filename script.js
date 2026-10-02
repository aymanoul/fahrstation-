(function () {
  'use strict';

  /* ======================================================================
     HIER DEN FORMULAR-DIENST EINTRAGEN — die einzige Stelle im ganzen Code.
     ======================================================================
     Leer lassen = das Formular prüft zwar die Eingaben, sendet aber nichts
     und zeigt stattdessen den Hinweis, dass man anrufen oder per WhatsApp
     schreiben soll. Ein scheinbar erfolgreiches Absenden ins Leere wäre
     schlimmer als gar kein Formular.

     Sobald der Dienst feststeht, hier dessen Endpunkt-URL eintragen, z. B.
       'https://formspree.io/f/xxxxxxx'      (Formspree)
       'https://api.web3forms.com/submit'    (Web3Forms, braucht zusätzlich
                                              ein access_key-Feld im Markup)

     Beide erwarten dasselbe: POST mit FormData und Accept: application/json.
     Deshalb genügt für den Wechsel diese eine Zeile.

     NICHT VERGESSEN: mit dem Eintragen wird der Abschnitt zum
     Kontaktformular in site/datenschutz.html falsch — dort steht aktuell,
     dass keine Daten übertragen werden (siehe WARTUNG.md). */
  var CONTACT_FORM_ENDPOINT = '';

  function initStickyHeader() {
    var header = document.getElementById('site-header');
    if (!header) return;

    var ticking = false;

    function update() {
      header.classList.toggle('is-scrolled', window.scrollY > 80);
      ticking = false;
    }

    window.addEventListener(
      'scroll',
      function () {
        if (!ticking) {
          window.requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true }
    );
  }

  function initMobileMenu() {
    var toggle = document.getElementById('nav-toggle');
    var menu = document.getElementById('mobile-menu');
    if (!toggle || !menu) return;

    function openMenu() {
      menu.hidden = false;
      document.body.classList.add('has-open-menu');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Menü schließen');
    }

    function closeMenu() {
      menu.hidden = true;
      document.body.classList.remove('has-open-menu');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Menü öffnen');
      toggle.focus();
    }

    toggle.addEventListener('click', function () {
      if (toggle.getAttribute('aria-expanded') === 'true') {
        closeMenu();
      } else {
        openMenu();
      }
    });

    menu.addEventListener('click', function (event) {
      if (event.target.closest('.mobile-menu__link') && !event.target.closest('.mobile-menu__dropdown-toggle')) {
        closeMenu();
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !menu.hidden) {
        closeMenu();
      }
    });
  }

  function initDropdown() {
    var toggles = document.querySelectorAll('.mobile-menu__dropdown-toggle');

    toggles.forEach(function (toggle) {
      toggle.addEventListener('click', function (event) {
        event.stopPropagation();
        var isOpen = toggle.getAttribute('aria-expanded') === 'true';
        toggles.forEach(function (other) {
          other.setAttribute('aria-expanded', 'false');
        });
        toggle.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
      });
    });

    document.addEventListener('click', function () {
      toggles.forEach(function (toggle) {
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  function initCurrentYear() {
    var el = document.getElementById('current-year');
    if (!el) return;
    el.textContent = new Date().getFullYear();
  }

  /* Bewertungs-Karte in #vertrauen: beim ersten Sichtbarwerden zählen "5,0"
     (eine Nachkommastelle, Komma) und die Bewertungszahl (0 bis 1200) gleichzeitig
     hoch, die Sterne füllen sich parallel nach dem Wert der Note (Stern i voll
     ab Wert i, dazwischen teilweise von links). Ein gemeinsamer Zeitgeber
     (requestAnimationFrame), 2000 ms, ease-out, einmalig. Im Markup steht
     immer der Endwert — ohne JavaScript, ohne IntersectionObserver/rAF oder
     bei reduzierter Bewegung bleibt es dabei. Startwerte (0) setzt erst dieses
     Skript: nur wenn die Karte außerhalb des Sichtbereichs liegt, sonst läuft
     die Animation sofort an. Die Zahlen sind aria-hidden (Karte), der
     Screenreader-Satz zeigt immer den Endwert. */
  function initRatingCounter() {
    var card = document.querySelector('.rating');
    if (!card) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!('IntersectionObserver' in window) || !window.requestAnimationFrame) return;

    var scoreEl = card.querySelector('.rating__num .rating__live');
    var countEl = card.querySelector('.rating__count-num .rating__live');
    var clips = card.querySelectorAll('.rating__clip');
    if (!scoreEl || !countEl || !clips.length) return;

    var DURATION = 2000;
    var SCORE = 5;
    var COUNT = 1200;
    var STAR_SIZE = 20;
    var scoreFinal = scoreEl.parentNode.getAttribute('data-final') || scoreEl.textContent;
    var countFinal = countEl.parentNode.getAttribute('data-final') || countEl.textContent;

    function render(progress) {
      var eased = 1 - Math.pow(1 - progress, 3);
      var value = SCORE * eased;
      scoreEl.textContent = progress >= 1 ? scoreFinal : value.toFixed(1).replace('.', ',');
      countEl.textContent = progress >= 1 ? countFinal : String(Math.round(COUNT * eased));
      Array.prototype.forEach.call(clips, function (rect, i) {
        var fill = Math.max(0, Math.min(1, value - i));
        rect.setAttribute('width', (STAR_SIZE * fill).toFixed(2));
      });
    }

    var started = false;

    function start() {
      if (started) return;
      started = true;
      var t0 = 0;
      render(0);
      window.requestAnimationFrame(function step(ts) {
        if (!t0) t0 = ts;
        var progress = Math.min((ts - t0) / DURATION, 1);
        render(progress);
        if (progress < 1) window.requestAnimationFrame(step);
      });
    }

    var rect = card.getBoundingClientRect();
    var inViewNow = rect.bottom > 0 && rect.top < window.innerHeight;
    if (inViewNow) {
      start();
      return;
    }

    render(0);

    var observer = new IntersectionObserver(
      function (entries, obs) {
        if (!entries[0].isIntersecting) return;
        obs.disconnect();
        start();
      },
      { threshold: 0.4 }
    );
    observer.observe(card);
  }

  /* Gold-Schimmer (.shine--gold): die Lichtbänder wandern nur, solange ihre
     Sektion im Bild ist (.is-inview schaltet den animation-play-state in
     CSS) — EIN gemeinsamer IntersectionObserver für alle, und höchstens
     zwei Schimmer laufen gleichzeitig (die mit dem größten sichtbaren
     Anteil). Silber (.shine--silver) ist statisch und braucht kein JS.
     Zusätzlich blendet die Überschrift im Ablauf-Kopf einmalig ein
     (.is-revealed, sobald ca. 30 % des Kopfes sichtbar sind). Bei reduzierter
     Bewegung passiert nichts: statische Schimmer, Überschrift sofort da. */
  function initAurora() {
    var shines = Array.prototype.slice.call(document.querySelectorAll('.shine--gold'));
    var TAN = Math.tan(10 * Math.PI / 180); // Streifen liegen bei 100deg

    // Angrenzende Sektionen mit .shine--join-t führen das Streifenmuster der
    // Vorgängersektion nahtlos fort: Phase = bisherige Phase + Höhe * tan(10deg).
    function alignJoins() {
      var all = Array.prototype.slice.call(document.querySelectorAll('.shine'));
      all.forEach(function (el) {
        if (!el.classList.contains('shine--join-t')) return;
        var prev = el.previousElementSibling;
        if (!prev && el.parentElement) prev = el.parentElement.previousElementSibling;
        if (!prev || !prev.classList.contains('shine')) return;
        var period = el.classList.contains('shine--silver') ? 760 : 560;
        var phase = (parseFloat(prev.style.getPropertyValue('--shine-phase')) || 0) + prev.offsetHeight * TAN;
        el.style.setProperty('--shine-phase', (phase % period).toFixed(1) + 'px');
      });
    }
    alignJoins();
    window.addEventListener('resize', alignJoins, { passive: true });

    if (!shines.length) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var head = document.querySelector('.ablauf__head');
    var heading = head && head.querySelector('.ablauf__heading');
    var MAX_RUNNING = 2;

    var PERIOD = 60000;
    var T0 = window.performance.now();

    function reveal() {
      if (heading) heading.classList.add('is-revealed');
    }

    if (!('IntersectionObserver' in window)) {
      shines.slice(0, MAX_RUNNING).forEach(function (el) { el.classList.add('is-inview'); });
      reveal();
      return;
    }

    var ratios = new Map();
    var revealed = false;

    function update() {
      var visible = shines
        .filter(function (el) { return (ratios.get(el) || 0) > 0; })
        .sort(function (x, y) { return ratios.get(y) - ratios.get(x); })
        .slice(0, MAX_RUNNING);
      var clock = (window.performance.now() - T0) % PERIOD;
      var syncing = false;
      shines.forEach(function (el) {
        var on = visible.indexOf(el) !== -1;
        if (on && !el.classList.contains('is-inview')) syncing = true;
        el.classList.toggle('is-inview', on);
      });
      // Alle Gold-Ebenen laufen auf einer gemeinsamen Uhr, damit Streifen an
      // der Naht zweier angrenzender Sektionen zusammenpassen.
      if (syncing && document.getAnimations) {
        document.getAnimations().forEach(function (a) {
          if (a.animationName === 'shine-drift') a.currentTime = clock;
        });
      }
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          ratios.set(entry.target, entry.isIntersecting ? entry.intersectionRatio || 0.01 : 0);
          if (!revealed && entry.target === head && entry.intersectionRatio >= 0.3) {
            revealed = true;
            reveal();
          }
        });
        update();
      },
      { threshold: [0, 0.1, 0.3, 0.6, 1] }
    );
    shines.forEach(function (el) { observer.observe(el); });
  }

  /* Positioniert die Straße (Verbindung der Nummern-Badges) in #ablauf so,
     dass sie exakt an der Mitte der ersten und der letzten Nummern-Badge
     beginnt und endet. Auf Mobile (Schritte untereinander, unterschiedlich hoch je nach
     Zeilenumbruch der Beschreibung) lässt sich das nicht aus CSS allein
     berechnen — anders als bei den gleich breiten Desktop-Spalten, die
     styles.css rein über calc() aus Breite und Gap herleitet. */
  function initAblaufLine() {
    var list = document.querySelector('.ablauf-steps');
    if (!list) return;

    var numbers = list.querySelectorAll('.step-number');
    if (numbers.length < 2) return;

    var first = numbers[0];
    var last = numbers[numbers.length - 1];
    var ticking = false;

    function update() {
      var listRect = list.getBoundingClientRect();
      var firstRect = first.getBoundingClientRect();
      var lastRect = last.getBoundingClientRect();
      var start = firstRect.top + firstRect.height / 2 - listRect.top;
      var end = listRect.bottom - (lastRect.top + lastRect.height / 2);
      list.style.setProperty('--ablauf-line-start', start + 'px');
      list.style.setProperty('--ablauf-line-end', end + 'px');
      ticking = false;
    }

    update();

    window.addEventListener(
      'resize',
      function () {
        if (!ticking) {
          window.requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true }
    );

    if (window.document.fonts && window.document.fonts.ready) {
      window.document.fonts.ready.then(update);
    }

    // Die Straße baut sich beim ersten Sichtbarwerden einmal auf (CSS-
    // Transition auf .is-road-drawn). Ohne IntersectionObserver sofort.
    if ('IntersectionObserver' in window) {
      var roadObserver = new IntersectionObserver(
        function (entries, obs) {
          if (!entries[0].isIntersecting) return;
          obs.disconnect();
          list.classList.add('is-road-drawn');
        },
        { threshold: 0.25 }
      );
      roadObserver.observe(list);
    } else {
      list.classList.add('is-road-drawn');
    }
  }

  /* Öffnungszeiten — EINE Quelle für den Live-Status in #kontakt und für den
     Badge der Standort-Karte. getDay() liefert 0 für Sonntag (nicht 7) —
     OPENING_SCHEDULE enthält deshalb bewusst keinen Eintrag für 0, und die
     Suche nach dem nächsten Öffnungstag überspringt jeden Tag ohne Eintrag
     automatisch. */
  var WEEKDAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  var OPENING_SCHEDULE = {
    1: { open: 10 * 60 + 30, close: 18 * 60 },
    2: { open: 10 * 60 + 30, close: 18 * 60 },
    3: { open: 10 * 60 + 30, close: 18 * 60 },
    4: { open: 10 * 60 + 30, close: 18 * 60 },
    5: { open: 10 * 60 + 30, close: 18 * 60 },
    6: { open: 11 * 60, close: 15 * 60 }
  };

  function formatTime(minutes) {
    var h = Math.floor(minutes / 60);
    var m = minutes % 60;
    return h + ':' + (m < 10 ? '0' : '') + m;
  }

  /* Wochentag (0 = Sonntag) und Minuten seit Mitternacht in Düsseldorf,
     unabhängig von der Zeitzone des Geräts: ein Besucher in London oder New
     York soll denselben Status sehen wie jemand vor Ort. Fällt Intl weg
     (sehr alte Browser), bleibt nur die Geräte-Ortszeit als Notlösung. */
  function getBerlinNow(now) {
    try {
      var parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Europe/Berlin',
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23'
      }).formatToParts(now);
      var map = {};
      parts.forEach(function (p) { map[p.type] = p.value; });
      var day = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[map.weekday];
      if (day === undefined) throw new Error('weekday');
      return { day: day, minutes: (parseInt(map.hour, 10) % 24) * 60 + parseInt(map.minute, 10) };
    } catch (e) {
      return { day: now.getDay(), minutes: now.getHours() * 60 + now.getMinutes() };
    }
  }

  function getOpeningState(now) {
    var t = getBerlinNow(now || new Date());
    var today = OPENING_SCHEDULE[t.day];
    var open = !!(today && t.minutes >= today.open && t.minutes < today.close);
    var next = null;

    if (!open) {
      for (var i = 0; i <= 7; i++) {
        var d = (t.day + i) % 7;
        var sched = OPENING_SCHEDULE[d];
        if (!sched) continue;
        if (i === 0 && t.minutes >= sched.close) continue;
        next = { day: d, open: sched.open };
        break;
      }
    }

    return { open: open, day: t.day, minutes: t.minutes, next: next };
  }

  /* Live-Status "Jetzt geöffnet" / "Öffnet [Wochentag] um [Zeit]" in
     #kontakt. */
  function initOpeningStatus() {
    var statusEl = document.getElementById('opening-status');
    var textEl = document.getElementById('opening-status-text');
    if (!statusEl || !textEl) return;

    var state = getOpeningState();

    if (state.open) {
      statusEl.classList.add('contact-hours__status--open');
      textEl.textContent = 'Jetzt geöffnet';
    } else {
      statusEl.classList.add('contact-hours__status--closed');
      if (state.next) {
        textEl.textContent = 'Öffnet ' + WEEKDAYS[state.next.day] + ' um ' + formatTime(state.next.open);
      }
    }

    statusEl.hidden = false;

    var todayKey = state.day === 0 ? 'sun' : state.day === 6 ? 'sat' : 'mon-fri';
    var todayRow = document.querySelector('.contact-hours__row[data-day="' + todayKey + '"]');
    if (todayRow) todayRow.classList.add('contact-hours__row--today');
  }

  /* Aufklappbare Standort-Karte (.location-card). Ohne JavaScript zeigt das
     Markup bereits alles (aufgeklappter Look, Klasse "js" am <html> fehlt);
     hier wird nur Verhalten ergänzt: auf-/zuklappen, 3D-Neigung auf
     Geräten mit Maus, Öffnungs-Badge. Der Route-Link ist bewusst kein Kind
     des Buttons (Link in Button wäre ungültig) und steht immer im Markup. */
  function initLocationCard() {
    var cards = document.querySelectorAll('[data-location-card]');
    if (!cards.length) return;

    var fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

    function updateBadge(card) {
      var badge = card.querySelector('[data-loc-badge]');
      var label = card.querySelector('[data-loc-status]');
      if (!badge || !label) return;
      var open = getOpeningState().open;
      badge.classList.toggle('location-card__badge--open', open);
      badge.classList.toggle('location-card__badge--closed', !open);
      label.textContent = open ? 'Geöffnet' : 'Geschlossen';
      badge.hidden = false;
    }

    Array.prototype.forEach.call(cards, function (card) {
      var toggle = card.querySelector('.location-card__toggle');
      var route = card.querySelector('.location-card__route');
      if (!toggle) return;

      toggle.setAttribute('aria-expanded', 'false');

      function setOpen(open) {
        card.classList.toggle('is-open', open);
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      }

      toggle.addEventListener('click', function () {
        setOpen(!card.classList.contains('is-open'));
      });

      toggle.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && card.classList.contains('is-open')) setOpen(false);
      });

      // Ein Klick auf den Link darf die Karte nie zuklappen.
      if (route) route.addEventListener('click', function (e) { e.stopPropagation(); });

      // 3D-Neigung: nur mit Maus und ohne reduzierte Bewegung. Die Werte
      // gehen als CSS-Variablen ans Element, das Zurückfedern übernimmt eine
      // CSS-Transition.
      var frame = 0;
      var tiltX = 0;
      var tiltY = 0;

      function applyTilt() {
        frame = 0;
        toggle.style.setProperty('--rx', tiltX.toFixed(2) + 'deg');
        toggle.style.setProperty('--ry', tiltY.toFixed(2) + 'deg');
      }

      toggle.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse' || !fine.matches || reduce.matches) return;
        var r = toggle.getBoundingClientRect();
        var nx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width / 2)));
        var ny = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height / 2)));
        tiltY = nx * 8;
        tiltX = -ny * 8;
        toggle.classList.add('is-tilting');
        if (!frame) frame = window.requestAnimationFrame(applyTilt);
      });

      toggle.addEventListener('pointerleave', function () {
        tiltX = 0;
        tiltY = 0;
        toggle.classList.remove('is-tilting');
        if (frame) window.cancelAnimationFrame(frame);
        applyTilt();
      });

      updateBadge(card);
      window.setInterval(function () { updateBadge(card); }, 60000);
    });
  }

  /* Klassen-Karussell (#klassen). Der Track scrollt und rastet per CSS
     (scroll-snap); hier kommen nur die Bedienelemente dazu: Pfeile (nur mit
     Maus sichtbar), Punkte, Pfeiltasten und der Aktiv-Zustand. Die
     Bedienelemente werden erst hier erzeugt — ohne JavaScript gäbe es sonst
     tote Buttons; der Track bleibt dann per Wischen/Scrollleiste bedienbar. */
  function initClassCarousel() {
    var carousel = document.querySelector('.classes__carousel');
    if (!carousel) return;

    var viewport = carousel.querySelector('.classes__viewport');
    var track = carousel.querySelector('.classes__track');
    var dotsBox = carousel.querySelector('[data-carousel-dots]');
    if (!viewport || !track) return;

    var items = Array.prototype.slice.call(track.children);
    if (items.length < 2) return;

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

    function scrollBehavior() {
      return reduce.matches ? 'auto' : 'smooth';
    }

    function makeArrow(direction) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'metal__btn carousel-arrow carousel-arrow--' + direction;
      btn.setAttribute('aria-label', direction === 'prev' ? 'Vorherige Klasse anzeigen' : 'Nächste Klasse anzeigen');
      btn.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="square" aria-hidden="true" focusable="false">' +
        '<path d="' + (direction === 'prev' ? 'M15 4l-8 8 8 8' : 'M9 4l8 8-8 8') + '"/></svg>';
      // Gold-Metall: der Wrapper trägt Rahmen, Schatten und Zustände (siehe
      // „Gold-Metall-Buttons“ in styles.css), der Button bleibt der echte Button.
      var wrap = document.createElement('span');
      wrap.className = 'metal metal--' + direction + ' metal--arrow metal--icon metal--p3';
      wrap.appendChild(btn);
      return btn;
    }

    var prev = makeArrow('prev');
    var next = makeArrow('next');
    viewport.appendChild(prev.parentNode);
    viewport.appendChild(next.parentNode);

    // Abstand von Kartenanfang zu Kartenanfang (Kartenbreite + gap).
    function step() {
      return items[1].offsetLeft - items[0].offsetLeft;
    }

    function padStart() {
      return parseFloat(window.getComputedStyle(track).scrollPaddingLeft) || 0;
    }

    function maxScroll() {
      return track.scrollWidth - track.clientWidth;
    }

    function scrollToCard(index) {
      var target = Math.max(0, Math.min(maxScroll(), items[index].offsetLeft - padStart()));
      track.scrollTo({ left: target, behavior: scrollBehavior() });
    }

    var dots = [];
    if (dotsBox) {
      items.forEach(function (item, i) {
        var letterEl = item.querySelector('.class-card__letter');
        var letter = letterEl ? letterEl.textContent.trim() : String(i + 1);
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'classes__dot';
        dot.setAttribute('aria-label', 'Klasse ' + letter + ' anzeigen');
        dot.addEventListener('click', function () { scrollToCard(i); });
        dotsBox.appendChild(dot);
        dots.push(dot);
      });
    }

    function setArrow(btn, hidden) {
      if (hidden && document.activeElement === btn) track.focus({ preventScroll: true });
      btn.parentNode.classList.toggle('is-hidden', hidden);
      btn.tabIndex = hidden ? -1 : 0;
    }

    var ticking = false;

    function update() {
      ticking = false;
      var x = track.scrollLeft;
      var max = maxScroll();
      var atEnd = x >= max - 2;

      setArrow(prev, x <= 2);
      setArrow(next, atEnd);

      // Aktiv = erste sichtbare Karte (nächster Rastpunkt), am Ende die letzte.
      var active = 0;
      if (atEnd && max > 2) {
        active = items.length - 1;
      } else {
        var best = Infinity;
        items.forEach(function (item, i) {
          var d = Math.abs(item.offsetLeft - padStart() - x);
          if (d < best) { best = d; active = i; }
        });
      }

      dots.forEach(function (dot, i) {
        if (i === active) dot.setAttribute('aria-current', 'true');
        else dot.removeAttribute('aria-current');
      });
    }

    function schedule() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }

    prev.addEventListener('click', function () {
      track.scrollBy({ left: -step(), behavior: scrollBehavior() });
    });

    next.addEventListener('click', function () {
      track.scrollBy({ left: step(), behavior: scrollBehavior() });
    });

    // Pfeiltasten scrollen um eine Karte, Pos1/Ende springen an die Ränder —
    // auf dem Track selbst und auf den Karten-Links darin.
    carousel.addEventListener('keydown', function (e) {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      var t = e.target;
      if (t !== track && !(t.closest && t.closest('.class-card'))) return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        track.scrollBy({ left: step(), behavior: scrollBehavior() });
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        track.scrollBy({ left: -step(), behavior: scrollBehavior() });
      } else if (e.key === 'Home') {
        e.preventDefault();
        track.scrollTo({ left: 0, behavior: scrollBehavior() });
      } else if (e.key === 'End') {
        e.preventDefault();
        track.scrollTo({ left: maxScroll(), behavior: scrollBehavior() });
      }
    });

    track.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    update();
  }

  /* Bewertungen (#bewertungen) als laufende Spalten. Die elf Karten stehen
     einmal als normale Liste im Markup (funktioniert ohne JavaScript). Hier
     werden sie je nach Breite auf 1 / 2 / 3 Spalten verteilt, jede Spalte
     wird für den nahtlosen Loop dupliziert (Duplikate aria-hidden + inert)
     und von einer requestAnimationFrame-Schleife endlos nach oben geschoben.

     Bewegung per JS-gesteuertem transform statt CSS-Animation, damit die Hand
     eingreifen kann: Wischen (Touch) und Mausrad schieben die Spalte nach oben
     oder unten, nach dem Loslassen läuft sie mit Schwung aus und danach von
     selbst weiter. Angehalten wird ausschließlich absichtlich — durch Antippen
     bzw. Anklicken einer Spalte (ohne Wischen/Ziehen), nochmal tippen setzt
     fort. Kein Hover-Pause, kein eigener Knopf. Bei reduzierter Bewegung
     bleibt es bei der normalen Liste: keine Duplikate, keine Bewegung. */
  function initReviewColumns() {
    var section = document.getElementById('bewertungen');
    if (!section) return;

    var viewport = section.querySelector('.reviews__viewport');
    var list = section.querySelector('.reviews__list');
    if (!viewport || !list) return;

    var originals = Array.prototype.slice.call(list.children);
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    var wide = window.matchMedia('(min-width: 768px)');
    var widest = window.matchMedia('(min-width: 1024px)');

    // Lesegeschwindigkeit in px pro Sekunde, Spalten leicht unterschiedlich
    // (im Verhältnis grob 30 s : 38 s : 34 s bei gleicher Höhe).
    var SPEEDS = [35, 28, 31];
    var RESUME_DELAY = 1500; // ms Ruhe nach Wischen/Mausrad, dann läuft es weiter

    var columns = null;
    var states = [];
    var paused = false;
    var inView = false;
    var resumeAt = 0;
    var raf = 0;
    var lastTs = 0;
    var lastWidth = 0;
    var resizeTimer = 0;

    function columnCount() {
      return widest.matches ? 3 : wide.matches ? 2 : 1;
    }

    function wrap(pos, half) {
      return ((pos % half) + half) % half;
    }

    function apply(st) {
      st.el.style.transform = 'translate3d(0,' + (-st.pos).toFixed(2) + 'px,0)';
    }

    function tick(ts) {
      var dt = lastTs ? Math.min((ts - lastTs) / 1000, 0.1) : 0;
      lastTs = ts;
      var auto = inView && !paused && ts >= resumeAt;
      var busy = false;

      states.forEach(function (st) {
        if (st.dragging) { busy = true; return; }
        var move = 0;

        // Auslaufen nach dem Wischen
        if (Math.abs(st.v) > 10) {
          move += st.v * dt;
          st.v *= Math.exp(-dt / 0.45);
          busy = true;
        } else {
          st.v = 0;
        }

        if (auto && st.v === 0) move += st.speed * dt;

        if (move) {
          st.pos = wrap(st.pos + move, st.half);
          apply(st);
        }
      });

      // Schleife nur weiterlaufen lassen, solange etwas zu tun ist.
      if ((inView && !paused) || busy || ts < resumeAt) {
        raf = window.requestAnimationFrame(tick);
      } else {
        raf = 0;
        lastTs = 0;
      }
    }

    function ensureLoop() {
      if (!raf && states.length) raf = window.requestAnimationFrame(tick);
    }

    function stopLoop() {
      if (raf) window.cancelAnimationFrame(raf);
      raf = 0;
      lastTs = 0;
    }

    function setPaused(value) {
      paused = value;
      if (!paused) ensureLoop();
    }

    function stateAt(clientX) {
      var found = null;
      states.forEach(function (st) {
        var r = st.el.getBoundingClientRect();
        if (clientX >= r.left && clientX <= r.right) found = st;
      });
      return found;
    }

    // Mausrad über den Spalten schiebt sie (statt die Seite zu scrollen).
    viewport.addEventListener('wheel', function (e) {
      if (!states.length) return;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      e.preventDefault();
      var dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * viewport.clientHeight : e.deltaY;
      var target = stateAt(e.clientX);
      (target ? [target] : states).forEach(function (st) {
        st.v = 0;
        st.pos = wrap(st.pos + dy, st.half);
        apply(st);
      });
      resumeAt = window.performance.now() + RESUME_DELAY;
      ensureLoop();
    }, { passive: false });

    // Wischen mit dem Finger (touch-action: none in CSS), Tippen = Pause.
    function bindDrag(st) {
      var el = st.el;

      el.addEventListener('pointerdown', function (e) {
        if (e.pointerType === 'mouse') return;
        st.dragging = true;
        st.moved = false;
        st.startY = st.lastY = e.clientY;
        st.lastT = e.timeStamp;
        st.v = 0;
        st.vs = 0;
        if (el.setPointerCapture) el.setPointerCapture(e.pointerId);
        ensureLoop();
      });

      el.addEventListener('pointermove', function (e) {
        if (!st.dragging) return;
        var dy = st.lastY - e.clientY;
        var dtm = (e.timeStamp - st.lastT) / 1000;
        st.lastY = e.clientY;
        st.lastT = e.timeStamp;
        if (Math.abs(e.clientY - st.startY) > 6) st.moved = true;
        if (!st.moved) return;
        st.pos = wrap(st.pos + dy, st.half);
        apply(st);
        if (dtm > 0) st.vs = st.vs * 0.6 + (dy / dtm) * 0.4;
      });

      function release() {
        if (!st.dragging) return;
        st.dragging = false;
        if (st.moved) st.v = Math.max(-3000, Math.min(3000, st.vs));
        resumeAt = window.performance.now() + RESUME_DELAY;
        ensureLoop();
      }

      el.addEventListener('pointerup', release);
      el.addEventListener('pointercancel', release);

      // Antippen (Finger) bzw. Klick (Maus) ohne Wischen hält an, nochmal
      // setzt fort. Nach einem Wisch (st.moved) und bei markiertem Text nicht.
      el.addEventListener('click', function () {
        if (st.moved) { st.moved = false; return; }
        if (window.getSelection && String(window.getSelection())) return;
        if (paused) resumeAt = 0; // Fortsetzen sofort, ohne Wartezeit
        setPaused(!paused);
      });
    }

    // Zurück zur normalen Liste (reduzierte Bewegung).
    function restore() {
      stopLoop();
      states = [];
      if (columns) {
        columns.remove();
        columns = null;
      }
      originals.forEach(function (li) {
        li.removeAttribute('aria-hidden');
        list.appendChild(li);
      });
      if (!list.parentNode) viewport.appendChild(list);
    }

    function build() {
      var count = columnCount();
      var cols = [];
      var i;

      stopLoop();
      states = [];
      if (columns) columns.remove();
      columns = document.createElement('div');
      columns.className = 'reviews__columns';

      for (i = 0; i < count; i++) {
        var ul = document.createElement('ul');
        ul.className = 'reviews__col';
        columns.appendChild(ul);
        cols.push(ul);
      }

      originals.forEach(function (li, index) {
        li.removeAttribute('aria-hidden');
        cols[index % count].appendChild(li);
      });

      if (list.parentNode) list.parentNode.removeChild(list);
      viewport.appendChild(columns);

      var viewHeight = viewport.clientHeight;

      cols.forEach(function (ul, n) {
        var base = Array.prototype.slice.call(ul.children);
        var setHeight = ul.scrollHeight;

        // Die erste Hälfte muss mindestens so hoch sein wie der sichtbare
        // Ausschnitt, sonst läuft unten Leerraum ins Bild: bei kurzen Spalten
        // also mehrere Sätze pro Hälfte. Hälfte 2 ist eine Kopie von Hälfte 1.
        var sets = Math.max(1, Math.ceil(viewHeight / Math.max(1, setHeight)));
        var extra = sets * 2 - 1;
        var k;

        for (k = 0; k < extra; k++) {
          base.forEach(function (li) {
            var copy = li.cloneNode(true);
            copy.setAttribute('aria-hidden', 'true');
            copy.setAttribute('inert', '');
            ul.appendChild(copy);
          });
        }

        var st = {
          el: ul,
          half: ul.scrollHeight / 2,
          speed: SPEEDS[n % SPEEDS.length],
          pos: 0,
          v: 0,
          vs: 0,
          dragging: false,
          moved: false,
          startY: 0,
          lastY: 0,
          lastT: 0
        };
        states.push(st);
        bindDrag(st);
      });

      setPaused(paused);
      ensureLoop();
    }

    function render() {
      lastWidth = window.innerWidth;
      if (reduce.matches) restore();
      else build();
    }

    render();

    function onResize() {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        if (window.innerWidth !== lastWidth) render();
      }, 200);
    }

    window.addEventListener('resize', onResize, { passive: true });
    [reduce, wide, widest].forEach(function (mq) {
      if (mq.addEventListener) mq.addEventListener('change', render);
      else if (mq.addListener) mq.addListener(render);
    });

    // Bewegung nur, solange die Sektion zu sehen ist.
    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          inView = entry.isIntersecting;
          if (inView) ensureLoop();
        });
      });
      observer.observe(viewport);
    } else {
      inView = true;
      ensureLoop();
    }
  }

  /* Formular auf site/kontakt.html. Prüft die Pflichtfelder selbst, statt die
     Browser-Meldungen zu nutzen: die sind je nach Browser anders formuliert,
     teils englisch, und lassen sich nicht unter dem Feld platzieren. */
  function initKontaktForm() {
    var form = document.getElementById('kontakt-form');
    if (!form) return;

    var notice = document.getElementById('kontakt-form-notice');
    var success = document.getElementById('kontakt-form-success');
    var submit = form.querySelector('.contact-form__submit');

    var rules = [
      { id: 'kontakt-name', leer: 'Bitte trag deinen Namen ein.' },
      {
        id: 'kontakt-email',
        leer: 'Bitte trag deine E-Mail-Adresse ein.',
        // Bewusst grob: alles mit @ und einem Punkt dahinter. Strengere
        // Muster sortieren regelmäßig gültige Adressen aus, und ob die
        // Adresse wirklich existiert, zeigt sich ohnehin erst beim Antworten.
        pruefen: function (wert) { return /.+@.+\..+/.test(wert); },
        ungueltig: 'Diese E-Mail-Adresse sieht nicht vollständig aus.'
      },
      { id: 'kontakt-message', leer: 'Bitte schreib uns kurz, worum es geht.' },
      { id: 'kontakt-privacy', leer: 'Ohne dein Einverständnis dürfen wir die Anfrage nicht bearbeiten.' }
    ];

    function fehlerZeigen(regel, text) {
      var feld = document.getElementById(regel.id);
      var box = document.getElementById(regel.id + '-error');
      if (box) {
        box.textContent = text;
        box.hidden = false;
      }
      if (feld && feld.type !== 'checkbox') feld.setAttribute('aria-invalid', 'true');
    }

    function fehlerLoeschen(regel) {
      var feld = document.getElementById(regel.id);
      var box = document.getElementById(regel.id + '-error');
      if (box) {
        box.textContent = '';
        box.hidden = true;
      }
      if (feld) feld.removeAttribute('aria-invalid');
    }

    function pruefen(regel) {
      var feld = document.getElementById(regel.id);
      if (!feld) return true;

      var wert = feld.type === 'checkbox' ? feld.checked : feld.value.trim();

      if (!wert) {
        fehlerZeigen(regel, regel.leer);
        return false;
      }
      if (regel.pruefen && !regel.pruefen(wert)) {
        fehlerZeigen(regel, regel.ungueltig);
        return false;
      }
      fehlerLoeschen(regel);
      return true;
    }

    // Erst nach dem ersten Absendeversuch live nachprüfen: sonst steht die
    // Fehlermeldung schon da, während man das Feld noch ausfüllt.
    //
    // Bewusst 'input' statt 'blur': beim Ausblenden einer Fehlermeldung
    // rutscht alles darunter nach oben. Passiert das erst beim Verlassen des
    // Feldes, verschiebt es sich genau in dem Moment, in dem man das nächste
    // Element antippt — mousedown und mouseup landen dann auf verschiedenen
    // Elementen und der Tipp verpufft. Beim Tippen ist das Layout dagegen
    // längst wieder ruhig, bevor der nächste Tipp kommt.
    //
    // Während des Tippens werden Fehler nur ENTFERNT, nie neu gesetzt: eine
    // Meldung "E-Mail unvollständig" nach dem ersten Buchstaben wäre nur
    // lästig.
    var wurdeAbgeschickt = false;
    rules.forEach(function (regel) {
      var feld = document.getElementById(regel.id);
      if (!feld) return;

      if (feld.type === 'checkbox') {
        feld.addEventListener('change', function () {
          if (wurdeAbgeschickt) pruefen(regel);
        });
        return;
      }

      feld.addEventListener('input', function () {
        if (!wurdeAbgeschickt) return;
        var box = document.getElementById(regel.id + '-error');
        if (box && box.hidden) return;
        pruefen(regel);
      });
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      wurdeAbgeschickt = true;

      var ersterFehler = null;
      rules.forEach(function (regel) {
        if (!pruefen(regel) && !ersterFehler) ersterFehler = document.getElementById(regel.id);
      });

      if (ersterFehler) {
        ersterFehler.focus();
        return;
      }

      // Honeypot: ausgefüllt heißt Bot. Nach außen sieht das aus wie ein
      // erfolgreicher Versand, damit der Bot es nicht erneut versucht.
      var honeypot = document.getElementById('kontakt-website');
      if (honeypot && honeypot.value) {
        form.hidden = true;
        if (success) success.hidden = false;
        return;
      }

      if (!CONTACT_FORM_ENDPOINT) {
        if (notice) {
          notice.textContent = 'Das Formular ist noch nicht freigeschaltet. Ruf uns bitte an oder schreib uns per WhatsApp — wir melden uns sofort.';
          notice.hidden = false;
        }
        return;
      }

      if (notice) notice.hidden = true;
      if (submit) submit.disabled = true;

      window.fetch(CONTACT_FORM_ENDPOINT, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      })
        .then(function (antwort) {
          if (!antwort.ok) throw new Error('Status ' + antwort.status);
          form.hidden = true;
          if (success) {
            success.hidden = false;
            success.focus();
          }
        })
        .catch(function () {
          if (submit) submit.disabled = false;
          if (notice) {
            notice.textContent = 'Das hat gerade nicht geklappt. Versuch es bitte noch einmal oder ruf uns direkt an.';
            notice.hidden = false;
          }
        });
    });
  }

  /* Hero-Video: das <video> im Markup hat bewusst keine <source> — ohne
     JavaScript (oder bei reduzierter Bewegung/Data-Saver) bleibt einfach
     das poster-Bild stehen, statt Bandbreite für ein Video zu verbrauchen,
     das niemand zu sehen bekommt. Nur wenn beides erlaubt ist, hängt diese
     Funktion die echte Quelle an und versucht die Wiedergabe zu starten.

     Darstellung läuft über ein per JS erzeugtes <canvas> statt direkt über
     das <video> — Hintergrund: iOS Safari hat das Video zuverlässig
     dekodiert (currentTime lief immer sauber weiter), aber die neuen
     Frames nie von selbst an den Compositor weitergegeben, das Bild blieb
     auf dem Poster-Frame stehen. Mehrere direkte Fixes dafür (isolation:
     isolate, Verlaufs-Overlay als echte Elemente statt Pseudo-Elemente,
     zwei Varianten eines periodischen Compositor-"Nudge") wurden am Gerät
     getestet und halfen nicht — bestätigt behoben erst mit dieser
     Canvas-Umgehung. Das <video> bleibt die unsichtbare Dekodier-Quelle
     (per JS erst nach dem ersten erfolgreich gezeichneten Frame auf
     opacity: 0 gesetzt, nicht vorher und nicht per display:none/
     visibility:hidden — beide können auf manchen Geräten die Dekodierung
     selbst pausieren). Das <canvas> übernimmt danach die sichtbare
     Darstellung, ein Frame pro Aufruf von requestVideoFrameCallback().

     Sicherheitsnetz ist kein Sonderfall-Code, sondern die Reihenfolge
     selbst: video.style.opacity wird nur nach dem ersten erfolgreich
     gezeichneten Frame gesetzt. Schlägt Canvas-Context, Laden oder
     Dekodieren fehl, passiert dieser Schritt einfach nie — das Video
     bleibt mit seinem poster-Attribut sichtbar, kein kaputter oder
     leerer Zustand. */
  function initHeroVideo() {
    var video = document.getElementById('hero-video');
    var posterImg = document.getElementById('hero-poster-img');
    if (!video) return;

    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var saveData = !!(navigator.connection && navigator.connection.saveData);

    if (reducedMotion || saveData) {
      video.remove();
      if (posterImg) posterImg.hidden = false;
      return;
    }

    var source = document.createElement('source');
    source.src = 'assets/hero.mp4';
    source.type = 'video/mp4';
    video.appendChild(source);
    video.load();

    var canvas = document.createElement('canvas');
    canvas.className = 'hero-section__video';
    canvas.setAttribute('aria-hidden', 'true');
    var ctx = canvas.getContext && canvas.getContext('2d');

    if (!ctx) {
      // Fallback ohne Canvas-Unterstützung: direkter Play-Versuch wie vor
      // der Canvas-Umstellung, Video bleibt mit seinem poster-Attribut
      // sichtbar, falls play() fehlschlägt.
      var fallbackPlayPromise = video.play();
      if (fallbackPlayPromise && typeof fallbackPlayPromise.catch === 'function') {
        fallbackPlayPromise.catch(function () {});
      }
    } else {
      // Direkt nach dem poster-<img> einfügen (falls vorhanden, sonst nach
      // dem Video) — beide teilen sich mit dem Canvas dieselbe Klasse und
      // damit denselben z-index:0; unter gleichem z-index gewinnt beim
      // Malen die spätere DOM-Position. So liegt das Canvas über Video
      // UND Poster-<img>, bleibt aber unter dem Scrim (z-index:1) und dem
      // Text-Inhalt (z-index:2) — unverändert wie zuvor mit dem Video.
      var insertAfter = posterImg || video;
      insertAfter.parentNode.insertBefore(canvas, insertAfter.nextSibling);

      var box = video.parentElement; // .hero-section
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var hasDrawnFirstFrame = false;
      var shouldPlay = false; // kombiniert Sichtbarkeit + Vordergrund
      var supportsRVFC = 'requestVideoFrameCallback' in video;

      function resizeCanvas() {
        var w = Math.round(box.clientWidth * dpr);
        var h = Math.round(box.clientHeight * dpr);
        if (w === canvas.width && h === canvas.height) return;
        canvas.width = w;
        canvas.height = h;
      }
      resizeCanvas();

      // ticking-Flag wie bei initAblaufLine/initStickyHeader weiter oben in
      // dieser Datei — verhindert Reflow-Spam durch iOS' Adressleisten-
      // Ein-/Ausblenden beim Scrollen.
      var resizeTicking = false;
      var resizeObserver = new ResizeObserver(function () {
        if (resizeTicking) return;
        resizeTicking = true;
        requestAnimationFrame(function () {
          resizeCanvas();
          resizeTicking = false;
        });
      });
      resizeObserver.observe(box);

      // object-fit: cover von Hand nachgebaut (object-position ist immer
      // "center", der einzige im Projekt verwendete Wert): die kürzere
      // Kante der Video-Quelle füllt die entsprechende Canvas-Kante
      // vollständig, die längere wird mittig beschnitten.
      function drawFrame() {
        if (!video.videoWidth || !video.videoHeight) return;
        var boxRatio = canvas.width / canvas.height;
        var videoRatio = video.videoWidth / video.videoHeight;
        var sx, sy, sWidth, sHeight;
        if (videoRatio > boxRatio) {
          sHeight = video.videoHeight;
          sWidth = sHeight * boxRatio;
          sx = (video.videoWidth - sWidth) / 2;
          sy = 0;
        } else {
          sWidth = video.videoWidth;
          sHeight = sWidth / boxRatio;
          sx = 0;
          sy = (video.videoHeight - sHeight) / 2;
        }
        ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
        if (!hasDrawnFirstFrame) {
          hasDrawnFirstFrame = true;
          video.style.opacity = '0';
        }
      }

      // requestVideoFrameCallback feuert genau einmal pro tatsächlich neu
      // dekodiertem Frame — koppelt die Zeichenrate von selbst ans
      // Video-Intervall, ohne Quell-Framerate raten oder manuell timen zu
      // müssen. Fallback für Browser ohne diese API (vor Safari 15.4):
      // rAF mit Zeitstempel-Gate, hart auf 24fps gedeckelt statt voller
      // Bildwiederholrate.
      function scheduleNextFrame() {
        if (!shouldPlay) return;
        if (supportsRVFC) {
          video.requestVideoFrameCallback(function () {
            drawFrame();
            scheduleNextFrame();
          });
        } else {
          var last = 0;
          (function tick(ts) {
            if (!shouldPlay) return;
            if (ts - last >= 41) {
              last = ts;
              drawFrame();
            }
            requestAnimationFrame(tick);
          })(performance.now());
        }
      }

      var heroVisible = false;
      var pageVisible = !document.hidden;

      function updatePlayState() {
        var wantPlay = heroVisible && pageVisible;
        if (wantPlay === shouldPlay) return;
        shouldPlay = wantPlay;
        if (shouldPlay) {
          var p = video.play();
          if (p && typeof p.catch === 'function') p.catch(function () {});
          scheduleNextFrame();
        } else {
          video.pause();
        }
      }

      var intersectionObserver = new IntersectionObserver(function (entries) {
        heroVisible = entries[0].isIntersecting;
        updatePlayState();
      }, { threshold: 0 });
      intersectionObserver.observe(box);

      document.addEventListener('visibilitychange', function () {
        pageVisible = !document.hidden;
        updatePlayState();
      });
    }

    // Sicherheitsnetz: manche mobilen Browser verlangen für Autoplay eine
    // (beliebige) erste Nutzer-Geste in dieser Sitzung, obwohl muted+
    // playsinline gesetzt sind — play() schlägt dann beim Laden fehl,
    // klappt aber bei erneutem Aufruf nach der Geste. Einmaliger Versuch,
    // nur falls das Video zu diesem Zeitpunkt noch pausiert ist; kein
    // Effekt, wenn Autoplay ohnehin schon lief.
    function retryPlayOnFirstGesture() {
      if (video.paused) {
        var p = video.play();
        if (p && typeof p.catch === 'function') p.catch(function () {});
      }
      window.removeEventListener('touchstart', retryPlayOnFirstGesture);
      window.removeEventListener('scroll', retryPlayOnFirstGesture);
      window.removeEventListener('click', retryPlayOnFirstGesture);
    }
    window.addEventListener('touchstart', retryPlayOnFirstGesture, { passive: true, once: true });
    window.addEventListener('scroll', retryPlayOnFirstGesture, { passive: true, once: true });
    window.addEventListener('click', retryPlayOnFirstGesture, { once: true });
  }

  /* FAQ (#faq): die Karten sind native <details>. Der Eintritt beim Scrollen
     (gestaffeltes Aufsteigen) setzt diese Funktion per IntersectionObserver
     an; das weiche Auf-/Zuklappen
     übernimmt CSS (::details-content + interpolate-size); nur wo das fehlt
     (Safari/iOS), animiert sie die Höhe der Antwort per Web
     Animations. Ohne JS, mit reduzierter Bewegung oder ohne Web Animations
     bleibt das Standardverhalten (sofort auf/zu). */
  function initFaq() {
    var items = document.querySelectorAll('.faq-item');
    if (!items.length) return;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Eintritt: Label, Überschrift und Karten steigen beim Sichtbarwerden
    // gestaffelt auf (CSS: .faq--pending versteckt, .is-inview animiert).
    var faq = document.getElementById('faq');
    if (faq && !reduce.matches && 'IntersectionObserver' in window) {
      faq.classList.add('faq--pending');
      var seen = new IntersectionObserver(function (entries) {
        if (!entries.some(function (e) { return e.isIntersecting; })) return;
        seen.disconnect();
        faq.classList.remove('faq--pending');
        faq.classList.add('is-inview');
      }, { threshold: 0.1 });
      seen.observe(faq);
    }

    if (window.CSS && window.CSS.supports && window.CSS.supports('selector(::details-content)')) return;
    if (!window.Element || !Element.prototype.animate) return;

    Array.prototype.forEach.call(items, function (item) {
      var summary = item.querySelector('.faq-item__summary');
      var panel = item.querySelector('.faq-item__a');
      if (!summary || !panel) return;
      var anim = null;
      var closing = false;

      function run(from, to, done) {
        var fadeOut = to === 0;
        if (anim) {
          anim.onfinish = null;
          anim.cancel();
        }
        panel.style.overflow = 'hidden';
        // fill: 'forwards' hält den Endzustand, bis done() gelaufen ist — sonst
        // blitzt die Antwort zwischen Animationsende und Schließen kurz auf.
        anim = panel.animate(
          [{ height: from + 'px', opacity: fadeOut ? 1 : 0 }, { height: to + 'px', opacity: fadeOut ? 0 : 1 }],
          { duration: 300, easing: 'ease-in-out', fill: 'forwards' }
        );
        anim.onfinish = function () {
          var finished = anim;
          panel.style.overflow = '';
          anim = null;
          if (done) done();
          finished.cancel();
        };
      }

      summary.addEventListener('click', function (event) {
        if (reduce.matches) return;
        event.preventDefault();
        var h = panel.getBoundingClientRect().height;
        if (item.open && !closing) {
          closing = true;
          run(h, 0, function () {
            item.open = false;
            closing = false;
          });
        } else {
          closing = false;
          item.open = true;
          run(h, panel.scrollHeight);
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initStickyHeader();
    initMobileMenu();
    initDropdown();
    initCurrentYear();
    initRatingCounter();
    initAblaufLine();
    initAurora();
    initOpeningStatus();
    initLocationCard();
    initClassCarousel();
    initReviewColumns();
    initKontaktForm();
    initFaq();
    initHeroVideo();
  });
})();
