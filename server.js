import { createNodeWebSocket } from '@hono/node-ws';
import { serve } from '@hono/node-server';

import { app } from './src/app.js';
import { webSockets } from './src/websockets.js';

import {
    calculateScore,
    checkAnswer,
    createNewGame,
    createNextLevelGame,
} from './src/services/gameService.js';

import { saveScore } from './src/db/database.js';

const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

const games = new Map();

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
                    const game = createNewGame(message.playerName);

                    games.set(message.roomCode, game);

                    broadcastToRoom(message.roomCode, {
                        type: 'sequence-generated',
                        level: game.level,
                        score: game.score,
                        sequence: game.sequence,
                        showTimeMs: game.levelConfig.showTimeMs,
                        pauseTimeMs: game.levelConfig.pauseTimeMs,
                    });

                    broadcastToRoom(message.roomCode, {
                        type: 'controller-state',
                        enabled: false,
                    });
                }

                if (message.type === 'sequence-shown') {
                    const game = games.get(message.roomCode);

                    if (!game || game.finished) {
                        return;
                    }

                    game.canAnswer = true;

                    broadcastToRoom(message.roomCode, {
                        type: 'controller-state',
                        enabled: true,
                    });
                }

                if (message.type === 'next-level') {
                    const currentGame = games.get(message.roomCode);

                    if (!currentGame) {
                        return;
                    }

                    const nextGame = createNextLevelGame(currentGame);

                    games.set(message.roomCode, nextGame);

                    broadcastToRoom(message.roomCode, {
                        type: 'sequence-generated',
                        level: nextGame.level,
                        score: nextGame.score,
                        sequence: nextGame.sequence,
                        showTimeMs: nextGame.levelConfig.showTimeMs,
                        pauseTimeMs: nextGame.levelConfig.pauseTimeMs,
                    });

                    broadcastToRoom(message.roomCode, {
                        type: 'controller-state',
                        enabled: false,
                    });
                }

                if (message.type === 'controller-answer') {
                    const game = games.get(message.roomCode);

                    if (!game || game.finished || !game.canAnswer) {
                        return;
                    }

                    const result = checkAnswer(game, message.answer);

                    broadcastToRoom(message.roomCode, {
                        type: 'answer-received',
                        answer: message.answer,
                        playerAnswers: result.playerAnswers,
                        isCurrentAnswerCorrect: result.isCorrect,
                    });

                    if (!result.isCorrect) {
                        game.finished = true;
                        game.canAnswer = false;

                        saveScore({
                            playerName: game.playerName,
                            score: game.score,
                            maxLevel: game.maxLevel,
                        });

                        broadcastToRoom(message.roomCode, {
                            type: 'controller-state',
                            enabled: false,
                        });

                        broadcastToRoom(message.roomCode, {
                            type: 'game-finished',
                            success: false,
                            message: 'Špatná odpověď. Konec hry.',
                            sequence: game.sequence,
                            playerAnswers: game.playerAnswers,
                            level: game.level,
                            totalScore: game.score,
                            maxLevel: game.maxLevel,
                        });

                        return;
                    }

                    if (result.isLevelCompleted) {
                        game.finished = true;
                        game.canAnswer = false;

                        const finishedAt = Date.now();
                        const durationMs = finishedAt - game.startedAt;
                        const roundScore = calculateScore(game.level, durationMs);

                        game.score = game.score + roundScore;

                        broadcastToRoom(message.roomCode, {
                            type: 'controller-state',
                            enabled: false,
                        });

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
                            maxLevel: game.maxLevel,
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