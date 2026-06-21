import { createNodeWebSocket } from '@hono/node-ws';
import { serve } from '@hono/node-server';

import { app } from './src/app.js';
import { webSockets } from './src/websockets.js';

const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

const games = new Map();

const colors = ['red', 'blue', 'green', 'yellow'];

function generateSequence(length = 4) {
    const sequence = [];

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * colors.length);
        sequence.push(colors[randomIndex]);
    }

    return sequence;
}

app.get(
    '/ws',
    upgradeWebSocket((c) => ({
        onOpen: (evt, ws) => {
            webSockets.set(ws, {
                roomCode: null,
                role: null,
            });

            console.log('open web sockets:', webSockets.size);
        },

        onMessage: (evt, ws) => {
            try {
                const message = JSON.parse(evt.data);

                if (message.type === 'join-room') {
                    webSockets.set(ws, {
                        roomCode: message.roomCode,
                        role: message.role,
                    });

                    broadcastToRoom(message.roomCode, {
                        type: 'user-joined',
                        role: message.role,
                    });
                }

                if (message.type === 'game-start') {
                    const sequence = generateSequence(4);

                    games.set(message.roomCode, {
                        sequence: sequence,
                        playerAnswers: [],
                        startedAt: Date.now(),
                    });

                    broadcastToRoom(message.roomCode, {
                        type: 'sequence-generated',
                        sequence: sequence,
                    });
                }

                if (message.type === 'controller-answer') {
                    const game = games.get(message.roomCode);

                    if (!game) {
                        return;
                    }

                    game.playerAnswers.push(message.answer);

                    broadcastToRoom(message.roomCode, {
                        type: 'answer-received',
                        answer: message.answer,
                        playerAnswers: game.playerAnswers,
                    });
                }
            } catch (error) {
                console.error(error);
            }
        },

        onClose: (evt, ws) => {
            webSockets.delete(ws);
            console.log('close web socket:', webSockets.size);
        },
    })),
);

function broadcastToRoom(roomCode, data) {
    for (const [ws, meta] of webSockets.entries()) {
        if (meta.roomCode === roomCode) {
            ws.send(JSON.stringify(data));
        }
    }
}

const server = serve(
    {
        fetch: app.fetch,
        port: 8000,
    },
    (info) => {
        console.log(`Server started on http://localhost:${info.port}`);
    },
);

injectWebSocket(server);