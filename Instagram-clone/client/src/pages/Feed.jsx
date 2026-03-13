import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFeed } from '../store/postSlice.js';
import PostCard from '../components/PostCard.jsx';
import Suggestions from '../components/Suggestions.jsx';

export default function Feed() {
  const dispatch = useDispatch();
  const { posts, loading, error, hasMore, page } = useSelector((s) => s.posts);
  const { user } = useSelector((s) => s.auth);

  useEffect(() => {
    dispatch(fetchFeed(1));
  }, [dispatch]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) dispatch(fetchFeed(page + 1));
  }, [dispatch, loading, hasMore, page]);

  // Infinite scroll
  useEffect(() => {
    const onScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 300
      ) {
        loadMore();
      }
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [loadMore]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 flex gap-8">

      {/* Feed column */}
      <div className="flex-1 max-w-xl">
        {error && (
          <p className="text-center text-red-500 mb-4">{error}</p>
        )}

        {posts.length === 0 && !loading && (
          <div className="text-center py-20">
            <p className="text-2xl font-bold mb-2">Start Following People</p>
            <p className="text-gray-500 text-sm">
              When you follow people, you'll see their photos and videos here.
            </p>
          </div>
        )}

        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard key={post._id} post={post} />
          ))}
        </div>

        {loading && (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          </div>
        )}

        {!hasMore && posts.length > 0 && (
          <p className="text-center text-gray-400 text-sm py-8">
            You're all caught up 🎉
          </p>
        )}
      </div>

      {/* Sidebar */}
      <div className="hidden lg:block w-80 flex-shrink-0">
        {/* Current user */}
        <div className="flex items-center gap-3 mb-6">
          <img
            src={user?.avatar}
            alt={user?.username}
            className="w-14 h-14 rounded-full object-cover"
          />
          <div>
            <p className="font-semibold text-sm">{user?.username}</p>
            <p className="text-gray-500 text-sm">{user?.fullName}</p>
          </div>
        </div>

        {/* Suggestions */}
        <Suggestions />
      </div>
    </div>
  );
}
