"use strict";

/*
    Jeu du Songo - Version locale

    Organisation du plateau :
    - Chaque joueur possède 7 cases.
    - Les tableaux nord et sud utilisent les indices 0 à 6.
    - L'indice 0 correspond à la case numéro 1.
    - L'indice 6 correspond à la case numéro 7.
*/

const INITIAL_SEEDS = 5;
const NUMBER_OF_PITS = 7;
const WINNING_SCORE = 40;
const MIN_SEEDS_ON_BOARD = 10;

const firstPlayer = drawStartingPlayer();

let game = {
    nord: [5, 5, 5, 5, 5, 5, 5],
    sud: [5, 5, 5, 5, 5, 5, 5],
    scoreNord: 0,
    scoreSud: 0,
    currentPlayer: firstPlayer,
    winner: null,
    gameOver: false,
    message: `Tirage au sort : ${firstPlayer} commence la partie.`
};

const northRow = document.getElementById("northRow");
const southRow = document.getElementById("southRow");
const scoreNordElement = document.getElementById("scoreNord");
const scoreSudElement = document.getElementById("scoreSud");
const currentPlayerElement = document.getElementById("currentPlayer");
const messageElement = document.getElementById("message");
const resetButton = document.getElementById("resetButton");

function drawStartingPlayer() {
    return Math.random() < 0.5 ? "SUD" : "NORD";
}

function resetGame() {
    const firstPlayer = drawStartingPlayer();

    game = {
        nord: Array(NUMBER_OF_PITS).fill(INITIAL_SEEDS),
        sud: Array(NUMBER_OF_PITS).fill(INITIAL_SEEDS),
        scoreNord: 0,
        scoreSud: 0,
        currentPlayer: firstPlayer,
        winner: null,
        gameOver: false,
        message: `Nouvelle partie. Tirage au sort : ${firstPlayer} commence.`
    };

    renderGame();
}

function renderGame() {
    northRow.innerHTML = "";
    southRow.innerHTML = "";

    renderRow("NORD", game.nord, northRow);
    renderRow("SUD", game.sud, southRow);

    scoreNordElement.textContent = game.scoreNord;
    scoreSudElement.textContent = game.scoreSud;
    currentPlayerElement.textContent = game.gameOver ? "Partie terminée" : game.currentPlayer;
    messageElement.textContent = game.message;
}

function renderRow(player, pits, container) {
    for (let i = 0; i < NUMBER_OF_PITS; i++) {
        const button = document.createElement("button");

        button.className = "pit";
        button.textContent = pits[i];
        button.title = `${player} - Case ${i + 1}`;

        const isCurrentPlayer = game.currentPlayer === player;
        const isEmpty = pits[i] === 0;

        if (!isCurrentPlayer || isEmpty || game.gameOver) {
            button.classList.add("disabled");
            button.disabled = true;
        } else {
            button.classList.add("active");
            button.disabled = false;
            button.addEventListener("click", function () {
                playMove(player, i);
            });
        }

        container.appendChild(button);
    }
}

function playMove(player, pitIndex) {
    if (game.gameOver) {
        return;
    }

    if (player !== game.currentPlayer) {
        game.message = "Ce n'est pas votre tour.";
        renderGame();
        return;
    }

    const playerPits = getPlayerPits(player);

    if (playerPits[pitIndex] === 0) {
        game.message = "Cette case est vide. Choisissez une autre case.";
        renderGame();
        return;
    }

    const validation = validateMove(player, pitIndex);

    if (!validation.valid) {
        game.message = validation.message;
        renderGame();
        return;
    }

    const selectedSeeds = playerPits[pitIndex];

    const sowResult = sowSeeds(player, pitIndex);
    const capturedSeeds = captureSeeds(player, sowResult.lastPit, selectedSeeds);

    if (player === "SUD") {
        game.scoreSud += capturedSeeds;
    } else {
        game.scoreNord += capturedSeeds;
    }

    checkEndGame();

    if (!game.gameOver) {
        game.currentPlayer = getOpponent(player);
        game.message = buildMoveMessage(player, pitIndex, capturedSeeds);
        checkIfCurrentPlayerCanPlay();
    }

    renderGame();
}

function validateMove(player, pitIndex) {
    const playerPits = getPlayerPits(player);
    const opponent = getOpponent(player);
    const opponentPits = getPlayerPits(opponent);

    if (playerPits[pitIndex] <= 0) {
        return {
            valid: false,
            message: "Coup invalide : la case choisie est vide."
        };
    }

    const seedsGiven = countSeedsGivenToOpponent(player, pitIndex);
    const opponentIsEmpty = sumArray(opponentPits) === 0;

    if (opponentIsEmpty) {
        const allPossibleMoves = getNonEmptyPits(player);
        const possibleGifts = allPossibleMoves.map(index => countSeedsGivenToOpponent(player, index));
        const maxGift = Math.max(...possibleGifts);

        if (maxGift === 0) {
            endGameBecauseNoSolidarity(player);
            return {
                valid: false,
                message: "Solidarité impossible. La partie est terminée."
            };
        }

        if (maxGift >= 7 && seedsGiven < 7) {
            return {
                valid: false,
                message: "Règle de solidarité : vous devez donner au moins 7 graines à l'adversaire si possible."
            };
        }

        if (maxGift < 7 && seedsGiven !== maxGift) {
            return {
                valid: false,
                message: `Règle de solidarité : vous devez donner le maximum possible, c'est-à-dire ${maxGift} graine(s).`
            };
        }

        return {
            valid: true,
            message: "Coup valide par solidarité."
        };
    }

    if (pitIndex === 6 && (seedsGiven === 1 || seedsGiven === 2)) {
        return {
            valid: false,
            message: "Coup interdit : avec la case 7, on ne peut pas semer seulement 1 ou 2 graines chez l'adversaire."
        };
    }

    return {
        valid: true,
        message: "Coup valide."
    };
}

