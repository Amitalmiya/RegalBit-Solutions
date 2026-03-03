import React, { useState } from "react";
import { CgProfile } from "react-icons/cg";
import { IoIosLogOut } from "react-icons/io";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const NavbarMain = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const navigate = useNavigate()

  const role = localStorage.getItem("role");

  const handleProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("You are not logged in.");
        return;
      }

      const res = await axios.get(
        `http://localhost:5000/api/users/profile/${token}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      navigate(`/profile/${token}`);
      console.log(res.data);
    } catch (error) {
      console.log("Error fetching user data", error);
      alert("Unable to fetch profile data");
    }
  };


   const handleLogOut = () => {
    const confirmLogOut = window.confirm("Are you sure you want to logout?");
    if (confirmLogOut) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      navigate("/login");
    }
  };


  return (
    <header className="lg:px-16 px-4 bg-blue-500 text-white flex flex-wrap items-center py-4 shadow-md">
      <div className="flex-1 flex justify-between items-center">
        <Link to="#" className="text-xl font-semibold">
          RegalBit Solution
        </Link>

        <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
          <svg
            className="fill-current"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 20 20"
          >
            <title>menu</title>
            <path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z" />
          </svg>
        </button>
      </div>

      <div
        className={`${
          menuOpen ? "block" : "hidden"
        } md:flex md:items-center md:w-auto w-full`}
      >
        <nav>
          <ul className="md:flex items-center justify-between text-base pt-4 md:pt-0">
            {role === "user" && (
              <>
              <li>
                <Link
                  to="/home"
                  className="hover:bg-blue-700 px-3 py-2 rounded transition"
                >
                  Home
                </Link>
              </li>
            <li>
              <Link
                to="#"
                className="hover:bg-blue-700 px-3 py-2 rounded transition"
              >
                Contact Us
              </Link>
            </li>
            </>
            )}


            <li>
              <button
                title="Profile"
                onClick={handleProfile}
                className="bg-red-700 hover:bg-red-400 px-3 py-2 rounded transition mx-4 cursor-pointer"
              >
                <CgProfile size={15} />
              </button>
            </li>

            <li>
              <button
                title="Logout"
                onClick={handleLogOut}
                className="bg-red-700 hover:bg-red-400 px-3 py-2 rounded transition cursor-pointer"
              >
                <IoIosLogOut size={15} />
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default NavbarMain;
