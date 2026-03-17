import { useEffect, useState, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { io as socketIO } from 'socket.io-client';
import {
  fetchConversations,
  addConversation,
  updateConversationLastMessage,
  setUserOnline,
} from '../store/chatSlice';
import {
  getOrCreateConversationAPI,
  getMessagesAPI,
  sendMessageAPI,
  deleteMessageAPI,
} from '../services/messageService';
import { searchUsersAPI } from '../services/userService';

// ─── Helpers ──────────────────────────────────────────────────────
function formatTime(d) {
  return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatConvTime(d) {
  if (!d) return '';
  const diff = (Date.now() - new Date(d)) / 1000;
  if (diff < 60)    return 'now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

// ─── Shared Post Preview ──────────────────────────────────────────
function SharedPostCard({ sharedPost }) {
  if (!sharedPost) return null;
  return (
    <Link
      to={`/post/${sharedPost._id}`}
      style={{
        display: 'block',
        marginTop: '8px',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.15)',
        background: 'rgba(0,0,0,0.25)',
        maxWidth: '200px',
        textDecoration: 'none',
      }}
    >
      <img
        src={sharedPost.mediaUrl}
        alt="shared post"
        style={{ width: '100%', maxHeight: '160px', objectFit: 'cover', display: 'block' }}
      />
      <div style={{ padding: '8px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <img
            src={sharedPost.author?.avatar}
            alt=""
            style={{ width: '16px', height: '16px', borderRadius: '50%', objectFit: 'cover' }}
          />
          <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.9)',
            margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            @{sharedPost.author?.username}
          </p>
        </div>
        {sharedPost.caption && (
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', margin: 0,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {sharedPost.caption}
          </p>
        )}
        <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.8)',
          margin: '4px 0 0 0' }}>
          View post →
        </p>
      </div>
    </Link>
  );
}

// ─── Conversation List Item ────────────────────────────────────────
function ConvItem({ conv, active, online, onClick }) {
  const lastMsg = conv.lastMessage;
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        background: active ? 'rgba(147,51,234,0.15)' : 'transparent',
        border: 'none',
        borderLeft: `3px solid ${active ? 'var(--accent-1)' : 'transparent'}`,
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background 0.15s ease',
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--hover-overlay)'; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = active ? 'rgba(147,51,234,0.15)' : 'transparent'; }}
    >
      {/* Avatar */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div className="avatar-ring" style={{ width: '48px', height: '48px', padding: '2px' }}>
          <img
            src={conv.otherUser?.avatar}
            alt=""
            style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover',
              border: '2px solid var(--bg-primary)' }}
          />
        </div>
        {online && (
          <span style={{
            position: 'absolute', bottom: 0, right: 0,
            width: '14px', height: '14px', borderRadius: '50%',
            background: '#34d399', border: '2px solid var(--bg-primary)',
          }} />
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
          <p style={{ margin: 0, fontWeight: 600, fontSize: '14px',
            color: 'var(--text-primary)', overflow: 'hidden',
            textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            {conv.otherUser?.username}
          </p>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)',
            flexShrink: 0, marginLeft: '8px' }}>
            {formatConvTime(conv.lastMessageAt)}
          </span>
        </div>
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {lastMsg?.messageType === 'post_share'
            ? '📸 Shared a post'
            : lastMsg?.text || 'Start a conversation'}
        </p>
      </div>
    </button>
  );
}

