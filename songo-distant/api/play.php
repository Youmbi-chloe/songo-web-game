<?php

require_once "db.php";

const NUMBER_OF_PITS = 7;
const WINNING_SCORE = 40;
const MIN_SEEDS_ON_BOARD = 10;

function getOpponent($player) {
    return $player === "SUD" ? "NORD" : "SUD";
}

function sumArrayValues($array) {
    return array_sum($array);
}

function getRoute($player) {
    if ($player === "SUD") {
        return [
            ["player" => "SUD", "index" => 6],
            ["player" => "SUD", "index" => 5],
            ["player" => "SUD", "index" => 4],
            ["player" => "SUD", "index" => 3],
            ["player" => "SUD", "index" => 2],
            ["player" => "SUD", "index" => 1],
            ["player" => "SUD", "index" => 0],

            ["player" => "NORD", "index" => 0],
            ["player" => "NORD", "index" => 1],
            ["player" => "NORD", "index" => 2],
            ["player" => "NORD", "index" => 3],
            ["player" => "NORD", "index" => 4],
            ["player" => "NORD", "index" => 5],
            ["player" => "NORD", "index" => 6],
        ];
    }

    return [
        ["player" => "NORD", "index" => 6],
        ["player" => "NORD", "index" => 5],
        ["player" => "NORD", "index" => 4],
        ["player" => "NORD", "index" => 3],
        ["player" => "NORD", "index" => 2],
        ["player" => "NORD", "index" => 1],
        ["player" => "NORD", "index" => 0],

        ["player" => "SUD", "index" => 0],
        ["player" => "SUD", "index" => 1],
        ["player" => "SUD", "index" => 2],
        ["player" => "SUD", "index" => 3],
        ["player" => "SUD", "index" => 4],
        ["player" => "SUD", "index" => 5],
        ["player" => "SUD", "index" => 6],
    ];
}

function findPositionInRoute($route, $player, $pitIndex) {
    foreach ($route as $position => $pit) {
        if ($pit["player"] === $player && $pit["index"] === $pitIndex) {
            return $position;
        }
    }

    return -1;
}

function getPitValue($game, $player, $index) {
    return $player === "SUD" ? $game["sud"][$index] : $game["nord"][$index];
}

function setPitValue(&$game, $player, $index, $value) {
    if ($player === "SUD") {
        $game["sud"][$index] = $value;
    } else {
        $game["nord"][$index] = $value;
    }
}

function getPlayerPits($game, $player) {
    return $player === "SUD" ? $game["sud"] : $game["nord"];
}

function getNonEmptyPits($game, $player) {
    $pits = getPlayerPits($game, $player);
    $indexes = [];

    foreach ($pits as $index => $value) {
        if ($value > 0) {
            $indexes[] = $index;
        }
    }

    return $indexes;
}

function countSeedsGivenToOpponent($game, $player, $pitIndex) {
    $simulation = [
        "nord" => $game["nord"],
        "sud" => $game["sud"]
    ];

    $route = getRoute($player);
    $startPosition = findPositionInRoute($route, $player, $pitIndex);

    if ($startPosition === -1) {
        return 0;
    }

    $startPit = $route[$startPosition];
    $seeds = getPitValue($simulation, $startPit["player"], $startPit["index"]);
    setPitValue($simulation, $startPit["player"], $startPit["index"], 0);

    $currentPosition = $startPosition;
    $seedsGiven = 0;
    $opponent = getOpponent($player);

    while ($seeds > 0) {
        $currentPosition = ($currentPosition + 1) % count($route);
        $currentPit = $route[$currentPosition];

        $isOriginalPit =
            $currentPit["player"] === $player &&
            $currentPit["index"] === $pitIndex;

        if ($isOriginalPit) {
            continue;
        }

        $oldValue = getPitValue($simulation, $currentPit["player"], $currentPit["index"]);
        setPitValue($simulation, $currentPit["player"], $currentPit["index"], $oldValue + 1);

        if ($currentPit["player"] === $opponent) {
            $seedsGiven++;
        }

        $seeds--;
    }

    return $seedsGiven;
}

