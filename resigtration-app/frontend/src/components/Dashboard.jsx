import React, { useState, useEffect, useCallback } from "react";
import { CgProfile } from "react-icons/cg";
import { IoIosLogOut, IoMdAdd, IoMdMail } from "react-icons/io";
import {
  FaUserTimes,
  FaUserCheck,
  FaEdit,
  FaUsers,
  FaUserPlus,
  FaSearch,
  FaRegCalendar,
  FaRegCalendarAlt,
  FaUserFriends,
} from "react-icons/fa";
import { MdDeleteForever, MdSpaceDashboard } from "react-icons/md";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { FiMoreVertical } from "react-icons/fi";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { IoChatbubbleEllipsesSharp } from "react-icons/io5";
import { FaRegFileAlt } from "react-icons/fa";
import { Calendar as BigCalendar, momentLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { format, parseISO } from "date-fns";
import moment from "moment";
const DashBoard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [activePage, setActivePage] = useState("dashboard");

  const [users, setUsers] = useState([]);

  const [user, setUser] = useState(null);

  const [openMenuId, setOpenMenuId] = useState(null);

  const [userName, setUserName] = useState("");

  const [phone, setPhone] = useState("");

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [role, setRole] = useState("");

  const [showPassword, setShowPassword] = useState("");

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [openDropdownId, setOpenDropdownId] = useState(null);

  const [loading, setLoading] = useState(false);

  const [query, setQuery] = useState("");

  const [filteredUsers, setFilteredUsers] = useState([]);

  const [value, setValue] = useState(new Date());

  const navigate = useNavigate();

  const { id } = useParams();

  const localizer = momentLocalizer(moment);

  const [selectedDate, setSelectedDate] = useState(new Date());

  const [events, setEvents] = useState([
    // {
    //   title: "Team Meeting",
    //   start: new Date(2025, 10, 10, 10, 0), // 10 Nov 2025, 10:00 AM
    //   end: new Date(2025, 10, 10, 11, 0),
    // },
    // {
    //   title: "Project Deadline",
    //   start: new Date(2025, 10, 15, 17, 0),
    //   end: new Date(2025, 10, 15, 18, 0),
    // },
  ]);

  const [searched, setSearched] = useState();

  const [activeFolder, setActiveFolder] = useState("Inbox");

  const [showCompose, setShowCompose] = useState(false);

  const [mails, setMails] = useState({
    Inbox: [
      {
        id: 1,
        subject: "Project Update",
        from: "manager@company.com",
        message:
          "Hi team, please find the latest project update attached below. Let’s review it in tomorrow’s meeting.",
      },
      {
        id: 2,
        subject: "Meeting Reminder",
        from: "hr@company.com",
        message:
          "Reminder: Please join the team meeting scheduled for 10 AM tomorrow. Agenda attached.",
      },
    ],
    Sent: [
      {
        id: 3,
        subject: "Re: Design Review",
        from: "you@company.com",
        message:
          "Hi Manager, please find attached the updated design files for review. Let me know your feedback.",
      },
    ],
    Drafts: [],
    Spam: [],
    Trash: [],
  });

  const [composeData, setComposeData] = useState({
    to: "",
    subject: "",
    message: "",
  });


  const token = localStorage.getItem("token");

  const userNameRegex = /^[A-Za-z_][A-Za-z0-9_]{2,19}$/;
  const phoneRegex = /^(\+91)?[6-9]\d{9}$/;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.com$/i;
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!userNameRegex.test(userName)) {
      setError("Enter a valid Username (3-20 characters, no spaces)");
      return;
    }

    if (!phoneRegex.test(phone)) {
      setError("Enter a valid Phone number (10 digits)");
      return;
    }

    if (!emailRegex.test(email)) {
      setError("Enter a valid Email address");
      return;
    }

    if (!passwordRegex.test(password)) {
      setError(
        "Password must include uppercase, lowercase, number & special character"
      );
      return;
    }

    if (!userName || !email || !phone || !password) {
      setError("All fields are required!");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(
        `http://localhost:5000/api/users`,
        { userName, email, phone, password, role },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.status === 201 || res.status === 200) {
        setSuccess("User created successfully!!");
        setUserName("");
        setPhone("");
        setEmail("");
        setPassword("");
        setRole("user");
        setShowPassword(false);

        setTimeout(() => navigate("/dashboard"), 1500);
      }
    } catch (error) {
      setError(error.response?.data?.message || "Failed to add user");
    }
  };

  const sidebarItems = [
    {
      name: "Dashboard",
      icon: <MdSpaceDashboard size={20} className="text-blue-500" />,
      key: "dashboard",
    },
    {
      name: "All Users",
      icon: <FaUsers size={20} className="text-green-500" />,
      key: "allUsers",
    },
    ...(user?.role === "superadmin"
      ? [
          {
            name: "Add User",
            icon: <FaUserPlus size={20} className="text-purple-500" />,
            key: "addUser",
          },
        ]
      : []),
    {
      name: "Messages",
      icon: <IoChatbubbleEllipsesSharp size={20} className="text-pink-500" />,
      key: "messages",
    },
    {
      name: "Mail Box",
      icon: <IoMdMail size={20} className="text-white-500" />,
      key: "mail",
    },
    {
      name: "Members",
      icon: <FaUserFriends size={20} className="text-purple-500" />,
      key: "members",
    },
    {
      name: "Report",
      icon: <FaRegFileAlt size={20} className="text-orange-500" />,
      key: "report",
    },
    {
      name: "Calendar",
      icon: <FaRegCalendarAlt size={20} className="text-cyan-500" />,
      key: "calendar",
    },
    {
      name: "Profile",
      icon: <CgProfile size={20} className="text-indigo-500" />,
      key: "profile",
    },
    {
      name: "Logout",
      icon: <IoIosLogOut size={20} className="text-red-500" />,
      key: "logout",
    },
  ];

  const teamMembers = [
    {
      id: 1,
      name: "Amit Kumar",
      role: "Frontend Developer",
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR-Opi7DeS74UKxWXRitnC0KQh5SwWmkOHdkg&s",
      email: "amitalm777@example.com",
    },
    {
      id: 2,
      name: "Pooja Mehta",
      role: "UI/UX Designer",
      image: "https://images.rawpixel.com/image_png_800/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDIyLTA4L2pvYjExMjAtZWxlbWVudC0xOS5wbmc.png",
      email: "mehtapooja854@gmail.com",
    },
    {
      id: 3,
      name: "Rohan Singh",
      role: "Backend Developer",
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSK_l3k2SIVclOwai1URNdqcnXK3rdrfPYYUg&s",
      email: "rohan987@gmail.com",
    },
    {
      id: 4,
      name: "Vishal Gupta",
      role: "Testing Engineer",
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJWZUq1utFP0GqEoOpjMHnHEvWIqyZ17GWSA&s",
      email: "vishal854@gmail.com",
    },
    {
      id: 5,
      name: "Rachna Rawat",
      role: "Human Resources",
      image: "https://images.squarespace-cdn.com/content/v1/58e167a8414fb5c0b2b8c13e/1503561540900-K0FXVM3QNP4843AJGQCD/Circle+Profile.jpg",
      email: "rachna85@gmail.com",
    },
    {
      id: 6,
      name: "Vijay Pal",
      role: "Support Engineer",
      image: "https://images.rawpixel.com/image_png_800/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDIyLTA4L2pvYjExMjAtZWxlbWVudC0yMi5wbmc.png",
      email: "vijay12@gmail.com",
    },
  ];

  const toggleMenu = (id) => {
    setOpenMenuId(openMenuId === id ? null : id);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5000/api/users/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const allUsers = res.data?.allUsers || res.data?.users || [];
      setUsers(Array.isArray(allUsers) ? allUsers : []);
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/users/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  }, [token]);

  useEffect(() => {
    if (activePage === "allUsers") fetchUsers();
    if (activePage === "profile") fetchProfile();
  }, [activePage, fetchUsers, fetchProfile]);

  const handleClick = (item) => {
    if (item.key === "logout") {
      if (window.confirm("Are you sure you want to logout?")) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    } else {
      setActivePage(item.key);
    }
  };

  // Profile data here ----------------------------------------------------
  useEffect(() => {
    const fetchUser = async () => {
      try {
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
        navigate(`/dashboard`);
      } catch (error) {
        setError(
          error.response?.data?.message ||
            "Failed to fetch user data. Please login again."
        );
      }
    };
    fetchUser();
  }, [navigate]);

  if (error) {
    return (
      <p className="text-red-500 text-center py-20 text-lg font-semibold">
        {error}
      </p>
    );
  }

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

  const handleUserStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "active" ? "deactivate" : "active";

    if (
      !window.confirm(
        `Are you sure you want to ${
          newStatus === "active" ? "activate" : "deactivate"
        } this user?`
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
        prev.map((u) => (u.id === id ? { ...u, status: newStatus } : u))
      );

      alert(
        `User ${
          newStatus === "deactivate" ? "deactivated" : "activated"
        } successfully`
      );
    } catch (err) {
      console.error("Status update error:", err.response?.data || err);
      alert("Failed to update user status");
    }
  };

  const handleDeleteUser = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this user?"
    );
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("User deleted successfully!");
      setUsers(users.filter((user) => user.id !== id));
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user. Try again later.");
    }
  };


 const handleComposeSubmit = (e) => {
    e.preventDefault();
    if (!composeData.to || !composeData.subject || !composeData.message) {
      alert("All fields are required.");
      return;
    }

    const newMail = {
      id: Date.now(),
      subject: composeData.subject,
      from: "you@company.com",
      message: composeData.message,
    };

    setMails((prev) => ({
      ...prev,
      Sent: [newMail, ...prev.Sent],
    }));

    setComposeData({ to: "", subject: "", message: "" });
    setShowCompose(false);
    setActiveFolder("Sent");
  };


  const renderAllUsers = () => (
    <div className="p-10 bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-4xl font-extrabold text-gray-800 tracking-tight">
          👥 All Users
        </h2>

        {user.role === "superadmin" && (
          <button
            onClick={() => navigate("/add-newUser")}
            className="relative flex items-center gap-2 px-6 py-2.5 rounded-2xl font-semibold text-white bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 shadow-lg shadow-green-200 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 hover:shadow-xl hover:shadow-green-300 transform hover:-translate-y-0.5 hover:scale-[1.04] active:scale-95 transition-all duration-300 ease-out group cursor-pointer"
          >
            <span className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-400 to-emerald-400 opacity-0 group-hover:opacity-20 blur-lg transition duration-300"></span>

            <IoMdAdd
              size={22}
              className="transform group-hover:rotate-90 transition-transform duration-300"
            />
            <span className="tracking-wide drop-shadow-sm">Add User</span>
          </button>
        )}
      </div>

      <div className="overflow-x-auto bg-white shadow-2xl rounded-3xl border border-gray-200">
        <table className="min-w-full text-sm text-gray-800">
          <thead className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white uppercase tracking-wider text-[13px]">
            <tr>
              <th className="px-6 py-4 text-left font-semibold">ID</th>
              <th className="px-6 py-4 text-left font-semibold">Username</th>
              <th className="px-6 py-4 text-left font-semibold">Email</th>
              <th className="px-6 py-4 text-left font-semibold">Phone</th>
              <th className="px-6 py-4 text-left font-semibold">Role</th>
              <th className="px-6 py-4 text-left font-semibold">Status</th>
              <th className="px-6 py-4 text-center font-semibold">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan="7"
                  className="text-center py-8 text-gray-500 italic"
                >
                  Loading users...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td
                  colSpan="7"
                  className="text-center py-8 text-gray-500 italic"
                >
                  No users found
                </td>
              </tr>
            ) : (
              users.map((u, i) => (
                <tr
                  key={u.id}
                  className={`${
                    i % 2 === 0 ? "bg-gray-50" : "bg-white"
                  } hover:bg-blue-50 transition-all duration-200 border-b border-gray-100`}
                >
                  <td className="px-6 py-4 font-semibold text-gray-700">
                    #{u.id}
                  </td>
                  <td className="px-6 py-4">{u.userName}</td>
                  <td className="px-6 py-4">{u.email || "-"}</td>
                  <td className="px-6 py-4">{u.phone || "-"}</td>

                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide ${
                        u.role === "admin"
                          ? "bg-blue-100 text-blue-700"
                          : u.role === "superadmin"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide ${
                        u.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {u.status || "inactive"}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-center relative">
                    <button
                      onClick={() => toggleMenu(u.id)}
                      className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 shadow-sm transition-all cursor-pointer"
                      title="Options"
                    >
                      <FiMoreVertical size={18} className="text-gray-700" />
                    </button>

                    {openMenuId === u.id && (
                      <div className="absolute right-0 mt-2 w-40 bg-white shadow-xl rounded-xl border border-gray-200 z-10 animate-fadeIn">
                        <button
                          onClick={() => {
                            handleUserStatus(u.id, u.status);
                            setOpenDropdownId(null);
                          }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition"
                        >
                          {u.status === "active" ? (
                            <>
                              <FaUserTimes
                                size={14}
                                className="text-yellow-600"
                              />
                              <span>Deactivate</span>
                            </>
                          ) : (
                            <>
                              <FaUserCheck
                                size={14}
                                className="text-green-600"
                              />
                              <span>Activate</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => navigate(`/edit/${u.id}`)}
                          className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition"
                        >
                          <FaEdit size={14} className="text-blue-600" />
                          <span className="text-blue-700 font-medium">
                            Edit User
                          </span>
                        </button>

                        {user?.role === "superadmin" && (
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition"
                          >
                            <MdDeleteForever
                              size={14}
                              className="text-red-600"
                            />
                            <span className="text-red-600 font-medium">
                              Delete
                            </span>
                          </button>
                        )}
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

  const renderAddUser = () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 p-6">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-sm shadow-2xl rounded-2xl p-8 border border-gray-200 hover:shadow-indigo-300/40 transition-shadow duration-300">
        <h2 className="text-3xl font-extrabold text-center text-indigo-700 mb-6">
          Add New User
        </h2>

        {error && (
          <p className="text-red-500 text-center mb-3 font-medium animate-pulse">
            {error}
          </p>
        )}
        {success && (
          <p className="text-green-600 text-center mb-3 font-medium animate-pulse">
            {success}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-700 font-semibold mb-1">
              Username
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              placeholder="Enter username"
              maxLength={20}
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              placeholder="Enter phone number"
              maxLength={10}
              pattern="[0-9]{10}"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              placeholder="Enter email address"
              maxLength={30}
              required
            />
          </div>

          <div className="relative">
            <label className="block text-gray-700 font-semibold mb-1">
              Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              placeholder="Enter password"
              maxLength={30}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-12 -translate-y-1/2 text-gray-500 hover:text-indigo-600 transition"
            >
              {showPassword ? (
                <AiOutlineEyeInvisible size={22} />
              ) : (
                <AiOutlineEye size={22} />
              )}
            </button>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-1">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="flex justify-between items-center mt-6">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-5 py-2 rounded-lg font-medium shadow-sm hover:shadow-md transition-all duration-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-5 py-2 rounded-lg font-semibold text-white shadow-md transition-all duration-300 ${
                loading
                  ? "bg-indigo-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transform hover:scale-[1.03]"
              }`}
            >
              {loading ? "Adding..." : "Add User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );


  const renderProfile = () => (
    <div className="flex justify-center items-start py-16 bg-gradient-to-br from-blue-100 via-white to-purple-100 min-h-screen">
      <div className="bg-white shadow-2xl rounded-3xl w-full max-w-lg p-10 border border-gray-100 transition-all duration-300 hover:shadow-3xl hover:-translate-y-1">
        <div className="flex flex-col items-center mb-10">
          <div className="relative">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-1 rounded-full">
              <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-inner">
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
            <div className="absolute -bottom-2 right-2 bg-green-500 w-4 h-4 rounded-full border-2 border-white animate-pulse"></div>
          </div>

          <h2 className="text-3xl font-bold mt-6 text-gray-800 capitalize tracking-wide">
            {user.userName || "Unknown User"}
          </h2>

          <div className="text-center mt-2 space-y-1">
            <p className="text-gray-500 italic">
              {user.email || "No Email Address"}
            </p>
            <p className="text-gray-500 italic">
              {user.phone || "No Phone Number"}
            </p>
          </div>
        </div>

        <div className="space-y-3 text-gray-700 border-t border-gray-200 pt-6">
          <div className="flex justify-between">
            <span className="font-semibold text-gray-800">Username:</span>
            <span className="italic">{user.userName}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-gray-800">Email Address:</span>
            <span className="italic">{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-gray-800">Phone:</span>
            <span className="italic">{user.phone}</span>
          </div>
        </div>

        <div className="flex justify-between mt-10 gap-4">
          <button
            onClick={() => navigate(`/edit/${id}`)}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold shadow-md hover:from-blue-600 hover:to-blue-700 hover:shadow-lg transform hover:scale-[1.03] transition-all duration-300"
          >
            Edit Profile
          </button>

          <button
            onClick={() => {
              const confirmLogout = window.confirm(
                "Are you sure you want to log out?"
              );
              if (confirmLogout) {
                localStorage.removeItem("token");
                navigate("/login");
              }
            }}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold shadow-md hover:from-red-600 hover:to-red-700 hover:shadow-lg transform hover:scale-[1.03] transition-all duration-300"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );

  const renderMember = () => (
  <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-100 py-16 px-6">
    <h2 className="text-4xl font-extrabold text-center text-gray-800 mb-12 tracking-tight">
      🌟 Meet Our Team
    </h2>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 max-w-7xl mx-auto">
      {teamMembers.map((member) => (
        <div
          key={member.id}
          className="group bg-white/80 backdrop-blur-md rounded-3xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 hover:scale-[1.02] transition-all duration-300 p-8 border border-gray-100 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 via-transparent to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>

          <div className="relative flex justify-center mb-6">
            <img
              src={member.image}
              alt={member.name}
              className="w-28 h-28 rounded-full border-4 border-indigo-500 shadow-md transition-transform duration-500 group-hover:scale-110"
            />
            <span className="absolute bottom-2 right-[40%] bg-green-500 w-4 h-4 rounded-full border-2 border-white shadow-sm"></span>
          </div>

          <div className="text-center relative z-10">
            <h3 className="text-xl font-bold text-gray-800 group-hover:text-indigo-600 transition-colors duration-300">
              {member.name}
            </h3>
            <p className="text-sm text-gray-600 font-medium mt-1 tracking-wide">
              {member.role}
            </p>
            <p className="text-sm text-gray-400 mt-2 italic">{member.email}</p>
          </div>

          <div className="w-16 h-[2px] bg-indigo-500 mx-auto my-5 rounded-full group-hover:w-24 transition-all duration-300"></div>

          <div className="flex justify-center">
            <button className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-md hover:from-indigo-600 hover:to-blue-600 hover:shadow-lg transition-all duration-300">
              View Profile
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

  const renderMessage = () => (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="flex items-center justify-between bg-white shadow px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-800">Team Chat</h2>
        <button className="text-sm text-blue-600 hover:underline">
          Clear Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center font-bold text-blue-700">
            A
          </div>
          <div className="bg-white shadow p-3 rounded-xl max-w-md">
            <p className="text-gray-700 text-sm">
              Hey there! How are you doing today?
            </p>
            <span className="text-xs text-gray-400 block mt-1">10:42 AM</span>
          </div>
        </div>

        <div className="flex items-start justify-end space-x-3">
          <div className="bg-blue-600 text-white shadow p-3 rounded-xl max-w-md">
            <p className="text-sm">
              I’m good! Working on the new dashboard UI.
            </p>
            <span className="text-xs text-gray-200 block mt-1">10:45 AM</span>
          </div>
        </div>
      </div>

      <div className="bg-white border-t p-4 flex items-center space-x-3">
        <input
          type="text"
          placeholder="Type your message..."
          className="flex-1 border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium transition">
          Send
        </button>
      </div>
    </div>
  );

  const renderMail = () => (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex flex-col">
      <div className="bg-white shadow px-8 py-4 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
          📬 Mail Inbox
        </h2>
        <button
          onClick={() => setShowCompose(true)}
          className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium shadow-md transition-all duration-300 transform hover:scale-105"
        >
          ✉️ Compose Mail
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 bg-white border-r border-gray-200 p-6 space-y-3 shadow-sm">
          {["Inbox", "Sent", "Drafts", "Spam", "Trash"].map((folder) => (
            <button
              key={folder}
              onClick={() => setActiveFolder(folder)}
              className={`w-full text-left px-4 py-2.5 rounded-lg font-medium transition-all duration-300 ${
                activeFolder === folder
                  ? "bg-indigo-100 text-indigo-700 shadow-sm"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {folder}
            </button>
          ))}
        </div>

        <div className="flex-1 p-8 overflow-y-auto space-y-6">
          {mails[activeFolder].length > 0 ? (
            mails[activeFolder].map((mail) => (
              <div
                key={mail.id}
                className="group bg-white rounded-2xl shadow-md p-6 border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <h3 className="text-lg font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">
                  Subject: {mail.subject}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  From: <span className="font-medium">{mail.from}</span>
                </p>
                <p className="mt-4 text-gray-600 leading-relaxed">
                  {mail.message}
                </p>
                <div className="flex justify-end mt-4">
                  <button className="text-sm text-indigo-600 font-medium hover:underline">
                    View Details →
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 italic mt-20">
              No emails in this folder 📭
            </p>
          )}
        </div>
      </div>

      {showCompose && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 relative animate-fadeIn">
            <button
              onClick={() => setShowCompose(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl"
            >
              ✖
            </button>

            <h3 className="text-xl font-semibold text-gray-800 mb-5">
              ✉️ New Message
            </h3>

            <form onSubmit={handleComposeSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  To
                </label>
                <input
                  type="email"
                  value={composeData.to}
                  onChange={(e) =>
                    setComposeData({ ...composeData, to: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none"
                  placeholder="recipient@example.com"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Subject
                </label>
                <input
                  type="text"
                  value={composeData.subject}
                  onChange={(e) =>
                    setComposeData({ ...composeData, subject: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none"
                  placeholder="Enter subject"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Message
                </label>
                <textarea
                  rows={4}
                  value={composeData.message}
                  onChange={(e) =>
                    setComposeData({ ...composeData, message: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none resize-none"
                  placeholder="Write your message..."
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCompose(false)}
                  className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:from-indigo-700 hover:to-blue-700 transition shadow-md"
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>  
  );

  const renderReport = () => (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Company Reports</h2>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm transition-all duration-300">
          Generate Report
        </button>
      </div>

      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-md p-5 hover:shadow-lg transition">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-gray-800">
              Monthly Sales
            </h3>
            <span className="text-sm text-gray-500">October 2025</span>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            This report provides an overview of total sales, revenue, and growth
            rate for the current month.
          </p>
          <div className="mt-4 flex justify-end">
            <button className="text-sm text-indigo-600 font-medium hover:underline">
              View Report
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-5 hover:shadow-lg transition">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-gray-800">
              Employee Performance
            </h3>
            <span className="text-sm text-gray-500">Q4 2025</span>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            Analyze team productivity, task completion rates, and performance
            indicators across departments.
          </p>
          <div className="mt-4 flex justify-end">
            <button className="text-sm text-indigo-600 font-medium hover:underline">
              View Report
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-5 hover:shadow-lg transition">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-gray-800">
              Project Summary
            </h3>
            <span className="text-sm text-gray-500">Weekly</span>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            Summary of ongoing projects, completed milestones, and pending
            deliverables for the week.
          </p>
          <div className="mt-4 flex justify-end">
            <button className="text-sm text-indigo-600 font-medium hover:underline">
              View Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCalender = () => (
     <div className="flex flex-col h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-indigo-100">
      <div className="bg-white/90 backdrop-blur-md shadow-md px-8 py-4 flex justify-between items-center border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
          📅 Company Calendar
        </h2>
        <button
          className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium shadow-md transition-all duration-300 transform hover:scale-105"
          onClick={() => alert("Add Event functionality coming soon!")}
        >
          + Add Event
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-8 py-10">
        <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100 w-full max-w-6xl">
          <BigCalendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 500 }}
            selectable
            onSelectEvent={(event) => alert(`Event: ${event.title}`)}
            onSelectSlot={(slotInfo) => setSelectedDate(slotInfo.start)}
          />
        </div>
      </div>

      <div className="bg-white/80 border-t border-gray-200 px-8 py-4 text-sm text-gray-700 flex justify-between items-center">
        <p>
          <span className="font-semibold text-gray-900">Selected Date:</span>{" "}
          {format(selectedDate, "EEE, dd MMM yyyy")}
        </p>
        <p className="text-gray-500 italic">
          Stay organized and never miss an important event!
        </p>
      </div>
    </div>

  );

  const renderContent = () => {
    const mainUsers = users.filter((u) => u.source === "main");
    const phoneUsers = users.filter((u) => u.source === "phone");
    const emailUsers = users.filter((u) => u.source === "email");
    const totalUsers = users.length;

    switch (activePage) {
      case "allUsers":
        return renderAllUsers();
      case "addUser":
        return renderAddUser();
      case "profile":
        return renderProfile();
      case "members":
        return renderMember();
      case "messages":
        return renderMessage();
      case "mail":
        return renderMail();
      case "report":
        return renderReport();
      case "calendar":
        return renderCalender();
      default:
        return (
          <div className="p-8 bg-gradient-to-br from-gray-50 to-indigo-50 min-h-screen">
            <h2 className="text-4xl font-extrabold mb-10 text-center text-gray-800 tracking-tight">
              Welcome to Your <span className="text-indigo-600">Dashboard</span>
            </h2>

            <div className="flex justify-center gap-8 flex-wrap">
              <div className="group bg-white shadow-lg hover:shadow-2xl rounded-2xl p-6 w-56 text-center border border-gray-100 transform hover:-translate-y-2 transition-all duration-300">
                <div className="w-14 h-14 mx-auto mb-3 flex items-center justify-center rounded-full bg-indigo-100 group-hover:bg-indigo-200 transition">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-7 w-7 text-indigo-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2m8-8a4 4 0 110-8 4 4 0 010 8z"
                    />
                  </svg>
                </div>
                <h3 className="text-gray-500 font-medium mb-1">
                  Registered Users
                </h3>
                <p className="text-3xl font-bold text-gray-800">
                  {mainUsers.length}
                </p>
              </div>

              <div className="group bg-white shadow-lg hover:shadow-2xl rounded-2xl p-6 w-56 text-center border border-gray-100 transform hover:-translate-y-2 transition-all duration-300">
                <div className="w-14 h-14 mx-auto mb-3 flex items-center justify-center rounded-full bg-blue-100 group-hover:bg-blue-200 transition">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-7 w-7 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 5h2l1 9h13l1-9h2M5 5l1 9m0 0h12m-12 0a2 2 0 100 4h12a2 2 0 100-4m-6 4v2m0 0H9m3 0h3"
                    />
                  </svg>
                </div>
                <h3 className="text-gray-500 font-medium mb-1">Phone Users</h3>
                <p className="text-3xl font-bold text-gray-800">
                  {phoneUsers.length}
                </p>
              </div>

              <div className="group bg-white shadow-lg hover:shadow-2xl rounded-2xl p-6 w-56 text-center border border-gray-100 transform hover:-translate-y-2 transition-all duration-300">
                <div className="w-14 h-14 mx-auto mb-3 flex items-center justify-center rounded-full bg-pink-100 group-hover:bg-pink-200 transition">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-7 w-7 text-pink-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 12H8m0 0l4-4m-4 4l4 4m-9 4h18"
                    />
                  </svg>
                </div>
                <h3 className="text-gray-500 font-medium mb-1">Email Users</h3>
                <p className="text-3xl font-bold text-gray-800">
                  {emailUsers.length}
                </p>
              </div>

              <div className="group bg-gradient-to-br from-green-100 to-emerald-50 shadow-lg hover:shadow-2xl rounded-2xl p-6 w-56 text-center border border-green-200 transform hover:-translate-y-2 transition-all duration-300">
                <div className="w-14 h-14 mx-auto mb-3 flex items-center justify-center rounded-full bg-green-200 group-hover:bg-green-300 transition">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-7 w-7 text-green-700"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17 20h5v-2a4 4 0 00-4-4h-1V9a5 5 0 00-5-5h-1a5 5 0 00-5 5v5H4a4 4 0 00-4 4v2h5"
                    />
                  </svg>
                </div>
                <h3 className="text-green-700 font-medium mb-1">Total Users</h3>
                <p className="text-3xl font-bold text-green-800">
                  {totalUsers}
                </p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 relative">
      <div
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transform md:flex flex-col w-64 bg-gray-800 transition-transform duration-300 ease-in-out shadow-lg`}
      >
        <div className="flex items-center justify-center h-16 bg-gray-900 shadow-md">
          <span className="text-white font-bold tracking-wide text-lg">
            RegelBitSolutions
          </span>
        </div>
        <div className="flex flex-col flex-1 overflow-y-auto">
          <nav className="flex-1 px-2 py-4 bg-gray-800">
            <ul>
              {sidebarItems.map((item) => (
                <li
                  key={item.key}
                  onClick={() => handleClick(item)}
                  className="flex items-center gap-3 px-4 py-3 mt-2 text-gray-100 rounded-lg cursor-pointer hover:bg-blue-600 hover:text-white transition-colors duration-200"
                >
                  {item.icon}
                  <span>{item.name}</span>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      <div className="flex flex-col flex-1 overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default DashBoard;
