"use strict";

const northRow = document.getElementById("northRow");
const southRow = document.getElementById("southRow");
const scoreNordElement = document.getElementById("scoreNord");
const scoreSudElement = document.getElementById("scoreSud");
const currentPlayerElement = document.getElementById("currentPlayer");
const messageElement = document.getElementById("message");
const resetButton = document.getElementById("resetButton");
const playerSelect = document.getElementById("playerSelect");

let currentGame = null;
let isPlaying = false;

async function loadGameState() {
    try {
        const response = await fetch("api/get_state.php");
        const data = await response.json();

        if (!data.success) {
            messageElement.textContent = data.message || "Erreur lors du chargement de la partie.";
            return;
        }

        currentGame = data.game;
        renderGame(currentGame);

    } catch (error) {
        messageElement.textContent = "Erreur Ajax : impossible de charger la partie.";
        console.error(error);
    }
}

function renderGame(game) {
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
    const selectedPlayer = playerSelect.value;

    for (let i = 0; i < pits.length; i++) {
        const button = document.createElement("button");

        button.className = "pit";
        button.textContent = pits[i];
        button.title = `${player} - Case ${i + 1}`;

        const isMyCamp = selectedPlayer === player;
        const isMyTurn = currentGame && currentGame.currentPlayer === selectedPlayer;
        const isEmpty = pits[i] === 0;
        const isGameOver = currentGame && currentGame.gameOver;

        if (!isMyCamp || !isMyTurn || isEmpty || isGameOver) {
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

async function playMove(player, pitIndex) {
    if (isPlaying) {
        return;
    }

    isPlaying = true;
    messageElement.textContent = "Coup en cours...";
    renderGame(currentGame);

    try {
        const response = await fetch("api/play.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                player: player,
                pitIndex: pitIndex
            })
        });

        const data = await response.json();

        if (!data.success) {
            messageElement.textContent = data.message || "Coup refusé.";
            await loadGameState();
            return;
        }

        currentGame = data.game;
        renderGame(currentGame);

    } catch (error) {
        messageElement.textContent = "Erreur Ajax : impossible de jouer le coup.";
        console.error(error);
    } finally {
        isPlaying = false;
        await loadGameState();
    }
}

async function resetGame() {
    try {
        const response = await fetch("api/reset.php");
        const data = await response.json();

        if (!data.success) {
            messageElement.textContent = data.message || "Impossible de réinitialiser la partie.";
            return;
        }

        await loadGameState();

    } catch (error) {
        messageElement.textContent = "Erreur Ajax : impossible de réinitialiser la partie.";
        console.error(error);
    }
}

resetButton.addEventListener("click", resetGame);

playerSelect.addEventListener("change", function () {
    if (currentGame) {
        renderGame(currentGame);
    }
});

loadGameState();

setInterval(loadGameState, 500);