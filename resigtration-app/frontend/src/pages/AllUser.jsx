import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Trash2, Pencil, Eye, MoreVertical, ShieldCheck } from "lucide-react";

const AllUser = () => {
  const [users, setUsers] = useState([]);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const navigate = useNavigate();

  const role = localStorage.getItem("role");

  useEffect(() => {
    if (role !== "admin" && role !== "superadmin") {
      navigate("/home");
      return;
    }
    fetchUsers();
  }, [navigate, role]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Token missing. Please login.");
        navigate("/login");
        return;
      }

      const res = await axios.get("http://localhost:5000/api/users/", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUsers(res.data.allUsers || []);
    } catch (err) {
      console.error("Error fetching users:", err.response?.data || err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUsers((prev) => prev.filter((u) => u.id !== id));
      alert("User deleted successfully");
    } catch (err) {
      console.error("Delete error:", err.response?.data || err.message);
      alert("Failed to delete user");
    }
  };

  const handleView = (id) => navigate(`/view/${id}`);
  const handleEdit = (id) => navigate(`/edit/${id}`);
  
  
  const handleUserStatus = async (id, currentStatus) => {
  const newStatus = currentStatus === "active" ? "deactivate" : "active"; 

  if (
    !window.confirm(
      `Are you sure you want to ${newStatus === "active" ? "activate" : "deactivate"} this user?`
    )
  )
    return;

  try {
    const token = localStorage.getItem("token");

    await axios.patch(
      `http://localhost:5000/api/users/user-status/${id}`,
      { status: newStatus },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setUsers((prev) =>
      prev.map((u) =>
        u.id === id
          ? { ...u, status: newStatus }
          : u
      )
    );

    alert(
      `User ${newStatus === "deactivate" ? "deactivated" : "activated"} successfully`
    );
  } catch (err) {
    console.error("Status update error:", err.response?.data || err);
    alert("Failed to update user status");
  }
};

  const renderTable = (usersList, title) => (
    <div className="mb-10 bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <h3 className="text-xl font-bold mb-2 italic underline text-gray-700">
        {title} ({usersList.length})
      </h3>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300 rounded-lg">
          <thead>
            <tr className="bg-green-600 text-white italic">
              <th className="px-4 py-2 text-center">ID</th>
              <th className="px-4 py-2 text-center">Username</th>
              <th className="px-4 py-2 text-center">Phone</th>
              <th className="px-4 py-2 text-center">Email</th>
              <th className="px-4 py-2 text-center">Role</th>
              <th className="px-4 py-2 text-center">Status</th>
              <th className="px-4 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {usersList.length === 0 ? (
              <tr>
                <td
                  colSpan="7"
                  className="text-center py-4 text-gray-500 italic"
                >
                  No users found.
                </td>
              </tr>
            ) : (
              usersList.map((u) => (
                <tr key={u.id} className="hover:bg-gray-100">
                  <td className="text-center px-4 py-2">{u.id}</td>
                  <td className="text-center px-4 py-2">{u.userName}</td>
                  <td className="text-center px-4 py-2">{u.phone || "-"}</td>
                  <td className="text-center px-4 py-2">{u.email || "-"}</td>
                  <td className="text-center px-4 py-2">{u.role}</td>
                  <td className="text-center px-4 py-2">
                    {u.status || "inactive"}
                  </td>
                  <td className="text-center px-4 py-2 relative">
                    <button
                      onClick={() =>
                        setOpenDropdownId(openDropdownId === u.id ? null : u.id)
                      }
                      className="bg-gray-200 cursor-pointer hover:bg-gray-300 text-gray-800 p-2 rounded-full shadow-sm transition-all duration-200 hover:scale-105"
                      title="Actions"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>

                    {openDropdownId === u.id && (
                      <div
                        className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-10 cursor-pointer"
                        onMouseLeave={() => setOpenDropdownId(null)}
                      >
                        <button
                          onClick={() => {
                            handleView(u.id);
                            setOpenDropdownId(null);
                          }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm hover:bg-blue-50 text-gray-700 cursor-pointer"
                        >
                          <Eye className="w-4 h-4 text-blue-600" /> View
                        </button>

                        <button
                          onClick={() => {
                            handleEdit(u.id);
                            setOpenDropdownId(null);
                          }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm hover:bg-yellow-50 text-gray-700 cursor-pointer"
                        >
                          <Pencil className="w-4 h-4 text-yellow-600" /> Edit
                        </button>

                        <button
                          onClick={() => {
                            handleUserStatus(u.id, u.status);
                            setOpenDropdownId(null);
                          }}
                          className={`flex items-center gap-2 w-full px-4 py-2 text-left text-sm cursor-pointer ${
                            u.status === "active"
                              ? "hover:bg-red-50 text-red-600" 
                              : "hover:bg-green-50 text-green-600" 
                          }`}
                        >
                          <ShieldCheck className="w-4 h-4" />{" "}
                          {u.status === "active" ? "Deactivate" : "Activate"}
                        </button>

                        <button
                          onClick={() => {
                            handleDelete(u.id);
                            setOpenDropdownId(null);
                          }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-gray-70 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" /> Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const totalUsers = users.length;
  const mainUsers = users.filter((u) => u.source === "main");
  const phoneUsers = users.filter((u) => u.source === "phone");
  const emailUsers = users.filter((u) => u.source === "email");

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h2 className="text-3xl font-bold mb-6 text-center italic underline text-gray-800">
        Users Dashboard
      </h2>

      <div className="flex justify-center gap-6 mb-8 flex-wrap">
        <div className="bg-white shadow-md rounded-lg p-4 w-48 text-center border border-gray-200">
          <h3 className="text-gray-600 italic">Registered Users</h3>
          <p className="text-2xl font-bold">{mainUsers.length}</p>
        </div>
        <div className="bg-white shadow-md rounded-lg p-4 w-48 text-center border border-gray-200">
          <h3 className="text-gray-600 italic">Phone Users</h3>
          <p className="text-2xl font-bold">{phoneUsers.length}</p>
        </div>
        <div className="bg-white shadow-md rounded-lg p-4 w-48 text-center border border-gray-200">
          <h3 className="text-gray-600 italic">Email Users</h3>
          <p className="text-2xl font-bold">{emailUsers.length}</p>
        </div>
        <div className="bg-green-100 shadow-md rounded-lg p-4 w-48 text-center border border-green-200">
          <h3 className="text-green-700 italic">Total Users</h3>
          <p className="text-2xl font-bold text-green-800">{totalUsers}</p>
        </div>
      </div>

      {renderTable(mainUsers, "Registered Users")}
      {renderTable(phoneUsers, "Phone Users")}
      {renderTable(emailUsers, "Email Users")}
    </div>
  );
};

export default AllUser;
