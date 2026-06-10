# Songo Web Game

## Project Description

This project is a web implementation of the traditional Cameroonian game **Songo**.
Songo is a two-player seed-sowing board game. The board is divided into two camps: **NORD** and **SUD**. Each camp contains seven pits, and each pit contains five seeds at the beginning of the game.

The objective of the game is to capture the highest number of seeds. A player wins when they collect at least **40 seeds**.

This project contains two versions of the game:

1. **Local version**: two players play on the same web page and on the same computer.
2. **Distant version**: two players can play from two different browser tabs or devices using Ajax, PHP and MySQL.

---

## Technologies Used

### Local Version

* HTML
* CSS
* JavaScript

### Distant Version

* HTML
* CSS
* JavaScript
* Ajax with `fetch()`
* PHP
* MySQL
* Apache local server

---

## Project Structure

```txt
songo-web-game/
├── songo-local/
│   ├── index.html
│   ├── style.css
│   └── script.js
│
└── songo-distant/
    ├── api/
    │   ├── db.php
    │   ├── get_state.php
    │   ├── play.php
    │   └── reset.php
    │
    ├── database/
    │   └── init.sql
    │
    ├── index.html
    ├── style.css
    ├── app.js
    └── README.txt
```

---

## Main Features

* Two camps: NORD and SUD
* Seven pits per camp
* Five seeds per pit at the beginning
* Random starting player
* Turn-based gameplay
* Seed sowing system
* Capture system
* Chain capture system
* Solidarity rule
* Case 7 restriction
* Prevention of illegal moves
* End game detection
* Local gameplay version
* Distant gameplay version using Ajax
* MySQL storage for the distant version
* Automatic synchronization between two browsers

---

## Game Rules Implemented

At the beginning of the game, each pit contains five seeds.

Players play one after another. During a turn, the current player chooses one non-empty pit from their own camp. The program takes all the seeds from that pit, empties it, and distributes the seeds one by one into the following pits.

The sowing direction used in this project is:

* in the player's own camp, seeds are sown from pit 7 toward pit 1;
* in the opponent's camp, seeds continue from pit 1 toward pit 7.

A capture is possible when the last seed lands in the opponent's camp and the destination pit contains, after the seed is dropped, exactly 2, 3 or 4 seeds.

The project also implements the following rules:

* a player cannot play an empty pit;
* a player cannot play when it is not their turn;
* a capture cannot completely empty the opponent's camp;
* if the opponent's camp is empty, the current player must apply the solidarity rule and give seeds if possible;
* if solidarity is impossible, the game ends;
* it is forbidden to sow only 1 or 2 seeds into the opponent's camp from pit 7, except when the move is forced by solidarity;
* the game ends when a player reaches at least 40 captured seeds;
* the game also ends when fewer than 10 seeds remain on the board.

---

## Local Version

The local version allows two players to play on the same web page.

The whole game state is stored directly in JavaScript variables. No database is required for this version.

### Local Version Files

```txt
songo-local/
├── index.html
├── style.css
└── script.js
```

### Role of Each File

* `index.html`: contains the structure of the page.
* `style.css`: contains the design of the game interface.
* `script.js`: contains the complete game logic for the local version.

### How to Run the Local Version

Copy the `songo-local` folder into the Apache web directory:

```txt
/var/www/html/
```

The final path should be:

```txt
/var/www/html/songo-local
```

Start Apache:

```bash
sudo systemctl start apache2
```

Open the local version in the browser:

```txt
http://localhost/songo-local/
```

---

## Distant Version

The distant version allows two players to play from two different browser tabs or devices.

Each player selects their camp using the dropdown menu:

* SUD
* NORD

The game state is stored in a MySQL database. JavaScript communicates with PHP using Ajax requests. PHP reads and updates the MySQL database, then sends the updated game state back to the browser in JSON format.

### Distant Version Files

```txt
songo-distant/
├── api/
│   ├── db.php
│   ├── get_state.php
│   ├── play.php
│   └── reset.php
│
├── database/
│   └── init.sql
│
├── index.html
├── style.css
├── app.js
└── README.txt
```

