const roomCode = window.ROOM_CODE;

const socket = new WebSocket(`ws://${window.location.host}/ws`);

const controllerStatusElement = document.querySelector('#controllerStatus');
const buttons = document.querySelectorAll('[data-answer]');

socket.addEventListener('open', () => {
    socket.send(JSON.stringify({
        type: 'join-room',
        roomCode: roomCode,
        role: 'controller',
    }));
});

socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);

    if (message.type === 'controller-state') {
        setButtonsEnabled(message.enabled);

        if (message.enabled) {
            controllerStatusElement.textContent = 'Teď zopakuj sekvenci.';
        } else {
            controllerStatusElement.textContent = 'Čekej na zobrazení sekvence...';
        }
    }

    if (message.type === 'game-finished') {
        setButtonsEnabled(false);

        if (message.success) {
            controllerStatusElement.textContent = 'Správně! Pokračuj na další level na hlavní obrazovce.';
        } else {
            controllerStatusElement.textContent = 'Konec hry. Výsledek je na hlavní obrazovce.';
        }
    }
});

buttons.forEach((button) => {
    button.addEventListener('click', () => {
        socket.send(JSON.stringify({
            type: 'controller-answer',
            roomCode: roomCode,
            answer: button.dataset.answer,
        }));
    });
});

function setButtonsEnabled(enabled) {
    buttons.forEach((button) => {
        button.disabled = !enabled;
    });
}