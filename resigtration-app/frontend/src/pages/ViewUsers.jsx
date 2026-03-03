import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const allFields = [
  { name: "phone", label: "Phone Number :" },
  { name: "zipCode", label: "Zip Code :" },
  { name: "email", label: "Email :" },
  { name: "password", label: "Password :" },
  { name: "socialSecurityNo", label: "Social Security Number :" },
  { name: "dateOfBirth", label: "Date of Birth :" },
  { name: "userName", label: "Username :" },
  { name: "websiteUrl", label: "Website Url :" },
  { name: "creditCardNo", label: "Credit Card Number :" },
  { name: "driverLicense", label: "Driver License :" },
  { name: "timeFormat", label: "Time :" },
  { name: "hexaDecimalColorCode", label: "Hexadecimal Color Code :" },
  { name: "gender", label: "Gender :" },
  { name: "bloodGroup", label: "Blood Group :" },
];

const ViewUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios
      .get(`http://localhost:5000/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setUser(res.data.user))
      .catch((err) => {
        console.error(err);
        alert("Error fetching user details");
      });
  }, [id]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="italic text-lg text-gray-600">Loading user details...</p>
      </div>
    );
  }

  let displayFields = allFields;

  if (user.phone && (!user.email || user.email === "")) {
    displayFields = [
      { name: "userName", label: "Username :" },
      { name: "phone", label: "Phone Number :" },
    ];
  } 
  else if (user.email && (!user.phone || user.phone === "")) {
    displayFields = [
      { name: "userName", label: "Username :" },
      { name: "email", label: "Email :" },
    ];
  }

  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  return (
    <div className="flex items-center justify-center w-full bg-gray-100 min-h-screen py-10">
      <div className="bg-white shadow-2xl rounded-2xl w-full max-w-md p-8 border border-gray-200 transition-all duration-300 hover:shadow-[0_0_25px_-5px_rgba(0,0,0,0.2)]">
        
        <div className="flex flex-col items-center mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-red-500 p-[3px] rounded-full">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white bg-gradient-to-br from-blue-600 to-red-600">
                {getInitials(user.userName)}
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold mt-4 text-gray-800 capitalize">
            {user.userName || "Unknown User"}
          </h2>
          <p className="text-gray-500 italic">
            {user.email || user.phone || "No contact info"}
          </p>
        </div>

        <div className="space-y-2">
          {displayFields.map(({ name, label }) => (
            <div key={name}>
              <p className="font-semibold text-gray-700">{label}</p>
              <p className="border rounded-md px-3 py-1 bg-gray-50 text-gray-600 italic text-center">
                {user[name]?.trim() || "N/A"}
              </p>
            </div>
          ))}
        </div>

        <div className="flex justify-between mt-8">
          <button
            className="italic w-[48%] py-2 bg-blue-500 text-white rounded-md hover:bg-blue-400 transition-all"
            onClick={() => navigate("/users")}
          >
            Back to Users
          </button>
          <button
            className="italic w-[48%] py-2 bg-green-500 text-white rounded-md hover:bg-green-400 transition-all"
            onClick={() => navigate(`/edit/${user.id}`)}
          >
            Edit User
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewUser;
