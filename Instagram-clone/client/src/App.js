import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Navbar from './components/Navbar.jsx';
import Feed from './pages/Feed.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Profile from './pages/Profile.jsx';
import Explore from './pages/Explore.jsx';
import PostDetail from './pages/PostDetail.jsx';
import CreatePost from './pages/CreatePost.jsx';
import EditProfile from './pages/EditProfile.jsx';

function PrivateRoute({ children }) {
  const { user } = useSelector((state) => state.auth);
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user } = useSelector((state) => state.auth);
  return !user ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

        {/* Protected routes */}
        <Route path="/" element={
          <PrivateRoute>
            <Navbar />
            <div className="pt-14">
              <Feed />
            </div>
          </PrivateRoute>
        } />
        <Route path="/explore" element={
          <PrivateRoute>
            <Navbar />
            <div className="pt-14"><Explore /></div>
          </PrivateRoute>
        } />
        <Route path="/create" element={
          <PrivateRoute>
            <Navbar />
            <div className="pt-14"><CreatePost /></div>
          </PrivateRoute>
        } />
        <Route path="/profile/:username" element={
          <PrivateRoute>
            <Navbar />
            <div className="pt-14"><Profile /></div>
          </PrivateRoute>
        } />
        <Route path="/post/:id" element={
          <PrivateRoute>
            <Navbar />
            <div className="pt-14"><PostDetail /></div>
          </PrivateRoute>
        } />
        <Route path="/edit-profile" element={
          <PrivateRoute>
            <Navbar />
            <div className="pt-14"><EditProfile /></div>
          </PrivateRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
