const mongoose = require("mongoose");

// =====================================================
// ORDER ITEM
// =====================================================

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    image: {
      type: String,
      default: "",
    },

    category: {
      type: String,
      default: "",
    },

    subCategory: {
      type: String,
      default: "",
    },

    itemTotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: false,
  }
);

// =====================================================
// SHIPPING ADDRESS
// =====================================================

const shippingAddressSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },

    state: {
      type: String,
      required: true,
      trim: true,
    },

    pincode: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    _id: false,
  }
);

// =====================================================
// ORDER SCHEMA
// =====================================================

const orderSchema = new mongoose.Schema(
  {
    // -------------------------------------------------
    // ORDER ID
    // -------------------------------------------------

    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    // -------------------------------------------------
    // USER
    // -------------------------------------------------

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // -------------------------------------------------
    // ITEMS
    // -------------------------------------------------

    items: {
      type: [orderItemSchema],
      required: true,

      validate: {
        validator: function (items) {
          return items && items.length > 0;
        },

        message: "Order must contain at least one item",
      },
    },

    // -------------------------------------------------
    // SHIPPING ADDRESS
    // -------------------------------------------------

    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },

    // -------------------------------------------------
    // PAYMENT METHOD
    // -------------------------------------------------

    paymentMethod: {
      type: String,
      enum: ["cod", "online"],
      default: "cod",
    },

    // -------------------------------------------------
    // PAYMENT STATUS
    // -------------------------------------------------

    paymentStatus: {
      type: String,
      enum: [
        "pending",
        "paid",
        "failed",
      ],
      default: "pending",
    },

    // -------------------------------------------------
    // ORDER STATUS
    // -------------------------------------------------

    orderStatus: {
      type: String,
      enum: [
        "placed",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      default: "placed",
    },

    // -------------------------------------------------
    // SUBTOTAL
    // -------------------------------------------------

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    // -------------------------------------------------
    // SHIPPING
    // -------------------------------------------------

    shipping: {
      type: Number,
      default: 0,
      min: 0,
    },

    // -------------------------------------------------
    // TOTAL
    // -------------------------------------------------

    total: {
      type: Number,
      required: true,
      min: 0,
    },
  },

  {
    timestamps: true,
  }
);

// =====================================================
// EXPORT
// =====================================================

module.exports = mongoose.model(
  "Order",
  orderSchema
);