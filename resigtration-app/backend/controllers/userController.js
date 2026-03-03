const { pool, poolPhone, poolEmail } = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { OAuth2Client } = require("google-auth-library");
const { generateToken, verifyToken } = require("../utils/tokenHelpers");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const userRegistration = async (req, res) => {
  try {
    const {
      userName,
      email,
      phone,
      dateOfBirth,
      // socialSecurityNo,
      // driverLicense,
      gender,
      bloodGroup,
      zipCode,
      // websiteUrl,
      // creditCardNo,
      // timeFormat,
      // hexaDecimalColorCode,
      password,
      role,
    } = req.body;

    if (!userName || !email) {
      return res.status(400).json({ message: "Name and Email are required." });
    }

    const [existing] = await pool.query(
      `SELECT * FROM users WHERE email = ? OR userName = ?`,
      [email, userName]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: "User already exists." });
    }

    const validRoles = ["user", "admin"];

    const userRole = validRoles.includes(role) ? role : "user";

    const password_hash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      `INSERT INTO users
      (userName, email, phone, dateOfBirth,
      gender, bloodGroup, zipCode, password,
      password_hash, role)
      VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userName,
        email,
        phone,
        dateOfBirth || null,
        // socialSecurityNo || null,
        // driverLicense || null,
        gender || null,
        bloodGroup || null,
        zipCode || null,
        // websiteUrl || null,
        // creditCardNo || null,
        // timeFormat || null,
        // hexaDecimalColorCode || null,
        password,
        password_hash,
        userRole,
      ]
    );

    const token = generateToken(result.insertId, userRole);

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: { id: result.insertId, userName, role: userRole },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { userName, password } = req.body;
    if (!userName || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const [mainUsers] = await pool.query(
      `SELECT * FROM users WHERE userName = ?`,
      [userName]
    );
    const [phoneUsers] = await poolPhone.query(
      `SELECT * FROM users WHERE userName = ?`,
      [userName]
    );
    const [emailUsers] = await poolEmail.query(
      `SELECT * FROM users WHERE userName = ?`,
      [userName]
    );
    const user = mainUsers[0] || phoneUsers[0] || emailUsers[0];

    if (!user) {
      return res.status(401).json({ message: "Invalid username or password." });
    }

    if (user.status === "deactive") {
      return res.status(403).json({ message: "Your Account is deactivated" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid username or password." });

    const token = generateToken(user.id, user.role);

    res.status(200).json({
      message: "Login successfully",
      token,
      user: {
        id: user.id,
        userName: user.userName,
        role: user.role,
        status: user.status,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const [mainUsers] = await pool.query(`SELECT * FROM users WHERE id = ?`, [
      userId,
    ]);
    const [phoneUsers] = await poolPhone.query(
      `SELECT id, userName, phone FROM users WHERE id = ?`,
      [userId]
    );
    const [emailUsers] = await poolEmail.query(
      `SELECT id, userName, email FROM users WHERE id = ?`,
      [userId]
    );

    const user = mainUsers[0] || phoneUsers[0] || emailUsers[0];
    if (!user) return res.status(404).json({ message: "User not found." });

    res.status(200).json({ message: "Profile fetched successfully", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

const getUserFromToken = async (token) => {
  try {
    if (!token) return { success: false, message: "Token missing" };
    const trimmedToken = token.replace(/^Bearer\s+/i, "").trim();
    const decoded = verifyToken(trimmedToken);
    if (!decoded)
      return { success: false, message: "Invalid or expired token" };

    const [mainUsers] = await pool.query(`SELECT * FROM users WHERE id = ?`, [
      decoded.id,
    ]);
    const [phoneUsers] = await poolPhone.query(
      `SELECT * FROM users WHERE id = ?`,
      [decoded.id]
    );
    const [emailUsers] = await poolEmail.query(
      `SELECT * FROM users WHERE id = ?`,
      [decoded.id]
    );

    const user = mainUsers[0] || phoneUsers[0] || emailUsers[0];
    if (!user) return { success: false, message: "User not found" };

    return { success: true, user };
  } catch (err) {
    console.error("Token Verification error:", err.message);
    return { success: false, message: "Invalid or expired token" };
  }
};

const allUsers = async (req, res) => {
  try {
    if (!["admin", "superadmin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const [mainUsers] = await pool.query("SELECT * FROM users");
    const [phoneUsers] = await poolPhone.query("SELECT * FROM users");
    const [emailUsers] = await poolEmail.query("SELECT * FROM users");

    const allUsers = [
      ...(mainUsers?.map((u) => ({
        ...u,
        source: "main",
        uniqueId: `main-${u.id}`,
      })) || []),
      ...(phoneUsers?.map((u) => ({
        ...u,
        source: "phone",
        uniqueId: `phone-${u.id}`,
      })) || []),
      ...(emailUsers?.map((u) => ({
        ...u,
        source: "email",
        uniqueId: `email-${u.id}`,
      })) || []),
    ];

    res.status(200).json({
      message: "All users fetched successfully",
      totalUsers: allUsers.length,
      allUsers,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error", error: err });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const [mainUsers] = await pool.query("SELECT * FROM users WHERE id = ?", [
      id,
    ]);
    const [phoneUsers] = await poolPhone.query(
      "SELECT * FROM users WHERE id = ?",
      [id]
    );
    const [emailUsers] = await poolEmail.query(
      "SELECT * FROM users WHERE id = ?",
      [id]
    );

    const user = mainUsers[0] || phoneUsers[0] || emailUsers[0];
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: "User fetched successfully", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      phone,
      zipCode,
      email,
      password,
      dateOfBirth,
      userName,
      gender,
      bloodGroup,
    } = req.body;

    if (!id) return res.status(400).json({ message: "User Id is required" });

    const updatedData = [
      phone,
      zipCode,
      email,
      password,
      dateOfBirth,
      userName,
      gender,
      bloodGroup,
      id,
    ];

    const [mainUser] = await pool.query("SELECT * FROM users WHERE id = ?", [
      id,
    ]);
    const [phoneUser] = await poolPhone.query(
      "SELECT * FROM users WHERE id = ?",
      [id]
    );
    const [emailUser] = await poolEmail.query(
      "SELECT * FROM users WHERE id = ?",
      [id]
    );

    let result;

    if (mainUser.length > 0) {
      [result] = await pool.query(
        `UPDATE users SET phone = ?,  zipCode=?, email=?, password=?, dateOfBirth=?, userName=?, gender=?, bloodGroup=? 
         WHERE id=?`,
        updatedData
      );
    } else if (phoneUser.length > 0) {
      [result] = await poolPhone.query(
        `UPDATE users 
         SET phone=?, zipCode=?, email=?, password=?, dateOfBirth=?, userName=?, gender=?, bloodGroup=? 
         WHERE id=?`,
        updatedData
      );
    } else if (emailUser.length > 0) {
      [result] = await poolEmail.query(
        `UPDATE users 
         SET phone=?, zipCode=?, email=?, password=?, dateOfBirth=?, userName=?, gender=?, bloodGroup=? 
         WHERE id=?`,
        updatedData
      );
    } else {
      return res.status(404).json({ message: "User not found" });
    }

    if (result.affectedRows === 0) {
      return res.status(400).json({ message: "No changes made to the user" });
    }

    res.status(200).json({ message: "User updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const [resultMain] = await pool.query("DELETE FROM users WHERE id = ?", [
      id,
    ]);
    const [resultPhone] = await poolPhone.query(
      "DELETE FROM users WHERE id = ?",
      [id]
    );
    const [resultEmail] = await poolEmail.query(
      "DELETE FROM users WHERE id = ?",
      [id]
    );

    if (
      resultMain.affectedRows === 0 &&
      resultPhone.affectedRows === 0 &&
      resultEmail.affectedRows === 0
    ) {
      return res
        .status(404)
        .json({ message: "User not found in any database" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

const userStatus = async (req, res) => {
  try {
    const { id } = req.params;
    let { status } = req.body;

    if (!["active", "deactivate"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const dbStatus = status === "deactivate" ? "deactive" : "active";

    const [resultMain] = await pool.query(
      `UPDATE users SET status = ? WHERE id = ?`,
      [dbStatus, id]
    );
    const [resultPhone] = await poolPhone.query(
      `UPDATE users SET status = ? WHERE id = ?`,
      [dbStatus, id]
    );
    const [resultEmail] = await poolEmail.query(
      `UPDATE users SET status = ? WHERE id = ?`,
      [dbStatus, id]
    );

    if (
      resultMain.affectedRows === 0 &&
      resultPhone.affectedRows === 0 &&
      resultEmail.affectedRows === 0
    ) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: `User ${
        status === "deactivate" ? "deactivated" : "activated"
      } successfully`,
      status,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { identifier } = req.body;

    if (!identifier) {
      return res
        .status(400)
        .json({ message: "Please provide a username, email, or phone number" });
    }

    const [mainUsers] = await pool.query(
      "SELECT * FROM users WHERE userName = ? OR email = ? OR phone = ?",
      [identifier, identifier, identifier]
    );

    const [phoneUsers] = await poolPhone.query(
      "SELECT * FROM users WHERE userName = ? OR phone = ?",
      [identifier, identifier]
    );

    const [emailUsers] = await poolEmail.query(
      "SELECT * FROM users WHERE userName = ? OR email = ?",
      [identifier, identifier]
    );

    const user = mainUsers[0] || phoneUsers[0] || emailUsers[0];

    if (!user) {
      return res
        .status(404)
        .json({ message: "No account found with provided details" });
    }

    const resetToken = jwt.sign(
      { id: user.id, userName: user.userName },
      process.env.JWT_SECRET,
      { expiresIn: "20m" }
    );

    const resetLink = `http://localhost:3000/reset-password/${resetToken}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Support Team" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Password Reset Request",
      html: `
        <h2>Password Reset Request</h2>
        <p>Hello ${user.userName},</p>
        <p>Click the button below to reset your password:</p>
        <a href="${resetLink}" style="background:#007bff;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">Reset Password</a>
        <p>This link will expire in 20 minutes.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Password reset link sent successfully!" });
  } catch (error) {
    console.error("Error in forgotPassword:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword, confirmPassword } = req.body;

    if (!newPassword || !confirmPassword) {
      return res
        .status(400)
        .json({ message: "Both password fields are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    const userId = decoded.id;

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await Promise.all([
      pool.query("UPDATE users SET password_hash = ? WHERE id = ?", [
        hashedPassword,
        userId,
      ]),
      poolPhone.query("UPDATE users SET password_hash = ? WHERE id = ?", [
        hashedPassword,
        userId,
      ]),
      poolEmail.query("UPDATE users SET password_hash = ? WHERE id = ?", [
        hashedPassword,
        userId,
      ]),
    ]);

    res.status(200).json({ message: "Password has been successfully reset" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Server error during password reset" });
  }
};


const googleSignup = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: "No Google token provided." });
    }

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { name, email, sub: googleId, picture } = payload;

    const [existingUser] = await pool.query(
      `SELECT * FROM users WHERE email = ?`,
      [email]
    );

    let user;

    if (existingUser.length > 0) {
      user = existingUser[0];
    } else {
      const hashedPassword = await bcrypt.hash(googleId, 10);
      const [result] = await pool.query(
        `INSERT INTO users (userName, email, password, googleId, profilePicture, role)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [name, email, hashedPassword, googleId, profilePicture, "user"]
      );

      const [newUser] = await pool.query("SELECT * FROM users WHERE id = ?", [
        result.insertId,
      ]);
      user = newUser[0];
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Google Signup/Login successful",
      token,
      user,
    });
  } catch (error) {
    console.error("Google signup error:", error);
    res.status(500).json({ message: "Google signup failed" });
  }
};

module.exports = {
  userRegistration,
  loginUser,
  getUserProfile,
  getUserFromToken,
  allUsers,
  getUserById,
  updateUser,
  deleteUser,
  userStatus,
  forgotPassword,
  resetPassword,
  googleSignup,
};
