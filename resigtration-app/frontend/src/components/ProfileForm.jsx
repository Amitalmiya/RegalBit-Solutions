import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate, useLocation } from "react-router-dom";

const ProfileForm = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const userId = location.state?.userId;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [formData, setFormData] = useState({
    userName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    bloodGroup: "",
    password: "",
    zipCode: "",
  });

  const regex = {
    userName: /^[A-Za-z_][A-Za-z0-9_]{2,19}$/,
    email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.com$/i,
    phone: /^(\+91)?[6-9]\d{9}$/, 
    password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    zipCode: /^\d{5}(-\d{4})?$/,
    
  };

  useEffect(() => {
    if (!userId || !token) return;

    (async () => {
      try {
        const { data } = await axios.get(`http://localhost:5000/api/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFormData((prev) => ({ ...prev, ...data }));
      } catch (error) {
        console.error("Failed to fetch user details:", error);
        setMessage({ type: "error", text: "Failed to fetch profile data." });
      } finally {
        setLoading(false);
      }
    })();
  }, [token, userId]);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const validateForm = () => {
    if (!regex.userName.test(formData.userName))
      return "Username must be 4–16 characters and cannot start with a number.";
    if (!regex.email.test(formData.email))
      return "Please enter a valid email address.";
    if (!regex.phone.test(formData.phone))
      return "Please enter a valid Indian phone number.";
    if (!regex.password.test(formData.password))
      return "Password must be at least 6 characters long and contain both letters and numbers.";
    if (!regex.zipCode.test(formData.zipCode))
      return "Please enter a valid 6-digit zip code.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setMessage({ type: "error", text: validationError });
      return;
    }

    try {
      await axios.post(`http://localhost:5000/api/users`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage({ type: "success", text: "Profile saved successfully!" });

      setTimeout(() => navigate(`/profile/${userId}`), 1000);
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to save profile.",
      });
    }
  };

  // if (loading)
  //   return (
  //     <div className="flex items-center justify-center h-screen text-xl">
  //       Loading profile...
  //     </div>
  //   );

  const step1Fields = [
    { name: "userName", label: "Username", type: "text", placeholder: "Enter username" },
    { name: "email", label: "Email", type: "email", placeholder: "Enter email" },
    { name: "dateOfBirth", label: "Date of Birth", type: "date" },
    { name: "phone", label: "Phone", type: "tel", placeholder: "Enter phone", maxLength: 10},
    { name: "password", label: "Password", type: "password", placeholder: "Enter password" },
  ];

  const step2Fields = [
    { name: "zipCode", label: "Zip Code", type: "text", placeholder: "Enter zip code" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Complete Your Profile</h2>

        {message.text && (
          <p
            className={`text-center mb-4 ${
              message.type === "error" ? "text-red-600" : "text-green-600"
            }`}
          >
            {message.text}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 && (
            <>
              {step1Fields.map(({ name, label, type, placeholder, maxLength }) => (
                <div key={name}>
                  <label className="block text-gray-700 font-medium mb-1">{label}</label>
                  <input
                    name={name}
                    type={type}
                    value={formData[name]}
                    onChange={handleChange}
                    placeholder={placeholder}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                    maxLength={maxLength}
                  />
                </div>
              ))}

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full bg-indigo-600 text-white py-3 rounded-md hover:bg-indigo-700 transition"
              >
                Next →
              </button>
            </>
          )}

          {step === 2 && (
            <>
              {step2Fields.map(({ name, label, type, placeholder }) => (
                <div key={name}>
                  <label className="block text-gray-700 font-medium mb-1">{label}</label>
                  <input
                    name={name}
                    type={type}
                    value={formData[name]}
                    onChange={handleChange}
                    placeholder={placeholder}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                  />
                </div>
              ))}

              <div>
                <label className="block text-gray-700 mb-1 font-medium">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                  required
                >
                  <option value="">Select Gender</option>
                  {["Male", "Female", "Other"].map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 mb-1 font-medium">Blood Group</label>
                <select
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                  className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                  required
                >
                  <option value="">Select Blood Group</option>
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/2 bg-gray-400 text-white py-3 rounded-md hover:bg-gray-500 transition"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition"
                >
                  Save Profile
                </button>
              </div>
            </>
          )}
        </form>

        <div className="mt-4 text-center text-sm text-gray-500">
          Step {step} of 2
        </div>
      </div>
    </div>
  );
};

export default ProfileForm;
