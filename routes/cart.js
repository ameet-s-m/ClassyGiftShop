// routes/cart.js
const express = require('express');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { requireUser } = require('../middleware/authMiddleware');

const router = express.Router();

/******** GET CART ********/
router.get('/', requireUser, async (req, res) => {
  let cart = await Cart.findOne({ user: req.userId }).populate(
    'items.product'
  );
  if (!cart) cart = await Cart.create({ user: req.userId, items: [] });
  res.json(cart);
});

/******** ADD TO CART ********/
router.post('/add', requireUser, async (req, res) => {
  const { productId, quantity } = req.body;
  const qty = Number(quantity) || 1;

  const product = await Product.findById(productId);
  if (!product) return res.status(400).json({ message: 'Invalid product' });

  let cart = await Cart.findOne({ user: req.userId });
  if (!cart) cart = await Cart.create({ user: req.userId, items: [] });

  const idx = cart.items.findIndex(
    (i) => String(i.product) === String(productId)
  );
  if (idx > -1) {
    cart.items[idx].quantity += qty;
  } else {
    cart.items.push({
      product: productId,
      quantity: qty,
      priceSnapshot: product.price
    });
  }

  await cart.save();
  await cart.populate('items.product');
  res.json(cart);
});

/******** UPDATE ITEM QTY ********/
router.put('/item/:itemId', requireUser, async (req, res) => {
  const { quantity } = req.body;
  let cart = await Cart.findOne({ user: req.userId });
  if (!cart) return res.status(400).json({ message: 'No cart' });

  const item = cart.items.id(req.params.itemId);
  if (!item) return res.status(404).json({ message: 'Item not found' });

  item.quantity = Number(quantity);
  if (item.quantity <= 0) item.remove();

  await cart.save();
  await cart.populate('items.product');
  res.json(cart);
});

/******** REMOVE ITEM ********/
router.delete('/item/:itemId', requireUser, async (req, res) => {
  let cart = await Cart.findOne({ user: req.userId });
  if (!cart) return res.status(400).json({ message: 'No cart' });

  const it = cart.items.id(req.params.itemId);
  if (it) it.remove();

  await cart.save();
  await cart.populate('items.product');
  res.json(cart);
});

/******** CLEAR CART ********/
router.delete('/clear', requireUser, async (req, res) => {
  await Cart.findOneAndUpdate({ user: req.userId }, { items: [] });
  res.json({ message: 'Cart cleared' });
});

module.exports = router;
