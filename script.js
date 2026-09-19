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

    // Live-Ticker: zeigt currentTime alle 500ms für 5s. Läuft currentTime
    // sichtbar hoch, während das Bild auf dem Gerät trotzdem stehen bleibt,
    // ist das der endgültige Beleg für einen reinen Repaint-Bug (Decode ok,
    // nur der Bildschirm zeigt es nicht) statt eines Autoplay-Problems.
    var ticks = 0;
    var ticker = setInterval(function () {
      logState('Ticker ' + (++ticks) + '/10');
      if (ticks >= 10) clearInterval(ticker);
    }, 500);

    // --- Canvas-Eskalation ---------------------------------------------
    // Vorherige Ansätze — isolation: isolate, Scrim als echte Geschwister-
    // Elemente statt Pseudo-Elemente, zwei Nudge-Loop-Varianten
    // (transform- bzw. will-change-Toggle) — wurden alle am Gerät
    // getestet und haben nicht geholfen: das Video dekodiert nachweislich
    // (currentTime lief immer sauber), WebKit gab die neuen Frames aber
    // nie von selbst an den Compositor weiter. Diese Eskalation umgeht
    // das Problem, statt es zu reparieren: statt das <video> selbst
    // anzuzeigen, wird jedes Frame aktiv per drawImage() in ein <canvas>
    // gezeichnet. Das Video bleibt die unsichtbare Dekodier-Quelle
    // (opacity: 0, NICHT display:none/visibility:hidden — beide können
    // auf manchen Geräten die Dekodierung selbst pausieren), das <canvas>
    // übernimmt die sichtbare Darstellung.
    //
    // Sicherheitsnetz ist kein Sonderfall-Code, sondern die Reihenfolge
    // selbst: das <video> bleibt mit seinem poster-Attribut sichtbar, bis
    // der ERSTE Frame erfolgreich gezeichnet wurde — erst dann wird
    // video.style.opacity auf 0 gesetzt. Schlägt irgendetwas fehl (kein
    // 2D-Context, Video lädt nie, kein Frame kommt je an), passiert dieser
    // Schritt einfach nie — das Poster bleibt stehen, kein kaputter oder
    // leerer Zustand.
    var canvas = document.createElement('canvas');
    canvas.className = 'hero-section__video';
    canvas.setAttribute('aria-hidden', 'true');
    var ctx = canvas.getContext && canvas.getContext('2d');

    if (!ctx) {
      log('Canvas-2D-Context nicht verfügbar — Video bleibt mit Poster sichtbar (Fallback).');
      // Ohne Canvas gibt es keine Sichtbarkeits-/Play-Steuerung weiter
      // unten — hier also der normale direkte Play-Versuch wie zuvor.
      var fallbackPlayPromise = video.play();
      log('play() aufgerufen (Canvas-Fallback-Pfad).');
      if (fallbackPlayPromise && typeof fallbackPlayPromise.catch === 'function') {
        fallbackPlayPromise
          .then(function () { log('play() resolved'); })
          .catch(function (err) { log('play() rejected: ' + (err && err.name) + ': ' + (err && err.message)); });
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
      log('Canvas erzeugt und eingefügt.');

      var box = video.parentElement; // .hero-section
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var hasDrawnFirstFrame = false;
      var shouldPlay = false; // kombiniert Sichtbarkeit + Vordergrund
      var supportsRVFC = 'requestVideoFrameCallback' in video;
      log('requestVideoFrameCallback unterstützt: ' + supportsRVFC);

      function resizeCanvas() {
        var w = Math.round(box.clientWidth * dpr);
        var h = Math.round(box.clientHeight * dpr);
        // ResizeObserver feuert nach observe() immer einmal sofort zusätzlich
        // zu diesem ersten manuellen Aufruf — ohne den Gleichheits-Check gäbe
        // es beim Start zwei identische Log-Zeilen im Debug-Panel.
        if (w === canvas.width && h === canvas.height) return;
        canvas.width = w;
        canvas.height = h;
        log('Canvas-Größe: ' + w + 'x' + h + ' (dpr=' + dpr + ')');
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
          log('Erster Frame gezeichnet — Video (mit Poster) ausgeblendet, Canvas übernimmt.');
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
          log('Sichtbar + Vordergrund — play() + Zeichenschleife.');
          var p = video.play();
          if (p && typeof p.catch === 'function') {
            p.catch(function (err) { log('play() rejected: ' + (err && err.name) + ': ' + (err && err.message)); });
          }
          scheduleNextFrame();
        } else {
          log('Unsichtbar oder Hintergrund — pause() (Akku/CPU).');
          video.pause();
        }
      }

      var intersectionObserver = new IntersectionObserver(function (entries) {
        heroVisible = entries[0].isIntersecting;
        log('IntersectionObserver: heroVisible=' + heroVisible);
        updatePlayState();
      }, { threshold: 0 });
      intersectionObserver.observe(box);

      document.addEventListener('visibilitychange', function () {
        pageVisible = !document.hidden;
        log('visibilitychange: pageVisible=' + pageVisible);
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
