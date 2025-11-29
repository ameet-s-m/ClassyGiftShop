// routes/categories.js
const express = require('express');
const Category = require('../models/Category');
const { requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

/******** CREATE CATEGORY (ADMIN) ********/
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Name required' });

    const exists = await Category.findOne({ name });
    if (exists) return res.status(400).json({ message: 'Category exists' });

    const cat = await Category.create({ name, description });
    res.status(201).json(cat);
  } catch (err) {
    res.status(500).json({ message: 'Create category failed', error: err.message });
  }
});

/******** GET ALL CATEGORIES (PUBLIC) ********/
router.get('/', async (req, res) => {
  const cats = await Category.find().sort({ name: 1 });
  res.json(cats);
});

/******** UPDATE CATEGORY (ADMIN) ********/
router.put('/:id', requireAdmin, async (req, res) => {
  await Category.findByIdAndUpdate(req.params.id, req.body);
  res.json({ message: 'Category updated' });
});

/******** DELETE CATEGORY (ADMIN) ********/
router.delete('/:id', requireAdmin, async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  res.json({ message: 'Category deleted' });
});

module.exports = router;