// ─── Message Bubble ────────────────────────────────────────────────
function MessageBubble({ msg, isOwn, showAvatar, onDelete }) {
  const [showTime, setShowTime] = useState(false);
  const [hovered, setHovered]  = useState(false);
  const isPostShare = msg.messageType === 'post_share';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: '8px',
        marginBottom: '6px',
        flexDirection: isOwn ? 'row-reverse' : 'row',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Other user avatar */}
      {!isOwn && (
        <div style={{ width: '28px', flexShrink: 0 }}>
          {showAvatar && (
            <img
              src={msg.sender?.avatar}
              alt=""
              style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
            />
          )}
        </div>
      )}

      {/* Bubble */}
      <div style={{ maxWidth: '70%', display: 'flex', flexDirection: 'column',
        alignItems: isOwn ? 'flex-end' : 'flex-start' }}>
        <div
          onClick={() => setShowTime((p) => !p)}
          style={{ cursor: 'pointer' }}
        >
          {isPostShare ? (
            <div style={{
              background: isOwn ? 'var(--gradient)' : 'var(--bg-card)',
              borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              border: isOwn ? 'none' : '1px solid var(--border)',
              padding: '10px 14px',
            }}>
              {msg.text && (
                <p style={{ margin: '0 0 8px 0', fontSize: '14px',
                  color: isOwn ? '#fff' : 'var(--text-primary)' }}>
                  {msg.text}
                </p>
              )}
              <SharedPostCard sharedPost={msg.sharedPost} />
            </div>
          ) : (
            <div style={{
              background: isOwn ? 'var(--gradient)' : 'var(--bg-card)',
              color: isOwn ? '#fff' : 'var(--text-primary)',
              borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              border: isOwn ? 'none' : '1px solid var(--border)',
              padding: '10px 16px',
              fontSize: '14px',
              wordBreak: 'break-word',
              lineHeight: '1.5',
            }}>
              {msg.text}
            </div>
          )}
        </div>

        {/* Timestamp + seen */}
        {showTime && (
          <p style={{ fontSize: '11px', marginTop: '4px', padding: '0 4px',
            color: 'var(--text-muted)' }}>
            {formatTime(msg.createdAt)}
            {isOwn && (
              <span style={{ marginLeft: '8px',
                color: msg.seen ? 'var(--accent-1)' : 'var(--text-muted)' }}>
                {msg.seen ? '✓✓' : '✓'}
              </span>
            )}
          </p>
        )}
      </div>

      {/* Delete button — own messages only */}
      {isOwn && hovered && (
        <button
          onClick={() => onDelete(msg._id)}
          style={{
            width: '24px', height: '24px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '10px', flexShrink: 0,
            background: 'rgba(248,113,113,0.15)',
            color: '#f87171',
            border: 'none', cursor: 'pointer',
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}

// ─── Main Chat Page ────────────────────────────────────────────────
export default function Chat() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { convId } = useParams();
  const { user }  = useSelector((s) => s.auth);
  const conversations = useSelector((s) => s.chat?.conversations || []);
  const onlineUsers   = useSelector((s) => s.chat?.onlineUsers   || []);

  const [messages,      setMessages]      = useState([]);
  const [text,          setText]          = useState('');
  const [activeConv,    setActiveConv]    = useState(null);
  const [loadingMsgs,   setLoadingMsgs]   = useState(false);
  const [sending,       setSending]       = useState(false);
  const [typingUsers,   setTypingUsers]   = useState([]);
  const [searchQuery,   setSearchQuery]   = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching,     setSearching]     = useState(false);
  const [showNewChat,   setShowNewChat]   = useState(false);
  const [isMobile,      setIsMobile]      = useState(false);
  const [showConvList,  setShowConvList]  = useState(true);

  const socketRef     = useRef(null);
  const messagesEnd   = useRef(null);
  const typingTimer   = useRef(null);
  const activeConvRef = useRef(null);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Keep ref in sync with activeConv for socket handlers
  useEffect(() => {
    activeConvRef.current = activeConv;
  }, [activeConv]);

  // Socket setup
  useEffect(() => {
    if (!user?._id) return;

    const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
    socketRef.current = socketIO(SOCKET_URL, { transports: ['websocket'] });
    socketRef.current.emit('join', user._id);

    socketRef.current.on('new_message', ({ message, conversationId }) => {
      if (activeConvRef.current?._id === conversationId) {
        setMessages((prev) => [...prev, message]);
      }
      dispatch(updateConversationLastMessage({ conversationId, message }));
    });

    socketRef.current.on('user_online', ({ userId, online }) => {
      dispatch(setUserOnline({ userId, online }));
    });

    socketRef.current.on('typing', ({ username }) => {
      setTypingUsers((prev) => [...new Set([...prev, username])]);
    });

    socketRef.current.on('stop_typing', ({ username }) => {
      setTypingUsers((prev) => prev.filter((u) => u !== username));
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [user?._id, dispatch]);

  // Load conversations on mount
  useEffect(() => {
    dispatch(fetchConversations());
  }, [dispatch]);

  // Auto-open conversation from URL param
  useEffect(() => {
    if (convId && conversations.length > 0 && !activeConv) {
      const found = conversations.find((c) => c._id === convId);
      if (found) openConversation(found);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [convId, conversations]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  // Search users debounce
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchUsersAPI(searchQuery);
        setSearchResults(res.data.users.filter((u) => u._id !== user._id));
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [searchQuery, user._id]);

  // ── Open a conversation ───────────────────────────────────────────
  const openConversation = useCallback(async (conv) => {
    if (activeConvRef.current?._id === conv._id) return;

    setActiveConv(conv);
    setLoadingMsgs(true);
    setMessages([]);
    setTypingUsers([]);

    if (isMobile) setShowConvList(false);

    if (activeConvRef.current) {
      socketRef.current?.emit('leave_conversation', activeConvRef.current._id);
    }
    socketRef.current?.emit('join_conversation', conv._id);

    try {
      const res = await getMessagesAPI(conv._id);
      setMessages(res.data.messages);
      navigate(`/messages/${conv._id}`, { replace: true });
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMsgs(false);
    }
  }, [navigate, isMobile]);

  // ── Start new chat ────────────────────────────────────────────────
  const startNewChat = async (targetUser) => {
    try {
      const res  = await getOrCreateConversationAPI(targetUser._id);
      const conv = res.data.conversation;
      dispatch(addConversation(conv));
      openConversation(conv);
      setShowNewChat(false);
      setSearchQuery('');
      setSearchResults([]);
    } catch (err) {
      console.error(err);
    }
  };

  // ── Send message ─────────────────────────────────────────────────
  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeConv || sending) return;
    const msgText = text.trim();
    setText('');
    setSending(true);

    socketRef.current?.emit('stop_typing', {
      conversationId: activeConv._id,
      userId: user._id,
    });

    try {
      const res = await sendMessageAPI(activeConv._id, { text: msgText });
      setMessages((prev) => [...prev, res.data.message]);
      dispatch(updateConversationLastMessage({
        conversationId: activeConv._id,
        message: res.data.message,
      }));
    } catch (err) {
      console.error(err);
      setText(msgText);
    } finally {
      setSending(false);
    }
  };

  // ── Typing indicator ──────────────────────────────────────────────
  const handleTyping = (e) => {
    setText(e.target.value);
    if (!activeConv) return;
    socketRef.current?.emit('typing', {
      conversationId: activeConv._id,
      userId: user._id,
      username: user.username,
    });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socketRef.current?.emit('stop_typing', {
        conversationId: activeConv._id,
        userId: user._id,
      });
    }, 1500);
  };

  // ── Enter to send ─────────────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  // ── Delete message ────────────────────────────────────────────────
  const handleDelete = async (messageId) => {
    try {
      await deleteMessageAPI(messageId);
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
    } catch (err) {
      console.error(err);
    }
  };

  const isOnline = (conv) => onlineUsers.includes(conv.otherUser?._id);

  // ═══════════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════════
  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden',
      background: 'var(--bg-primary)' }}>

      {/* ══════════════════════════════════════
          LEFT — Conversation List
      ══════════════════════════════════════ */}
      <div style={{
        width: isMobile ? '100%' : '320px',
        flexShrink: 0,
        display: isMobile ? (showConvList ? 'flex' : 'none') : 'flex',
        flexDirection: 'column',
        borderRight: '1px solid var(--border)',
        height: '100%',
        background: 'var(--bg-glass)',
        backdropFilter: 'blur(20px)',
      }}>

        {/* Header */}
        <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid var(--border)',
          flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ margin: 0, fontWeight: 700, fontSize: '18px',
              color: 'var(--text-primary)' }}>
              Messages
            </h2>
            <button
              onClick={() => setShowNewChat((p) => !p)}
              title="New message"
              style={{
                width: '36px', height: '36px', borderRadius: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: showNewChat ? 'rgba(147,51,234,0.15)' : 'var(--hover-overlay)',
                border: 'none', cursor: 'pointer', color: 'var(--accent-1)',
              }}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor"
                strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
            </button>
          </div>

          {/* New chat search */}
          {showNewChat && (
            <div style={{ position: 'relative', marginBottom: '8px' }}>
              <input
                type="text"
                placeholder="Search people..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="input-base"
                style={{ borderRadius: '12px', padding: '10px 16px',
                  fontSize: '14px', width: '100%' }}
              />
              {searching && (
                <div style={{ position: 'absolute', right: '12px', top: '50%',
                  transform: 'translateY(-50%)' }}>
                  <div className="animate-spin" style={{ width: '16px', height: '16px',
                    borderRadius: '50%', border: '2px solid var(--border)',
                    borderTopColor: 'var(--accent-1)' }} />
                </div>
              )}

              {/* Search results dropdown */}
              {searchResults.length > 0 && (
                <div className="glass" style={{
                  position: 'absolute', top: '100%', marginTop: '4px',
                  width: '100%', borderRadius: '14px', overflow: 'hidden',
                  border: '1px solid var(--border)', zIndex: 100,
                  boxShadow: 'var(--shadow-lg)',
                }}>
                  {searchResults.map((u) => (
                    <button
                      key={u._id}
                      onClick={() => startNewChat(u)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center',
                        gap: '12px', padding: '10px 16px',
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        textAlign: 'left',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--hover-overlay)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <img src={u.avatar} alt="" style={{ width: '36px', height: '36px',
                        borderRadius: '50%', objectFit: 'cover' }} />
                      <div>
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: 600,
                          color: 'var(--text-primary)' }}>{u.username}</p>
                        <p style={{ margin: 0, fontSize: '12px',
                          color: 'var(--text-muted)' }}>{u.fullName}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Conversation list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {conversations.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', height: '100%', textAlign: 'center', padding: '32px' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>💬</div>
              <p style={{ margin: '0 0 6px', fontWeight: 600, fontSize: '16px',
                color: 'var(--text-primary)' }}>
                No conversations yet
              </p>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                Click ✏️ above to start chatting
              </p>
            </div>
          ) : (
            conversations.map((conv) => (
              <ConvItem
                key={conv._id}
                conv={conv}
                active={activeConv?._id === conv._id}
                online={isOnline(conv)}
                onClick={() => openConversation(conv)}
              />
            ))
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════
          RIGHT — Chat Window
      ══════════════════════════════════════ */}
      <div style={{
        flex: 1,
        display: isMobile ? (!showConvList ? 'flex' : 'none') : 'flex',
        flexDirection: 'column',
        height: '100%',
        minWidth: 0,
      }}>

        {/* Empty state */}
        {!activeConv ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            textAlign: 'center', padding: '32px' }}>
            <div style={{ width: '96px', height: '96px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '48px', marginBottom: '24px',
              background: 'var(--gradient-soft)', border: '2px solid var(--border)' }}>
              💬
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 700,
              color: 'var(--text-primary)' }}>
              Your Messages
            </h3>
            <p style={{ margin: '0 0 24px', fontSize: '14px', color: 'var(--text-muted)',
              maxWidth: '260px' }}>
              Send private messages and share posts with friends
            </p>
            <button
              onClick={() => setShowNewChat(true)}
              className="btn-primary"
              style={{ padding: '10px 24px', borderRadius: '12px', fontSize: '14px',
                fontWeight: 600 }}
            >
              Send a Message
            </button>
          </div>
        ) : (
          <>
            {/* ── Chat Header ── */}
            <div className="glass" style={{ display: 'flex', alignItems: 'center',
              gap: '12px', padding: '12px 16px',
              borderBottom: '1px solid var(--border)', flexShrink: 0 }}>

              {/* Back button on mobile */}
              {isMobile && (
                <button
                  onClick={() => { setShowConvList(true); setActiveConv(null); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-secondary)', padding: '4px',
                    display: 'flex', alignItems: 'center' }}
                >
                  <svg width="24" height="24" fill="none" stroke="currentColor"
                    strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
                  </svg>
                </button>
              )}

              {/* User info */}
              <Link
                to={`/profile/${activeConv.otherUser?.username}`}
                style={{ display: 'flex', alignItems: 'center', gap: '12px',
                  flex: 1, textDecoration: 'none' }}
              >
                <div style={{ position: 'relative' }}>
                  <div className="avatar-ring" style={{ width: '42px', height: '42px', padding: '2px' }}>
                    <img
                      src={activeConv.otherUser?.avatar}
                      alt=""
                      style={{ width: '100%', height: '100%', borderRadius: '50%',
                        objectFit: 'cover', border: '2px solid var(--bg-primary)' }}
                    />
                  </div>
                  {isOnline(activeConv) && (
                    <span style={{ position: 'absolute', bottom: 0, right: 0,
                      width: '12px', height: '12px', borderRadius: '50%',
                      background: '#34d399', border: '2px solid var(--bg-primary)' }} />
                  )}
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: '14px',
                    color: 'var(--text-primary)' }}>
                    {activeConv.otherUser?.username}
                  </p>
                  <p style={{ margin: 0, fontSize: '12px',
                    color: isOnline(activeConv) ? '#34d399' : 'var(--text-muted)' }}>
                    {isOnline(activeConv) ? '● Active now' : 'Offline'}
                  </p>
                </div>
              </Link>

              {/* Action icons */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {[
                  { title: 'Voice call', d: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' },
                  { title: 'Video call', d: 'M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
                ].map(({ title, d }) => (
                  <button key={title} title={`${title} (coming soon)`}
                    style={{ width: '36px', height: '36px', borderRadius: '10px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'var(--hover-overlay)', border: 'none',
                      cursor: 'pointer', color: 'var(--text-secondary)' }}>
                    <svg width="18" height="18" fill="none" stroke="currentColor"
                      strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d={d}/>
                    </svg>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Messages Area ── */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px',
              background: 'var(--bg-primary)' }}>

              {loadingMsgs ? (
                <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '40px' }}>
                  <div className="animate-spin" style={{ width: '32px', height: '32px',
                    borderRadius: '50%', border: '2px solid var(--border)',
                    borderTopColor: 'var(--accent-1)' }} />
                </div>
              ) : messages.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', height: '100%', textAlign: 'center' }}>
                  <div className="avatar-ring" style={{ width: '64px', height: '64px',
                    padding: '2px', marginBottom: '12px' }}>
                    <img src={activeConv.otherUser?.avatar} alt=""
                      style={{ width: '100%', height: '100%', borderRadius: '50%',
                        objectFit: 'cover', border: '2px solid var(--bg-primary)' }} />
                  </div>
                  <p style={{ margin: '0 0 4px', fontWeight: 600,
                    color: 'var(--text-primary)' }}>
                    {activeConv.otherUser?.username}
                  </p>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                    Say hi to start the conversation! 👋
                  </p>
                </div>
              ) : (
                <>
                  {messages.map((msg, idx) => {
                    const isOwn = msg.sender?._id === user._id || msg.sender === user._id;
                    const nextMsg = messages[idx + 1];
                    const showAvatar = !isOwn && (
                      !nextMsg ||
                      (nextMsg.sender?._id || nextMsg.sender) !==
                      (msg.sender?._id || msg.sender)
                    );
                    const showDate = idx === 0 || (
                      new Date(msg.createdAt).toDateString() !==
                      new Date(messages[idx - 1].createdAt).toDateString()
                    );

                    return (
                      <div key={msg._id}>
                        {showDate && (
                          <div style={{ display: 'flex', alignItems: 'center',
                            gap: '12px', margin: '16px 0' }}>
                            <div style={{ flex: 1, height: '1px',
                              background: 'var(--border)' }} />
                            <span style={{ fontSize: '11px', padding: '0 12px',
                              color: 'var(--text-muted)' }}>
                              {new Date(msg.createdAt).toLocaleDateString([], {
                                weekday: 'short', month: 'short', day: 'numeric',
                              })}
                            </span>
                            <div style={{ flex: 1, height: '1px',
                              background: 'var(--border)' }} />
                          </div>
                        )}
                        <MessageBubble
                          msg={msg}
                          isOwn={isOwn}
                          showAvatar={showAvatar}
                          onDelete={handleDelete}
                        />
                      </div>
                    );
                  })}

                  {/* Typing indicator */}
                  {typingUsers.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'flex-end',
                      gap: '8px', marginBottom: '8px' }}>
                      <img src={activeConv.otherUser?.avatar} alt=""
                        style={{ width: '28px', height: '28px', borderRadius: '50%',
                          objectFit: 'cover' }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px',
                        padding: '12px 16px', borderRadius: '18px',
                        background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                        {[0, 1, 2].map((i) => (
                          <span key={i} className="animate-bounce" style={{
                            width: '8px', height: '8px', borderRadius: '50%',
                            background: 'var(--text-muted)', display: 'block',
                            animationDelay: `${i * 0.15}s`,
                          }} />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
              <div ref={messagesEnd} />
            </div>

            {/* ── Message Input ── */}
            <div className="glass" style={{ borderTop: '1px solid var(--border)',
              padding: '12px 16px', flexShrink: 0 }}>
              <form onSubmit={handleSend}
                style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>

                {/* Emoji button */}
                <button type="button" title="Emoji (coming soon)"
                  style={{ width: '36px', height: '36px', borderRadius: '10px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, marginBottom: '2px', fontSize: '18px',
                    background: 'var(--hover-overlay)', border: 'none', cursor: 'pointer' }}>
                  😊
                </button>

                {/* Text area */}
                <textarea
                  value={text}
                  onChange={handleTyping}
                  onKeyDown={handleKeyDown}
                  placeholder="Message..."
                  rows={1}
                  className="input-base"
                  style={{ flex: 1, borderRadius: '20px', padding: '10px 16px',
                    fontSize: '14px', resize: 'none', maxHeight: '120px',
                    lineHeight: '1.5', overflowY: 'auto' }}
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                  }}
                />

                {/* Send button */}
                <button
                  type="submit"
                  disabled={!text.trim() || sending}
                  style={{
                    width: '40px', height: '40px', borderRadius: '12px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, marginBottom: '2px',
                    background: 'var(--gradient)',
                    border: 'none', cursor: 'pointer',
                    opacity: (!text.trim() || sending) ? 0.4 : 1,
                    boxShadow: text.trim() ? '0 4px 12px rgba(147,51,234,0.4)' : 'none',
                    transition: 'opacity 0.2s, box-shadow 0.2s',
                  }}
                >
                  {sending ? (
                    <div className="animate-spin" style={{ width: '16px', height: '16px',
                      borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)',
                      borderTopColor: '#fff' }} />
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <line x1="22" y1="2" x2="11" y2="13" stroke="white" strokeWidth="2"/>
                      <polygon points="22 2 15 22 11 13 2 9 22 2" fill="white"/>
                    </svg>
                  )}
                </button>
              </form>

              <p style={{ textAlign: 'center', fontSize: '11px', marginTop: '6px',
                color: 'var(--text-muted)' }}>
                Enter to send · Shift+Enter for new line
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}