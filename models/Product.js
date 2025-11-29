const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    images: [String],
    description: String
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Product || mongoose.model('Product', ProductSchema);
