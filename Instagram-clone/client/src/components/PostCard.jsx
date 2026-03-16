import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { likePost } from '../store/postSlice.js';
import { addCommentAPI } from '../services/commentService.js';
import { formatDate } from '../utils/formatDate.js';

// ─── Share Modal ────────────────────────────────────────────────────────────
function ShareModal({ post, onClose }) {
  const postUrl  = `${window.location.origin}/post/${post._id}`;
  const [copied, setCopied] = useState(false);
  const modalRef = useRef();

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input');
      input.value = postUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const shareOptions = [
    {
      label: 'Copy Link',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      action: copyLink,
      highlight: copied,
      highlightLabel: '✓ Copied!',
      color: 'var(--accent-1)',
    },
    {
      label: 'Share on WhatsApp',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      ),
      action: () => window.open(
        `https://wa.me/?text=${encodeURIComponent(`Check out this post: ${postUrl}`)}`,
        '_blank'
      ),
      color: '#25D366',
    },
    {
      label: 'Share on Twitter / X',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
      action: () => window.open(
        `https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(`Check out this post by @${post.author.username}`)}`,
        '_blank'
      ),
      color: '#1DA1F2',
    },
    {
      label: 'Share on Facebook',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      action: () => window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`,
        '_blank'
      ),
      color: '#1877F2',
    },
    {
      label: 'Share via Email',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      action: () => window.open(
        `mailto:?subject=${encodeURIComponent(`Check out this post`)}&body=${encodeURIComponent(`Hey! Check out this post: ${postUrl}`)}`,
        '_blank'
      ),
      color: 'var(--accent-3)',
    },
    {
      label: 'Native Share',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
      ),
      action: async () => {
        if (navigator.share) {
          try {
            await navigator.share({
              title:  `Post by @${post.author.username}`,
              text:   post.caption || 'Check out this post!',
              url:    postUrl,
            });
          } catch { /* user cancelled */ }
        } else {
          copyLink(); // fallback
        }
      },
      color: 'var(--accent-2)',
      hidden: !navigator.share,
    },
  ].filter((o) => !o.hidden);

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
    >
      <div
        ref={modalRef}
        className="glass w-full max-w-sm animate-fade-up"
        style={{ borderRadius: '20px', overflow: 'hidden' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <h3 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
            Share Post
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ background: 'var(--hover-overlay)', color: 'var(--text-muted)',
              border: 'none', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {/* Post preview strip */}
        <div
          className="flex items-center gap-3 px-5 py-3"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--hover-overlay)' }}
        >
          <img
            src={post.mediaUrl}
            alt=""
            className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
          />
          <div className="overflow-hidden">
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
              @{post.author.username}
            </p>
            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
              {post.caption || 'View post'}
            </p>
          </div>
        </div>

        {/* Share options */}
        <div className="p-3">
          {shareOptions.map((opt) => (
            <button
              key={opt.label}
              onClick={() => { opt.action(); if (opt.label !== 'Copy Link') onClose(); }}
              className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: opt.highlight ? opt.color : 'var(--text-primary)',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--hover-overlay)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <span
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${opt.color}18`, color: opt.color }}
              >
                {opt.icon}
              </span>
              <span>{opt.highlight ? opt.highlightLabel : opt.label}</span>
            </button>
          ))}
        </div>

        {/* URL bar */}
        <div
          className="mx-4 mb-4 flex items-center gap-2 px-4 py-2.5 rounded-xl"
          style={{ background: 'var(--input-bg)', border: '1px solid var(--border)' }}
        >
          <p
            className="flex-1 text-xs truncate"
            style={{ color: 'var(--text-muted)' }}
          >
            {postUrl}
          </p>
          <button
            onClick={copyLink}
            className="text-xs font-bold flex-shrink-0 px-3 py-1 rounded-lg"
            style={{
              background: copied ? 'rgba(52,211,153,0.15)' : 'var(--gradient-soft)',
              color: copied ? '#34d399' : 'var(--accent-1)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PostCard ───────────────────────────────────────────────────────────────
export default function PostCard({ post }) {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);

  const [liked,       setLiked]       = useState(post.likes?.some((l) => (l._id || l) === user?._id));
  const [likesCount,  setLikesCount]  = useState(post.likes?.length || 0);
  const [comment,     setComment]     = useState('');
  const [comments,    setComments]    = useState([]);
  const [heartAnim,   setHeartAnim]   = useState(false);
  const [showShare,   setShowShare]   = useState(false);

  const handleLike = async () => {
    const prev = liked;
    setLiked(!prev);
    setLikesCount((c) => (prev ? c - 1 : c + 1));
    if (!prev) { setHeartAnim(true); setTimeout(() => setHeartAnim(false), 400); }
    const result = await dispatch(likePost(post._id));
    if (likePost.rejected.match(result)) {
      setLiked(prev);
      setLikesCount((c) => (prev ? c + 1 : c - 1));
    }
  };

  const handleDoubleClick = () => { if (!liked) handleLike(); };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    try {
      const res = await addCommentAPI(post._id, { text: comment });
      setComments((p) => [...p, res.data.comment]);
      setComment('');
    } catch (err) { console.error(err); }
  };

  return (
    <>
      <article
        className="glass animate-fade-up"
        style={{ borderRadius: '18px', overflow: 'hidden', marginBottom: '20px' }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between p-4">
          <Link to={`/profile/${post.author.username}`} className="flex items-center gap-3">
            <div
              className="avatar-ring flex-shrink-0"
              style={{ width: '42px', height: '42px', padding: '2px' }}
            >
              <img
                src={post.author.avatar}
                alt={post.author.username}
                className="w-full h-full rounded-full object-cover"
                style={{ border: '2px solid var(--bg-primary)' }}
              />
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                {post.author.username}
              </p>
              {post.location && (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  📍 {post.location}
                </p>
              )}
            </div>
          </Link>
          <button
            style={{ background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: '1.25rem' }}
          >
            ···
          </button>
        </div>

        {/* ── Image ── */}
        <div
          className="relative overflow-hidden cursor-pointer"
          onDoubleClick={handleDoubleClick}
        >
          <img
            src={post.mediaUrl}
            alt={post.caption}
            className="w-full object-cover"
            style={{ maxHeight: '500px', display: 'block' }}
          />
          {heartAnim && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-7xl animate-heart-pop">❤️</span>
            </div>
          )}
        </div>

        {/* ── Action buttons ── */}
        <div className="p-4">
          <div className="flex items-center gap-4 mb-3">

            {/* Like */}
            <button
              onClick={handleLike}
              className="transition-transform active:scale-90"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              title="Like"
            >
              {liked ? (
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="#f472b6">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                </svg>
              ) : (
                <svg
                  className="w-7 h-7"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                </svg>
              )}
            </button>

            {/* Comment */}
            <Link to={`/post/${post._id}`} title="Comment">
              <svg
                className="w-7 h-7"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ color: 'var(--text-secondary)' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
            </Link>

            {/* ── SHARE BUTTON ── */}
            <button
              onClick={() => setShowShare(true)}
              className="transition-transform active:scale-90 ml-auto"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              title="Share"
            >
              <svg
                className="w-7 h-7"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ color: 'var(--text-secondary)' }}
              >
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>

          </div>

          {/* Likes count */}
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            {likesCount.toLocaleString()} {likesCount === 1 ? 'like' : 'likes'}
          </p>

          {/* Caption */}
          {post.caption && (
            <p className="text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
              <Link
                to={`/profile/${post.author.username}`}
                className="font-semibold mr-2"
                style={{ color: 'var(--text-primary)' }}
              >
                {post.author.username}
              </Link>
              <span style={{ color: 'var(--text-secondary)' }}>{post.caption}</span>
            </p>
          )}

          {/* Comment count */}
          {(post.commentCount > 0 || comments.length > 0) && (
            <Link
              to={`/post/${post._id}`}
              className="text-sm block mb-1"
              style={{ color: 'var(--text-muted)' }}
            >
              View all {(post.commentCount || 0) + comments.length} comments
            </Link>
          )}

          {/* New local comments */}
          {comments.map((c) => (
            <p key={c._id} className="text-sm mb-0.5" style={{ color: 'var(--text-secondary)' }}>
              <span className="font-semibold mr-1" style={{ color: 'var(--text-primary)' }}>
                {c.author.username}
              </span>
              {c.text}
            </p>
          ))}

          {/* Timestamp */}
          <p
            className="text-xs mt-2 uppercase tracking-wider"
            style={{ color: 'var(--text-muted)' }}
          >
            {formatDate(post.createdAt)}
          </p>
        </div>

        {/* ── Comment input ── */}
        <form
          onSubmit={handleComment}
          className="flex items-center gap-3 px-4 pb-4 pt-2"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <img
            src={user?.avatar}
            alt=""
            className="w-7 h-7 rounded-full object-cover flex-shrink-0"
          />
          <input
            type="text"
            placeholder="Add a comment..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="flex-1 text-sm bg-transparent focus:outline-none"
            style={{ color: 'var(--text-primary)' }}
          />
          <button
            type="submit"
            disabled={!comment.trim()}
            className="text-xs font-bold disabled:opacity-30 transition-opacity"
            style={{ color: 'var(--accent-1)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Post
          </button>
        </form>
      </article>

      {/* ── Share Modal ── */}
      {showShare && (
        <ShareModal post={post} onClose={() => setShowShare(false)} />
      )}
    </>
  );
}