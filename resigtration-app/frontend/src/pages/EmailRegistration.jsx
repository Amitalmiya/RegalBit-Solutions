// import React from "react";
// import axios from "axios";
// import { GoogleLogin } from "@react-oauth/google";
// import { jwtDecode } from "jwt-decode";

// const EmailRegistration = () => {
//   const handleGoogleSuccess = async (credentialResponse) => {
//     try {
//       const { credential } = credentialResponse;

//       const decoded = jwtDecode(credential);
//       console.log("Decoded User Info:", decoded);

//       const res = await axios.post("http://localhost:5000/api/users/google-signup", {
//         credential,
//       });

//       localStorage.setItem("token", res.data.token);
//       localStorage.setItem("user", JSON.stringify(res.data.user));

//       alert("Google Signup/Login Successful!");
//       window.location.href = "/home";
//     } catch (error) {
//       console.error("Google Signup/Login failed:", error);
//       alert("Google sign-in failed. Please try again.");
//     }
//   };

//   return (
//     <div className="flex items-center justify-center h-screen">
//       <GoogleLogin
//         onSuccess={handleGoogleSuccess}
//         onError={() => {
//           console.log("Google Login Failed");
//           alert("Google Login Failed!");
//         }}
//       />
//     </div>
//   );
// };

// export default EmailRegistration;
