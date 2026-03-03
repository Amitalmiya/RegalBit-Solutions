import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const initialForm = {
  phone: "",
  zipCode: "",
  email: "",
  password: "",
  socialSecurityNo: "",
  dateOfBirth: "",
  userName: "",
  websiteUrl: "",
  creditCardNo: "",
  driverLicense: "",
  timeFormat: "",
  hexaDecimalColorCode: "",
  gender: "",
  bloodGroup: "",
};

const fields = [
  {
    name: "phone",
    label: "Phone Number :",
    type: "tel",
    placeholder: "+1-555-123-4567 or (555) 123-4567",
  },
  {
    name: "zipCode",
    label: "Zip Code :",
    type: "text",
    placeholder: "12345 or 12345-6789",
    maxLength: 10,
  },
  {
    name: "email",
    label: "Email :",
    type: "email",
    placeholder: "example@gmail.com",
  },
  {
    name: "password",
    label: "Password :",
    type: "password",
    placeholder: "Enter a strong password",
    minLength: 8,
  },
  // {
  //   name: "socialSecurityNo",
  //   label: "Social Security Number :",
  //   type: "tel",
  //   placeholder: "123-45-6789",
  //   maxLength: 11,
  // },
  {
    name: "dateOfBirth",
    label: "Date of Birth :",
    type: "date",
    // placeholder: "MM-DD-YYYY or MM/DD/YYYY",
    maxLength: 10,
  },
  {
    name: "userName",
    label: "Username :",
    type: "text",
    placeholder: "Enter your name",
    maxLength: 20,
  },
  // {
  //   name: "websiteUrl",
  //   label: "Website Url :",
  //   type: "text",
  //   placeholder: "https://example.com",
  // },
  // {
  //   name: "creditCardNo",
  //   label: "Credit Card Number :",
  //   type: "text",
  //   placeholder: "xxxx-xxxx-xxxx-xxxx",
  //   maxLength: 19,
  // },
  // {
  //   name: "driverLicense",
  //   label: "Driver License :",
  //   type: "text",
  //   placeholder: "X12X456",
  //   maxLength: 12,
  // },
  // {
  //   name: "timeFormat",
  //   label: "Time :",
  //   type: "text",
  //   placeholder: "HH:MM AM/PM",
  //   maxLength: 7,
  // },
  // {
  //   name: "hexaDecimalColorCode",
  //   label: "Hexadecimal Color Code :",
  //   type: "text",
  //   placeholder: "#FFF, #FFFFFF, #F5A52S",
  // },
  {
    name: "gender",
    label: "Gender :",
    type: "select",
    option: ["Male", "Female", "Other"],
  },
  {
    name: "bloodGroup",
    label: "Blood Group :",
    type: "select",
    option: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"],
  },
];

const EditUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [edit, setEdit] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const role = localStorage.getItem("role");

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios
      .get(`http://localhost:5000/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setEdit(res.data.user))
      .catch((err) => alert(`Error fetching user: ${err.message}`));
  }, [id]);

  const handleFormEdit = async (e) => {
    e.preventDefault();

    try {
      const existingUsers = await axios.get("http://localhost:5000/api/users");

      const userEmailExist = existingUsers.data.some(
        (u) => u.email === edit.email && u.id.toString() !== id
      );
      if (userEmailExist) {
        alert("Email already exists");
        return;
      }

      const userNameExist = existingUsers.data.some(
        (u) => u.userName === edit.userName && u.id.toString() !== id
      );
      if (userNameExist) {
        alert("Username already exists");
        return;
      }

      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");

      await axios.put(`http://localhost:5000/api/users/${id}`, edit, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("User updated successfully!");

      if (role === "superadmin" || role === "admin") {
        navigate("/dashboard");
      } else {
        navigate(`/profile/${id}`);
      }
    } catch (error) {
      console.error("Update Error:", error);
      alert("Update failed! Please try again.");
    }
  };

  return (
    <div className="bg-gray-200 flex items-center justify-center w-full min-h-screen py-8">
      <div className="p-8 rounded-[11px] shadow-md w-full max-w-md border border-white bg-white">
        <h2 className="text-2xl text-center font-bold underline mb-6">
          Edit User
        </h2>
        <form onSubmit={handleFormEdit}>
          {fields.map(
            ({
              name,
              label,
              type,
              placeholder,
              maxLength,
              minLength,
              option = [],
            }) => (
              <div className="space-y-1" key={name}>
                <label className="block text-gray-700 font-semibold">
                  {label}
                </label>

                {type === "select" ? (
                  <select
                    name={name}
                    value={edit[name] || ""}
                    onChange={(e) =>
                      setEdit({ ...edit, [name]: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 outline-none transition text-gray-700"
                    // className="border w-full focus:ring-1 focus:ring-black italic text-center"
                    required
                  >
                    <option value="">Select {label.replace(":", "")}</option>
                    {option.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : name === "password" ? (
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name={name}
                      placeholder={placeholder}
                      value={edit[name] || ""}
                      onChange={(e) =>
                        setEdit({ ...edit, [name]: e.target.value })
                      }
                      // className="border w-full focus:ring-1 focus:ring-black italic text-center pr-10"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 outline-none transition text-gray-700"
                      maxLength={maxLength}
                      minLength={minLength}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600"
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                ) : (
                  <input
                    type={type}
                    name={name}
                    placeholder={placeholder}
                    value={edit[name] || ""}
                    onChange={(e) =>
                      setEdit({ ...edit, [name]: e.target.value })
                    }
                    // className="border w-full focus:ring-1 focus:ring-black italic text-center"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 outline-none transition text-gray-700"
                    maxLength={maxLength}
                    minLength={minLength}
                    required
                  />
                )}

                {errors[name] && (
                  <p className="text-red-500 text-sm italic mt-1">
                    {errors[name]}
                  </p>
                )}
              </div>
            )
          )}

          <div className="flex justify-center gap-4 mt-6">
            <button
              type="button"
              onClick={() => {
                if (role === "admin" || role === "superadmin") {
                  navigate("/dashboard");
                } else {
                  navigate(`/profile/${id}`);
                }
              }}
              className="italic border rounded-[5px] w-1/3 bg-red-500 py-2 hover:bg-red-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="italic border rounded-[5px] w-1/3 bg-blue-500 py-2 hover:bg-blue-300 transition"
            >
              Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUser;
