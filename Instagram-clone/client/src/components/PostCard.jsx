import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { likePost } from '../store/postSlice';
import { addCommentAPI } from '../services/commentService';
import { formatDate } from '../utils/formatDate';
import SharePostModal from './SharePostModal';

export default function PostCard({ post }) {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);

  const [liked,      setLiked]      = useState(post.likes?.some((l) => (l._id || l) === user?._id));
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
  const [comment,    setComment]    = useState('');
  const [comments,   setComments]   = useState([]);
  const [heartAnim,  setHeartAnim]  = useState(false);
  const [showShare,  setShowShare]  = useState(false);

  // ── Like handler ──────────────────────────────────────────────────
  const handleLike = async () => {
    const prev = liked;
    setLiked(!prev);
    setLikesCount((c) => (prev ? c - 1 : c + 1));
    if (!prev) {
      setHeartAnim(true);
      setTimeout(() => setHeartAnim(false), 400);
    }
    const result = await dispatch(likePost(post._id));
    if (likePost.rejected.match(result)) {
      setLiked(prev);
      setLikesCount((c) => (prev ? c + 1 : c - 1));
    }
  };

  // ── Comment handler ───────────────────────────────────────────────
  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    try {
      const res = await addCommentAPI(post._id, { text: comment });
      setComments((prev) => [...prev, res.data.comment]);
      setComment('');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <article
        className="glass animate-fade-up"
        style={{ borderRadius: '18px', overflow: 'hidden', marginBottom: '20px' }}
      >
        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '14px 16px' }}>
          <Link
            to={`/profile/${post.author.username}`}
            style={{ display: 'flex', alignItems: 'center', gap: '12px',
              textDecoration: 'none' }}
          >
            <div className="avatar-ring" style={{ width: '42px', height: '42px',
              padding: '2px', flexShrink: 0 }}>
              <img
                src={post.author.avatar}
                alt={post.author.username}
                style={{ width: '100%', height: '100%', borderRadius: '50%',
                  objectFit: 'cover', border: '2px solid var(--bg-primary)' }}
              />
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: '14px',
                color: 'var(--text-primary)' }}>
                {post.author.username}
              </p>
              {post.location && (
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
                  📍 {post.location}
                </p>
              )}
            </div>
          </Link>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', fontSize: '20px', lineHeight: 1 }}>
            ···
          </button>
        </div>

        {/* ── Image ── */}
        <div
          style={{ position: 'relative', overflow: 'hidden', cursor: 'pointer' }}
          onDoubleClick={() => { if (!liked) handleLike(); }}
        >
          <img
            src={post.mediaUrl}
            alt={post.caption}
            style={{ width: '100%', objectFit: 'cover',
              maxHeight: '500px', display: 'block' }}
          />
          {heartAnim && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none' }}>
              <span className="animate-heart-pop" style={{ fontSize: '72px' }}>❤️</span>
            </div>
          )}
        </div>

        {/* ── Action Buttons ── */}
        <div style={{ padding: '14px 16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center',
            gap: '16px', marginBottom: '10px' }}>

            {/* Like button */}
            <button
              onClick={handleLike}
              title="Like"
              style={{ background: 'none', border: 'none', cursor: 'pointer',
                padding: 0, display: 'flex', alignItems: 'center',
                transition: 'transform 0.1s ease' }}
              onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.88)')}
              onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              {liked ? (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="#f472b6">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                </svg>
              ) : (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                  stroke="var(--text-primary)" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                </svg>
              )}
            </button>

            {/* Comment button */}
            <Link to={`/post/${post._id}`} title="Comment"
              style={{ display: 'flex', alignItems: 'center' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                stroke="var(--text-secondary)" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
            </Link>

            {/* ── Share button ── opens SharePostModal */}
            <button
              onClick={() => setShowShare(true)}
              title="Share post"
              style={{ background: 'none', border: 'none', cursor: 'pointer',
                padding: 0, marginLeft: 'auto', display: 'flex', alignItems: 'center',
                transition: 'transform 0.1s ease' }}
              onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.88)')}
              onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                stroke="var(--text-secondary)" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>

          {/* Likes count */}
          <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: '14px',
            color: 'var(--text-primary)' }}>
            {likesCount.toLocaleString()} {likesCount === 1 ? 'like' : 'likes'}
          </p>

          {/* Caption */}
          {post.caption && (
            <p style={{ margin: '0 0 4px', fontSize: '14px',
              color: 'var(--text-primary)' }}>
              <Link
                to={`/profile/${post.author.username}`}
                style={{ fontWeight: 600, marginRight: '6px',
                  color: 'var(--text-primary)', textDecoration: 'none' }}
              >
                {post.author.username}
              </Link>
              <span style={{ color: 'var(--text-secondary)' }}>{post.caption}</span>
            </p>
          )}

          {/* Comments link */}
          {(post.commentCount > 0 || comments.length > 0) && (
            <Link
              to={`/post/${post._id}`}
              style={{ fontSize: '14px', color: 'var(--text-muted)',
                display: 'block', marginBottom: '4px', textDecoration: 'none' }}
            >
              View all {(post.commentCount || 0) + comments.length} comments
            </Link>
          )}

          {/* New local comments */}
          {comments.map((c) => (
            <p key={c._id} style={{ margin: '2px 0', fontSize: '14px',
              color: 'var(--text-secondary)' }}>
              <span style={{ fontWeight: 600, marginRight: '6px',
                color: 'var(--text-primary)' }}>
                {c.author.username}
              </span>
              {c.text}
            </p>
          ))}

          {/* Timestamp */}
          <p style={{ margin: '8px 0 0', fontSize: '11px', textTransform: 'uppercase',
            letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
            {formatDate(post.createdAt)}
          </p>
        </div>

        {/* ── Comment Input ── */}
        <form
          onSubmit={handleComment}
          style={{ display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 16px 14px',
            borderTop: '1px solid var(--border)', marginTop: '12px' }}
        >
          <img
            src={user?.avatar}
            alt=""
            style={{ width: '28px', height: '28px', borderRadius: '50%',
              objectFit: 'cover', flexShrink: 0 }}
          />
          <input
            type="text"
            placeholder="Add a comment..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            style={{ flex: 1, fontSize: '14px', background: 'transparent',
              border: 'none', outline: 'none', color: 'var(--text-primary)' }}
          />
          <button
            type="submit"
            disabled={!comment.trim()}
            style={{ fontSize: '13px', fontWeight: 700,
              color: 'var(--accent-1)', background: 'none',
              border: 'none', cursor: 'pointer',
              opacity: comment.trim() ? 1 : 0.35,
              transition: 'opacity 0.2s' }}
          >
            Post
          </button>
        </form>
      </article>

      {/* ── Share Post Modal ── */}
      {showShare && (
        <SharePostModal post={post} onClose={() => setShowShare(false)} />
      )}
    </>
  );
}