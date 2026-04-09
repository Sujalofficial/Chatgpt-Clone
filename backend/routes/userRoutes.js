const express = require('express');
const router = express.Router();
const { updateProfile, getProfile } = require('../controllers/userController');
const { verifyToken } = require('../middleware/verifyToken');

router.get('/profile', verifyToken, getProfile);
router.put('/update', verifyToken, updateProfile);

module.exports = router;
