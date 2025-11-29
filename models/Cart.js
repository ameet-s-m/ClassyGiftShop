const mongoose = require('mongoose');

const CartItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: { type: Number, default: 1 },
    priceSnapshot: { type: Number, required: true }
  },
  { _id: true }
);

const CartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true },
    items: [CartItemSchema]
  },
  { timestamps: true }
);

module.exports = mongoose.models.Cart || mongoose.model('Cart', CartSchema);
