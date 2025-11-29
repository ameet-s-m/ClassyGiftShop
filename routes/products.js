// routes/products.js
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const { requireAdmin } = require('../middleware/authMiddleware');
const router = express.Router();

// CLOUDINARY CONFIG
const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
});

/***********************
 * CREATE PRODUCT (ADMIN)
 ***********************/
router.post('/', requireAdmin, async (req, res) => {
  try {
    let { name, price, categoryId, category, description } = req.body;
    const catId = categoryId || category;

    if (!name || !price || !catId)
      return res.status(400).json({ message: 'Name, price & category required' });

    const priceNum = Number(price);
    if (Number.isNaN(priceNum) || priceNum <= 0)
      return res.status(400).json({ message: 'Invalid price' });

    if (!mongoose.Types.ObjectId.isValid(catId))
      return res.status(400).json({ message: 'Invalid category id' });

    const cat = await Category.findById(catId);
    if (!cat) return res.status(400).json({ message: "Category doesn't exist" });

    if (!req.files || !req.files.images)
      return res.status(400).json({ message: 'Upload at least one image' });

    let files = req.files.images;
    const filesArr = Array.isArray(files) ? files : [files];
    const images = [];

    // 🔥 Upload images to Cloudinary
    for (const file of filesArr) {
      const result = await cloudinary.uploader.upload(file.tempFilePath, {
        folder: "products"
      });
      images.push(result.secure_url);
    }

    const product = await Product.create({
      name,
      price: priceNum,
      category: catId,
      description,
      images // ⭐ stored as Cloudinary URLs
    });

    res.status(201).json({ message: "Product added successfully", product });

  } catch (err) {
    console.error("Create product error:", err);
    res.status(500).json({ message: "Create failed", error: err.message });
  }
});

/***********************
 * GET ALL PRODUCTS (Public)
 ***********************/
router.get('/', async (req, res) => {
  try {
    const { categoryId } = req.query;
    const filter = categoryId ? { category: categoryId } : {};
    const products = await Product.find(filter).populate('category', 'name');
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Fetch failed', error: err.message });
  }
});

/***********************
 * GET SINGLE PRODUCT
 ***********************/
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category', 'name');
    if (!product) return res.status(404).json({ message: 'Not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Fetch failed', error: err.message });
  }
});

/***********************
 * UPDATE PRODUCT (ADMIN) — now supports Cloudinary
 ***********************/
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const update = { ...req.body };
    if (update.price) update.price = Number(update.price);

    // 🔥 If new images uploaded — replace old ones via Cloudinary
    if (req.files && req.files.images) {
      let files = req.files.images;
      const filesArr = Array.isArray(files) ? files : [files];
      const newImages = [];

      for (const file of filesArr) {
        const upload = await cloudinary.uploader.upload(file.tempFilePath, {
          folder: "products"
        });
        newImages.push(upload.secure_url);
      }

      update.images = newImages;  // overwrite old images permanently
    }

    await Product.findByIdAndUpdate(req.params.id, update);
    res.json({ message: "Product updated with Cloudinary images" });

  } catch (err) {
    res.status(500).json({ message: 'Update failed', error: err.message });
  }
});

/***********************
 * DELETE PRODUCT (ADMIN)
 ***********************/
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ message: 'Delete failed', error: err.message });
  }
});

module.exports = router;
