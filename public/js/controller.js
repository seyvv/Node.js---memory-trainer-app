const roomCode = window.ROOM_CODE;

const socket = new WebSocket(`ws://${window.location.host}/ws`);

socket.addEventListener('open', () => {
    socket.send(JSON.stringify({
        type: 'join-room',
        roomCode: roomCode,
        role: 'controller',
    }));
});

document.querySelectorAll('[data-answer]').forEach((button) => {
    button.addEventListener('click', () => {
        socket.send(JSON.stringify({
            type: 'controller-answer',
            roomCode: roomCode,
            answer: button.dataset.answer,
        }));
    });
});