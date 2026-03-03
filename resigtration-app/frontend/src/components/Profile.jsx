import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

const Profile = () => {
  const { id } = useParams();

  const navigate = useNavigate();

  const [user, setUser] = useState(null);

  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("User not logged in. Please login again.");
          navigate("/login");
          return;
        }

        const res = await axios.get(
          `http://localhost:5000/api/users/profile/${token}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setUser(res.data.user);
        navigate(`/profile/${res.data.user.id}`);
      } catch (error) {
        console.error("Error fetching Profile", error);
        setError(
          error.response?.data?.message ||
            "Failed to fetch user data. Please login again."
        );
      }
    };

    fetchUser();
  }, [navigate]);

  if (error)
    return (
      <p className="text-red-500 text-center py-20 text-lg font-semibold">
        {error}
      </p>
    );

  if (!user)
    return (
      <p className="text-center py-20 text-gray-500 text-lg italic">
        Loading user details...
      </p>
    );

  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  return (
    <div className="flex justify-center items-start py-16 bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 min-h-screen">
      <div className="bg-white shadow-xl rounded-3xl w-full max-w-lg p-8 border border-gray-200 transition-all hover:shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-1 rounded-full">
            <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md">
                {user.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-white bg-gradient-to-tr from-blue-600 to-purple-500">
                    {getInitials(user.userName)}
                  </div>
                )}
              </div>
            </div>
          </div>
          <h2 className="text-3xl font-bold mt-4 text-gray-800 capitalize">
            {user.userName || "Unknown User"}
          </h2>
          <p className="text-gray-500 italic mt-1">
            {user.email || user.phone || "No contact info"}
          </p>
        </div>

        <div className="space-y-4 text-gray-700">
          {user.userName && (
            <p>
              <span className="font-semibold">Username:</span> {user.userName}
            </p>
          )}
          {user.email && (
            <p>
              <span className="font-semibold">Email:</span> {user.email}
            </p>
          )}
          {user.phone && (
            <p>
              <span className="font-semibold">Phone:</span> {user.phone}
            </p>
          )}
          {user.dateOfBirth && (
            <p>
              <span className="font-semibold">Date of Birth:</span>{" "}
              {user.dateOfBirth}
            </p>
          )}
          {user.gender && (
            <p>
              <span className="font-semibold">Gender:</span> {user.gender}
            </p>
          )}
          {user.bloodGroup && (
            <p>
              <span className="font-semibold">Blood Group:</span>{" "}
              {user.bloodGroup}
            </p>
          )}
          {user.websiteUrl && (
            <p>
              <span className="font-semibold">Website:</span>{" "}
              <a
                href={user.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline hover:text-blue-700 transition"
              >
                {user.websiteUrl}
              </a>
            </p>
          )}
          {user.creditCardNo && (
            <p>
              <span className="font-semibold">Credit Card No.:</span>{" "}
              {user.creditCardNo}
            </p>
          )}
          {user.driverLicense && (
            <p>
              <span className="font-semibold">Driver License:</span>{" "}
              {user.driverLicense}
            </p>
          )}
          {user.socialSecurityNo && (
            <p>
              <span className="font-semibold">Social Security No:</span>{" "}
              {user.socialSecurityNo}
            </p>
          )}
        </div>

        <div className="flex justify-between mt-10">
          <button
            className="w-1/2 mr-2 py-2 rounded-xl bg-blue-500 text-white font-semibold hover:bg-blue-400 transition"
            onClick={() => navigate(`/edit/${id}`)}
          >
            Edit Profile
          </button>
          <button
            className="w-1/2 ml-2 py-2 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-400 transition"
            onClick={() => {
              localStorage.removeItem("token");
              navigate("/login");
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
