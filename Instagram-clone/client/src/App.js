import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Navbar from './components/Navbar';
import Feed from './pages/Feed';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Explore from './pages/Explore';
import PostDetail from './pages/PostDetail';
import CreatePost from './pages/CreatePost';
import EditProfile from './pages/EditProfile';
import Chat from './pages/Chat';

function PrivateRoute({ children }) {
  const { user } = useSelector((s) => s.auth);
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user } = useSelector((s) => s.auth);
  return !user ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

        {/* Protected routes — normal pages with navbar + padding */}
        <Route path="/" element={
          <PrivateRoute>
            <Navbar />
            <div style={{ paddingTop: '60px', minHeight: '100vh',
              background: 'var(--bg-primary)' }}>
              <Feed />
            </div>
          </PrivateRoute>
        } />

        <Route path="/explore" element={
          <PrivateRoute>
            <Navbar />
            <div style={{ paddingTop: '60px', minHeight: '100vh',
              background: 'var(--bg-primary)' }}>
              <Explore />
            </div>
          </PrivateRoute>
        } />

        <Route path="/create" element={
          <PrivateRoute>
            <Navbar />
            <div style={{ paddingTop: '60px', minHeight: '100vh',
              background: 'var(--bg-primary)' }}>
              <CreatePost />
            </div>
          </PrivateRoute>
        } />

        <Route path="/profile/:username" element={
          <PrivateRoute>
            <Navbar />
            <div style={{ paddingTop: '60px', minHeight: '100vh',
              background: 'var(--bg-primary)' }}>
              <Profile />
            </div>
          </PrivateRoute>
        } />

        <Route path="/post/:id" element={
          <PrivateRoute>
            <Navbar />
            <div style={{ paddingTop: '60px', minHeight: '100vh',
              background: 'var(--bg-primary)' }}>
              <PostDetail />
            </div>
          </PrivateRoute>
        } />

        <Route path="/edit-profile" element={
          <PrivateRoute>
            <Navbar />
            <div style={{ paddingTop: '60px', minHeight: '100vh',
              background: 'var(--bg-primary)' }}>
              <EditProfile />
            </div>
          </PrivateRoute>
        } />

        {/* Chat — full viewport, no scroll wrapper */}
        <Route path="/messages" element={
          <PrivateRoute>
            <div style={{ height: '100vh', display: 'flex',
              flexDirection: 'column', background: 'var(--bg-primary)',
              overflow: 'hidden' }}>
              <Navbar />
              <div style={{ flex: 1, overflow: 'hidden', display: 'flex',
                flexDirection: 'column', marginTop: '60px' }}>
                <Chat />
              </div>
            </div>
          </PrivateRoute>
        } />

        <Route path="/messages/:convId" element={
          <PrivateRoute>
            <div style={{ height: '100vh', display: 'flex',
              flexDirection: 'column', background: 'var(--bg-primary)',
              overflow: 'hidden' }}>
              <Navbar />
              <div style={{ flex: 1, overflow: 'hidden', display: 'flex',
                flexDirection: 'column', marginTop: '60px' }}>
                <Chat />
              </div>
            </div>
          </PrivateRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}