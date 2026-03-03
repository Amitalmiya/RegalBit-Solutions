import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const ForgottenPassword = () => {
  const [identifier, setIdentifier] = useState(""); // username / email / phone
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!identifier.trim()) {
      setError("Please enter your username, email, or phone number");
      return;
    }

    try {
      const res = await axios.post(
        "http://localhost:5000/api/users/forgot-password",
        {
          identifier, // single field sent to backend
        }
      );
      setMessage(res.data.message || "Password reset link sent successfully!");
    } catch (err) {
      setError(
        err.response?.data?.message || "Something went wrong. Please try again."
      );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="w-96 bg-white shadow-lg p-6 rounded-2xl border"
      >
        <h2 className="text-2xl font-semibold mb-4 text-center text-gray-800">
          Forgot Password
        </h2>

        <p className="text-sm text-gray-600 text-center mb-6">
          Enter your <b>username</b>, <b>email</b>, or <b>phone number</b> to
          receive a password reset link.
        </p>

        <input
          type="text"
          placeholder="Enter your Username, Email, or Phone"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          className="border p-2 rounded w-full mb-3"
        />

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded w-full hover:bg-blue-700 transition duration-200"
        >
          Send Reset Link
        </button>

        {message && (
          <p className="text-green-600 mt-3 text-center font-medium">
            {message}
          </p>
        )}
        {error && (
          <p className="text-red-600 mt-3 text-center font-medium">{error}</p>
        )}

        <div className="text-center mt-5">
          <Link to="/login" className="text-blue-500 hover:underline text-sm">
            Remember your password? <span className="italic">Login here</span>
          </Link>
        </div>
      </form>
    </div>
  );
};

export default ForgottenPassword;
