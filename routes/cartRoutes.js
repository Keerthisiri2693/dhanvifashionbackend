const express = require("express");

const router = express.Router();

const {
  addToCart,
  getCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} = require("../controllers/cartController");

// ADD TO CART
router.post("/add", addToCart);

// GET CART
router.get("/:cartId", getCart);

// UPDATE QUANTITY
router.put(
  "/update/:cartId/:productId",
  updateCartItem
);

// REMOVE ITEM
router.delete(
  "/remove/:cartId/:productId",
  removeCartItem
);

// CLEAR CART
router.delete(
  "/clear/:cartId",
  clearCart
);

module.exports = router;