let express = require("express");
let path = require("path");

const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();
const { DATABASE_URL } = process.env;

let app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
        require: true,
    },
});

async function getPostgresVersion() {
    const client = await pool.connect();
    try {
        const response = await client.query("SELECT version()");
        console.log(response.rows[0]);
    } finally {
        client.release();
    }
}

getPostgresVersion();

//endpoint start

//CRUD operation
//add post
app.post("/listings", async (req, res) => {
    const client = await pool.connect();
    try {
        const data = {
            sell_or_rent: req.body.sell_or_rent,
            brand: req.body.brand,
            model: req.body.model,
            year: req.body.year,
            transmission: req.body.transmission,
            images: req.body.images,
            name: req.body.name,
            phone_number: req.body.phone_number,
            user_id: req.body.user_id,
        };

        console.log("Data being inserted:", data); // Log the data object

        const query =
            "INSERT INTO listings(sell_or_rent, brand, model, year, transmission, images, name, phone_number, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id";
        const params = [
            data.sell_or_rent,
            data.brand,
            data.model,
            data.year,
            data.transmission,
            data.images,
            data.name,
            data.phone_number,
            data.user_id
        ];

        console.log('Executing query:', query, params); // Log the full query and parameters

        const result = await client.query(query, params);
        data.id = result.rows[0].id; // assign the last inserted id to data object

        console.log('Post created successfully with id ${data.id}');
        res.json({
            status: "success",
            data: data,
            message: "Post created successfully",
        });
    } catch (error) {
        console.error("Error: ", error.message);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

//add get for display
app.get("/listings", async (req, res) => {
    const userId = req.params.id
    const client = await pool.connect();
    try {
        const query = "SELECT * FROM listings WHERE user_id = $1";
        const result = await client.query(query, [userId]);
        res.json(result.rows);
    } catch (err) {
        console.log(err.stack);
        res.status(500).send("An error occured");
    } finally {
        client.release();
    }
});

//add update
app.put("/listings/:id", async (req, res) => {
    const id = req.params.id;
    const updatedData = req.body;
    const client = await pool.connect();
    try {
        const updateQuery =
            "UPDATE listings SET sell_or_rent = $1, brand = $2, model = $3, year = $4, transmission = $5, images = $6, name = $7, phone_number = $8 WHERE id = $9";
        const queryData = [
            updatedData.sell_or_rent,
            updatedData.brand,
            updatedData.model,
            updatedData.year,
            updatedData.transmission,
            updatedData.images,
            updatedData.name,
            updatedData.phone_number,
            id,
        ];
        await client.query(updateQuery, queryData);

        res.json({ status: "success", message: "Post updated successfully" });
    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

//add delete
app.delete("/listings/:id", async (req, res) => {
    const id = req.params.id;
    const client = await pool.connect();

    try {
        const deleteQuery = "DELETE FROM listings WHERE id = $1";
        await client.query(deleteQuery, [id]);

        res.json({ status: "success", message: "Post deleted successfully" });
    } catch (error) {
        console.error("Error", error.message);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

//endpoint end

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname + "/index.html"));
});

app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname + "/404.html"));
});

app.listen(3000, () => {
    console.log("App is listening on port 3000");
});