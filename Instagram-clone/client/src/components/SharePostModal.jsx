import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { sharePostAPI } from '../services/messageService';
import { searchUsersAPI, getUserProfileAPI } from '../services/userService';

export default function SharePostModal({ post, onClose }) {
  const { user }         = useSelector((s) => s.auth);
  const modalRef         = useRef();
  const [searchQuery,    setSearchQuery]    = useState('');
  const [searchResults,  setSearchResults]  = useState([]);
  const [followers,      setFollowers]      = useState([]);
  const [selected,       setSelected]       = useState([]);
  const [caption,        setCaption]        = useState('');
  const [sending,        setSending]        = useState(false);
  const [sent,           setSent]           = useState(false);
  const [searching,      setSearching]      = useState(false);
  const [activeTab,      setActiveTab]      = useState('followers');

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

  // Load followers
  useEffect(() => {
    if (!user?.username) return;
    getUserProfileAPI(user.username)
      .then((res) => setFollowers(res.data.user.followers || []))
      .catch(console.error);
  }, [user?.username]);

  // Search users debounce
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchUsersAPI(searchQuery);
        setSearchResults(res.data.users.filter((u) => u._id !== user._id));
      } catch (err) { console.error(err); }
      finally { setSearching(false); }
    }, 400);
    return () => clearTimeout(t);
  }, [searchQuery, user._id]);

  const toggleSelect = (u) => {
    setSelected((prev) =>
      prev.find((s) => s._id === u._id)
        ? prev.filter((s) => s._id !== u._id)
        : [...prev, u]
    );
  };

  const isSelected = (u) => selected.some((s) => s._id === u._id);

  const handleSend = async () => {
    if (!selected.length || sending) return;
    setSending(true);
    try {
      await sharePostAPI(
        post._id,
        selected.map((u) => u._id),
        caption
      );
      setSent(true);
      setTimeout(onClose, 1800);
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const displayList = activeTab === 'followers' ? followers : searchResults;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
      background: 'rgba(0,0,0,0.65)',
      backdropFilter: 'blur(6px)',
    }}>
      <div ref={modalRef} className="glass" style={{
        width: '100%', maxWidth: '420px',
        borderRadius: '22px', overflow: 'hidden',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '16px 20px',
          borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <h3 style={{ margin: 0, fontWeight: 700, fontSize: '16px',
            color: 'var(--text-primary)' }}>
            Share Post
          </h3>
          <button onClick={onClose} style={{
            width: '32px', height: '32px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--hover-overlay)', border: 'none',
            cursor: 'pointer', color: 'var(--text-muted)',
            fontSize: '14px', fontWeight: 700,
          }}>✕</button>
        </div>

        {/* Post preview */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '12px 20px', flexShrink: 0,
          background: 'var(--hover-overlay)',
          borderBottom: '1px solid var(--border)',
        }}>
          <img src={post.mediaUrl} alt="" style={{
            width: '52px', height: '52px', borderRadius: '12px',
            objectFit: 'cover', flexShrink: 0,
          }} />
          <div style={{ overflow: 'hidden' }}>
            <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: 600,
              color: 'var(--text-primary)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              @{post.author?.username}
            </p>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {post.caption || 'No caption'}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', flexShrink: 0,
          borderBottom: '1px solid var(--border)' }}>
          {['followers', 'search'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              flex: 1, padding: '12px', fontSize: '12px',
              fontWeight: 600, textTransform: 'uppercase',
              letterSpacing: '0.05em', background: 'transparent',
              border: 'none', cursor: 'pointer',
              borderBottom: `2px solid ${activeTab === tab
                ? 'var(--accent-1)' : 'transparent'}`,
              color: activeTab === tab ? 'var(--accent-1)' : 'var(--text-muted)',
              marginBottom: '-1px',
            }}>
              {tab === 'followers'
                ? `Followers (${followers.length})`
                : 'Search'}
            </button>
          ))}
        </div>

        {/* Search input */}
        {activeTab === 'search' && (
          <div style={{ padding: '12px 16px 8px', flexShrink: 0 }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search by username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="input-base"
                style={{ borderRadius: '12px', padding: '10px 36px 10px 14px',
                  fontSize: '14px', width: '100%' }}
              />
              {searching ? (
                <div style={{ position: 'absolute', right: '12px',
                  top: '50%', transform: 'translateY(-50%)' }}>
                  <div className="animate-spin" style={{
                    width: '16px', height: '16px', borderRadius: '50%',
                    border: '2px solid var(--border)',
                    borderTopColor: 'var(--accent-1)',
                  }} />
                </div>
              ) : (
                <svg style={{ position: 'absolute', right: '12px',
                  top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-muted)' }}
                  width="16" height="16" fill="none" stroke="currentColor"
                  strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              )}
            </div>
          </div>
        )}

        {/* Selected chips */}
        {selected.length > 0 && (
          <div style={{
            display: 'flex', gap: '8px', padding: '8px 16px',
            overflowX: 'auto', flexShrink: 0,
            borderBottom: '1px solid var(--border)',
          }}>
            {selected.map((u) => (
              <button key={u._id} onClick={() => toggleSelect(u)} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 12px', borderRadius: '20px',
                fontSize: '12px', fontWeight: 600, flexShrink: 0,
                background: 'rgba(147,51,234,0.15)',
                color: 'var(--accent-1)',
                border: '1px solid rgba(147,51,234,0.3)',
                cursor: 'pointer',
              }}>
                <img src={u.avatar} alt="" style={{
                  width: '16px', height: '16px',
                  borderRadius: '50%', objectFit: 'cover',
                }} />
                {u.username}
                <span style={{ opacity: 0.7 }}>✕</span>
              </button>
            ))}
          </div>
        )}

        {/* User list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {displayList.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '32px 24px', textAlign: 'center' }}>
              <p style={{ fontSize: '32px', margin: '0 0 8px' }}>
                {activeTab === 'followers' ? '👥' : '🔍'}
              </p>
              <p style={{ margin: 0, fontSize: '14px',
                color: 'var(--text-muted)' }}>
                {activeTab === 'followers'
                  ? 'No followers yet'
                  : searchQuery
                    ? `No results for "${searchQuery}"`
                    : 'Type a username to search'}
              </p>
            </div>
          ) : (
            displayList.map((u) => (
              <button key={u._id} onClick={() => toggleSelect(u)} style={{
                width: '100%', display: 'flex', alignItems: 'center',
                gap: '12px', padding: '10px 20px',
                background: 'transparent', border: 'none',
                cursor: 'pointer', textAlign: 'left',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = 'var(--hover-overlay)')}
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = 'transparent')}
              >
                <div className="avatar-ring" style={{
                  width: '42px', height: '42px', padding: '2px', flexShrink: 0,
                }}>
                  <img src={u.avatar} alt={u.username} style={{
                    width: '100%', height: '100%', borderRadius: '50%',
                    objectFit: 'cover', border: '2px solid var(--bg-primary)',
                  }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: '0 0 2px', fontSize: '14px',
                    fontWeight: 600, color: 'var(--text-primary)',
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap' }}>
                    {u.username}
                  </p>
                  <p style={{ margin: 0, fontSize: '12px',
                    color: 'var(--text-muted)' }}>
                    {u.fullName || 'Instagram member'}
                  </p>
                </div>
                {/* Checkbox */}
                <div style={{
                  width: '24px', height: '24px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, transition: 'all 0.2s ease',
                  background: isSelected(u) ? 'var(--gradient)' : 'transparent',
                  border: `2px solid ${isSelected(u)
                    ? 'transparent' : 'var(--border-hover)'}`,
                }}>
                  {isSelected(u) && (
                    <svg width="12" height="12" viewBox="0 0 24 24"
                      fill="none" stroke="white" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Caption input */}
        {selected.length > 0 && (
          <div style={{ padding: '8px 16px', flexShrink: 0,
            borderTop: '1px solid var(--border)' }}>
            <input
              type="text"
              placeholder="Add a message... (optional)"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="input-base"
              style={{ borderRadius: '12px', padding: '10px 14px',
                fontSize: '14px', width: '100%' }}
            />
          </div>
        )}

        {/* Send button */}
        <div style={{ padding: '12px 16px', flexShrink: 0 }}>
          {sent ? (
            <div style={{
              padding: '12px', borderRadius: '12px', textAlign: 'center',
              fontSize: '14px', fontWeight: 600,
              background: 'rgba(52,211,153,0.12)',
              color: '#34d399',
              border: '1px solid rgba(52,211,153,0.25)',
            }}>
              ✓ Sent to {selected.length}{' '}
              {selected.length === 1 ? 'person' : 'people'}!
            </div>
          ) : (
            <button
              onClick={handleSend}
              disabled={!selected.length || sending}
              className="btn-primary"
              style={{
                width: '100%', padding: '12px', borderRadius: '12px',
                fontSize: '14px', fontWeight: 600,
                opacity: !selected.length || sending ? 0.45 : 1,
              }}
            >
              {sending ? (
                <span style={{ display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '8px' }}>
                  <span className="animate-spin" style={{
                    display: 'inline-block', width: '16px', height: '16px',
                    borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)',
                    borderTopColor: '#fff',
                  }} />
                  Sending...
                </span>
              ) : selected.length > 0
                ? `Send to ${selected.length} ${selected.length === 1 ? 'person' : 'people'}`
                : 'Select people to share'
              }
            </button>
          )}
        </div>
      </div>
    </div>
  );
}