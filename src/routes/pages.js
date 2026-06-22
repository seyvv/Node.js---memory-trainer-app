import { Hono } from 'hono';
import crypto from 'node:crypto';

import { getLeaderboard } from '../db/database.js';

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
        <p>Zapamatuj si sekvenci barev a potom ji zopakuj na ovladači.</p>

        <form method="POST" action="/games">
          <button type="submit">Vytvořit novou hru</button>
        </form>

        <p>
          <a href="/leaderboard">Zobrazit leaderboard</a>
        </p>
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

          <label for="playerName">Jméno hráče:</label>
          <input id="playerName" type="text" value="Hráč" maxlength="30">

          <div class="stats">
            <p>Level: <strong id="level">-</strong></p>
            <p>Skóre: <strong id="score">0</strong></p>
          </div>

          <button id="startGameButton" disabled>Start hry</button>
          <button id="nextLevelButton" hidden>Další level</button>

          <p id="instruction">Klikni na Start hry a zapamatuj si sekvenci barev.</p>

          <div id="colorDisplay" class="color-display"></div>

          <h3>Tvoje odpověď:</h3>
          <div id="playerAnswers" class="answer-list"></div>

          <p id="lastAnswer">Zatím žádná odpověď.</p>
        </section>

        <p>
          <a href="/leaderboard">Leaderboard</a>
        </p>
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
      <main class="container controller-container">
        <h1>Ovladač</h1>
        <p>Místnost: <strong>${roomCode}</strong></p>
        <p id="controllerStatus">Čekám na začátek hry...</p>

        <div class="button-grid">
          <button class="color-button red-button" data-answer="red" disabled>Červená</button>
          <button class="color-button blue-button" data-answer="blue" disabled>Modrá</button>
          <button class="color-button green-button" data-answer="green" disabled>Zelená</button>
          <button class="color-button yellow-button" data-answer="yellow" disabled>Žlutá</button>
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

pagesRouter.get('/leaderboard', (c) => {
    const results = getLeaderboard(10);

    const rows = results.map((result, index) => {
        return `
            <tr>
                <td>${index + 1}</td>
                <td>${escapeHtml(result.player_name)}</td>
                <td>${result.score}</td>
                <td>${result.max_level}</td>
                <td>${new Date(result.created_at).toLocaleString('cs-CZ')}</td>
            </tr>
        `;
    }).join('');

    return c.html(`
    <!DOCTYPE html>
    <html lang="cs">
    <head>
      <meta charset="UTF-8">
      <title>Memory Trainer - leaderboard</title>
      <link rel="stylesheet" href="/public/css/style.css">
    </head>
    <body>
      <main class="container">
        <h1>Leaderboard</h1>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Hráč</th>
              <th>Skóre</th>
              <th>Max level</th>
              <th>Datum</th>
            </tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="5">Zatím nejsou žádné výsledky.</td></tr>'}
          </tbody>
        </table>

        <p>
          <a href="/">Zpět na úvod</a>
        </p>
      </main>
    </body>
    </html>
  `);
});

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}