import { useState } from 'react';
import { toggleFollowAPI } from '../services/userService.js';

export default function FollowButton({ userId, isFollowing, onToggle }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await toggleFollowAPI(userId);
      onToggle?.(res.data.following);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`text-sm font-semibold px-5 py-1.5 rounded transition ${
        isFollowing
          ? 'border border-gray-300 text-gray-800 hover:bg-gray-50'
          : 'bg-blue-500 hover:bg-blue-600 text-white'
      } disabled:opacity-50`}
    >
      {loading ? '...' : isFollowing ? 'Following' : 'Follow'}
    </button>
  );
}
