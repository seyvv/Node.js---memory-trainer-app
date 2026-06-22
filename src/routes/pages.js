import { Hono } from 'hono';
import crypto from 'node:crypto';

export const pagesRouter = new Hono();

function generateRoomCode() {
    return crypto.randomBytes(3).toString('hex').toUpperCase();
}

pagesRouter.get('/', (c) => {
    return c.html(`
    <!DOCTYPE html>
    <html lang="cs">
    <head>
      <meta charset="UTF-8">
      <title>Memory Trainer</title>
      <link rel="stylesheet" href="/public/css/style.css">
    </head>
    <body>
      <main class="container">
        <h1>Memory Trainer</h1>
        <p>Zapamatuj si sekvenci barev a potom ji zopakuj.</p>

        <form method="POST" action="/games">
          <button type="submit">Vytvořit novou hru</button>
        </form>
      </main>
    </body>
    </html>
  `);
});

pagesRouter.post('/games', (c) => {
    const roomCode = generateRoomCode();

    return c.redirect(`/game/${roomCode}`);
});

pagesRouter.get('/game/:roomCode', (c) => {
    const roomCode = c.req.param('roomCode');

    return c.html(`
    <!DOCTYPE html>
    <html lang="cs">
    <head>
      <meta charset="UTF-8">
      <title>Memory Trainer - hra</title>
      <link rel="stylesheet" href="/public/css/style.css">
    </head>
    <body>
      <main class="container">
        <h1>Memory Trainer</h1>

        <p>Kód místnosti:</p>
        <h2>${roomCode}</h2>

        <p>Ovladač otevři v druhém tabu nebo na mobilu:</p>
        <p>
          <a href="/controller/${roomCode}" target="_blank">
            /controller/${roomCode}
          </a>
        </p>

        <section class="game-box">
            <h2 id="status">Čekám na ovladač...</h2>

            <div class="stats">
                <p>Level: <strong id="level">-</strong></p>
                <p>Skóre: <strong id="score">0</strong></p>
            </div>

            <button id="startGameButton">Start hry</button>
            <button id="nextLevelButton" hidden>Další level</button>

            <p id="instruction">Klikni na Start hry a zapamatuj si sekvenci barev.</p>

            <div id="colorDisplay" class="color-display"></div>

            <h3>Tvoje odpověď:</h3>
            <div id="playerAnswers" class="answer-list"></div>

            <p id="lastAnswer">Zatím žádná odpověď.</p>
        </section>
      </main>

      <script>
        window.ROOM_CODE = '${roomCode}';
      </script>
      <script src="/public/js/game.js"></script>
    </body>
    </html>
  `);
});

pagesRouter.get('/controller/:roomCode', (c) => {
    const roomCode = c.req.param('roomCode');

    return c.html(`
    <!DOCTYPE html>
    <html lang="cs">
    <head>
      <meta charset="UTF-8">
      <title>Memory Trainer - ovladač</title>
      <link rel="stylesheet" href="/public/css/style.css">
    </head>
    <body>
      <main class="container">
        <h1>Ovladač</h1>
        <p>Místnost: <strong>${roomCode}</strong></p>

        <div class="button-grid">
          <button data-answer="red">Červená</button>
          <button data-answer="blue">Modrá</button>
          <button data-answer="green">Zelená</button>
          <button data-answer="yellow">Žlutá</button>
        </div>
      </main>

      <script>
        window.ROOM_CODE = '${roomCode}';
      </script>
      <script src="/public/js/controller.js"></script>
    </body>
    </html>
  `);
});