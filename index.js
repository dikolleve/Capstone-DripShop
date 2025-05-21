import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import axios from "axios";
import session from "express-session";

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3000;
const API_URL = "https://fakestoreapi.com";

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({extended: true}));

app.get("/", async (req, res) => {
    try {
        const productRes = await axios.get(`${API_URL}/products`);
        res.render("index", {
            products: productRes.data
        });
    } catch (error) {
        console.error("Error to fetch products: ", error.message);
        res.status(500).send("Failed to fetch products");
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));