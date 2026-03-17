import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';

export function useSocket(onNotification) {
  const { user }  = useSelector((s) => s.auth);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user?._id) return;

    const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

    socketRef.current = io(SOCKET_URL, { transports: ['websocket'] });
    socketRef.current.emit('join', user._id);

    socketRef.current.on('notification', (data) => {
      onNotification?.(data);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [user?._id, onNotification]);

  return socketRef.current;
}