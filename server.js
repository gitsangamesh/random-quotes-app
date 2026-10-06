const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
const PORT = 5000;

// ===============================
// Middleware
// ===============================

app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

// ===============================
// Database
// ===============================

const dbPath = path.join(__dirname, "quotes.db");

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Database error:", err.message);
    } else {
        console.log("SQLite database connected");
    }
});

db.run(`
    CREATE TABLE IF NOT EXISTS favorites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quote TEXT NOT NULL,
        author TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`, (err) => {

    if (err) {
        console.error("Table error:", err.message);
    } else {
        console.log("Favorites table ready");
    }

});


// ===============================
// Health Check
// ===============================

app.get("/api/health", (req, res) => {

    res.json({
        success: true,
        message: "Backend is working"
    });

});


// ===============================
// Get Random Quote
// ===============================

const fallbackQuotes = [
    {
        content: "The future depends on what you do today.",
        author: "Mahatma Gandhi"
    },
    {
        content: "Success is not final, failure is not fatal.",
        author: "Winston Churchill"
    },
    {
        content: "It always seems impossible until it's done.",
        author: "Nelson Mandela"
    },
    {
        content: "Believe you can and you're halfway there.",
        author: "Theodore Roosevelt"
    },
    {
        content: "Great things are done by a series of small things brought together.",
        author: "Vincent van Gogh"
    }
];

app.get("/api/quote", async (req, res) => {

    try {

        const response = await fetch(
            "https://api.realinspire.live/v1/quotes/random?limit=1"
        );

        if (!response.ok) {
            throw new Error("External API failed");
        }

        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
            throw new Error("Invalid API response");
        }

        res.json({
            success: true,
            source: "external",
            quote: {
                text: data[0].content,
                author: data[0].author
            }
        });

    } catch (error) {

        console.log(
            "External API unavailable. Using fallback."
        );

        const random =
            fallbackQuotes[
                Math.floor(
                    Math.random() *
                    fallbackQuotes.length
                )
            ];

        res.json({
            success: true,
            source: "fallback",
            quote: {
                text: random.content,
                author: random.author
            }
        });

    }

});


// ===============================
// GET FAVORITES
// ===============================

app.get("/api/favorites", (req, res) => {

    db.all(
        `
        SELECT *
        FROM favorites
        ORDER BY id DESC
        `,
        [],
        (err, rows) => {

            if (err) {

                console.error(
                    "GET favorites error:",
                    err.message
                );

                return res.status(500).json({
                    success: false,
                    message: "Database error"
                });

            }

            res.json({
                success: true,
                favorites: rows
            });

        }
    );

});


// ===============================
// ADD FAVORITE
// ===============================

app.post("/api/favorites", (req, res) => {

    console.log("POST /api/favorites");

    console.log("Request body:", req.body);

    const { quote, author } = req.body;

    if (!quote || !author) {

        return res.status(400).json({
            success: false,
            message: "Quote and author are required"
        });

    }

    // Check duplicate

    db.get(
        `
        SELECT id
        FROM favorites
        WHERE quote = ? AND author = ?
        `,
        [quote, author],
        (err, row) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    success: false,
                    message: "Database error"
                });

            }

            if (row) {

                return res.status(409).json({
                    success: false,
                    message: "Quote already saved"
                });

            }


            // Insert

            db.run(
                `
                INSERT INTO favorites
                (quote, author)
                VALUES (?, ?)
                `,
                [quote, author],
                function (err) {

                    if (err) {

                        console.error(
                            "INSERT error:",
                            err.message
                        );

                        return res.status(500).json({
                            success: false,
                            message:
                                "Failed to save quote"
                        });

                    }

                    console.log(
                        "Quote saved with ID:",
                        this.lastID
                    );

                    res.status(201).json({
                        success: true,
                        message:
                            "Quote saved successfully",
                        favorite: {
                            id: this.lastID,
                            quote: quote,
                            author: author
                        }
                    });

                }
            );

        }
    );

});


// ===============================
// DELETE FAVORITE
// ===============================

app.delete("/api/favorites/:id", (req, res) => {

    const id = Number(req.params.id);

    console.log(
        "Deleting favorite:",
        id
    );

    db.run(
        `
        DELETE FROM favorites
        WHERE id = ?
        `,
        [id],
        function (err) {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    success: false,
                    message: "Delete failed"
                });

            }

            if (this.changes === 0) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Favorite not found"
                });

            }

            res.json({
                success: true,
                message:
                    "Favorite deleted successfully"
            });

        }
    );

});


// ===============================
// Start Server
// ===============================

app.listen(PORT, () => {

    console.log(
        `Server running at http://localhost:${PORT}`
    );

});