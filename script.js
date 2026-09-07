(function () {
  'use strict';

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

  /* Formular in #kontakt: standardmäßig sichtbar im Markup (funktioniert
     ohne JavaScript), wird hier erst zu einem aufklappbaren Panel mit
     Höhen-Animation. Der Submit-Handler verhindert das Absenden, weil noch
     kein Backend angebunden ist — ein scheinbar erfolgreiches Absenden ins
     Leere wäre schlimmer als kein Formular. */
  function initContactForm() {
    var trigger = document.getElementById('contact-form-trigger');
    var panel = document.getElementById('contact-form-panel');

    if (trigger && panel) {
      panel.classList.add('contact-form-panel--js');
      panel.style.maxHeight = '0px';
      panel.setAttribute('inert', '');
      trigger.setAttribute('aria-expanded', 'false');

      trigger.addEventListener('click', function () {
        var isOpen = trigger.getAttribute('aria-expanded') === 'true';

        if (isOpen) {
          panel.style.maxHeight = panel.scrollHeight + 'px';
          window.requestAnimationFrame(function () {
            panel.style.maxHeight = '0px';
          });
          panel.setAttribute('inert', '');
          trigger.setAttribute('aria-expanded', 'false');
        } else {
          panel.removeAttribute('inert');
          panel.style.maxHeight = panel.scrollHeight + 'px';
          trigger.setAttribute('aria-expanded', 'true');
        }
      });

      panel.addEventListener('transitionend', function (event) {
        if (event.propertyName !== 'max-height') return;
        if (trigger.getAttribute('aria-expanded') === 'true') {
          panel.style.maxHeight = 'none';
        }
      });
    }

    var form = document.getElementById('contact-form');
    var notice = document.getElementById('contact-form-notice');
    if (!form) return;

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (notice) notice.hidden = false;
    });
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

    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var saveData = !!(navigator.connection && navigator.connection.saveData);

    if (reducedMotion || saveData) {
      video.remove();
      if (posterImg) posterImg.hidden = false;
      return;
    }

    var source = document.createElement('source');
    source.src = '../assets/hero.mp4';
    source.type = 'video/mp4';
    video.appendChild(source);
    video.load();

    // Manche Browser blockieren Autoplay trotz muted/playsinline (seltene
    // Ausnahmefälle). Schlägt play() fehl, bleibt einfach das poster-Bild
    // sichtbar — kein Fehler, keine Meldung für Besucher:innen.
    var playPromise = video.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(function () {});
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    initStickyHeader();
    initMobileMenu();
    initDropdown();
    initCurrentYear();
    initTrustStats();
    initAblaufLine();
    initOpeningStatus();
    initContactForm();
    initHeroVideo();
  });
})();
