import { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { updateUser } from '../store/authSlice.js';
import { updateProfileAPI } from '../services/userService.js';

export default function EditProfile() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { user }  = useSelector((s) => s.auth);
  const fileRef   = useRef();

  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    bio:      user?.bio      || '',
    website:  user?.website  || '',
  });
  const [avatar,  setAvatar]  = useState(null);
  const [preview, setPreview] = useState(user?.avatar || '');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatar(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('fullName', form.fullName);
      formData.append('bio',      form.bio);
      formData.append('website',  form.website);
      if (avatar) formData.append('avatar', avatar);

      const res = await updateProfileAPI(formData);
      dispatch(updateUser(res.data.user));
      setSuccess(true);
      setTimeout(() => navigate(`/profile/${user.username}`), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-semibold mb-6">Edit Profile</h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Avatar */}
        <div className="flex items-center gap-6">
          <img src={preview} alt="avatar"
            className="w-16 h-16 rounded-full object-cover" />
          <div>
            <p className="font-semibold text-sm">{user?.username}</p>
            <button type="button" onClick={() => fileRef.current.click()}
              className="text-blue-500 text-sm font-semibold mt-1">
              Change profile photo
            </button>
            <input ref={fileRef} type="file" accept="image/*"
              className="hidden" onChange={handleAvatarChange} />
          </div>
        </div>

        {error   && <p className="text-red-500 text-sm">{error}</p>}
        {success && <p className="text-green-500 text-sm">Profile updated! Redirecting...</p>}

        {/* Full name */}
        <div>
          <label className="block text-sm font-semibold mb-1">Name</label>
          <input name="fullName" value={form.fullName} onChange={handleChange}
            placeholder="Full Name"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500" />
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-semibold mb-1">Bio</label>
          <textarea name="bio" value={form.bio} onChange={handleChange}
            maxLength={150} rows={3} placeholder="Bio"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm resize-none focus:outline-none focus:border-gray-500" />
          <p className="text-right text-xs text-gray-400">{form.bio.length}/150</p>
        </div>

        {/* Website */}
        <div>
          <label className="block text-sm font-semibold mb-1">Website</label>
          <input name="website" value={form.website} onChange={handleChange}
            placeholder="Website URL"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500" />
        </div>

        <button type="submit" disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold rounded px-6 py-2 text-sm transition">
          {loading ? 'Saving...' : 'Submit'}
        </button>
      </form>
    </div>
  );
}
