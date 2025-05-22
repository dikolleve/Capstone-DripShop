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

/********** retrieve all product categories **********/
const getCategories = async () => {
    const response = await axios.get(`${API_URL}/products/categories`);
    return response.data;
}

/********** view products all products / home **********/
app.get("/", async (req, res) => {
    try {
        const [productRes, categories] = await Promise.all([
            axios.get(`${API_URL}/products`),
            getCategories()
        ]);
        res.render("index", {
            products: productRes.data,
            allCategories: categories,
            activeCategory: "All",
            pageTitle: "All Products"
        });
    } catch (error) {
        console.error("Error to fetch products: ", error.message);
        res.status(500).send("Failed to fetch products");
    }
});

/********** view products by category name **********/
app.get("/category/:name", async (req, res) => {
    try {
        const category = req.params.name;
        const [categoryRes, categories] = await Promise.all([
            axios.get(`${API_URL}/products/category/${category}`),
            getCategories()
        ]);
        res.render("index", {
            products: categoryRes.data,
            allCategories: categories,
            activeCategory: category,
            pageTitle: `Category: ${category}`
        })
    } catch (error) {
        console.error("Error to view category of products: ", error.message);
        res.status(500).send("Failed to view category of products");
    }
});


app.get("/products/:id", async (req, res) => {
    const productId = parseInt(req.params.id);
    try {
        const productRes = await axios.get(`${API_URL}/products/${productId}`);
        res.render("product", {
            products: productRes.data
        });
    } catch (error) {
        console.error("Error to select product: ", error.message);
        res.status(500).send("Failed to select product.");
    }
});

/********** running PORT **********/
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));