# Fahrstation Düsseldorf — GitHub-Pages-Spiegel

Dies ist **kein** eigenständiges Projekt. Die Quelle dieser Website liegt in
[`aymanoul/Ayman`](https://github.com/aymanoul/Ayman), Branch
`claude/practical-wright-d1vge6`, Ordner `site/` und `assets/`.

Dieses Repository dient ausschließlich als eigener, unabhängiger
GitHub-Pages-Slot für die Fahrstation-Website (parallel zum
Vercel-Deployment unter https://ayman-one.vercel.app/, als robusterer
Ersatz, solange dieses kaputt ist). Der Inhalt hier wird bei jeder
Änderung an der Quelle manuell neu erzeugt und übertragen — nicht direkt
hier bearbeiten, Änderungen gehen bei der nächsten Synchronisierung
verloren.

## Warum nicht einfach der Ordner `site/` direkt?

GitHub Pages kann keinen beliebigen Unterordner als Quelle verwenden (nur
`/` oder `/docs`) und löst anders als Vercel keine "cleanen" URLs wie
`/klasse-b` automatisch auf. Deshalb ist die Struktur hier leicht
umgebaut: jede Unterseite liegt in einem eigenen Ordner mit `index.html`
darin (`klasse-b.html` → `klasse-b/index.html`), damit `/klasse-b` genauso
funktioniert wie auf der eigentlichen Vercel-Seite — ganz ohne die
Original-Struktur in `aymanoul/Ayman` zu verändern.

## Live-URL

https://aymanoul.github.io/fahrstation-/