function validateMove(&$game, $player, $pitIndex) {
    if ($game["gameOver"]) {
        return [
            "valid" => false,
            "message" => "La partie est déjà terminée."
        ];
    }

    if ($player !== $game["currentPlayer"]) {
        return [
            "valid" => false,
            "message" => "Ce n'est pas votre tour."
        ];
    }

    if ($pitIndex < 0 || $pitIndex >= NUMBER_OF_PITS) {
        return [
            "valid" => false,
            "message" => "Case invalide."
        ];
    }

    $playerPits = getPlayerPits($game, $player);

    if ($playerPits[$pitIndex] <= 0) {
        return [
            "valid" => false,
            "message" => "Coup invalide : la case choisie est vide."
        ];
    }

    $opponent = getOpponent($player);
    $opponentPits = getPlayerPits($game, $opponent);
    $seedsGiven = countSeedsGivenToOpponent($game, $player, $pitIndex);
    $opponentIsEmpty = sumArrayValues($opponentPits) === 0;

    if ($opponentIsEmpty) {
        $allPossibleMoves = getNonEmptyPits($game, $player);
        $possibleGifts = [];

        foreach ($allPossibleMoves as $index) {
            $possibleGifts[] = countSeedsGivenToOpponent($game, $player, $index);
        }

        $maxGift = max($possibleGifts);

        if ($maxGift === 0) {
            endGameBecauseNoSolidarity($game);

            return [
                "valid" => false,
                "message" => "Solidarité impossible. La partie est terminée."
            ];
        }

        if ($maxGift >= 7 && $seedsGiven < 7) {
            return [
                "valid" => false,
                "message" => "Règle de solidarité : vous devez donner au moins 7 graines à l'adversaire si possible."
            ];
        }

        if ($maxGift < 7 && $seedsGiven !== $maxGift) {
            return [
                "valid" => false,
                "message" => "Règle de solidarité : vous devez donner le maximum possible, c'est-à-dire $maxGift graine(s)."
            ];
        }

        return [
            "valid" => true,
            "message" => "Coup valide par solidarité."
        ];
    }

    if ($pitIndex === 6 && ($seedsGiven === 1 || $seedsGiven === 2)) {
        return [
            "valid" => false,
            "message" => "Coup interdit : avec la case 7, on ne peut pas semer seulement 1 ou 2 graines chez l'adversaire."
        ];
    }

    return [
        "valid" => true,
        "message" => "Coup valide."
    ];
}

function sowSeeds(&$game, $player, $pitIndex) {
    $route = getRoute($player);
    $startPosition = findPositionInRoute($route, $player, $pitIndex);
    $startPit = $route[$startPosition];

    $seeds = getPitValue($game, $startPit["player"], $startPit["index"]);
    setPitValue($game, $startPit["player"], $startPit["index"], 0);

    $currentPosition = $startPosition;
    $lastPosition = $startPosition;

    while ($seeds > 0) {
        $currentPosition = ($currentPosition + 1) % count($route);
        $currentPit = $route[$currentPosition];

        $isOriginalPit =
            $currentPit["player"] === $player &&
            $currentPit["index"] === $pitIndex;

        if ($isOriginalPit) {
            continue;
        }

        $oldValue = getPitValue($game, $currentPit["player"], $currentPit["index"]);
        setPitValue($game, $currentPit["player"], $currentPit["index"], $oldValue + 1);

        $lastPosition = $currentPosition;
        $seeds--;
    }

    return [
        "route" => $route,
        "lastPosition" => $lastPosition
    ];
}

