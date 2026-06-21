const roomCode = window.ROOM_CODE;

const statusElement = document.querySelector('#status');
const lastAnswerElement = document.querySelector('#lastAnswer');
const startGameButton = document.querySelector('#startGameButton');
const sequenceElement = document.querySelector('#sequence');
const playerAnswersElement = document.querySelector('#playerAnswers');

const socket = new WebSocket(`ws://${window.location.host}/ws`);

socket.addEventListener('open', () => {
    socket.send(JSON.stringify({
        type: 'join-room',
        roomCode: roomCode,
        role: 'screen',
    }));
});

socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);

    if (message.type === 'user-joined' && message.role === 'controller') {
        statusElement.textContent = 'Ovladač je připojený.';
    }

    if (message.type === 'sequence-generated') {
        sequenceElement.textContent = message.sequence.join(' → ');
        playerAnswersElement.textContent = '';
        lastAnswerElement.textContent = 'Sekvence vygenerována. Teď ji zopakuj na ovladači.';
    }

    if (message.type === 'answer-received') {
        lastAnswerElement.textContent = `Poslední odpověď: ${message.answer}`;
        playerAnswersElement.textContent = message.playerAnswers.join(' → ');
    }
});

startGameButton.addEventListener('click', () => {
    socket.send(JSON.stringify({
        type: 'game-start',
        roomCode: roomCode,
    }));
});