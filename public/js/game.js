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
        statusElement.textContent = 'Ovladač je připojený.';
    }

    if (message.type === 'sequence-generated') {
        levelElement.textContent = message.level;
        scoreElement.textContent = message.score;

        playerAnswersElement.textContent = '';
        lastAnswerElement.textContent = '';
        instructionElement.textContent = 'Sleduj sekvenci barev...';

        startGameButton.hidden = true;
        nextLevelButton.hidden = true;

        await playSequence(message.sequence);

        instructionElement.textContent = 'Teď zopakuj sekvenci na ovladači.';
    }

    if (message.type === 'answer-received') {
        lastAnswerElement.textContent = `Poslední odpověď: ${translateColor(message.answer)}`;
        playerAnswersElement.textContent = message.playerAnswers
            .map((answer) => translateColor(answer))
            .join(' → ');

        if (!message.isCurrentAnswerCorrect) {
            lastAnswerElement.textContent = `Špatná odpověď: ${translateColor(message.answer)}`;
        }
    }

    if (message.type === 'game-finished') {
        statusElement.textContent = message.message;
        colorDisplayElement.className = 'color-display';

        if (message.success) {
            const seconds = (message.durationMs / 1000).toFixed(2);

            scoreElement.textContent = message.totalScore;
            lastAnswerElement.textContent = `Hotovo za ${seconds} s. Body za level: ${message.roundScore}.`;
            instructionElement.textContent = 'Sekvenci jsi zopakovala správně. Můžeš pokračovat na další level.';

            nextLevelButton.hidden = false;
        }

        if (!message.success) {
            scoreElement.textContent = message.totalScore;
            lastAnswerElement.textContent = `Správná sekvence byla: ${message.sequence
                .map((color) => translateColor(color))
                .join(' → ')}. Finální skóre: ${message.totalScore}.`;

            instructionElement.textContent = 'Hra skončila. Můžeš spustit novou hru.';

            startGameButton.textContent = 'Nová hra';
            startGameButton.hidden = false;
            nextLevelButton.hidden = true;
        }
    }
});

startGameButton.addEventListener('click', () => {
    socket.send(JSON.stringify({
        type: 'game-start',
        roomCode: roomCode,
    }));
});

nextLevelButton.addEventListener('click', () => {
    socket.send(JSON.stringify({
        type: 'next-level',
        roomCode: roomCode,
    }));
});

async function playSequence(sequence) {
    for (const color of sequence) {
        showColor(color);
        await wait(800);

        hideColor();
        await wait(300);
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