const express = require("express");

const router = express.Router();

const {
  createOrder,
  getUserOrders,
  getOrderById,
} = require("../controllers/orderController");


// =====================================================
// CREATE ORDER
// POST /api/orders
// =====================================================

router.post(
  "/",
  createOrder
);


// =====================================================
// GET USER ORDERS
// GET /api/orders/user/:userId
// =====================================================

router.get(
  "/user/:userId",
  getUserOrders
);


// =====================================================
// GET SINGLE ORDER
// GET /api/orders/:id
// =====================================================

router.get(
  "/:id",
  getOrderById
);


// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;