function sowSeeds(player, pitIndex) {
    const route = getRoute(player);
    const startPosition = findPositionInRoute(route, player, pitIndex);
    const startPit = route[startPosition];

    let seeds = getPitValue(startPit.player, startPit.index);
    setPitValue(startPit.player, startPit.index, 0);

    let currentPosition = startPosition;
    let lastPosition = startPosition;

    while (seeds > 0) {
        currentPosition = (currentPosition + 1) % route.length;

        const currentPit = route[currentPosition];

        const isOriginalPit =
            currentPit.player === player &&
            currentPit.index === pitIndex;

        if (isOriginalPit) {
            continue;
        }

        setPitValue(
            currentPit.player,
            currentPit.index,
            getPitValue(currentPit.player, currentPit.index) + 1
        );

        lastPosition = currentPosition;
        seeds--;
    }

    return {
        route: route,
        lastPosition: lastPosition,
        lastPit: route[lastPosition]
    };
}

function captureSeeds(player, lastPit, seedsPlayed) {
    const opponent = getOpponent(player);

    if (lastPit.player !== opponent) {
        return 0;
    }

    /*
        Règle spéciale :
        Si la dernière graine tombe dans la case 1 adverse
        après au moins un tour complet, on ne prend qu'une seule graine :
        la dernière graine déposée.
    */
    if (lastPit.index === 0 && seedsPlayed >= 14) {
        const currentValue = getPitValue(opponent, 0);

        if (currentValue > 0) {
            setPitValue(opponent, 0, currentValue - 1);
            return 1;
        }

        return 0;
    }

    /*
        Règle normale :
        Si la dernière graine tombe directement dans la case 1 adverse
        sans tour complet, il n'y a pas de capture.
    */
    if (lastPit.index === 0) {
        return 0;
    }

    const capturedIndexes = [];

    for (let i = lastPit.index; i >= 0; i--) {
        const value = getPitValue(opponent, i);

        if (value === 2 || value === 3 || value === 4) {
            capturedIndexes.push(i);
        } else {
            break;
        }
    }

    if (capturedIndexes.length === 0) {
        return 0;
    }

    const opponentSeedsBeforeCapture = sumArray(getPlayerPits(opponent));

    let totalCaptured = 0;

    for (const index of capturedIndexes) {
        totalCaptured += getPitValue(opponent, index);
    }

    /*
        On interdit une capture qui vide complètement
        le camp adverse.
    */
    if (opponentSeedsBeforeCapture - totalCaptured === 0) {
        return 0;
    }

    for (const index of capturedIndexes) {
        setPitValue(opponent, index, 0);
    }

    return totalCaptured;
}

function checkEndGame() {
    if (game.scoreSud >= WINNING_SCORE) {
        game.gameOver = true;
        game.winner = "SUD";
        game.message = "Partie terminée. SUD gagne avec au moins 40 graines.";
        return;
    }

    if (game.scoreNord >= WINNING_SCORE) {
        game.gameOver = true;
        game.winner = "NORD";
        game.message = "Partie terminée. NORD gagne avec au moins 40 graines.";
        return;
    }

    const totalSeedsOnBoard = sumArray(game.sud) + sumArray(game.nord);

    if (totalSeedsOnBoard < MIN_SEEDS_ON_BOARD) {
        game.scoreSud += sumArray(game.sud);
        game.scoreNord += sumArray(game.nord);

        game.sud = Array(NUMBER_OF_PITS).fill(0);
        game.nord = Array(NUMBER_OF_PITS).fill(0);

        game.gameOver = true;

        if (game.scoreSud > game.scoreNord) {
            game.winner = "SUD";
            game.message = "Partie terminée : il reste moins de 10 graines. SUD gagne.";
        } else if (game.scoreNord > game.scoreSud) {
            game.winner = "NORD";
            game.message = "Partie terminée : il reste moins de 10 graines. NORD gagne.";
        } else {
            game.winner = "ÉGALITÉ";
            game.message = "Partie terminée : égalité.";
        }
    }
}

