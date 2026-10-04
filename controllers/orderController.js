const mongoose = require("mongoose");

const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Order = require("../models/Order");

// =====================================================
// GENERATE UNIQUE ORDER ID
// =====================================================

const generateOrderId = () => {
  const timestamp = Date.now();

  const random = Math.floor(
    1000 + Math.random() * 9000
  );

  return `DHF-${timestamp}-${random}`;
};

// =====================================================
// CREATE ORDER
// =====================================================

const createOrder = async (req, res) => {
  try {
    const {
      cartId,
      userId,
      shippingAddress,
      paymentMethod,
    } = req.body;

    console.log("=================================");
    console.log("🛒 CREATE ORDER");
    console.log("Cart ID:", cartId);
    console.log("User ID:", userId);
    console.log("Payment:", paymentMethod);
    console.log("Shipping:", shippingAddress);
    console.log("=================================");

    // =================================================
    // VALIDATION
    // =================================================

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

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid User ID",
      });
    }

    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        message: "Shipping address is required",
      });
    }

    const requiredFields = [
      "name",
      "email",
      "phone",
      "address",
      "city",
      "state",
      "pincode",
    ];

    for (const field of requiredFields) {
      if (
        !shippingAddress[field] ||
        String(shippingAddress[field]).trim() === ""
      ) {
        return res.status(400).json({
          success: false,
          message: `${field} is required`,
        });
      }
    }

    if (!["cod", "online"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method",
      });
    }

    // =================================================
    // FIND CART
    // =================================================

    const cart = await Cart.findOne({
      cartId,
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    if (
      !cart.items ||
      cart.items.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty",
      });
    }

    console.log(
      "🛒 Cart Items:",
      cart.items.length
    );

    // =================================================
    // PREPARE ORDER ITEMS
    // =================================================

    const orderItems = [];

    let subtotal = 0;

    // =================================================
    // CHECK PRODUCTS + STOCK
    // =================================================

    for (const cartItem of cart.items) {
      const productId = cartItem.productId;

      if (
        !mongoose.Types.ObjectId.isValid(
          productId
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid product ID in cart",
        });
      }

      const product =
        await Product.findById(productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `${
            cartItem.name || "Product"
          } is no longer available`,
        });
      }

      // -----------------------------------------------
      // QUANTITY
      // -----------------------------------------------

      const quantity = Number(
        cartItem.quantity
      );

      if (
        !Number.isInteger(quantity) ||
        quantity < 1
      ) {
        return res.status(400).json({
          success: false,
          message: `Invalid quantity for ${product.name}`,
        });
      }

      // -----------------------------------------------
      // STOCK
      // -----------------------------------------------

      const stock = Number(
        product.stock ??
          product.quantity ??
          0
      );

      console.log(
        `📦 ${product.name} | Stock: ${stock} | Requested: ${quantity}`
      );

      if (quantity > stock) {
        return res.status(400).json({
          success: false,
          message: `Only ${stock} ${product.name} available`,
        });
      }

      // -----------------------------------------------
      // PRICE
      // -----------------------------------------------

      const price = Number(
        product.price || 0
      );

      const itemTotal =
        price * quantity;

      subtotal += itemTotal;

      // -----------------------------------------------
      // ORDER ITEM
      // -----------------------------------------------

      orderItems.push({
        productId: product._id,

        name:
          product.name ||
          cartItem.name ||
          "",

        price,

        quantity,

        image:
          product.image ||
          cartItem.image ||
          "",

        category:
          product.category ||
          cartItem.category ||
          "",

        subCategory:
          product.subCategory ||
          cartItem.subCategory ||
          "",

        itemTotal,
      });
    }

    // =================================================
    // SHIPPING
    // =================================================

    const shipping =
      subtotal >= 1000
        ? 0
        : 50;

    const total =
      subtotal + shipping;

    console.log(
      "💰 Subtotal:",
      subtotal
    );

    console.log(
      "🚚 Shipping:",
      shipping
    );

    console.log(
      "💰 Total:",
      total
    );

    // =================================================
    // GENERATE ORDER ID
    // =================================================

    const orderId =
      generateOrderId();

    console.log(
      "🆔 Order ID:",
      orderId
    );

    // =================================================
    // CREATE ORDER FIRST
    // =================================================

    const order =
      await Order.create({
        orderId,

        userId:
          new mongoose.Types.ObjectId(
            userId
          ),

        items: orderItems,

        shippingAddress: {
          name:
            shippingAddress.name
              .trim(),

          email:
            shippingAddress.email
              .trim(),

          phone:
            shippingAddress.phone
              .trim(),

          address:
            shippingAddress.address
              .trim(),

          city:
            shippingAddress.city
              .trim(),

          state:
            shippingAddress.state
              .trim(),

          pincode:
            shippingAddress.pincode
              .trim(),
        },

        paymentMethod,

        paymentStatus:
          paymentMethod === "cod"
            ? "pending"
            : "pending",

        orderStatus: "placed",

        subtotal,

        shipping,

        total,
      });

    console.log(
      "✅ ORDER CREATED:",
      order.orderId
    );

    // =================================================
    // REDUCE STOCK
    // =================================================

    for (const item of orderItems) {
      const product =
        await Product.findById(
          item.productId
        );

      if (!product) {
        console.error(
          "❌ Product disappeared:",
          item.productId
        );

        continue;
      }

      // -----------------------------------------------
      // USE STOCK FIELD
      // -----------------------------------------------

      if (
        typeof product.stock ===
        "number"
      ) {
        product.stock =
          product.stock -
          item.quantity;

        console.log(
          `📦 STOCK UPDATED: ${product.name} → ${product.stock}`
        );
      }

      // -----------------------------------------------
      // USE QUANTITY FIELD
      // -----------------------------------------------

      else {
        product.quantity =
          Number(
            product.quantity || 0
          ) - item.quantity;

        console.log(
          `📦 QUANTITY UPDATED: ${product.name} → ${product.quantity}`
        );
      }

      await product.save();
    }

    // =================================================
    // CLEAR CART
    // =================================================

    cart.items = [];

    await cart.save();

    console.log(
      "🛒 CART CLEARED"
    );

    console.log(
      "================================="
    );

    // =================================================
    // RESPONSE
    // =================================================

    return res.status(201).json({
      success: true,

      message:
        "Order placed successfully",

      order,
    });
  } catch (error) {
    console.error(
      "================================="
    );

    console.error(
      "❌ CREATE ORDER ERROR:",
      error
    );

    console.error(
      "================================="
    );

    // =================================================
    // DUPLICATE KEY ERROR
    // =================================================

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,

        message:
          "Duplicate order ID. Please try again.",

        error:
          error.message,
      });
    }

    // =================================================
    // VALIDATION ERROR
    // =================================================

    if (
      error.name ===
      "ValidationError"
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Order validation failed",

        error:
          error.message,
      });
    }

    // =================================================
    // GENERAL ERROR
    // =================================================

    return res.status(500).json({
      success: false,

      message:
        "Failed to place order",

      error:
        error.message,
    });
  }
};

