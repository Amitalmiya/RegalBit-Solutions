import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Link } from "react-router-dom";
import "react-phone-input-2/lib/style.css";
import PhoneInput from "react-phone-input-2";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";


const PhoneRegistration = () => {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  const [otpSent, setOtpSent] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [disableTime, setDisableTime] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(3);

  const navigate = useNavigate();
  const inputs = useRef([]);

  const phoneRegex = /^\+?[1-9]\d{1,3}[\s-]?\d{6,14}$/;

  useEffect(() => {
    let timer;
    if (disableTime > 0) {
      timer = setInterval(() => {
        setDisableTime((prev) => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [disableTime]);

  const handleRequestOtp = async (e) => {
    e.preventDefault();

    if (!phoneRegex.test(phone))
      return setError("Enter a valid Indian phone number");

    setError("");

    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/signup/requestphone-otp",
        { phone }
      );
      console.log("OTP sent:", res.data.otp);
      alert("OTP sent to your phone number!");
      setOtpSent(true);
      setAttemptsLeft(3);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send OTP");
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (!enteredOtp) return setError("Please enter the OTP");

    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/signup/verifyphone-otp",
        { phone, otp: enteredOtp }
      );

      console.log("Phone registration success:", res.data);
      localStorage.setItem("token", res.data.token);
      setIsVerified(true);
      alert("Registration Successful! Redirecting to profile...");
      navigate(`/profile-setup/${res.data.token}`, {
        state: { phone: phone, userId: res.data.id }
      });
    } catch (err) {
      console.error("OTP verification error:", err);
      const errorMessage =
        err.response?.data?.error || "OTP verification failed";
      setError(errorMessage);

      if (errorMessage.includes("Try again in")) {
        const match = errorMessage.match(/(\d+)/);
        if (match) setDisableTime(parseInt(match[1], 10) * 60);
      }

      setAttemptsLeft((prev) => {
        const newAttempts = prev - 1;
        if (newAttempts <= 0) {
          setError("You have used all attempts. Please try again later.");
        } else {
          setError(`Wrong OTP. ${newAttempts} attempts left.`);
        }
        return newAttempts;
      });
    }
  };

  const handleInput = (e, index) => {
    const value = e.target.value.replace(/\D/, "");
    if (!value) return;

    const newOtp = enteredOtp.split("");
    newOtp[index] = value;
    setEnteredOtp(newOtp.join(""));
    if (value && index < 5) inputs.current[index + 1].focus();
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !enteredOtp[index] && index > 0) {
      inputs.current[index - 1].focus();
    }
  };

  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? "0" : ""}${sec}`;
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await axios.post("http://localhost:5000/api/users/google-signup", {
        credential: credentialResponse.credential,
      });
  
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
  
      alert("Google Signup/Login Successful!");
      // window.location.href = "/profile/${res.data.token}";
      navigate(`/profile/${res.data.token}`)
    } catch (error) {
      console.error("Google Signup failed:", error);
      alert("Sign-in failed. Please try again.");
    }
  };

  if (otpSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white dark:bg-gray-700 shadow-2xl rounded-3xl w-full max-w-md overflow-hidden">
          <div className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-white">
              Verify OTP
            </h2>
            {error && (
              <p className="text-sm text-red-600 dark:text-red-300 mb-6">
                {error}
              </p>
            )}
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              Enter the 6-digit code sent to your phone
            </p>

            <form onSubmit={handleVerifyOtp}>
              <div className="flex justify-center space-x-4 mb-6">
                {[...Array(6)].map((_, i) => (
                  <input
                    key={i}
                    type="text"
                    maxLength="1"
                    ref={(el) => (inputs.current[i] = el)}
                    onChange={(e) => handleInput(e, i)}
                    onKeyDown={(e) => handleKeyDown(e, i)}
                    className="w-12 h-16 text-center text-2xl border-2 border-blue-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-transform duration-300 hover:scale-110 dark:bg-gray-600 dark:text-white dark:border-blue-400"
                  />
                ))}
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                Didn’t receive code?{" "}
                <button
                  type="button"
                  disabled={disableTime > 0}
                  className={`text-blue-500 hover:underline ${
                    disableTime > 0 ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  onClick={handleRequestOtp}
                >
                  {disableTime > 0
                    ? `Resend in ${formatTime(disableTime)}`
                    : "Resend OTP"}
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-transform duration-300 hover:scale-105"
              >
                Verify OTP
              </button>
              {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 flex justify-center">
      <div className="max-w-screen-xl m-0 sm:m-10 bg-white shadow sm:rounded-lg flex justify-center flex-1">
        <div className="lg:w-1/2 xl:w-5/12 p-6 sm:p-8">
          <div className="flex flex-col items-center">
            <img
              src="https://media.licdn.com/dms/image/v2/C510BAQFoBzmJKOzY_A/company-logo_200_200/company-logo_200_200/0/1630619835821/regalbit_solutions_logo?e=2147483647&v=beta&t=N4zeufGLJGf7cpGoaFn2Mn1mR9Gd1HYn-nZqkpaXaa8"
              className="w-32 mx-auto mb-4"
              alt="Logo"
            />
            <h1 className="text-2xl xl:text-3xl font-extrabold mb-2">
              Create account using Phone
            </h1>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>

          <div className="flex flex-col items-center mt-4 space-y-3">
            <button
              className="w-full max-w-xs font-bold shadow-sm rounded-lg py-3 bg-white border border-gray-200 text-gray-800 flex items-center justify-center transition-all duration-300 ease-in-out hover:shadow-md cursor-pointer"
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
              onClick={() => navigate("/login")}
            >
              <div className="bg-white p-2 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 text-gray-800"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5z" />
                </svg>
              </div>
              <span className="ml-4">Already have an account?</span>
            </button>
          </div>

          <div className="my-5 border-b text-center">
            <span className="leading-none px-2 inline-block text-sm text-gray-600 font-medium bg-white transform translate-y-1/2">
              Or continue with your Phone Number
            </span>
          </div>

          <form onSubmit={handleRequestOtp} className="mx-auto max-w-xs">
            <PhoneInput
              country={"in"}
              value={phone}
              onChange={setPhone}
              inputStyle={{
                width: "100%",
                height: "50px",
                borderRadius: "8px",
                fontSize: "15px",
                border: "1px solid #d1d5db",
                backgroundColor: "#f9fafb",
              }}
              buttonStyle={{
                border: "1px solid #d1d5db",
                backgroundColor: "#f9fafb",
              }}
            />

            <button
              type="submit"
              className="mt-5 tracking-wide font-semibold bg-indigo-500 text-gray-100 w-full py-4 rounded-lg hover:bg-indigo-700 transition-all duration-300 flex items-center justify-center"
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
              <span className="ml-3">Send OTP</span>
            </button>
          </form>
          <p className="mt-6 text-xs text-gray-600 text-center">
            By phone number, I agree to the{" "}
            <Link to="#" className="border-b border-gray-500 border-dotted">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="#" className="border-b border-gray-500 border-dotted">
              Privacy Policy
            </Link>
            .
          </p>
        </div>

        <div className="flex-1 bg-indigo-100 text-center hidden lg:flex">
          <div
            className="m-12 xl:m-16 w-full bg-contain bg-center bg-no-repeat"
            style={{
              backgroundImage:
                "url('https://img.freepik.com/premium-vector/vector-professional-icon-business-illustration-line-symbol-people-management-career-set-c_1013341-77516.jpg')",
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default PhoneRegistration;
