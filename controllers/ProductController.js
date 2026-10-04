const mongoose = require("mongoose");
const Product = require("../models/Product");

// =====================================================
// NORMALIZE SLUG
// =====================================================

const normalizeSlug = (value) => {
  if (!value) return "";

  return String(value)
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};


// =====================================================
// GET ALL PRODUCTS
// GET /api/products
// =====================================================

const getProducts = async (req, res) => {
  try {
    const {
      category,
      subCategory,
      featured,
      search,
    } = req.query;

    // ===============================================
    // BASE FILTER
    // ===============================================

    const filter = {
      active: true,
    };

    // ===============================================
    // CATEGORY
    // ===============================================

    if (category) {
      const categorySlug =
        normalizeSlug(category);

      if (categorySlug) {
        filter.category = categorySlug;
      }
    }

    // ===============================================
    // SUBCATEGORY
    // ===============================================

    if (subCategory) {
      const subCategorySlug =
        normalizeSlug(subCategory);

      if (subCategorySlug) {
        filter.subCategory =
          subCategorySlug;
      }
    }

    // ===============================================
    // FEATURED
    // ===============================================

    if (featured === "true") {
      filter.featured = true;
    }

    // ===============================================
    // SEARCH
    // ===============================================

    if (search && search.trim()) {
      filter.name = {
        $regex: search.trim(),
        $options: "i",
      };
    }

    console.log("");
    console.log("=================================");
    console.log("📦 PRODUCT FILTER");
    console.log("=================================");
    console.log(
      "📂 Category:",
      category || "ALL"
    );
    console.log(
      "📁 SubCategory:",
      subCategory || "ALL"
    );
    console.log(
      "⭐ Featured:",
      featured || "ALL"
    );
    console.log(
      "🔎 Search:",
      search || "ALL"
    );
    console.log(
      "🧩 MongoDB Filter:",
      filter
    );
    console.log("=================================");

    // ===============================================
    // FETCH
    // ===============================================

    const products = await Product.find(filter)
      .sort({
        createdAt: -1,
      })
      .lean();

    console.log(
      "✅ Products Found:",
      products.length
    );

    // ===============================================
    // RESPONSE
    // ===============================================

    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    });

  } catch (error) {

    console.error(
      "❌ Get Products Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: error.message,
    });
  }
};


// =====================================================
// GET SINGLE PRODUCT
// GET /api/products/:id
// =====================================================

const getProduct = async (req, res) => {
  try {

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product =
      await Product.findById(id).lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      product,
    });

  } catch (error) {

    console.error(
      "❌ Get Product Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      error: error.message,
    });
  }
};


// =====================================================
// CREATE PRODUCT
// POST /api/products
// =====================================================

const createProduct = async (req, res) => {
  try {

    const data = {
      ...req.body,

      name:
        String(req.body.name || "").trim(),

      category:
        normalizeSlug(req.body.category),

      subCategory:
        normalizeSlug(req.body.subCategory),

      slug:
        req.body.slug
          ? normalizeSlug(req.body.slug)
          : normalizeSlug(req.body.name),

      price:
        Number(req.body.price || 0),

      originalPrice:
        Number(req.body.originalPrice || 0),

      stock:
        Number(req.body.stock || 0),

      active:
        req.body.active !== undefined
          ? Boolean(req.body.active)
          : true,

      featured:
        req.body.featured !== undefined
          ? Boolean(req.body.featured)
          : false,
    };

    console.log("");
    console.log("=================================");
    console.log("📥 CREATE PRODUCT");
    console.log("=================================");
    console.log(data);
    console.log("=================================");

    const product =
      await Product.create(data);

    return res.status(201).json({
      success: true,
      message:
        "Product created successfully",
      product,
    });

  } catch (error) {

    console.error(
      "❌ Create Product Error:",
      error
    );

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};


// =====================================================
// UPDATE PRODUCT
// PUT /api/products/:id
// =====================================================

const updateProduct = async (req, res) => {
  try {

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const data = {
      ...req.body,
    };

    // ===============================================
    // NORMALIZE
    // ===============================================

    if (data.name !== undefined) {
      data.name =
        String(data.name).trim();
    }

    if (data.category !== undefined) {
      data.category =
        normalizeSlug(data.category);
    }

    if (data.subCategory !== undefined) {
      data.subCategory =
        normalizeSlug(data.subCategory);
    }

    if (data.slug !== undefined) {
      data.slug =
        normalizeSlug(data.slug);
    }

    // ===============================================
    // NUMBERS
    // ===============================================

    if (data.price !== undefined) {
      data.price =
        Number(data.price);
    }

    if (
      data.originalPrice !== undefined
    ) {
      data.originalPrice =
        Number(data.originalPrice);
    }

    if (data.stock !== undefined) {
      data.stock =
        Number(data.stock);
    }

    // ===============================================
    // UPDATE
    // ===============================================

    const product =
      await Product.findByIdAndUpdate(
        id,
        data,
        {
          new: true,
          runValidators: true,
        }
      );

    if (!product) {
      return res.status(404).json({
        success: false,
        message:
          "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Product updated successfully",
      product,
    });

  } catch (error) {

    console.error(
      "❌ Update Product Error:",
      error
    );

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};


// =====================================================
// DELETE PRODUCT
// DELETE /api/products/:id
// =====================================================

const deleteProduct = async (req, res) => {
  try {

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product =
      await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message:
          "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Product deleted successfully",
    });

  } catch (error) {

    console.error(
      "❌ Delete Product Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to delete product",
      error: error.message,
    });
  }
};


module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
};