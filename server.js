const dotenv = require("dotenv");

// =====================================================
// LOAD ENVIRONMENT VARIABLES
// =====================================================

dotenv.config();

console.log(
  "JWT_SECRET loaded:",
  !!process.env.JWT_SECRET
);

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");

const app = express();

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(
  cors({
    origin: "*",
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =====================================================
// HEALTH CHECK
// =====================================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Dhanvi Fashion & Gifts API is running",
  });
});

// =====================================================
// ROUTES
// =====================================================

// Authentication
app.use(
  "/api/auth",
  require("./routes/authRoutes")
);

// Products
app.use(
  "/api/products",
  require("./routes/productRoutes")
);

// Categories
app.use(
  "/api/categories",
  require("./routes/categoryRoutes")
);

// Cart
app.use(
  "/api/cart",
  require("./routes/cartRoutes")
);

// Orders
app.use(
  "/api/orders",
  require("./routes/orderRoutes")
);

// =====================================================
// SERVER
// =====================================================

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error(
      "Database connection failed:",
      error
    );

    process.exit(1);
  });