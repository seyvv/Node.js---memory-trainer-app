import test from 'ava';

import {
    calculateScore,
    checkAnswer,
    createNewGame,
    createNextLevelGame,
    generateSequence,
    getLevelConfig,
    loadLevels,
} from '../src/services/gameService.js';

test('loadLevels načte konfiguraci levelů ze souboru', (t) => {
    const levels = loadLevels();

    t.true(Array.isArray(levels));
    t.true(levels.length > 0);

    t.true(Object.hasOwn(levels[0], 'level'));
    t.true(Object.hasOwn(levels[0], 'sequenceLength'));
    t.true(Object.hasOwn(levels[0], 'showTimeMs'));
    t.true(Object.hasOwn(levels[0], 'pauseTimeMs'));
});

test('getLevelConfig vrátí konfiguraci existujícího levelu', (t) => {
    const levelConfig = getLevelConfig(1);

    t.is(levelConfig.level, 1);
    t.is(levelConfig.sequenceLength, 3);
    t.true(levelConfig.showTimeMs > 0);
    t.true(levelConfig.pauseTimeMs > 0);
});

test('generateSequence vytvoří sekvenci požadované délky', (t) => {
    const sequence = generateSequence(5);

    t.is(sequence.length, 5);
});

test('generateSequence používá pouze povolené barvy', (t) => {
    const sequence = generateSequence(20);
    const allowedColors = ['red', 'blue', 'green', 'yellow'];

    for (const color of sequence) {
        t.true(allowedColors.includes(color));
    }
});

test('calculateScore vrátí vyšší skóre pro vyšší level při stejném čase', (t) => {
    const levelOneScore = calculateScore(1, 1000);
    const levelTwoScore = calculateScore(2, 1000);

    t.true(levelTwoScore > levelOneScore);
});

test('createNewGame vytvoří novou hru na levelu 1', (t) => {
    const game = createNewGame('Veronika');

    t.is(game.playerName, 'Veronika');
    t.is(game.level, 1);
    t.is(game.score, 0);
    t.is(game.maxLevel, 1);
    t.is(game.sequence.length, 3);
    t.deepEqual(game.playerAnswers, []);
    t.false(game.finished);
    t.false(game.canAnswer);
});

test('createNewGame použije výchozí jméno, pokud není zadané', (t) => {
    const game = createNewGame('');

    t.is(game.playerName, 'Hráč');
});

test('createNextLevelGame zvýší level a zachová skóre', (t) => {
    const firstGame = createNewGame('Veronika');
    firstGame.score = 500;

    const nextGame = createNextLevelGame(firstGame);

    t.is(nextGame.playerName, 'Veronika');
    t.is(nextGame.level, 2);
    t.is(nextGame.score, 500);
    t.is(nextGame.maxLevel, 2);
    t.is(nextGame.sequence.length, 4);
    t.deepEqual(nextGame.playerAnswers, []);
});

test('checkAnswer vyhodnotí správnou odpověď', (t) => {
    const game = {
        sequence: ['red', 'blue', 'green'],
        playerAnswers: [],
    };

    const result = checkAnswer(game, 'red');

    t.true(result.isCorrect);
    t.is(result.expectedAnswer, 'red');
    t.deepEqual(result.playerAnswers, ['red']);
    t.false(result.isLevelCompleted);
});

test('checkAnswer vyhodnotí špatnou odpověď', (t) => {
    const game = {
        sequence: ['red', 'blue', 'green'],
        playerAnswers: [],
    };

    const result = checkAnswer(game, 'yellow');

    t.false(result.isCorrect);
    t.is(result.expectedAnswer, 'red');
    t.deepEqual(result.playerAnswers, ['yellow']);
    t.false(result.isLevelCompleted);
});

test('checkAnswer pozná dokončení levelu', (t) => {
    const game = {
        sequence: ['red', 'blue'],
        playerAnswers: ['red'],
    };

    const result = checkAnswer(game, 'blue');

    t.true(result.isCorrect);
    t.deepEqual(result.playerAnswers, ['red', 'blue']);
    t.true(result.isLevelCompleted);
});