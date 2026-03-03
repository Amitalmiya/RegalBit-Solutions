import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import RegistrationForm from "./pages/RegistrationForm";
import AllUser from "./pages/AllUser";
import EditUser from "./pages/EditUser";
import ViewUsers from "./pages/ViewUsers";
import PhoneRegistration from "./pages/PhoneRegistration";
import EmailRegistration from "./pages/EmailRegistration";
import Login from "./pages/Login";
import NavbarMain from "./components/NavbarMain";
import Home from "./components/Home";
import Profile from "./components/Profile";
import ProtectedRoute from "./utils/ProtectedRoute";
import Dashboard from "./components/Dashboard";
import NotFound from "./components/NotFound";
import AddNew from "./components/AddNew";
import ForgottenPassword from "./components/ForgottenPassword";
import Demo from "./pages/Demo";
import { useEffect, useState } from "react";
import ResetPassword from "./components/ResetPassword";
import ProfileForm from "./components/ProfileForm";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));

  const [role, setRole] = useState(localStorage.getItem("role"));

  const [user, setUser] = useState();

  useEffect(() => {
    const handleStorageChange = () => {
      setIsLoggedIn(!!localStorage.getItem("token"));
      setRole(localStorage.getItem("role"));
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <>
      <BrowserRouter>
        {isLoggedIn && role === "user" && (
          <NavbarMain onLogout={() => setIsLoggedIn(false)} />
        )}
        <Routes>
          <Route path="/" element={<RegistrationForm />} />
          <Route path="demo" element={<Demo />} />
          <Route path="/login" element={<Login />} />
          <Route path="/phone" element={<PhoneRegistration />} />
          <Route path="/email" element={<EmailRegistration />} />
          <Route path="/users" element={<AllUser />} />
          <Route path="/edit/:id" element={<EditUser />} />
          <Route path="/view/:id" element={<ViewUsers />} />
          <Route path="*" element={<NotFound />} />
          <Route path="forgotten-password" element={<ForgottenPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/:id"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/allusers"
            element={
              <ProtectedRoute>
                <AllUser />
              </ProtectedRoute>
            }
          />
          <Route
            path="/add-newUser"
            element={
              <ProtectedRoute>
                <AddNew />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile-setup/:token"
            element={
              <ProtectedRoute>
                <ProfileForm />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