### Role of Each File

* `index.html`: contains the interface of the distant version.
* `style.css`: contains the design of the interface.
* `app.js`: handles Ajax requests, displays the board and updates the interface.
* `api/db.php`: connects PHP to MySQL.
* `api/get_state.php`: retrieves the current game state from MySQL.
* `api/play.php`: receives a move, applies the game rules and updates MySQL.
* `api/reset.php`: resets the game.
* `database/init.sql`: creates the database and the required table.

---

## How to Run the Distant Version

### 1. Copy the Project Folder

Copy the `songo-distant` folder into:

```txt
/var/www/html/
```

The final path should be:

```txt
/var/www/html/songo-distant
```

---

### 2. Start Apache

```bash
sudo systemctl start apache2
```

---

### 3. Start MySQL

```bash
sudo systemctl start mysql
```

---

### 4. Import the Database

Go to the distant project folder:

```bash
cd /var/www/html/songo-distant
```

Import the SQL file:

```bash
sudo mysql < database/init.sql
```

This command creates the database `songo_db` and the table required for the game.

---

### 5. Create the MySQL User

Enter MySQL:

```bash
sudo mysql
```

Then run the following commands:

```sql
CREATE USER IF NOT EXISTS 'songo_user'@'localhost' IDENTIFIED BY 'songo_password';
GRANT ALL PRIVILEGES ON songo_db.* TO 'songo_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

This user is used by the file:

```txt
api/db.php
```

to connect PHP to MySQL.

---

### 6. Test the Database Connection

Open this URL in the browser:

```txt
http://localhost/songo-distant/api/get_state.php
```

If everything is working correctly, a JSON response should appear with:

```txt
success: true
```

and the current game state.

---

### 7. Open the Distant Version

Open the game in the browser:

```txt
http://localhost/songo-distant/
```

To simulate two distant players:

1. Open the game in a first tab.
2. Select `SUD`.
3. Open the game in a second tab.
4. Select `NORD`.
5. Play from each tab when it is the corresponding player's turn.

When one player plays, the other browser tab updates automatically.

---

## Ajax Synchronization

The distant version uses Ajax to synchronize the two players.

The file `app.js` sends requests to the PHP API files. The game state is refreshed automatically every 0.5 seconds.

This allows both players to see the updated board without manually refreshing the page.

Simplified communication flow:

```txt
Browser
   ↓ Ajax request
PHP API
   ↓
MySQL database
   ↓
PHP API response in JSON
   ↓
Browser update
```

---

## Database

The database used in this project is:

```txt
songo_db
```

The main table is:

```txt
games
```

This table stores:

* NORD pits
* SUD pits
* NORD score
* SUD score
* current player
* winner
* game over status
* game message
* last update time

The pits are stored as JSON arrays inside MySQL.

Example:

```json
[5,5,5,5,5,5,5]
```

---

## Resetting the Game

The game can be reset directly from the interface by clicking:

```txt
Nouvelle partie
```

It can also be reset by opening:

```txt
http://localhost/songo-distant/api/reset.php
```

---

## Development Environment

This project was developed and tested on Ubuntu using:

* Apache
* PHP
* MySQL
* Visual Studio Code
* Firefox browser

The project was placed inside:

```txt
/var/www/html
```

because this is the default Apache web directory on Ubuntu.

---

## Notes

* The local version does not need MySQL.
* The distant version requires Apache, PHP and MySQL.
* The database must be imported before running the distant version.
* If the MySQL connection fails, check the credentials inside `api/db.php`.
* The default MySQL user for the project is:

```txt
Username: songo_user
Password: songo_password
Database: songo_db
```

---

## Future Improvements

Possible future improvements include:

* player authentication;
* multiple simultaneous games;
* move history;
* online deployment;
* improved animations;
* artificial intelligence opponent;
* strategic move suggestions.

---

## Author

Created by **[Youmbi Chloe]**.

---

## License

This project was created for academic and learning purposes.