function captureSeeds(&$game, $player, $lastPosition, $route) {
    $opponent = getOpponent($player);
    $lastPit = $route[$lastPosition];

    if ($lastPit["player"] !== $opponent) {
        return 0;
    }

    if ($lastPit["index"] === 0) {
        return 0;
    }

    $positionsToCapture = [];
    $currentPosition = $lastPosition;

    while (true) {
        $currentPit = $route[$currentPosition];

        if ($currentPit["player"] !== $opponent) {
            break;
        }

        $seedsInPit = getPitValue($game, $currentPit["player"], $currentPit["index"]);

        if ($seedsInPit < 2 || $seedsInPit > 4) {
            break;
        }

        $positionsToCapture[] = [
            "player" => $currentPit["player"],
            "index" => $currentPit["index"],
            "seeds" => $seedsInPit
        ];

        $currentPosition--;

        if ($currentPosition < 0) {
            $currentPosition = count($route) - 1;
        }
    }

    if (count($positionsToCapture) === 0) {
        return 0;
    }

    $opponentPits = getPlayerPits($game, $opponent);
    $opponentTotalBeforeCapture = sumArrayValues($opponentPits);

    $totalCaptured = 0;

    foreach ($positionsToCapture as $pit) {
        $totalCaptured += $pit["seeds"];
    }

    if ($opponentTotalBeforeCapture - $totalCaptured === 0) {
        return 0;
    }

    foreach ($positionsToCapture as $pit) {
        setPitValue($game, $pit["player"], $pit["index"], 0);
    }

    return $totalCaptured;
}

function collectRemainingSeeds(&$game) {
    $game["scoreSud"] += sumArrayValues($game["sud"]);
    $game["scoreNord"] += sumArrayValues($game["nord"]);

    $game["sud"] = array_fill(0, NUMBER_OF_PITS, 0);
    $game["nord"] = array_fill(0, NUMBER_OF_PITS, 0);
}

function endGameBecauseNoSolidarity(&$game) {
    collectRemainingSeeds($game);
    $game["gameOver"] = true;

    if ($game["scoreSud"] > $game["scoreNord"]) {
        $game["winner"] = "SUD";
        $game["message"] = "Partie terminée : solidarité impossible. SUD gagne.";
    } elseif ($game["scoreNord"] > $game["scoreSud"]) {
        $game["winner"] = "NORD";
        $game["message"] = "Partie terminée : solidarité impossible. NORD gagne.";
    } else {
        $game["winner"] = "ÉGALITÉ";
        $game["message"] = "Partie terminée : solidarité impossible. Égalité.";
    }
}

function checkEndGame(&$game) {
    if ($game["scoreSud"] >= WINNING_SCORE) {
        $game["gameOver"] = true;
        $game["winner"] = "SUD";
        $game["message"] = "Partie terminée. SUD gagne avec au moins 40 graines.";
        return;
    }

    if ($game["scoreNord"] >= WINNING_SCORE) {
        $game["gameOver"] = true;
        $game["winner"] = "NORD";
        $game["message"] = "Partie terminée. NORD gagne avec au moins 40 graines.";
        return;
    }

    $totalSeedsOnBoard = sumArrayValues($game["sud"]) + sumArrayValues($game["nord"]);

    if ($totalSeedsOnBoard < MIN_SEEDS_ON_BOARD) {
        collectRemainingSeeds($game);
        $game["gameOver"] = true;

        if ($game["scoreSud"] > $game["scoreNord"]) {
            $game["winner"] = "SUD";
            $game["message"] = "Partie terminée : il reste moins de 10 graines. SUD gagne.";
        } elseif ($game["scoreNord"] > $game["scoreSud"]) {
            $game["winner"] = "NORD";
            $game["message"] = "Partie terminée : il reste moins de 10 graines. NORD gagne.";
        } else {
            $game["winner"] = "ÉGALITÉ";
            $game["message"] = "Partie terminée : égalité.";
        }
    }
}

function checkIfCurrentPlayerCanPlay(&$game) {
    $currentPits = getPlayerPits($game, $game["currentPlayer"]);

    if (sumArrayValues($currentPits) === 0) {
        collectRemainingSeeds($game);
        $game["gameOver"] = true;

        if ($game["scoreSud"] > $game["scoreNord"]) {
            $game["winner"] = "SUD";
            $game["message"] = $game["currentPlayer"] . " ne peut plus jouer. SUD gagne.";
        } elseif ($game["scoreNord"] > $game["scoreSud"]) {
            $game["winner"] = "NORD";
            $game["message"] = $game["currentPlayer"] . " ne peut plus jouer. NORD gagne.";
        } else {
            $game["winner"] = "ÉGALITÉ";
            $game["message"] = $game["currentPlayer"] . " ne peut plus jouer. Partie nulle.";
        }
    }
}

