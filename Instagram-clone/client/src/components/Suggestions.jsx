import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSuggestionsAPI, toggleFollowAPI } from '../services/userService.js';

export default function Suggestions() {
  const [suggestions, setSuggestions] = useState([]);
  const [followed,    setFollowed]    = useState({});

  useEffect(() => {
    getSuggestionsAPI()
      .then((res) => setSuggestions(res.data.suggestions))
      .catch(console.error);
  }, []);

  const handleFollow = async (userId) => {
    try {
      await toggleFollowAPI(userId);
      setFollowed((prev) => ({ ...prev, [userId]: true }));
    } catch (err) { console.error(err); }
  };

  if (suggestions.length === 0) return null;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm font-semibold text-gray-500">Suggestions For You</p>
        <button className="text-xs font-semibold">See All</button>
      </div>

      <div className="space-y-3">
        {suggestions.map((s) => (
          <div key={s._id} className="flex items-center justify-between">
            <Link to={`/profile/${s.username}`} className="flex items-center gap-3">
              <img
                src={s.avatar}
                alt={s.username}
                className="w-9 h-9 rounded-full object-cover"
              />
              <div>
                <p className="text-sm font-semibold leading-tight">{s.username}</p>
                <p className="text-xs text-gray-500">
                  {s.followers?.length} followers
                </p>
              </div>
            </Link>
            {followed[s._id] ? (
              <span className="text-xs text-gray-400 font-semibold">Following</span>
            ) : (
              <button
                onClick={() => handleFollow(s._id)}
                className="text-xs font-semibold text-blue-500"
              >
                Follow
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
