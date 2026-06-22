const roomCode = window.ROOM_CODE;

const statusElement = document.querySelector('#status');
const lastAnswerElement = document.querySelector('#lastAnswer');
const startGameButton = document.querySelector('#startGameButton');
const nextLevelButton = document.querySelector('#nextLevelButton');
const playerAnswersElement = document.querySelector('#playerAnswers');
const levelElement = document.querySelector('#level');
const scoreElement = document.querySelector('#score');
const instructionElement = document.querySelector('#instruction');
const colorDisplayElement = document.querySelector('#colorDisplay');
const playerNameInput = document.querySelector('#playerName');

let isControllerConnected = false;

const socket = new WebSocket(`ws://${window.location.host}/ws`);

socket.addEventListener('open', () => {
    socket.send(JSON.stringify({
        type: 'join-room',
        roomCode: roomCode,
        role: 'screen',
    }));
});

socket.addEventListener('message', async (event) => {
    const message = JSON.parse(event.data);

    if (message.type === 'user-joined' && message.role === 'controller') {
        isControllerConnected = true;

        statusElement.textContent = 'Ovladač je připojený.';
        instructionElement.textContent = 'Ovladač je připravený. Můžeš spustit hru.';
        startGameButton.disabled = false;
    }

    if (message.type === 'sequence-generated') {
        levelElement.textContent = message.level;
        scoreElement.textContent = message.score;

        playerAnswersElement.textContent = '';
        lastAnswerElement.textContent = '';
        instructionElement.textContent = 'Sleduj sekvenci barev...';

        startGameButton.hidden = true;
        nextLevelButton.hidden = true;
        playerNameInput.disabled = true;

        await playSequence(
            message.sequence,
            message.showTimeMs,
            message.pauseTimeMs
        );

        instructionElement.textContent = 'Teď zopakuj sekvenci na ovladači.';

        socket.send(JSON.stringify({
            type: 'sequence-shown',
            roomCode: roomCode,
        }));
    }

    if (message.type === 'answer-received') {
        lastAnswerElement.textContent = `Zadaná odpověď: ${translateColor(message.answer)}`;

        playerAnswersElement.textContent = message.playerAnswers
            .map((answer) => translateColor(answer))
            .join(' → ');
    }

    if (message.type === 'game-finished') {
        statusElement.textContent = message.message;
        colorDisplayElement.className = 'color-display';

        if (message.success) {
            const seconds = (message.durationMs / 1000).toFixed(2);

            scoreElement.textContent = message.totalScore;
            lastAnswerElement.textContent = `Hotovo za ${seconds} s. Body za level: ${message.roundScore}.`;
            instructionElement.textContent = 'Sekvence byla správně. Můžeš pokračovat na další level.';

            nextLevelButton.hidden = false;
        }

        if (!message.success) {
            scoreElement.textContent = message.totalScore;

            lastAnswerElement.textContent = `
                Správná sekvence: ${message.sequence.map((color) => translateColor(color)).join(' → ')}
                | Tvoje odpověď: ${message.playerAnswers.map((color) => translateColor(color)).join(' → ')}
                | Finální skóre: ${message.totalScore}
            `;

            instructionElement.textContent = 'Hra skončila. Výsledek byl uložen do leaderboardu.';

            startGameButton.textContent = 'Nová hra';
            startGameButton.hidden = false;
            nextLevelButton.hidden = true;
            playerNameInput.disabled = false;
        }
    }
});

startGameButton.addEventListener('click', () => {
    if (!isControllerConnected) {
        instructionElement.textContent = 'Nejdřív otevři ovladač.';
        return;
    }

    socket.send(JSON.stringify({
        type: 'game-start',
        roomCode: roomCode,
        playerName: playerNameInput.value.trim() || 'Hráč',
    }));
});

nextLevelButton.addEventListener('click', () => {
    socket.send(JSON.stringify({
        type: 'next-level',
        roomCode: roomCode,
    }));
});

async function playSequence(sequence, showTimeMs = 800, pauseTimeMs = 300) {
    for (const color of sequence) {
        showColor(color);
        await wait(showTimeMs);

        hideColor();
        await wait(pauseTimeMs);
    }
}

function showColor(color) {
    colorDisplayElement.className = `color-display ${color} active`;
}

function hideColor() {
    colorDisplayElement.className = 'color-display';
}

function wait(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function translateColor(color) {
    const translations = {
        red: 'červená',
        blue: 'modrá',
        green: 'zelená',
        yellow: 'žlutá',
    };

    return translations[color] || color;
}