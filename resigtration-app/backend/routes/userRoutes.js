const express = require("express");
const router = express.Router();

const authenticateToken = require('../middleware/userMiddleware');
const { isAdmin, isSuperAdmin, isAdminOrSuperAdmin } = require('../middleware/roleMiddleware');

const {
  loginUser,
  userRegistration,
  allUsers,
  getUserById,
  updateUser,
  deleteUser,
  userStatus,
  getUserProfile,
  forgotPassword,
  resetPassword,
  googleSignup,
} = require("../controllers/userController");


router.post("/", userRegistration);
router.post("/login", loginUser);


router.get("/profile/:id", authenticateToken, getUserProfile);
router.put("/:id", authenticateToken, updateUser);
router.get("/:id", authenticateToken, getUserById);


router.get("/", authenticateToken, isAdminOrSuperAdmin, allUsers);
router.patch("/user-status/:id", authenticateToken, isAdminOrSuperAdmin, userStatus);


router.delete("/:id", authenticateToken, isSuperAdmin, deleteUser);
router.get("/dashboard", authenticateToken, isSuperAdmin);


router.get("/dashboard", authenticateToken, isAdminOrSuperAdmin);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);


router.post("/google-signup", googleSignup);


module.exports = router;
