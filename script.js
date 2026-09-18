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

  function initTrustStats() {
    var group = document.getElementById('trust-stats');
    if (!group) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var numbers = group.querySelectorAll('.trust-stat__number');
    var duration = 900;

    function animateNumber(el, delay) {
      var target = parseFloat(el.getAttribute('data-count-to'));
      var decimals = parseInt(el.getAttribute('data-decimals'), 10) || 0;

      setTimeout(function () {
        var start = null;

        function step(timestamp) {
          if (start === null) start = timestamp;
          var progress = Math.min((timestamp - start) / duration, 1);
          var eased = 1 - Math.pow(1 - progress, 3);
          var value = target * eased;
          el.textContent = decimals
            ? value.toFixed(decimals).replace('.', ',')
            : String(Math.round(value));
          if (progress < 1) {
            window.requestAnimationFrame(step);
          }
        }

        window.requestAnimationFrame(step);
      }, delay);
    }

    group.classList.add('trust-stats--ready');

    var observer = new IntersectionObserver(
      function (entries, obs) {
        if (!entries[0].isIntersecting) return;
        obs.disconnect();
        group.classList.add('trust-stats--visible');
        animateNumber(numbers[0], 0);
        animateNumber(numbers[1], 120);
      },
      { threshold: 0.4 }
    );

    observer.observe(group);
  }

  /* Positioniert die gestrichelte Verbindungslinie in #ablauf so, dass sie
     exakt an der Mitte der ersten und der letzten Nummern-Badge beginnt und
     endet. Auf Mobile (Schritte untereinander, unterschiedlich hoch je nach
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
  }

  /* Live-Status "Jetzt geöffnet" / "Öffnet [Wochentag] um [Zeit]" in
     #kontakt, berechnet aus der aktuellen Uhrzeit. getDay() liefert 0 für
     Sonntag (nicht 7) — SCHEDULE enthält deshalb bewusst keinen Eintrag für
     0, und die Suche nach dem nächsten Öffnungstag überspringt jeden Tag
     ohne Eintrag automatisch. */
  function initOpeningStatus() {
    var statusEl = document.getElementById('opening-status');
    var textEl = document.getElementById('opening-status-text');
    if (!statusEl || !textEl) return;

    var WEEKDAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    var SCHEDULE = {
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

    var now = new Date();
    var day = now.getDay();
    var minutes = now.getHours() * 60 + now.getMinutes();
    var today = SCHEDULE[day];

    if (today && minutes >= today.open && minutes < today.close) {
      statusEl.classList.add('contact-hours__status--open');
      textEl.textContent = 'Jetzt geöffnet';
    } else {
      var next = null;
      for (var i = 0; i <= 7; i++) {
        var d = (day + i) % 7;
        var sched = SCHEDULE[d];
        if (!sched) continue;
        if (i === 0 && minutes >= sched.close) continue;
        next = { day: d, open: sched.open };
        break;
      }
      statusEl.classList.add('contact-hours__status--closed');
      if (next) {
        textEl.textContent = 'Öffnet ' + WEEKDAYS[next.day] + ' um ' + formatTime(next.open);
      }
    }

    statusEl.hidden = false;

    var todayKey = day === 0 ? 'sun' : day === 6 ? 'sat' : 'mon-fri';
    var todayRow = document.querySelector('.contact-hours__row[data-day="' + todayKey + '"]');
    if (todayRow) todayRow.classList.add('contact-hours__row--today');
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

  // TEMPORÄR — sichtbares Debug-Overlay für das Hero-Video-Problem auf
  // iPhone (bekannt: currentTime läuft, das Bild bleibt aber auf dem
  // Poster-Frame stehen). Konsole ist auf dem Gerät ohne Mac nicht
  // erreichbar. Entfernen, sobald die Ursache am Gerät bestätigt/behoben
  // ist — siehe gleichnamigen Zwischenstand in der Commit-Historie.
  var MEDIA_ERROR_MEANINGS = {
    1: 'MEDIA_ERR_ABORTED — Abspielen wurde abgebrochen',
    2: 'MEDIA_ERR_NETWORK — Netzwerkfehler beim Laden',
    3: 'MEDIA_ERR_DECODE — Fehler beim Dekodieren der Datei',
    4: 'MEDIA_ERR_SRC_NOT_SUPPORTED — Format/Quelle nicht unterstützt'
  };

  function createHeroVideoDebugPanel() {
    var panel = document.createElement('div');
    panel.id = 'hero-video-debug';
    panel.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'right:0', 'z-index:9999',
      'max-height:45vh', 'overflow-y:auto', 'background:#000', 'color:#fff',
      'font:11px/1.5 ui-monospace,Menlo,Consolas,monospace', 'padding:8px 10px',
      'box-sizing:border-box', 'white-space:pre-wrap', 'word-break:break-all'
    ].join(';');
    document.body.appendChild(panel);
    return function log(line) {
      var row = document.createElement('div');
      row.textContent = line;
      panel.appendChild(row);
      console.log('[hero-video]', line);
    };
  }

  /* Hero-Video: das <video> im Markup hat bewusst keine <source> — ohne
     JavaScript (oder bei reduzierter Bewegung/Data-Saver) bleibt einfach
     das poster-Bild stehen, statt Bandbreite für ein Video zu verbrauchen,
     das niemand zu sehen bekommt. Nur wenn beides erlaubt ist, hängt diese
     Funktion die echte Quelle an und versucht die Wiedergabe zu starten. */
  function initHeroVideo() {
    var video = document.getElementById('hero-video');
    var posterImg = document.getElementById('hero-poster-img');
    if (!video) return;

    var log = createHeroVideoDebugPanel();

    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var saveData = !!(navigator.connection && navigator.connection.saveData);
    log('reducedMotion=' + reducedMotion + ' saveData=' + saveData);

    if (reducedMotion || saveData) {
      log('Abbruch: Video wird entfernt, Poster-Bild wird gezeigt (reducedMotion/saveData aktiv).');
      video.remove();
      if (posterImg) posterImg.hidden = false;
      return;
    }

    var source = document.createElement('source');
    source.src = 'assets/hero.mp4';
    source.type = 'video/mp4';
    video.appendChild(source);
    log('source.src gesetzt auf: ' + source.src);
    video.load();
    log('load() aufgerufen. currentSrc=' + video.currentSrc);

    function logState(prefix) {
      var msg = prefix + ' — readyState=' + video.readyState + ' networkState=' + video.networkState +
        ' paused=' + video.paused + ' currentTime=' + video.currentTime.toFixed(2);
      if (video.error) {
        msg += ' | error.code=' + video.error.code + ' (' + (MEDIA_ERROR_MEANINGS[video.error.code] || 'unbekannt') + ')';
      }
      log(msg);
    }

    ['loadstart', 'loadedmetadata', 'canplay', 'playing', 'error', 'stalled', 'abort', 'emptied', 'suspend'].forEach(function (ev) {
      video.addEventListener(ev, function () {
        logState('event: ' + ev);
      });
    });

    // Verdacht (aus dem letzten Debug-Durchlauf): das Video dekodiert und
    // spielt tatsächlich (currentTime läuft), aber WebKit malt weiterhin
    // das poster-Bild statt der echten Frames. removeAttribute('poster')
    // erst NACH bestätigtem Start (statt blind beim Laden) — so bleibt der
    // Sofort-Effekt des Posters erhalten (kein schwarzer Rahmen vor dem
    // ersten Frame), er wird nur genau in dem Moment entfernt, in dem er
    // laut bekanntem Bug hängen bleiben könnte. { once: true } genügt,
    // das Attribut wird nur einmal gebraucht.
    video.addEventListener('playing', function () {
      if (video.hasAttribute('poster')) {
        video.removeAttribute('poster');
        log('poster-Attribut entfernt bei currentTime=' + video.currentTime.toFixed(2) + ' (Video läuft laut "playing"-Event).');
      }
    }, { once: true });

    // Live-Ticker: zeigt currentTime alle 500ms für 5s. Läuft currentTime
    // sichtbar hoch, während das Bild auf dem Gerät trotzdem stehen bleibt,
    // ist das der endgültige Beleg für einen reinen Repaint-Bug (Decode ok,
    // nur der Bildschirm zeigt es nicht) statt eines Autoplay-Problems.
    var ticks = 0;
    var ticker = setInterval(function () {
      logState('Ticker ' + (++ticks) + '/10');
      if (ticks >= 10) clearInterval(ticker);
    }, 500);

    // "Nudge"-Loop — direkte Reaktion auf den bestätigten Gerätebefund:
    // ein zufälliger DOM-Mutation-Repaint (durch das Debug-Panel selbst)
    // hat einmalig ein neues Bild erzwungen, während currentTime die ganze
    // Zeit sauber weiterlief. Das zeigt: WebKit dekodiert zuverlässig,
    // gibt die neuen Frames aber nicht von selbst an den Compositor weiter
    // — erst eine externe Layer-Invalidierung stößt das an. Dieser rAF-Loop
    // bildet genau das nach, kontinuierlich statt zufällig: er wechselt bei
    // jedem Frame zwischen zwei GPU-Layer-Zuständen (translateZ(0) und ein
    // Hundertstel Pixel versetzt), was für das Auge nicht wahrnehmbar ist,
    // WebKit aber zwingt, die Video-Ebene jedes Mal neu zu kompositieren.
    // Ersetzt damit die bisherige rein statische transform: translateZ(0)
    // aus design-tokens.css (bleibt als Basis stehen), die nur EINMAL beim
    // Layout greift und deshalb laufende Frame-Updates nicht erzwingen kann.
    // Läuft nur während echter Wiedergabe und pausiert im Hintergrund-Tab
    // (Akku); { stop } wird aktuell nicht aufgerufen, da das Video ohnehin
    // endlos loopen soll, solange die Seite offen ist.
    (function startHeroVideoNudge() {
      var toggle = false;
      log('Nudge-Loop gestartet (erzwingt fortlaufenden Compositor-Refresh).');
      function tick() {
        if (!video.paused && !document.hidden) {
          toggle = !toggle;
          var value = toggle ? 'translateZ(0.01px)' : 'translateZ(0)';
          video.style.transform = value;
          video.style.webkitTransform = value;
        }
        requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    })();

    // Manche Browser blockieren Autoplay trotz muted/playsinline (seltene
    // Ausnahmefälle). Schlägt play() fehl, bleibt einfach das poster-Bild
    // sichtbar — kein Fehler, keine Meldung für Besucher:innen.
    var playPromise = video.play();
    log('play() aufgerufen.');
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise
        .then(function () { log('play() resolved'); })
        .catch(function (err) { log('play() rejected: ' + (err && err.name) + ': ' + (err && err.message)); });
    } else {
      log('play() lieferte kein Promise (sehr alter Browser).');
    }

    // Sicherheitsnetz: manche mobilen Browser verlangen für Autoplay eine
    // (beliebige) erste Nutzer-Geste in dieser Sitzung, obwohl muted+
    // playsinline gesetzt sind — play() schlägt dann beim Laden fehl,
    // klappt aber bei erneutem Aufruf nach der Geste. Einmaliger Versuch,
    // nur falls das Video zu diesem Zeitpunkt noch pausiert ist; kein
    // Effekt, wenn Autoplay ohnehin schon lief.
    function retryPlayOnFirstGesture() {
      if (video.paused) {
        log('Erneuter play()-Versuch nach erster Nutzer-Geste.');
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

  document.addEventListener('DOMContentLoaded', function () {
    initStickyHeader();
    initMobileMenu();
    initDropdown();
    initCurrentYear();
    initTrustStats();
    initAblaufLine();
    initOpeningStatus();
    initKontaktForm();
    initHeroVideo();
  });
})();
