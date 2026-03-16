import { useEffect, useState, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { io as socketIO } from 'socket.io-client';
import {
  fetchConversations,
  addConversation,
  updateConversationLastMessage,
  setUserOnline,
} from '../store/chatSlice.js';
import {
  getOrCreateConversationAPI,
  getMessagesAPI,
  sendMessageAPI,
  deleteMessageAPI,
} from '../services/messageService.js';
import { searchUsersAPI } from '../services/userService.js';
import { formatDate } from '../utils/formatDate.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatMessageTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatConvTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now  = new Date();
  const diff = (now - date) / 1000;
  if (diff < 60)     return 'now';
  if (diff < 3600)   return `${Math.floor(diff / 60)}m`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

// ─── Conversation List Item ────────────────────────────────────────────────────
function ConvItem({ conv, active, online, onClick }) {
  const lastMsg = conv.lastMessage;
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all rounded-xl"
      style={{
        background: active ? 'rgba(147,51,234,0.12)' : 'transparent',
        border: 'none', cursor: 'pointer',
        borderLeft: active ? '3px solid var(--accent-1)' : '3px solid transparent',
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--hover-overlay)'; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      {/* Avatar with online dot */}
      <div className="relative flex-shrink-0">
        <div className="avatar-ring" style={{ width: '48px', height: '48px', padding: '2px' }}>
          <img src={conv.otherUser?.avatar} alt=""
            className="w-full h-full rounded-full object-cover"
            style={{ border: '2px solid var(--bg-primary)' }} />
        </div>
        {online && (
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2"
            style={{ background: '#34d399', borderColor: 'var(--bg-primary)' }} />
        )}
      </div>
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
            {conv.otherUser?.username}
          </p>
          <span className="text-xs flex-shrink-0 ml-2" style={{ color: 'var(--text-muted)' }}>
            {formatConvTime(conv.lastMessageAt)}
          </span>
        </div>
        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
          {lastMsg ? lastMsg.text || 'Sent a message' : 'Start a conversation'}
        </p>
      </div>
    </button>
  );
}

// ─── Message Bubble ────────────────────────────────────────────────────────────
function MessageBubble({ msg, isOwn, showAvatar, onDelete }) {
  const [showTime, setShowTime] = useState(false);
  const [showDel,  setShowDel]  = useState(false);

  return (
    <div
      className={`flex items-end gap-2 mb-2 group ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
      onMouseEnter={() => setShowDel(true)}
      onMouseLeave={() => setShowDel(false)}
    >
      {/* Avatar (other user only) */}
      {!isOwn && (
        <div style={{ width: '28px', flexShrink: 0 }}>
          {showAvatar && (
            <img src={msg.sender?.avatar} alt=""
              className="w-7 h-7 rounded-full object-cover" />
          )}
        </div>
      )}

      {/* Bubble */}
      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        <button
          onClick={() => setShowTime((p) => !p)}
          className="max-w-xs lg:max-w-sm px-4 py-2.5 text-sm text-left cursor-pointer"
          style={{
            background: isOwn ? 'var(--gradient)' : 'var(--bg-card)',
            color: isOwn ? '#fff' : 'var(--text-primary)',
            borderRadius: isOwn
              ? '18px 18px 4px 18px'
              : '18px 18px 18px 4px',
            border: isOwn ? 'none' : '1px solid var(--border)',
            wordBreak: 'break-word',
            lineHeight: '1.5',
          }}
        >
          {msg.text}
        </button>

        {/* Time + seen */}
        {showTime && (
          <p className="text-xs mt-1 px-1" style={{ color: 'var(--text-muted)' }}>
            {formatMessageTime(msg.createdAt)}
            {isOwn && (
              <span className="ml-2" style={{ color: msg.seen ? 'var(--accent-1)' : 'var(--text-muted)' }}>
                {msg.seen ? '✓✓' : '✓'}
              </span>
            )}
          </p>
        )}
      </div>

      {/* Delete button (own messages only) */}
      {isOwn && showDel && (
        <button
          onClick={() => onDelete(msg._id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0"
          style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171',
            border: 'none', cursor: 'pointer' }}
        >
          ✕
        </button>
      )}
    </div>
  );
}

// ─── Main Chat Page ────────────────────────────────────────────────────────────
export default function Chat() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { convId } = useParams();
  const { user }  = useSelector((s) => s.auth);
  const { conversations, onlineUsers } = useSelector((s) => s.chat);

  const [messages,       setMessages]       = useState([]);
  const [text,           setText]           = useState('');
  const [activeConv,     setActiveConv]     = useState(null);
  const [loadingMsgs,    setLoadingMsgs]    = useState(false);
  const [sending,        setSending]        = useState(false);
  const [typingUsers,    setTypingUsers]    = useState([]);
  const [searchQuery,    setSearchQuery]    = useState('');
  const [searchResults,  setSearchResults]  = useState([]);
  const [searching,      setSearching]      = useState(false);
  const [showNewChat,    setShowNewChat]    = useState(false);
  const [isMobileView,   setIsMobileView]   = useState(false);
  const [showConvList,   setShowConvList]   = useState(true);

  const socketRef    = useRef(null);
  const messagesEnd  = useRef(null);
  const typingTimer  = useRef(null);
  const inputRef     = useRef(null);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobileView(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Init socket
  useEffect(() => {
    socketRef.current = socketIO(
      import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000',
      { transports: ['websocket'] }
    );
    socketRef.current.emit('join', user._id);

    socketRef.current.on('new_message', ({ message, conversationId }) => {
      if (activeConv?._id === conversationId) {
        setMessages((p) => [...p, message]);
      }
      dispatch(updateConversationLastMessage({ conversationId, message }));
    });

    socketRef.current.on('user_online', ({ userId, online }) => {
      dispatch(setUserOnline({ userId, online }));
    });

    socketRef.current.on('typing', ({ username }) => {
      setTypingUsers((p) => [...new Set([...p, username])]);
    });

    socketRef.current.on('stop_typing', ({ username }) => {
      setTypingUsers((p) => p.filter((u) => u !== username));
    });

    return () => socketRef.current?.disconnect();
  }, [user._id, activeConv?._id, dispatch]);

  // Load conversations
  useEffect(() => {
    dispatch(fetchConversations());
  }, [dispatch]);

  // Open conversation from URL param
  useEffect(() => {
    if (convId && conversations.length > 0) {
      const found = conversations.find((c) => c._id === convId);
      if (found) openConversation(found);
    }
  }, [convId, conversations]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  // Search users for new chat
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

  const openConversation = useCallback(async (conv) => {
    setActiveConv(conv);
    setLoadingMsgs(true);
    setMessages([]);
    if (isMobileView) setShowConvList(false);

    // Join conversation socket room
    if (activeConv) {
      socketRef.current?.emit('leave_conversation', activeConv._id);
    }
    socketRef.current?.emit('join_conversation', conv._id);

    try {
      const res = await getMessagesAPI(conv._id);
      setMessages(res.data.messages);
      navigate(`/messages/${conv._id}`, { replace: true });
    } catch (err) { console.error(err); }
    finally { setLoadingMsgs(false); }
  }, [navigate, isMobileView, activeConv]);

  const startNewChat = async (targetUser) => {
    try {
      const res = await getOrCreateConversationAPI(targetUser._id);
      const conv = res.data.conversation;
      dispatch(addConversation(conv));
      openConversation(conv);
      setShowNewChat(false);
      setSearchQuery('');
      setSearchResults([]);
    } catch (err) { console.error(err); }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeConv || sending) return;
    const msgText = text.trim();
    setText('');
    setSending(true);

    // Stop typing
    socketRef.current?.emit('stop_typing', {
      conversationId: activeConv._id, userId: user._id,
    });

    try {
      const res = await sendMessageAPI(activeConv._id, { text: msgText });
      setMessages((p) => [...p, res.data.message]);
      dispatch(updateConversationLastMessage({
        conversationId: activeConv._id,
        message: res.data.message,
      }));
    } catch (err) { console.error(err); setText(msgText); }
    finally { setSending(false); }
  };

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
        conversationId: activeConv._id, userId: user._id,
      });
    }, 1500);
  };

  const handleDelete = async (messageId) => {
    try {
      await deleteMessageAPI(messageId);
      setMessages((p) => p.filter((m) => m._id !== messageId));
    } catch (err) { console.error(err); }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const isOnline = (conv) => {
    return onlineUsers.includes(conv.otherUser?._id);
  };

  return (
    <div className="flex h-screen pt-[60px]" style={{ background: 'var(--bg-primary)' }}>

      {/* ── LEFT: Conversation list ── */}
      <div
        className={`flex flex-col glass ${isMobileView ? (showConvList ? 'flex' : 'hidden') : 'flex'}`}
        style={{
          width: isMobileView ? '100%' : '340px',
          flexShrink: 0,
          borderRight: '1px solid var(--border)',
          height: '100%',
        }}
      >
        {/* Header */}
        <div className="px-4 pt-5 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
              Messages
            </h2>
            <button
              onClick={() => setShowNewChat((p) => !p)}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
              style={{ background: showNewChat ? 'rgba(147,51,234,0.15)' : 'var(--hover-overlay)',
                border: 'none', cursor: 'pointer', color: 'var(--accent-1)' }}
              title="New message"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
            </button>
          </div>

          {/* New chat search */}
          {showNewChat && (
            <div className="relative animate-fade-up mb-2">
              <input
                type="text"
                placeholder="Search people..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="input-base w-full px-4 py-2.5 text-sm"
                style={{ borderRadius: '12px' }}
              />
              {searching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 rounded-full animate-spin"
                    style={{ border: '2px solid var(--border)', borderTopColor: 'var(--accent-1)' }} />
                </div>
              )}
              {searchResults.length > 0 && (
                <div className="absolute top-full mt-1 w-full glass rounded-xl overflow-hidden z-20 shadow-lg"
                  style={{ border: '1px solid var(--border)' }}>
                  {searchResults.map((u) => (
                    <button key={u._id} onClick={() => startNewChat(u)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--hover-overlay)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                      <img src={u.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                      <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {u.username}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{u.fullName}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto py-2 px-2">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center px-6">
              <div className="text-5xl mb-4">💬</div>
              <p className="font-semibold text-base mb-1" style={{ color: 'var(--text-primary)' }}>
                No conversations yet
              </p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Search for someone to start chatting
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

      {/* ── RIGHT: Chat window ── */}
      <div
        className={`flex flex-col flex-1 ${isMobileView ? (!showConvList ? 'flex' : 'hidden') : 'flex'}`}
        style={{ height: '100%', minWidth: 0 }}
      >
        {!activeConv ? (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-24 h-24 rounded-full mb-6 flex items-center justify-center text-5xl"
              style={{ background: 'var(--gradient-soft)', border: '2px solid var(--border)' }}>
              💬
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              Your Messages
            </h3>
            <p className="text-sm mb-6 max-w-xs" style={{ color: 'var(--text-muted)' }}>
              Send private messages to your friends and followers
            </p>
            <button
              onClick={() => setShowNewChat(true)}
              className="btn-primary px-6 py-2.5 rounded-xl text-sm font-semibold"
            >
              Send a Message
            </button>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div
              className="flex items-center gap-3 px-4 py-3 glass flex-shrink-0"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              {/* Back button on mobile */}
              {isMobileView && (
                <button
                  onClick={() => setShowConvList(true)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-secondary)', padding: '4px' }}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
                  </svg>
                </button>
              )}

              <Link to={`/profile/${activeConv.otherUser?.username}`} className="flex items-center gap-3 flex-1">
                <div className="relative">
                  <div className="avatar-ring" style={{ width: '42px', height: '42px', padding: '2px' }}>
                    <img src={activeConv.otherUser?.avatar} alt=""
                      className="w-full h-full rounded-full object-cover"
                      style={{ border: '2px solid var(--bg-primary)' }} />
                  </div>
                  {isOnline(activeConv) && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
                      style={{ background: '#34d399', borderColor: 'var(--bg-primary)' }} />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                    {activeConv.otherUser?.username}
                  </p>
                  <p className="text-xs" style={{
                    color: isOnline(activeConv) ? '#34d399' : 'var(--text-muted)'
                  }}>
                    {isOnline(activeConv) ? 'Active now' : 'Offline'}
                  </p>
                </div>
              </Link>

              {/* Video/Call icons (UI only) */}
              <div className="flex items-center gap-2">
                <button className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                  style={{ background: 'var(--hover-overlay)', border: 'none', cursor: 'pointer',
                    color: 'var(--text-secondary)' }}
                  title="Voice call (coming soon)">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                  </svg>
                </button>
                <button className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                  style={{ background: 'var(--hover-overlay)', border: 'none', cursor: 'pointer',
                    color: 'var(--text-secondary)' }}
                  title="Video call (coming soon)">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-4 py-4"
              style={{ background: 'var(--bg-primary)' }}>

              {loadingMsgs ? (
                <div className="flex justify-center pt-10">
                  <div className="w-8 h-8 rounded-full animate-spin"
                    style={{ border: '2px solid var(--border)', borderTopColor: 'var(--accent-1)' }} />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <div className="avatar-ring mb-4" style={{ width: '64px', height: '64px', padding: '2px' }}>
                    <img src={activeConv.otherUser?.avatar} alt=""
                      className="w-full h-full rounded-full object-cover"
                      style={{ border: '2px solid var(--bg-primary)' }} />
                  </div>
                  <p className="font-semibold text-base mb-1" style={{ color: 'var(--text-primary)' }}>
                    {activeConv.otherUser?.username}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
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
                      (nextMsg.sender?._id || nextMsg.sender) !== (msg.sender?._id || msg.sender)
                    );

                    // Date separator
                    const showDate = idx === 0 || (
                      new Date(msg.createdAt).toDateString() !==
                      new Date(messages[idx - 1].createdAt).toDateString()
                    );

                    return (
                      <div key={msg._id}>
                        {showDate && (
                          <div className="flex items-center gap-3 my-4">
                            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                            <span className="text-xs px-3" style={{ color: 'var(--text-muted)' }}>
                              {new Date(msg.createdAt).toLocaleDateString([], {
                                weekday: 'short', month: 'short', day: 'numeric'
                              })}
                            </span>
                            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
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
                    <div className="flex items-end gap-2 mb-2">
                      <img src={activeConv.otherUser?.avatar} alt=""
                        className="w-7 h-7 rounded-full object-cover" />
                      <div className="px-4 py-3 rounded-2xl flex items-center gap-1"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                        {[0,1,2].map((i) => (
                          <span key={i} className="w-2 h-2 rounded-full animate-bounce"
                            style={{ background: 'var(--text-muted)',
                              animationDelay: `${i * 0.15}s` }} />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
              <div ref={messagesEnd} />
            </div>

            {/* Input area */}
            <div className="px-4 py-3 glass flex-shrink-0"
              style={{ borderTop: '1px solid var(--border)' }}>
              <form onSubmit={handleSend} className="flex items-end gap-3">

                {/* Emoji button */}
                <button type="button"
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mb-0.5"
                  style={{ background: 'var(--hover-overlay)', border: 'none', cursor: 'pointer',
                    color: 'var(--text-secondary)', fontSize: '1.1rem' }}
                  title="Emoji (coming soon)">
                  😊
                </button>

                {/* Text input */}
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={text}
                    onChange={handleTyping}
                    onKeyDown={handleKeyDown}
                    placeholder="Message..."
                    rows={1}
                    className="input-base w-full px-4 py-2.5 text-sm resize-none"
                    style={{ borderRadius: '20px', maxHeight: '120px', lineHeight: '1.5' }}
                    onInput={(e) => {
                      e.target.style.height = 'auto';
                      e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                    }}
                  />
                </div>

                {/* Send button */}
                <button
                  type="submit"
                  disabled={!text.trim() || sending}
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mb-0.5 transition-all disabled:opacity-40"
                  style={{ background: 'var(--gradient)', border: 'none', cursor: 'pointer',
                    boxShadow: text.trim() ? '0 4px 12px rgba(147,51,234,0.4)' : 'none' }}
                >
                  {sending ? (
                    <div className="w-4 h-4 rounded-full animate-spin"
                      style={{ border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff' }} />
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                      <line x1="22" y1="2" x2="11" y2="13" stroke="white" strokeWidth="2"/>
                      <polygon points="22 2 15 22 11 13 2 9 22 2" fill="white"/>
                    </svg>
                  )}
                </button>
              </form>
              <p className="text-xs text-center mt-1" style={{ color: 'var(--text-muted)' }}>
                Press Enter to send · Shift+Enter for new line
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}