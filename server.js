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

function calculateScore(level, durationMs) {
    const basePoints = level * 100;
    const timeBonus = Math.max(0, 1000 - Math.floor(durationMs / 10));

    return basePoints + timeBonus;
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
                    const level = 1;
                    const sequence = generateSequence(level + 2);

                    games.set(message.roomCode, {
                        level: level,
                        score: 0,
                        sequence: sequence,
                        playerAnswers: [],
                        startedAt: Date.now(),
                        finished: false,
                    });

                    broadcastToRoom(message.roomCode, {
                        type: 'sequence-generated',
                        level: level,
                        score: 0,
                        sequence: sequence,
                    });
                }

                if (message.type === 'next-level') {
                    const game = games.get(message.roomCode);

                    if (!game) {
                        return;
                    }

                    const nextLevel = game.level + 1;
                    const sequence = generateSequence(nextLevel + 2);

                    games.set(message.roomCode, {
                        level: nextLevel,
                        score: game.score,
                        sequence: sequence,
                        playerAnswers: [],
                        startedAt: Date.now(),
                        finished: false,
                    });

                    broadcastToRoom(message.roomCode, {
                        type: 'sequence-generated',
                        level: nextLevel,
                        score: game.score,
                        sequence: sequence,
                    });
                }

                if (message.type === 'controller-answer') {
                    const game = games.get(message.roomCode);

                    if (!game) {
                        return;
                    }

                    if (game.finished) {
                        return;
                    }

                    game.playerAnswers.push(message.answer);

                    const currentIndex = game.playerAnswers.length - 1;
                    const expectedAnswer = game.sequence[currentIndex];
                    const isCurrentAnswerCorrect = message.answer === expectedAnswer;

                    broadcastToRoom(message.roomCode, {
                        type: 'answer-received',
                        answer: message.answer,
                        playerAnswers: game.playerAnswers,
                        isCurrentAnswerCorrect: isCurrentAnswerCorrect,
                    });

                    if (!isCurrentAnswerCorrect) {
                        game.finished = true;

                        broadcastToRoom(message.roomCode, {
                            type: 'game-finished',
                            success: false,
                            message: 'Špatná odpověď. Konec hry.',
                            sequence: game.sequence,
                            playerAnswers: game.playerAnswers,
                            level: game.level,
                            totalScore: game.score,
                        });

                        return;
                    }

                    if (game.playerAnswers.length === game.sequence.length) {
                        game.finished = true;

                        const finishedAt = Date.now();
                        const durationMs = finishedAt - game.startedAt;
                        const roundScore = calculateScore(game.level, durationMs);

                        game.score = game.score + roundScore;

                        broadcastToRoom(message.roomCode, {
                            type: 'game-finished',
                            success: true,
                            message: 'Správně! Můžeš pokračovat na další level.',
                            sequence: game.sequence,
                            playerAnswers: game.playerAnswers,
                            durationMs: durationMs,
                            level: game.level,
                            roundScore: roundScore,
                            totalScore: game.score,
                        });
                    }
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