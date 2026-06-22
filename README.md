# Memory Trainer

Memory Trainer je jednoduchá webová hra v Node.js na trénování paměti. Hráč si na hlavní obrazovce zapamatuje sekvenci barev a následně ji zopakuje pomocí ovladače v druhém okně nebo na mobilu.

## Funkce

- vytvoření herní místnosti
- ovladač připojený přes odkaz `/controller/:roomCode`
- real-time komunikace přes WebSockety
- postupné zobrazování barevné sekvence
- levely se zvyšující se obtížností
- výpočet skóre
- ukládání výsledků do SQLite databáze
- leaderboard nejlepších výsledků
- konfigurace levelů načítaná z JSON souboru
- základní testy herní logiky pomocí AVA

## Technologie

- Node.js
- Hono
- @hono/node-server
- @hono/node-ws
- better-sqlite3
- AVA

## Instalace

```bash
npm install
```

## Spuštění aplikace

```bash
npm run dev
```

Aplikace poběží na adrese:

```text
http://localhost:8000
```

## Spuštění testů

```bash
npm test
```

## Struktura projektu

```text
memory-trainer/
├── server.js
├── package.json
├── README.md
├── src/
│   ├── app.js
│   ├── websockets.js
│   ├── routes/
│   │   └── pages.js
│   ├── services/
│   │   └── gameService.js
│   └── db/
│       └── database.js
├── public/
│   ├── js/
│   │   ├── game.js
│   │   └── controller.js
│   └── css/
│       └── style.css
├── data/
│   └── levels.json
└── tests/
    └── gameService.test.js
```
