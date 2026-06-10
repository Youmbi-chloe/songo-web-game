<?php

require_once "db.php";

try {
    $stmt = $pdo->query("SELECT * FROM games WHERE id = 1");
    $game = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$game) {
        echo json_encode([
            "success" => false,
            "message" => "Aucune partie trouvée."
        ]);
        exit;
    }

    echo json_encode([
        "success" => true,
        "game" => [
            "id" => (int) $game["id"],
            "nord" => json_decode($game["nord"], true),
            "sud" => json_decode($game["sud"], true),
            "scoreNord" => (int) $game["score_nord"],
            "scoreSud" => (int) $game["score_sud"],
            "currentPlayer" => $game["current_player"],
            "winner" => $game["winner"],
            "gameOver" => (bool) $game["game_over"],
            "message" => $game["message"],
            "updatedAt" => $game["updated_at"]
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Impossible de récupérer l'état du jeu.",
        "error" => $e->getMessage()
    ]);
}
