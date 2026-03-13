export const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now  = new Date();
  const diff = Math.floor((now - date) / 1000); // seconds

  if (diff < 60)          return `${diff}s ago`;
  if (diff < 3600)        return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)       return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800)      return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const formatCount = (count) => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000)    return `${(count / 1000).toFixed(1)}K`;
  return String(count);
};
