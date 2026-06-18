import { createNodeWebSocket } from '@hono/node-ws';
import { serve } from '@hono/node-server';

import { app } from './src/app.js';
import { webSockets } from './src/webSockets.js';

const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

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

                if (message.type === 'controller-answer') {
                    broadcastToRoom(message.roomCode, {
                        type: 'answer-received',
                        answer: message.answer,
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