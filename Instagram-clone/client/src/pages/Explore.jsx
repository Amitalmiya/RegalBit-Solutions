import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getExploreAPI } from '../services/postService.js';
import { searchUsersAPI } from '../services/userService.js';

export default function Explore() {
  const [posts,   setPosts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [query,   setQuery]   = useState('');
  const [users,   setUsers]   = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const fetchExplore = async () => {
      try {
        const res = await getExploreAPI();
        setPosts(res.data.posts);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchExplore();
  }, []);

  useEffect(() => {
    if (!query.trim()) { setUsers([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchUsersAPI(query);
        setUsers(res.data.users);
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">

      {/* Search bar */}
      <div className="relative mb-6">
        <input
          type="text"
          placeholder="Search users..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-gray-100 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
        />
        {searching && (
          <div className="absolute right-3 top-2.5">
            <div className="w-4 h-4 border-2 border-gray-400 border-t-gray-700 rounded-full animate-spin" />
          </div>
        )}

        {/* Search results dropdown */}
        {users.length > 0 && (
          <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-10">
            {users.map((u) => (
              <Link
                key={u._id}
                to={`/profile/${u.username}`}
                onClick={() => { setQuery(''); setUsers([]); }}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50"
              >
                <img
                  src={u.avatar}
                  alt={u.username}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <p className="text-sm font-semibold">{u.username}</p>
                  <p className="text-xs text-gray-500">{u.fullName}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Explore grid */}
      {loading ? (
        <div className="flex justify-center pt-20">
          <div className="w-10 h-10 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1">
          {posts.map((post, idx) => (
            <Link
              key={post._id}
              to={`/post/${post._id}`}
              className={`relative group ${
                idx % 7 === 0 ? 'col-span-2 row-span-2' : ''
              }`}
            >
              <div className="aspect-square overflow-hidden">
                <img
                  src={post.mediaUrl}
                  alt={post.caption}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-6">
                <span className="text-white font-bold text-sm">
                  ❤️ {post.likes?.length || 0}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
