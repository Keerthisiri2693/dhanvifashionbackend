const mongoose = require("mongoose");

const Cart = require("../models/Cart");
const Product = require("../models/Product");

// =====================================================
// ADD PRODUCT TO CART
// POST /api/cart/add
// =====================================================

const addToCart = async (req, res) => {
  try {
    const {
      cartId,
      userId,
      productId,
      quantity = 1,
    } = req.body;

    console.log("🛒 ADD TO CART");
    console.log("Cart ID:", cartId);
    console.log("User ID:", userId);
    console.log("Product ID:", productId);
    console.log("Quantity:", quantity);

    if (!cartId) {
      return res.status(400).json({
        success: false,
        message: "Cart ID is required",
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const qty = Number(quantity);

    if (!Number.isInteger(qty) || qty < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid quantity",
      });
    }

    // =====================================================
    // FIND PRODUCT
    // =====================================================

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const stock = Number(
      product.stock ??
      product.quantity ??
      0
    );

    if (stock <= 0) {
      return res.status(400).json({
        success: false,
        message: "Product is out of stock",
      });
    }

    if (qty > stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${stock} items available`,
      });
    }

    // =====================================================
    // FIND CART
    // =====================================================

    let cart = await Cart.findOne({ cartId });

    // =====================================================
    // CREATE CART IF NOT EXISTS
    // =====================================================

    if (!cart) {
      cart = new Cart({
        cartId,
        userId,
        items: [],
      });
    }

    // =====================================================
    // CHECK EXISTING ITEM
    // =====================================================

    const existingItem = cart.items.find(
      (item) =>
        item.productId.toString() ===
        productId.toString()
    );

    // =====================================================
    // UPDATE EXISTING ITEM
    // =====================================================

    if (existingItem) {
      const newQuantity =
        Number(existingItem.quantity || 0) + qty;

      if (newQuantity > stock) {
        return res.status(400).json({
          success: false,
          message: `Only ${stock} items available`,
        });
      }

      existingItem.quantity = newQuantity;
    }

    // =====================================================
    // ADD NEW ITEM
    // =====================================================

    else {
      cart.items.push({
        productId: product._id,
        name: product.name,
        price: Number(product.price || 0),
        originalPrice: Number(
          product.originalPrice ||
          product.mrp ||
          product.price ||
          0
        ),
        quantity: qty,
        image: product.image || "",
        category: product.category || "",
        subCategory: product.subCategory || "",
      });
    }

    await cart.save();

    console.log(
      "✅ PRODUCT ADDED TO CART"
    );

    return res.status(200).json({
      success: true,
      message: "Product added to cart",
      cart,
      items: cart.items,
    });

  } catch (error) {
    console.error(
      "❌ ADD TO CART ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to add product to cart",
      error: error.message,
    });
  }
};


// =====================================================
// GET CART
// GET /api/cart/:cartId
// =====================================================

const getCart = async (req, res) => {
  try {
    const { cartId } = req.params;

    if (!cartId) {
      return res.status(400).json({
        success: false,
        message: "Cart ID is required",
      });
    }

    const cart = await Cart.findOne({
      cartId,
    });

    if (!cart) {
      return res.status(200).json({
        success: true,
        message: "Cart is empty",
        cart: {
          cartId,
          items: [],
        },
        items: [],
      });
    }

    return res.status(200).json({
      success: true,
      cart,
      items: cart.items,
    });

  } catch (error) {
    console.error(
      "❌ GET CART ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to get cart",
      error: error.message,
    });
  }
};


// =====================================================
// UPDATE CART ITEM
// PUT /api/cart/update/:cartId/:productId
// =====================================================

const updateCartItem = async (req, res) => {
  try {
    const {
      cartId,
      productId,
    } = req.params;

    const {
      quantity,
    } = req.body;

    console.log("=================================");
    console.log("🛒 UPDATE CART");
    console.log("Cart ID:", cartId);
    console.log("Product ID:", productId);
    console.log("Quantity:", quantity);
    console.log("=================================");

    if (!cartId) {
      return res.status(400).json({
        success: false,
        message: "Cart ID is required",
      });
    }

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(productId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const qty = Number(quantity);

    if (
      !Number.isInteger(qty) ||
      qty < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid quantity",
      });
    }

    // =====================================================
    // FIND CART
    // =====================================================

    const cart = await Cart.findOne({
      cartId,
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    // =====================================================
    // FIND ITEM
    // =====================================================

    const item = cart.items.find(
      (item) =>
        item.productId.toString() ===
        productId.toString()
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Product not found in cart",
      });
    }

    // =====================================================
    // FIND PRODUCT
    // =====================================================

    const product =
      await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // =====================================================
    // CHECK STOCK
    // =====================================================

    const stock = Number(
      product.stock ??
      product.quantity ??
      0
    );

    console.log(
      "📦 Available stock:",
      stock
    );

    if (stock <= 0) {
      return res.status(400).json({
        success: false,
        message: "Product is out of stock",
      });
    }

    if (qty > stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${stock} items available`,
      });
    }

    // =====================================================
    // UPDATE QUANTITY
    // =====================================================

    item.quantity = qty;

    await cart.save();

    console.log(
      "✅ CART UPDATED"
    );

    return res.status(200).json({
      success: true,
      message: "Cart updated successfully",
      cart,
      items: cart.items,
    });

  } catch (error) {
    console.error(
      "❌ UPDATE CART ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update cart",
      error: error.message,
    });
  }
};


// =====================================================
// REMOVE CART ITEM
// DELETE /api/cart/remove/:cartId/:productId
// =====================================================

const removeCartItem = async (req, res) => {
  try {
    const {
      cartId,
      productId,
    } = req.params;

    console.log("🗑️ REMOVE CART ITEM");
    console.log("Cart ID:", cartId);
    console.log("Product ID:", productId);

    if (!cartId) {
      return res.status(400).json({
        success: false,
        message: "Cart ID is required",
      });
    }

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    const cart = await Cart.findOne({
      cartId,
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const oldLength =
      cart.items.length;

    cart.items =
      cart.items.filter(
        (item) =>
          item.productId.toString() !==
          productId.toString()
      );

    if (
      cart.items.length ===
      oldLength
    ) {
      return res.status(404).json({
        success: false,
        message: "Product not found in cart",
      });
    }

    await cart.save();

    console.log(
      "✅ ITEM REMOVED"
    );

    return res.status(200).json({
      success: true,
      message: "Product removed from cart",
      cart,
      items: cart.items,
    });

  } catch (error) {
    console.error(
      "❌ REMOVE CART ITEM ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to remove cart item",
      error: error.message,
    });
  }
};


// =====================================================
// CLEAR CART
// DELETE /api/cart/clear/:cartId
// =====================================================

const clearCart = async (req, res) => {
  try {
    const {
      cartId,
    } = req.params;

    if (!cartId) {
      return res.status(400).json({
        success: false,
        message: "Cart ID is required",
      });
    }

    const cart = await Cart.findOne({
      cartId,
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    cart.items = [];

    await cart.save();

    console.log(
      "🧹 CART CLEARED:",
      cartId
    );

    return res.status(200).json({
      success: true,
      message: "Cart cleared",
      cart,
      items: [],
    });

  } catch (error) {
    console.error(
      "❌ CLEAR CART ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to clear cart",
      error: error.message,
    });
  }
};


// =====================================================
// EXPORT
// =====================================================

module.exports = {
  addToCart,
  getCart,
  updateCartItem,
  removeCartItem,
  clearCart,
};