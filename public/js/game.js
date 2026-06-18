const roomCode = window.ROOM_CODE;

const statusElement = document.querySelector('#status');
const lastAnswerElement = document.querySelector('#lastAnswer');

const socket = new WebSocket(`ws://${window.location.host}/ws`);

socket.addEventListener('open', () => {
    socket.send(JSON.stringify({
        type: 'join-room',
        roomCode,
        role: 'screen',
    }));
});

socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);

    if (message.type === 'user-joined' && message.role === 'controller') {
        statusElement.textContent = 'Ovladač je připojený.';
    }

    if (message.type === 'answer-received') {
        lastAnswerElement.textContent = `Poslední odpověď: ${message.answer}`;
    }
});