// =====================================================
// GET USER ORDERS
// =====================================================

const getUserOrders = async (
  req,
  res
) => {
  try {
    const { userId } =
      req.params;

    // -----------------------------------------------
    // VALIDATE USER ID
    // -----------------------------------------------

    if (!userId) {
      return res.status(400).json({
        success: false,
        message:
          "User ID is required",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        userId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid User ID",
      });
    }

    // -----------------------------------------------
    // FIND ORDERS
    // -----------------------------------------------

    const orders =
      await Order.find({
        userId:
          new mongoose.Types.ObjectId(
            userId
          ),
      }).sort({
        createdAt: -1,
      });

    // -----------------------------------------------
    // RESPONSE
    // -----------------------------------------------

    return res.status(200).json({
      success: true,

      count:
        orders.length,

      orders,
    });
  } catch (error) {
    console.error(
      "❌ GET ORDERS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Failed to fetch orders",

      error:
        error.message,
    });
  }
};

// =====================================================
// GET SINGLE ORDER
// =====================================================

const getOrderById = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    // -----------------------------------------------
    // VALIDATE
    // -----------------------------------------------

    if (!id) {
      return res.status(400).json({
        success: false,
        message:
          "Order ID is required",
      });
    }

    // -----------------------------------------------
    // FIND ORDER
    // -----------------------------------------------

    const order =
      await Order.findOne({
        orderId: id,
      });

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "Order not found",
      });
    }

    // -----------------------------------------------
    // RESPONSE
    // -----------------------------------------------

    return res.status(200).json({
      success: true,

      order,
    });
  } catch (error) {
    console.error(
      "❌ GET ORDER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Failed to fetch order",

      error:
        error.message,
    });
  }
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  createOrder,
  getUserOrders,
  getOrderById,
};