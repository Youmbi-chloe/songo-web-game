CREATE DATABASE IF NOT EXISTS songo_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_general_ci;

USE songo_db;

DROP TABLE IF EXISTS games;

CREATE TABLE games (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nord TEXT NOT NULL,
    sud TEXT NOT NULL,
    score_nord INT NOT NULL DEFAULT 0,
    score_sud INT NOT NULL DEFAULT 0,
    current_player VARCHAR(10) NOT NULL DEFAULT 'SUD',
    winner VARCHAR(20) DEFAULT NULL,
    game_over TINYINT(1) NOT NULL DEFAULT 0,
    message TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO games (
    nord,
    sud,
    score_nord,
    score_sud,
    current_player,
    winner,
    game_over,
    message
) VALUES (
    '[5,5,5,5,5,5,5]',
    '[5,5,5,5,5,5,5]',
    0,
    0,
    IF(RAND() < 0.5, 'SUD', 'NORD'),
    NULL,
    0,
    'Nouvelle partie. Le joueur qui commence est choisi par tirage au sort.'
);