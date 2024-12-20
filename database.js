const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./participants.db'); // Persistent database file

db.serialize(() => {
    // Create a table for polls
    db.run(`CREATE TABLE IF NOT EXISTS polls (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        votingOpen BOOLEAN DEFAULT 0
    )`);

    // Create a table for participants
    db.run(`CREATE TABLE IF NOT EXISTS participants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pollId INTEGER NOT NULL,
        name TEXT NOT NULL,
        designation TEXT NOT NULL,
        department TEXT NOT NULL,
        review TEXT NOT NULL,
        imagePath TEXT NOT NULL,
        votes INTEGER DEFAULT 0,
        FOREIGN KEY (pollId) REFERENCES polls(id)
    )`);
});

module.exports = db;
