import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [strength, setStrength] = useState({ label: "", color: "", width: "0%" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Password strength evaluator
  const evaluateStrength = (password) => {
    let score = 0;

    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[@$!%*?&]/.test(password)) score++;

    switch (score) {
      case 0:
      case 1:
        return { label: "Weak", color: "bg-red-500", width: "25%" };
      case 2:
      case 3:
        return { label: "Medium", color: "bg-yellow-500", width: "60%" };
      case 4:
      case 5:
        return { label: "Strong", color: "bg-green-500", width: "100%" };
      default:
        return { label: "", color: "", width: "0%" };
    }
  };

  const handlePasswordChange = (e) => {
    const password = e.target.value;
    setNewPassword(password);
    setStrength(evaluateStrength(password));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (newPassword !== confirmPassword) {
      return setError("Passwords do not match");
    }

    try {
      const res = await axios.post(
        `http://localhost:5000/api/users/reset-password/${token}`,
        { newPassword, confirmPassword }
      );
      setMessage(res.data.message || "Password reset successfully");

      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-xl p-6 rounded-2xl w-96"
      >
        <h2 className="text-2xl font-semibold mb-4 text-center text-blue-700">
          Reset Your Password
        </h2>

        {/* New Password Input */}
        <div className="relative mb-2">
          <input
            type={showNewPassword ? "text" : "password"}
            placeholder="Enter new password"
            value={newPassword}
            onChange={handlePasswordChange}
            className="border p-2 rounded w-full pr-10 focus:ring-2 focus:ring-blue-400 outline-none"
            required
          />
          <span
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute right-3 top-2.5 text-gray-600 cursor-pointer"
          >
            {showNewPassword ? (
              <AiOutlineEyeInvisible size={22} />
            ) : (
              <AiOutlineEye size={22} />
            )}
          </span>
        </div>

        {/* Password Strength Meter */}
        {strength.label && (
          <div className="mb-4">
            <div className="w-full h-2 bg-gray-200 rounded-full mt-1">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${strength.color}`}
                style={{ width: strength.width }}
              ></div>
            </div>
            <p
              className={`text-sm mt-1 text-center ${
                strength.label === "Strong"
                  ? "text-green-600"
                  : strength.label === "Medium"
                  ? "text-yellow-600"
                  : "text-red-600"
              }`}
            >
              Strength: <b>{strength.label}</b>
            </p>
          </div>
        )}

        {/* Confirm Password Input */}
        <div className="relative mb-4">
          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="border p-2 rounded w-full pr-10 focus:ring-2 focus:ring-blue-400 outline-none"
            required
          />
          <span
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-2.5 text-gray-600 cursor-pointer"
          >
            {showConfirmPassword ? (
              <AiOutlineEyeInvisible size={22} />
            ) : (
              <AiOutlineEye size={22} />
            )}
          </span>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded w-full hover:bg-blue-700 transition"
        >
          Reset Password
        </button>

        {/* Messages */}
        {message && (
          <p className="text-green-600 mt-3 text-center">{message}</p>
        )}
        {error && <p className="text-red-600 mt-3 text-center">{error}</p>}

        <div className="text-center mt-4">
          <Link to="/login" className="text-blue-500 hover:underline">
            Back to Login
          </Link>
        </div>
      </form>
    </div>
  );
};

export default ResetPassword;
