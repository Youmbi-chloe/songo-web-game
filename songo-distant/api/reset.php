<?php

require_once "db.php";

function drawStartingPlayer() {
    return rand(0, 1) === 0 ? "SUD" : "NORD";
}

try {
    $firstPlayer = drawStartingPlayer();

    $stmt = $pdo->prepare("
        UPDATE games
        SET
            nord = :nord,
            sud = :sud,
            score_nord = 0,
            score_sud = 0,
            current_player = :current_player,
            winner = NULL,
            game_over = 0,
            message = :message
        WHERE id = 1
    ");

    $stmt->execute([
        "nord" => json_encode([5, 5, 5, 5, 5, 5, 5]),
        "sud" => json_encode([5, 5, 5, 5, 5, 5, 5]),
        "current_player" => $firstPlayer,
        "message" => "Nouvelle partie. Tirage au sort : $firstPlayer commence."
    ]);

    echo json_encode([
        "success" => true,
        "message" => "Partie réinitialisée.",
        "currentPlayer" => $firstPlayer
    ]);

} catch (PDOException $e) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Impossible de réinitialiser la partie.",
        "error" => $e->getMessage()
    ]);
}