function buildMoveMessage($player, $pitIndex, $capturedSeeds) {
    $caseNumber = $pitIndex + 1;
    $opponent = getOpponent($player);

    if ($capturedSeeds > 0) {
        return "$player a joué la case $caseNumber et a capturé $capturedSeeds graine(s). Tour de $opponent.";
    }

    return "$player a joué la case $caseNumber. Aucune capture. Tour de $opponent.";
}

function saveGame($pdo, $game) {
    $stmt = $pdo->prepare("
        UPDATE games
        SET
            nord = :nord,
            sud = :sud,
            score_nord = :score_nord,
            score_sud = :score_sud,
            current_player = :current_player,
            winner = :winner,
            game_over = :game_over,
            message = :message
        WHERE id = 1
    ");

    $stmt->execute([
        "nord" => json_encode($game["nord"]),
        "sud" => json_encode($game["sud"]),
        "score_nord" => $game["scoreNord"],
        "score_sud" => $game["scoreSud"],
        "current_player" => $game["currentPlayer"],
        "winner" => $game["winner"],
        "game_over" => $game["gameOver"] ? 1 : 0,
        "message" => $game["message"]
    ]);
}

function formatGameForResponse($game) {
    return [
        "nord" => $game["nord"],
        "sud" => $game["sud"],
        "scoreNord" => $game["scoreNord"],
        "scoreSud" => $game["scoreSud"],
        "currentPlayer" => $game["currentPlayer"],
        "winner" => $game["winner"],
        "gameOver" => $game["gameOver"],
        "message" => $game["message"]
    ];
}

try {
    $input = json_decode(file_get_contents("php://input"), true);

    if (!$input || !isset($input["player"]) || !isset($input["pitIndex"])) {
        echo json_encode([
            "success" => false,
            "message" => "Données invalides."
        ]);
        exit;
    }

    $player = $input["player"];
    $pitIndex = (int) $input["pitIndex"];

    if ($player !== "SUD" && $player !== "NORD") {
        echo json_encode([
            "success" => false,
            "message" => "Joueur invalide."
        ]);
        exit;
    }

    $stmt = $pdo->query("SELECT * FROM games WHERE id = 1");
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        echo json_encode([
            "success" => false,
            "message" => "Aucune partie trouvée."
        ]);
        exit;
    }

    $game = [
        "nord" => json_decode($row["nord"], true),
        "sud" => json_decode($row["sud"], true),
        "scoreNord" => (int) $row["score_nord"],
        "scoreSud" => (int) $row["score_sud"],
        "currentPlayer" => $row["current_player"],
        "winner" => $row["winner"],
        "gameOver" => (bool) $row["game_over"],
        "message" => $row["message"]
    ];

    $validation = validateMove($game, $player, $pitIndex);

    if (!$validation["valid"]) {
        saveGame($pdo, $game);

        echo json_encode([
            "success" => false,
            "message" => $validation["message"],
            "game" => formatGameForResponse($game)
        ]);
        exit;
    }

    $result = sowSeeds($game, $player, $pitIndex);
    $capturedSeeds = captureSeeds($game, $player, $result["lastPosition"], $result["route"]);

    if ($player === "SUD") {
        $game["scoreSud"] += $capturedSeeds;
    } else {
        $game["scoreNord"] += $capturedSeeds;
    }

    checkEndGame($game);

    if (!$game["gameOver"]) {
        $game["currentPlayer"] = getOpponent($player);
        $game["message"] = buildMoveMessage($player, $pitIndex, $capturedSeeds);
        checkIfCurrentPlayerCanPlay($game);
    }

    saveGame($pdo, $game);

    echo json_encode([
        "success" => true,
        "game" => formatGameForResponse($game)
    ]);

} catch (Throwable $e) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Erreur serveur pendant le coup.",
        "error" => $e->getMessage()
    ]);
}