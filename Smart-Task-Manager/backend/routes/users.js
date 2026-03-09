const express = require('express');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all users (Admin and Superadmin only)
router.get('/', auth, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const { role, isActive } = req.query;
    const filter = {};

    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const users = await User.find(filter).select('-password');

    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only allow users to view their own profile, or admins/superadmins to view any
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin' && req.user._id.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this user' });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user role (Superadmin only)
router.patch('/:id/role', auth, authorize('superadmin'), async (req, res) => {
  try {
    const { role } = req.body;

    if (!['user', 'admin', 'superadmin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent superadmin from changing their own role
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(403).json({ message: 'Cannot change your own role' });
    }

    user.role = role;
    user.updatedAt = Date.now();
    await user.save();

    res.json({
      message: 'User role updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Activate/Deactivate user (Admin and Superadmin only)
router.patch('/:id/status', auth, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const { isActive } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deactivating yourself
    if (user._id.toString() === req.user._id.toString() && !isActive) {
      return res.status(403).json({ message: 'Cannot deactivate yourself' });
    }

    // Admins cannot deactivate superadmins
    if (req.user.role === 'admin' && user.role === 'superadmin') {
      return res.status(403).json({ message: 'Admins cannot deactivate superadmins' });
    }

    user.isActive = isActive;
    user.updatedAt = Date.now();
    await user.save();

    res.json({
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete user (Superadmin only)
router.delete('/:id', auth, authorize('superadmin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting yourself
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(403).json({ message: 'Cannot delete yourself' });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;