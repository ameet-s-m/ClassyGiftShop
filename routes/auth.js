// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { requireUser } = require('../middleware/authMiddleware');

const router = express.Router();

function generateToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
}

// SIGNUP
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, phone, altPhone, address } = req.body;

    if (!name || !email || !password || !phone || !altPhone || !address) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(400).json({ message: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      passwordHash,
      phone,
      altPhone,
      address
    });

    const token = generateToken({ id: user._id, role: 'user' });

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'Lax',
      secure: false
    });

    res.status(201).json({
      message: 'Signup success',
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    res.status(500).json({ message: 'Signup failed', error: err.message });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: 'Invalid email or password' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok)
      return res.status(400).json({ message: 'Invalid email or password' });

    const token = generateToken({ id: user._id, role: 'user' });

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'Lax',
      secure: false
    });

    res.json({
      message: 'Login success',
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
});

// CURRENT USER
router.get('/me', requireUser, async (req, res) => {
  const user = await User.findById(req.userId).select('-passwordHash');
  res.json(user);
});

// UPDATE PROFILE (name, phone, altPhone, address only - email is immutable)
router.put('/profile', requireUser, async (req, res) => {
  try {
    const { name, phone, altPhone, address } = req.body;

    if (!name || !phone || !address) {
      return res.status(400).json({ message: 'Name, phone, and address are required' });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { name, phone, altPhone, address },
      { new: true }
    ).select('-passwordHash');

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (err) {
    res.status(500).json({ message: 'Profile update failed', error: err.message });
  }
});

// LOGOUT
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

module.exports = router;
