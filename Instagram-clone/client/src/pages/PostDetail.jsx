import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { getPostAPI, deletePostAPI } from '../services/postService.js';
import { getCommentsAPI, addCommentAPI, deleteCommentAPI } from '../services/commentService.js';
import { toggleLikeAPI } from '../services/postService.js';
import { removePost } from '../store/postSlice.js';
import { formatDate } from '../utils/formatDate.js';

export default function PostDetail() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const dispatch     = useDispatch();
  const { user }     = useSelector((s) => s.auth);

  const [post,     setPost]     = useState(null);
  const [comments, setComments] = useState([]);
  const [text,     setText]     = useState('');
  const [loading,  setLoading]  = useState(true);
  const [liked,    setLiked]    = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getPostAPI(id);
        setPost(res.data.post);
        setComments(res.data.comments);
        setLiked(res.data.post.likes?.some((l) => l._id === user?._id));
        setLikesCount(res.data.post.likes?.length || 0);
      } catch {
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id, navigate, user]);

  const handleLike = async () => {
    try {
      const res = await toggleLikeAPI(id);
      setLiked(res.data.liked);
      setLikesCount(res.data.likesCount);
    } catch (err) { console.error(err); }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      const res = await addCommentAPI(id, { text });
      setComments((prev) => [...prev, res.data.comment]);
      setText('');
    } catch (err) { console.error(err); }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await deleteCommentAPI(commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch (err) { console.error(err); }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await deletePostAPI(id);
      dispatch(removePost(id));
      navigate('/');
    } catch (err) { console.error(err); }
  };

  if (loading) return (
    <div className="flex justify-center pt-20">
      <div className="w-10 h-10 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
    </div>
  );

  if (!post) return null;

  return (
    <div className="flex justify-center px-4 py-8">
      <div className="flex bg-white border border-gray-300 max-w-4xl w-full rounded overflow-hidden">

        {/* Image */}
        <div className="flex-1 bg-black flex items-center">
          <img src={post.mediaUrl} alt={post.caption} className="w-full max-h-[600px] object-contain" />
        </div>

        {/* Right panel */}
        <div className="w-80 flex flex-col flex-shrink-0">

          {/* Post author header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200">
            <Link to={`/profile/${post.author.username}`} className="flex items-center gap-3">
              <img src={post.author.avatar} alt={post.author.username}
                className="w-8 h-8 rounded-full object-cover" />
              <span className="font-semibold text-sm">{post.author.username}</span>
            </Link>
            {post.author._id === user?._id && (
              <button onClick={handleDeletePost} className="text-red-500 text-xs font-semibold">
                Delete
              </button>
            )}
          </div>

          {/* Comments area */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {/* Caption */}
            {post.caption && (
              <div className="flex gap-3">
                <img src={post.author.avatar} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                <div>
                  <span className="font-semibold text-sm mr-2">{post.author.username}</span>
                  <span className="text-sm">{post.caption}</span>
                  <p className="text-gray-400 text-xs mt-1">{formatDate(post.createdAt)}</p>
                </div>
              </div>
            )}

            {/* Comments */}
            {comments.map((c) => (
              <div key={c._id} className="flex gap-3 group">
                <img src={c.author.avatar} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                <div className="flex-1">
                  <span className="font-semibold text-sm mr-2">{c.author.username}</span>
                  <span className="text-sm">{c.text}</span>
                  <p className="text-gray-400 text-xs mt-1">{formatDate(c.createdAt)}</p>
                </div>
                {c.author._id === user?._id && (
                  <button
                    onClick={() => handleDeleteComment(c._id)}
                    className="text-gray-400 text-xs opacity-0 group-hover:opacity-100"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="border-t border-gray-200 p-3">
            <div className="flex gap-4 mb-2">
              <button onClick={handleLike} className="text-2xl">
                {liked ? '❤️' : '🤍'}
              </button>
              <span className="text-sm font-semibold">{likesCount} likes</span>
            </div>
            <p className="text-gray-400 text-xs mb-3">{formatDate(post.createdAt)}</p>

            {/* Add comment */}
            <form onSubmit={handleComment} className="flex gap-2 border-t border-gray-200 pt-3">
              <input
                type="text"
                placeholder="Add a comment..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="flex-1 text-sm focus:outline-none"
              />
              <button
                type="submit"
                disabled={!text.trim()}
                className="text-blue-500 font-semibold text-sm disabled:opacity-40"
              >
                Post
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
