// routes/admin.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const User = require('../models/User');
const Cart = require('../models/Cart');
const { requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

function generateToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
}

/********* SEED ADMIN (run via curl ONCE) *********/
router.post('/seed-admin', async (req, res) => {
  try {
    const { email, password } = req.body;
    const exists = await Admin.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Admin already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    await Admin.create({ email, passwordHash });

    res.status(201).json({ message: 'Admin created' });
  } catch (err) {
    res.status(500).json({ message: 'Seed admin failed', error: err.message });
  }
});

/********* ADMIN LOGIN *********/
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(400).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) return res.status(400).json({ message: 'Invalid credentials' });

    const token = generateToken({ id: admin._id, role: 'admin' });

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'Lax',
      secure: false
    });

    res.json({ message: 'Admin Login Successful' });
  } catch (err) {
    res.status(500).json({ message: 'Admin login failed', error: err.message });
  }
});

/********* ADMIN ME (dashboard header) *********/
router.get('/me', requireAdmin, async (req, res) => {
  const admin = await Admin.findById(req.adminId).select('email');
  res.json({ email: admin.email });
});

/********* LOGOUT *********/
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Admin logged out' });
});

/********* USERS LIST *********/
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Users fetch failed' });
  }
});

/********* UPDATE USER *********/
router.put('/users/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, altPhone, address } = req.body;
    
    // Check if email is already used by another user
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: id } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }
    
    const user = await User.findByIdAndUpdate(
      id,
      { name, email, phone, altPhone, address },
      { new: true, runValidators: true }
    );
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User updated', user });
  } catch (err) {
    res.status(500).json({ message: 'User update failed', error: err.message });
  }
});

/********* DELETE USER *********/
router.delete('/users/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    await Cart.findOneAndDelete({ user: id });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: 'User delete failed' });
  }
});

module.exports = router;
