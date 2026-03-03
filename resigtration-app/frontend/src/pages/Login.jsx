import axios from "axios";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";


const Login = () => {
  const [userName, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!userName || !password) {
      setError("All fields are required");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/api/users/login", {
        userName,
        password,
      });

      if (res.status === 200 || res.status === 201) {
        const token = res.data.token;
        const userId = res.data.user.id;

        localStorage.setItem("token", token);
        localStorage.setItem("role", res.data.user.role);
        setSuccess("Login Successfully");
        alert("Login successfully!!");

        if (
          res.data.user.role === "superadmin" ||
          res.data.user.role === "admin"
        ) {
          navigate("/dashboard");
        } else {
          navigate(`/profile/${userId}`);
        }
      }
    } catch (err) {
      const message =
        err.response?.data?.message || "Server error. Please try again later.";

      if (err.response?.status === 403) {
        alert(
          "Your account has been deactivated by the superadmin. Please contact support team."
        );
      } else {
        alert(message);
      }
      setError(message);
      console.log(err);
    }
  };

const handleGoogleSuccess = async (credentialResponse) => {
  try {
    const res = await axios.post("http://localhost:5000/api/users/google-signup", {
      credential: credentialResponse.credential,
    });

    localStorage.setItem("token", res.data.token);
    localStorage.setItem("user", JSON.stringify(res.data.user));

    localStorage.setItem("role", res.data.user.role || "user")

    // window.dispatchEvent(new Event("storage"));

    alert("Google Signup/Login Successful!");
    
    navigate(`/profile/${res.data.user.id}`)
  } catch (error) {
    console.error("Google Signup failed:", error);
    alert("Sign-in failed. Please try again.");
  }
};

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 flex justify-center">
      <div className="max-w-screen-xl m-0 sm:m-10 bg-white shadow sm:rounded-lg flex justify-center flex-1">
        <div className="lg:w-1/2 xl:w-5/12 p-6 sm:p-8">
          <div>
            <img
              src="https://media.licdn.com/dms/image/v2/C510BAQFoBzmJKOzY_A/company-logo_200_200/company-logo_200_200/0/1630619835821/regalbit_solutions_logo?e=2147483647&v=beta&t=N4zeufGLJGf7cpGoaFn2Mn1mR9Gd1HYn-nZqkpaXaa8"
              className="w-32 mx-auto"
              alt="Logo"
            />
          </div>

          <div className="flex flex-col items-center">
            <h1 className="text-2xl xl:text-3xl font-extrabold mb-3">Login</h1>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            {success && <p className="text-2xl xl:text-sm mt-2">{success}</p>}
            <div className="w-full flex-1 mt-2">
              <div className="flex flex-col items-center">
                <button
                  className="w-full mb-3 max-w-xs font-bold shadow-sm rounded-lg py-3 bg-white border border-gray-200 text-gray-800 flex items-center justify-center transition-all duration-300 ease-in-out hover:shadow-md cursor-pointer"
                  onClick={() => navigate("/")}
                >
                  <div className="bg-white p-1 rounded-full">
                    <svg
                      className="w-6 h-6 text-indigo-600"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      viewBox="0 0 24 24"
                    >
                      <path d="M19 21H9a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z" />
                      <polyline points="17 21 17 13 11 13 11 21" />
                      <polyline points="12 3 12 8 17 8" />
                    </svg>
                  </div>
                  <span className="ml-4">Register Yourself</span>
                </button>
                <div className="w-full max-w-xs mb-3">
                  <GoogleOAuthProvider clientId="147357071117-3s5bnhf8tmm0scal13l4v4iv8nmr4bhn.apps.googleusercontent.com">
                    <div className="w-full font-bold shadow-sm rounded-lg py-3 bg-white border border-gray-200 flex items-center justify-center transition-all duration-300 ease-in-out hover:shadow-md cursor-pointer">
                      <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => {
                          console.log("Google Login Failed");
                          alert("Google Sign-In Failed!");
                        }}
                        shape="rectangular"
                        theme="outline"
                        text="signin_with"
                        size="large"
                        width="280"
                      />
                    </div>
                  </GoogleOAuthProvider>
                </div>

                <button
                  className="w-full max-w-xs font-bold shadow-sm rounded-lg py-3 bg-white border border-gray-200 text-gray-800 flex items-center justify-center transition-all duration-300 ease-in-out hover:shadow-md cursor-pointer"
                  onClick={() => navigate("/phone")}
                >
                  <div className="bg-white p-1 rounded-full">
                    <svg
                      className="w-6 h-6 text-indigo-600"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      viewBox="0 0 24 24"
                    >
                      <path d="M22 16.92V21a2 2 0 01-2.18 2A19.8 19.8 0 013 5.18 2 2 0 015 3h4.09a1 1 0 011 .75l1.12 4.49a1 1 0 01-.27.95l-2.2 2.2a16 16 0 006.41 6.41l2.2-2.2a1 1 0 01.95-.27l4.49 1.12a1 1 0 01.75 1z" />
                    </svg>
                  </div>
                  <span className="ml-4 text-sm font-medium">
                    Sign Up with Phone Number
                  </span>
                </button>
              </div>
              <div className="my-5 border-b text-center">
                <div className="leading-none px-2 inline-block text-sm text-gray-600 tracking-wide font-medium bg-white transform translate-y-1/2">
                  Or Login up with Username
                </div>
              </div>

              <div className="mx-auto max-w-xs">
                <form onSubmit={handleSubmit}>
                  <input
                    className="w-full px-8 py-4 rounded-lg font-medium bg-gray-100 border border-gray-200 placeholder-gray-500 text-sm focus:outline-none focus:border-gray-400 focus:bg-white"
                    type="text"
                    placeholder="Username"
                    value={userName}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                  <div className="relative">
                    <input
                      className="w-full px-8 py-4 rounded-lg font-medium bg-gray-100 border border-gray-200 placeholder-gray-500 text-sm focus:outline-none focus:border-gray-400 focus:bg-white mt-5"
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <div
                      className="absolute right-3 top-10 cursor-pointer text-gray-500"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="mt-5 tracking-wide font-semibold bg-indigo-500 text-gray-100 w-full py-4 rounded-lg hover:bg-indigo-700 transition-all duration-300 ease-in-out flex items-center justify-center focus:shadow-outline focus:outline-none cursor-pointer"
                  >
                    <svg
                      className="w-6 h-6 ml-2"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                      <circle cx="8.5" cy="7" r="4" />
                      <path d="M20 8v6M23 11h-6" />
                    </svg>
                    <span className="ml-3">Login</span>
                  </button>
                  <div className="mt-2 flex flex-col space-y-2 text-center">
                  <Link
                    to="/forgotten-password"
                    className="text-blue-500 hover:underline"
                  >
                    Forgotten password
                  </Link>
                </div>
                </form>
                <p className="mt-6 text-xs text-gray-600 text-center">
                  By signing up, I agree to the{" "}
                  <Link
                    to="#"
                    className="border-b border-gray-500 border-dotted"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    to="#"
                    className="border-b border-gray-500 border-dotted"
                  >
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-indigo-100 text-center hidden lg:flex">
          <div
            className="m-12 xl:m-16 w-full bg-contain bg-center bg-no-repeat"
            style={{
              backgroundImage:
                "url('https://storage.googleapis.com/devitary-image-host.appspot.com/15848031292911696601-undraw_designer_life_w96d.svg')",
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default Login;
