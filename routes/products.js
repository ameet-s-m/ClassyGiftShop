// routes/products.js
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const { requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

/***********************
 * CREATE PRODUCT (ADMIN)
 ***********************/
router.post('/', requireAdmin, async (req, res) => {
  try {
    // 1. Basic fields
    let { name, price, categoryId, category, description } = req.body;

    // Allow either "category" or "categoryId"
    const catId = categoryId || category;

    if (!name || !price || !catId) {
      return res
        .status(400)
        .json({ message: 'Name, price and category are required' });
    }

    // Convert price safely
    const priceNum = Number(price);
    if (Number.isNaN(priceNum) || priceNum <= 0) {
      return res.status(400).json({ message: 'Invalid price' });
    }

    // 2. Validate category id format
    if (!mongoose.Types.ObjectId.isValid(catId)) {
      return res.status(400).json({ message: 'Invalid category id' });
    }

    const cat = await Category.findById(catId);
    if (!cat) {
      return res.status(400).json({ message: 'Category does not exist' });
    }

    // 3. Handle images using Cloudinary
const cloudinary = require("cloudinary").v2;
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
});

if (!req.files || !req.files.images) {
    return res.status(400).json({ message: 'Please upload at least one product image' });
}

let files = req.files.images;
const filesArr = Array.isArray(files) ? files : [files];
const images = [];

for (const file of filesArr) {
    const uploadResult = await cloudinary.uploader.upload(file.tempFilePath, {
        folder: "products"
    });
    images.push(uploadResult.secure_url);
}


    // 4. Save product
    const product = await Product.create({
      name,
      price: priceNum,
      category: catId,
      description,
      images
    });

    return res
      .status(201)
      .json({ message: 'Product added successfully', product });
  } catch (err) {
    console.error('Create product error:', err); // this will show exact cause in terminal
    return res
      .status(500)
      .json({ message: 'Create product failed', error: err.message });
  }
});

/***********************
 * GET PRODUCTS (public)
 ***********************/
router.get('/', async (req, res) => {
  try {
    const { categoryId } = req.query;
    const filter = categoryId ? { category: categoryId } : {};
    const products = await Product.find(filter).populate('category', 'name');
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Get products failed', error: err.message });
  }
});

/***********************
 * GET SINGLE PRODUCT
 ***********************/
router.get('/:id', async (req, res) => {
  try {
    const p = await Product.findById(req.params.id).populate('category', 'name');
    if (!p) return res.status(404).json({ message: 'Product not found' });
    res.json(p);
  } catch (err) {
    res.status(500).json({ message: 'Get product failed', error: err.message });
  }
});

/***********************
 * UPDATE PRODUCT (ADMIN)
 ***********************/
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const update = { ...req.body };
    if (update.price) update.price = Number(update.price);
    await Product.findByIdAndUpdate(req.params.id, update);
    res.json({ message: 'Product updated' });
  } catch (err) {
    res.status(500).json({ message: 'Update product failed', error: err.message });
  }
});

/***********************
 * DELETE PRODUCT (ADMIN)
 ***********************/
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Delete product failed', error: err.message });
  }
});

module.exports = router;
