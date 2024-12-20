const express = require('express');
const multer = require('multer');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./participants.db'); // Persistent database file

const app = express();
app.use(express.json()); // For parsing application/json
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from the 'public' directory

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/assets/images/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const filetypes = /svg/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only SVG files are allowed!'));
    }
});

// Initialize the database and create tables if they don't exist
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS polls (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        votingOpen BOOLEAN DEFAULT 0
    )`);

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

// GET route to retrieve all polls
app.get('/polls', (req, res) => {
    db.all('SELECT * FROM polls', [], (err, rows) => {
        if (err) {
            return res.status(500).send(err.message);
        }
        res.json(rows);
    });
});

// GET route to retrieve a specific poll
app.get('/polls/:pollId', (req, res) => {
    const { pollId } = req.params;
    db.get('SELECT * FROM polls WHERE id = ?', [pollId], (err, row) => {
        if (err) {
            return res.status(500).send(err.message);
        }
        res.json(row);
    });
});

// POST route to create a new poll
app.post('/polls', (req, res) => {
    const { name } = req.body;
    db.run(`INSERT INTO polls (name, votingOpen) VALUES (?, 0)`, [name], function(err) {
        if (err) {
            return res.status(500).send(err.message);
        }
        res.status(201).json({ id: this.lastID });
    });
});

// GET route to retrieve participants for a specific poll
app.get('/polls/:pollId/participants', (req, res) => {
    const { pollId } = req.params;
    db.all('SELECT * FROM participants WHERE pollId = ?', [pollId], (err, rows) => {
        if (err) {
            return res.status(500).send(err.message);
        }
        res.json(rows);
    });
});

// POST route to add a new participant to a specific poll
app.post('/polls/:pollId/participants', upload.single('image'), (req, res) => {
    const { pollId } = req.params;
    const { name, designation, department, review } = req.body;
    const imagePath = req.file ? `/assets/images/${req.file.filename}` : '/assets/images/placeholder.svg';
    db.run(`INSERT INTO participants (pollId, name, designation, department, review, imagePath, votes) VALUES (?, ?, ?, ?, ?, ?, 0)`,
        [pollId, name, designation, department, review, imagePath], function(err) {
            if (err) {
                console.error('Database error:', err.message);
                return res.status(500).send(err.message);
            }
            res.status(201).json({ id: this.lastID });
        });
});

// PUT route to toggle voting status for a poll
app.put('/polls/:pollId/toggle-voting', (req, res) => {
    const { pollId } = req.params;
    db.get(`SELECT votingOpen FROM polls WHERE id = ?`, [pollId], (err, row) => {
        if (err) {
            return res.status(500).send(err.message);
        }
        const newStatus = row.votingOpen ? 0 : 1;
        db.run(`UPDATE polls SET votingOpen = ? WHERE id = ?`, [newStatus, pollId], (err) => {
            if (err) {
                return res.status(500).send(err.message);
            }
            res.json({ votingOpen: newStatus === 1 });
        });
    });
});

// PUT route to increment votes for a participant
app.put('/polls/:pollId/participants/:id/vote', (req, res) => {
    const { pollId, id } = req.params;
    db.get(`SELECT votingOpen FROM polls WHERE id = ?`, [pollId], (err, row) => {
        if (err) {
            return res.status(500).send(err.message);
        }
        if (!row.votingOpen) {
            return res.status(403).send('Voting is currently closed.');
        }
        db.run(`UPDATE participants SET votes = votes + 1 WHERE id = ? AND pollId = ?`, [id, pollId], function(err) {
            if (err) {
                console.error('Database error:', err.message);
                return res.status(500).send(err.message);
            }
            res.status(204).send();
        });
    });
});

// DELETE route to remove a participant
app.delete('/polls/:pollId/participants/:id', (req, res) => {
    const { pollId, id } = req.params;
    db.run(`DELETE FROM participants WHERE id = ? AND pollId = ?`, [id, pollId], function(err) {
        if (err) {
            return res.status(500).send(err.message);
        }
        res.status(204).send();
    });
});

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
