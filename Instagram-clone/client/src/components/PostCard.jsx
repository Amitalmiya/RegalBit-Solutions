import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { likePost } from '../store/postSlice.js';
import { addCommentAPI } from '../services/commentService.js';
import { formatDate } from '../utils/formatDate.js';

export default function PostCard({ post }) {
  const dispatch   = useDispatch();
  const { user }   = useSelector((s) => s.auth);

  const [liked,      setLiked]      = useState(post.likes?.some((l) => (l._id || l) === user?._id));
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
  const [comment,    setComment]    = useState('');
  const [comments,   setComments]   = useState([]);
  const [showAll,    setShowAll]    = useState(false);

  const handleLike = async () => {
    const prev = liked;
    setLiked(!prev);
    setLikesCount((c) => prev ? c - 1 : c + 1);
    const result = await dispatch(likePost(post._id));
    if (likePost.rejected.match(result)) {
      setLiked(prev);
      setLikesCount((c) => prev ? c + 1 : c - 1);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    try {
      const res = await addCommentAPI(post._id, { text: comment });
      setComments((prev) => [...prev, res.data.comment]);
      setComment('');
    } catch (err) { console.error(err); }
  };

  return (
    <article className="bg-white border border-gray-300 rounded-sm">

      {/* Header */}
      <div className="flex items-center justify-between p-3">
        <Link to={`/profile/${post.author.username}`} className="flex items-center gap-3">
          <img
            src={post.author.avatar}
            alt={post.author.username}
            className="w-9 h-9 rounded-full object-cover ring-2 ring-pink-500 ring-offset-2"
          />
          <div>
            <p className="font-semibold text-sm">{post.author.username}</p>
            {post.location && (
              <p className="text-xs text-gray-500">{post.location}</p>
            )}
          </div>
        </Link>
        <button className="text-gray-500 text-xl leading-none">···</button>
      </div>

      {/* Image */}
      <div className="relative">
        <img
          src={post.mediaUrl}
          alt={post.caption}
          className="w-full object-cover"
          onDoubleClick={handleLike}
        />
      </div>

      {/* Action buttons */}
      <div className="p-3">
        <div className="flex items-center gap-4 mb-2">
          <button onClick={handleLike} className="transition-transform active:scale-110">
            {liked ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 fill-red-500" viewBox="0 0 24 24">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 fill-none stroke-black stroke-2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
              </svg>
            )}
          </button>

          <Link to={`/post/${post._id}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 fill-none stroke-black stroke-2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
          </Link>
        </div>

        {/* Likes count */}
        <p className="font-semibold text-sm mb-1">{likesCount} likes</p>

        {/* Caption */}
        {post.caption && (
          <p className="text-sm mb-1">
            <Link to={`/profile/${post.author.username}`} className="font-semibold mr-1">
              {post.author.username}
            </Link>
            {post.caption}
          </p>
        )}

        {/* Comments preview */}
        {(post.commentCount > 0 || comments.length > 0) && (
          <Link to={`/post/${post._id}`} className="text-gray-500 text-sm">
            View all {(post.commentCount || 0) + comments.length} comments
          </Link>
        )}

        {/* New comments (locally added) */}
        {comments.map((c) => (
          <p key={c._id} className="text-sm mt-1">
            <span className="font-semibold mr-1">{c.author.username}</span>
            {c.text}
          </p>
        ))}

        {/* Timestamp */}
        <p className="text-gray-400 text-xs mt-2 uppercase tracking-wide">
          {formatDate(post.createdAt)}
        </p>
      </div>

      {/* Comment input */}
      <form onSubmit={handleComment} className="flex items-center gap-2 px-3 pb-3 border-t border-gray-100 pt-2">
        <input
          type="text"
          placeholder="Add a comment..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="flex-1 text-sm focus:outline-none"
        />
        <button
          type="submit"
          disabled={!comment.trim()}
          className="text-blue-500 font-semibold text-sm disabled:opacity-40"
        >
          Post
        </button>
      </form>
    </article>
  );
}
