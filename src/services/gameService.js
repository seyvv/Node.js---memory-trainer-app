import fs from 'node:fs';
import path from 'node:path';

const colors = ['red', 'blue', 'green', 'yellow'];

const levelsPath = path.join(process.cwd(), 'data', 'levels.json');

export function loadLevels() {
    const fileContent = fs.readFileSync(levelsPath, 'utf-8');
    return JSON.parse(fileContent);
}

export function getLevelConfig(level) {
    const levels = loadLevels();

    const levelConfig = levels.find((item) => item.level === level);

    if (levelConfig) {
        return levelConfig;
    }

    const lastLevel = levels[levels.length - 1];

    return {
        level: level,
        sequenceLength: lastLevel.sequenceLength + (level - lastLevel.level),
        showTimeMs: Math.max(350, lastLevel.showTimeMs - 30),
        pauseTimeMs: Math.max(120, lastLevel.pauseTimeMs - 20),
    };
}

export function generateSequence(length) {
    const sequence = [];

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * colors.length);
        sequence.push(colors[randomIndex]);
    }

    return sequence;
}

export function calculateScore(level, durationMs) {
    const basePoints = level * 100;
    const timeBonus = Math.max(0, 1000 - Math.floor(durationMs / 10));

    return basePoints + timeBonus;
}

export function createNewGame(playerName = 'Hráč') {
    const level = 1;
    const levelConfig = getLevelConfig(level);

    return {
        playerName: playerName || 'Hráč',
        level: level,
        score: 0,
        maxLevel: 1,
        sequence: generateSequence(levelConfig.sequenceLength),
        playerAnswers: [],
        startedAt: Date.now(),
        finished: false,
        canAnswer: false,
        levelConfig: levelConfig,
    };
}

export function createNextLevelGame(previousGame) {
    const nextLevel = previousGame.level + 1;
    const levelConfig = getLevelConfig(nextLevel);

    return {
        playerName: previousGame.playerName,
        level: nextLevel,
        score: previousGame.score,
        maxLevel: nextLevel,
        sequence: generateSequence(levelConfig.sequenceLength),
        playerAnswers: [],
        startedAt: Date.now(),
        finished: false,
        canAnswer: false,
        levelConfig: levelConfig,
    };
}

export function checkAnswer(game, answer) {
    game.playerAnswers.push(answer);

    const currentIndex = game.playerAnswers.length - 1;
    const expectedAnswer = game.sequence[currentIndex];
    const isCorrect = answer === expectedAnswer;

    return {
        isCorrect: isCorrect,
        expectedAnswer: expectedAnswer,
        playerAnswers: game.playerAnswers,
        isLevelCompleted: isCorrect && game.playerAnswers.length === game.sequence.length,
    };
}