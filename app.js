import express from "express";
import db from "./db/client.js";

const app = express();

app.use(express.json());

app.get("/files", async (req, res, next) => {
    try {
        const { rows } = await db.query(`
            SELECT files.*, folders.name AS folder_name
            FROM files
            JOIN folders ON folders.id = files.folder_id     
        `);

        res.status(200).json(rows);
    } catch (err) {
        next(err);
    }
});

app.get("/folders", async (req, res, next) => {
    try {
        const { rows } = await db.query(`SELECT * FROM folders`);
        res.status(200).json(rows);
    } catch (err) {
        next(err);
    }
});

app.get("/folders/:id", async (req, res, next) => {
    try {
        const { id } = req.params;

        const { rows } = await db.query(
            `
            SELECT
                folders.*,
                COALESCE(json_agg(files.*) FILTER (WHERE files.id IS NOT NULL), '[]') AS files
            FROM folders
            LEFT JOIN files ON files.folder_id = folders.id
            WHERE folders.id = $1
            GROUP BY folders.id
            `,
            [id]
        );

        if (!rows.length) {
            return res.status(404).json({ error: "Folder not found" });
        }

        res.status(200).json(rows[0]);
    } catch (err) {
        next(err);
    }
});

app.post("/folders/:id/files", async (req, res, next) => {
    try {
        const { id } = req.params;

        const folder = await db.query(
            `SELECT * FROM folders WHERE id = $1`,
            [id]
        );

        if (!folder.rows.length) {
            return res.status(404).json({ error: "Folder not found" });
        }

        if (!req.body || !req.body.name || !req.body.size) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const { name, size } = req.body;

        const { rows } = await db.query(
            `
            INSERT INTO files (name, size, folder_id)
            VALUES ($1, $2, $3)
            RETURNING *;
            `,
            [name, size, id]
        );

        res.status(201).json(rows[0]);
    } catch (err) {
        next(err);
    }
});

export default app;