function checkIfCurrentPlayerCanPlay() {
    const currentPits = getPlayerPits(game.currentPlayer);

    if (sumArray(currentPits) === 0) {
        game.gameOver = true;

        collectRemainingSeeds();

        if (game.scoreSud > game.scoreNord) {
            game.winner = "SUD";
            game.message = `${game.currentPlayer} ne peut plus jouer. SUD gagne.`;
        } else if (game.scoreNord > game.scoreSud) {
            game.winner = "NORD";
            game.message = `${game.currentPlayer} ne peut plus jouer. NORD gagne.`;
        } else {
            game.winner = "ÉGALITÉ";
            game.message = `${game.currentPlayer} ne peut plus jouer. Partie nulle.`;
        }
    }
}

function endGameBecauseNoSolidarity(player) {
    collectRemainingSeeds();
    game.gameOver = true;

    if (game.scoreSud > game.scoreNord) {
        game.winner = "SUD";
        game.message = "Partie terminée : solidarité impossible. SUD gagne.";
    } else if (game.scoreNord > game.scoreSud) {
        game.winner = "NORD";
        game.message = "Partie terminée : solidarité impossible. NORD gagne.";
    } else {
        game.winner = "ÉGALITÉ";
        game.message = "Partie terminée : solidarité impossible. Égalité.";
    }
}

function collectRemainingSeeds() {
    game.scoreSud += sumArray(game.sud);
    game.scoreNord += sumArray(game.nord);

    game.sud = Array(NUMBER_OF_PITS).fill(0);
    game.nord = Array(NUMBER_OF_PITS).fill(0);
}

function countSeedsGivenToOpponent(player, pitIndex) {
    const simulatedGame = {
        nord: [...game.nord],
        sud: [...game.sud]
    };

    const route = getRoute(player);
    const startPosition = findPositionInRoute(route, player, pitIndex);
    const startPit = route[startPosition];

    let seeds = simulatedGame[startPit.player.toLowerCase()][startPit.index];
    simulatedGame[startPit.player.toLowerCase()][startPit.index] = 0;

    let currentPosition = startPosition;
    let seedsGiven = 0;
    const opponent = getOpponent(player);

    while (seeds > 0) {
        currentPosition = (currentPosition + 1) % route.length;

        const currentPit = route[currentPosition];

        const isOriginalPit =
            currentPit.player === player &&
            currentPit.index === pitIndex;

        if (isOriginalPit) {
            continue;
        }

        simulatedGame[currentPit.player.toLowerCase()][currentPit.index]++;

        if (currentPit.player === opponent) {
            seedsGiven++;
        }

        seeds--;
    }

    return seedsGiven;
}

function getRoute(player) {
    if (player === "SUD") {
        return [
            { player: "SUD", index: 6 },
            { player: "SUD", index: 5 },
            { player: "SUD", index: 4 },
            { player: "SUD", index: 3 },
            { player: "SUD", index: 2 },
            { player: "SUD", index: 1 },
            { player: "SUD", index: 0 },

            { player: "NORD", index: 0 },
            { player: "NORD", index: 1 },
            { player: "NORD", index: 2 },
            { player: "NORD", index: 3 },
            { player: "NORD", index: 4 },
            { player: "NORD", index: 5 },
            { player: "NORD", index: 6 }
        ];
    }

    return [
        { player: "NORD", index: 6 },
        { player: "NORD", index: 5 },
        { player: "NORD", index: 4 },
        { player: "NORD", index: 3 },
        { player: "NORD", index: 2 },
        { player: "NORD", index: 1 },
        { player: "NORD", index: 0 },

        { player: "SUD", index: 0 },
        { player: "SUD", index: 1 },
        { player: "SUD", index: 2 },
        { player: "SUD", index: 3 },
        { player: "SUD", index: 4 },
        { player: "SUD", index: 5 },
        { player: "SUD", index: 6 }
    ];
}

function findPositionInRoute(route, player, pitIndex) {
    return route.findIndex(function (pit) {
        return pit.player === player && pit.index === pitIndex;
    });
}

function getPlayerPits(player) {
    return player === "SUD" ? game.sud : game.nord;
}

function getOpponent(player) {
    return player === "SUD" ? "NORD" : "SUD";
}

function getPitValue(player, index) {
    return player === "SUD" ? game.sud[index] : game.nord[index];
}

function setPitValue(player, index, value) {
    if (player === "SUD") {
        game.sud[index] = value;
    } else {
        game.nord[index] = value;
    }
}

function getNonEmptyPits(player) {
    const pits = getPlayerPits(player);
    const indexes = [];

    for (let i = 0; i < pits.length; i++) {
        if (pits[i] > 0) {
            indexes.push(i);
        }
    }

    return indexes;
}

function sumArray(array) {
    return array.reduce(function (total, value) {
        return total + value;
    }, 0);
}

function buildMoveMessage(player, pitIndex, capturedSeeds) {
    const caseNumber = pitIndex + 1;
    const opponent = getOpponent(player);

    if (capturedSeeds > 0) {
        return `${player} a joué la case ${caseNumber} et a capturé ${capturedSeeds} graine(s). Tour de ${opponent}.`;
    }

    return `${player} a joué la case ${caseNumber}. Aucune capture. Tour de ${opponent}.`;
}

resetButton.addEventListener("click", resetGame);

renderGame();