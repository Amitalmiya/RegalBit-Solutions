import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { getUserProfileAPI, toggleFollowAPI } from '../services/userService.js';
import { updateUser } from '../store/authSlice.js';

export default function Profile() {
  const { username } = useParams();
  const navigate     = useNavigate();
  const dispatch     = useDispatch();
  const { user: currentUser } = useSelector((s) => s.auth);

  const [profile,   setProfile]   = useState(null);
  const [posts,     setPosts]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [following, setFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');

  const isOwnProfile = currentUser?.username === username;

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await getUserProfileAPI(username);
        setProfile(res.data.user);
        setPosts(res.data.posts);
        setFollowing(res.data.user.followers.some((f) => f._id === currentUser?._id));
      } catch {
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [username, navigate, currentUser]);

  const handleFollow = async () => {
    try {
      const res = await toggleFollowAPI(profile._id);
      setFollowing(res.data.following);
      setProfile((prev) => ({
        ...prev,
        followers: res.data.following
          ? [...prev.followers, { _id: currentUser._id }]
          : prev.followers.filter((f) => f._id !== currentUser._id),
      }));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return (
    <div className="flex justify-center pt-20">
      <div className="w-10 h-10 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
    </div>
  );

  if (!profile) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex items-start gap-16 mb-10">
        <img
          src={profile.avatar}
          alt={profile.username}
          className="w-36 h-36 rounded-full object-cover flex-shrink-0"
        />
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-4 flex-wrap">
            <h2 className="text-2xl font-light">{profile.username}</h2>
            {isOwnProfile ? (
              <Link
                to="/edit-profile"
                className="border border-gray-300 text-sm font-semibold px-4 py-1.5 rounded"
              >
                Edit Profile
              </Link>
            ) : (
              <button
                onClick={handleFollow}
                className={`text-sm font-semibold px-5 py-1.5 rounded ${
                  following
                    ? 'border border-gray-300 text-gray-800'
                    : 'bg-blue-500 text-white'
                }`}
              >
                {following ? 'Following' : 'Follow'}
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="flex gap-8 mb-4">
            <span><strong>{posts.length}</strong> posts</span>
            <span><strong>{profile.followers.length}</strong> followers</span>
            <span><strong>{profile.following.length}</strong> following</span>
          </div>

          {/* Bio */}
          <div>
            {profile.fullName && (
              <p className="font-semibold text-sm">{profile.fullName}</p>
            )}
            {profile.bio && (
              <p className="text-sm whitespace-pre-line mt-1">{profile.bio}</p>
            )}
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-blue-900 font-semibold"
              >
                {profile.website}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-t border-gray-300">
        <div className="flex justify-center gap-12">
          {['posts', 'saved'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 text-xs font-semibold uppercase tracking-widest border-t-2 -mt-px transition ${
                activeTab === tab
                  ? 'border-gray-800 text-gray-800'
                  : 'border-transparent text-gray-500'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Posts grid */}
      {activeTab === 'posts' && (
        posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-2xl font-light mb-2">No Posts Yet</p>
            {isOwnProfile && (
              <Link to="/create" className="text-blue-500 text-sm font-semibold">
                Share your first photo
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1 mt-4">
            {posts.map((post) => (
              <Link key={post._id} to={`/post/${post._id}`} className="relative group aspect-square">
                <img
                  src={post.mediaUrl}
                  alt={post.caption}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-6">
                  <span className="text-white font-bold text-sm">
                    ❤️ {post.likes?.length || 0}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )
      )}
    </div>
  );
}
