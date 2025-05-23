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

app.use(session({
  secret: '#drip~shop?', // change this in production
  resave: false,
  saveUninitialized: true
}));

// To ensure the cart count is always up-to-date when you navigate back to home, 
// you can force the browser to not cache the page.
// This tells the browser not to cache the page, so it always gets a 
// fresh version from the server — which means cartCount will be up-to-date.
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// This ensures that after any redirect (like from the product page to /cart),
// the cart count shows the updated number.
app.use((req, res, next) => {
    res.locals.cartCount = req.session.cart ? req.session.cart.reduce((sum, item) => sum + item.quantity, 0) : 0;
    next();
});

/********** retrieve all product categories **********/
const getCategories = async () => {
    const response = await axios.get(`${API_URL}/products/categories`);
    return response.data;
}

/********** view products all products / home **********/
app.get("/", async (req, res) => {
    try {
        const [selectedProduct, categories] = await Promise.all([
            axios.get(`${API_URL}/products`),
            getCategories()
        ]);
        res.render("index", {
            products: selectedProduct.data,
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

/********** get random products limit to 12 **********/
const getRandomProducts = (count, products) => {
    const copy = [...products];

    // uses Math.min to control to avoid errors on displaying limited products
    count = Math.min(count, products.length);

    return Array(count).fill().map(() => {
        let randomSelect = Math.floor(Math.random() * copy.length);
        return copy.splice(randomSelect, 1)[0];
    });
}

/********** display selected product  **********/
app.get("/products/:id", async (req, res) => {
    const productId = parseInt(req.params.id);
    try {
        const [selectedProduct, allProducts, categories] = await Promise.all([
            axios.get(`${API_URL}/products/${productId}`),
            axios.get(`${API_URL}/products`),
            getCategories()
        ]);
        
        const otherProducts = allProducts.data.filter(product => product.id !== productId);

        //to display a limit of 12 random products
        const maxProduct = 12;
        const limitedProductsDisplay = getRandomProducts(maxProduct, otherProducts);

        res.render("product", {
            product: selectedProduct.data,
            limitedProductsDisplay,
            activeCategory: selectedProduct.data.category,
            allCategories: categories
        });
    } catch (error) {
        console.error("Error to select product: ", error.message);
        res.status(500).send("Failed to select product.");
    }
});

app.post("/add-to-cart/:id", async (req, res) => {
    const productId = parseInt(req.params.id);
    try {
        const selectedProduct = await axios.get(`${API_URL}/products/${productId}`);
        console.log(selectedProduct.data);

        if(!req.session.cart) {
            req.session.cart = [];
        }

        const existing = req.session.cart.find(item => item.id === productId);
        console.log(req.session.cart);

        if(existing) {
            existing.quantity += 1;
        }else{
            req.session.cart.push({...selectedProduct.data, quantity: 1})
        }
        res.redirect("/");

    } catch (error) {
        console.error("Error to add to cart: ", error.message);
        res.status(500).send("Failed to add to cart.");
    }
});

/********** running PORT **********/
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));