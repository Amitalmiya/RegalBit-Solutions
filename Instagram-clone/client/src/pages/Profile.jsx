import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getUserProfileAPI, toggleFollowAPI } from '../services/userService.js';

export default function Profile() {
  const { username } = useParams();
  const navigate = useNavigate();
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
      } catch { navigate('/'); }
      finally { setLoading(false); }
    };
    fetchProfile();
  }, [username, navigate, currentUser]);

  const handleFollow = async () => {
    try {
      const res = await toggleFollowAPI(profile._id);
      setFollowing(res.data.following);
      setProfile((p) => ({
        ...p,
        followers: res.data.following
          ? [...p.followers, { _id: currentUser._id }]
          : p.followers.filter((f) => f._id !== currentUser._id),
      }));
    } catch (err) { console.error(err); }
  };

  if (loading) return (
    <div className="flex justify-center pt-20">
      <div className="w-10 h-10 rounded-full animate-spin"
        style={{ border: '2px solid var(--border)', borderTopColor: 'var(--accent-1)' }} />
    </div>
  );
  if (!profile) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="glass rounded-2xl p-8 mb-6 animate-fade-up" style={{ borderRadius: '20px' }}>
        <div className="flex items-start gap-12">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="avatar-ring" style={{ width: '110px', height: '110px', padding: '3px' }}>
              <img src={profile.avatar} alt={profile.username}
                className="w-full h-full rounded-full object-cover"
                style={{ border: '3px solid var(--bg-primary)' }} />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-5 flex-wrap">
              <h2 className="text-2xl font-light" style={{ color: 'var(--text-primary)' }}>
                {profile.username}
              </h2>
              {isOwnProfile ? (
                <Link to="/edit-profile"
                  className="btn-secondary px-4 py-1.5 rounded-xl text-sm">
                  Edit Profile
                </Link>
              ) : (
                <button onClick={handleFollow}
                  className={`px-6 py-1.5 rounded-xl text-sm font-semibold transition-all ${following ? 'btn-secondary' : 'btn-primary'}`}>
                  {following ? 'Following' : 'Follow'}
                </button>
              )}
            </div>

            {/* Stats */}
            <div className="flex gap-8 mb-5">
              {[
                { label: 'posts',     value: posts.length },
                { label: 'followers', value: profile.followers.length },
                { label: 'following', value: profile.following.length },
              ].map(({ label, value }) => (
                <div key={label} className="text-center">
                  <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{value}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
                </div>
              ))}
            </div>

            {/* Bio */}
            <div>
              {profile.fullName && (
                <p className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
                  {profile.fullName}
                </p>
              )}
              {profile.bio && (
                <p className="text-sm whitespace-pre-line" style={{ color: 'var(--text-secondary)' }}>
                  {profile.bio}
                </p>
              )}
              {profile.website && (
                <a href={profile.website} target="_blank" rel="noreferrer"
                  className="text-sm font-semibold mt-1 block" style={{ color: 'var(--accent-1)' }}>
                  {profile.website}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-8 mb-4" style={{ borderTop: '1px solid var(--border)', paddingTop: '0' }}>
        {['posts', 'saved'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="py-3 text-xs font-semibold uppercase tracking-widest transition-all"
            style={{
              borderTop: `2px solid ${activeTab === tab ? 'var(--accent-1)' : 'transparent'}`,
              color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-muted)',
              marginTop: '-1px',
            }}>
            {tab}
          </button>
        ))}
      </div>

      {/* Posts grid */}
      {activeTab === 'posts' && (
        posts.length === 0 ? (
          <div className="text-center py-20 glass rounded-2xl" style={{ borderRadius: '20px' }}>
            <p className="text-5xl mb-4">📷</p>
            <p className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>No Posts Yet</p>
            {isOwnProfile && (
              <Link to="/create" className="btn-primary px-6 py-2.5 rounded-xl text-sm font-semibold inline-block mt-2">
                Share your first photo
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1 rounded-2xl overflow-hidden">
            {posts.map((post) => (
              <Link key={post._id} to={`/post/${post._id}`} className="relative group aspect-square block">
                <img src={post.mediaUrl} alt={post.caption} className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center gap-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  style={{ background: 'rgba(0,0,0,0.5)' }}>
                  <span className="text-white font-bold text-sm">❤️ {post.likes?.length || 0}</span>
                </div>
              </Link>
            ))}
          </div>
        )
      )}
    </div>
  );
}