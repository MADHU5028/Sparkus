import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';
import toast from 'react-hot-toast';

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);
    const { user } = useAuth();

    // Notification state
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const newSocket = io(SOCKET_URL, {
            autoConnect: false,
        });

        newSocket.on('connect', () => {
            console.log('Socket connected');
            setConnected(true);

            // Re-join host room if user is logged in
            if (user?.id) {
                newSocket.emit('host:join', {
                    sessionId: 'dashboard', // special room for dashboard updates? 
                    // Actually, host:join currently expects sessionId. 
                    // We might need a generic 'login' event or just rely on 'host:join' when viewing a session.
                    // But for notifications, we added joining `host:${hostId}` in `host:join`.
                    // We should probably emit a dedicated event for global dashboard connection.
                    hostId: user.id
                });
            }
        });

        newSocket.on('disconnect', () => {
            console.log('Socket disconnected');
            setConnected(false);
        });

        // Listen for new notifications
        newSocket.on('notification:new', (notification) => {
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);

            // Show toast based on type
            const toastOptions = { duration: 4000, position: 'top-right' };
            switch (notification.type) {
                case 'error': toast.error(notification.message, toastOptions); break;
                case 'success': toast.success(notification.message, toastOptions); break;
                case 'warning': toast(notification.message, { icon: '⚠️', ...toastOptions }); break;
                default: toast(notification.message, { icon: 'ℹ️', ...toastOptions });
            }
        });

        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, [user]);

    // Connect when user is authenticated
    useEffect(() => {
        if (socket && user && !connected) {
            socket.io.opts.query = { userId: user.id }; // Pass ID for connection
            socket.connect();

            // Emit join event specifically for notifications if not in a session
            // Modify backend to handle generic 'join' or just emit here
            socket.emit('host:join', { sessionId: 'global', hostId: user.id });
        } else if (socket && !user && connected) {
            socket.disconnect();
        }
    }, [socket, user, connected]);

    const connect = () => {
        if (socket && !connected) {
            socket.connect();
        }
    };

    const disconnect = () => {
        if (socket && connected) {
            socket.disconnect();
        }
    };

    const markAsRead = async (id) => {
        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
        // Call API handled in component or here? 
        // For now, simple state update, component calls API
    };

    const clearNotifications = () => {
        setNotifications([]);
        setUnreadCount(0);
    };

    return (
        <SocketContext.Provider value={{
            socket,
            connected,
            connect,
            disconnect,
            notifications,
            unreadCount,
            setNotifications,
            setUnreadCount,
            markAsRead,
            clearNotifications
        }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within SocketProvider');
    }
    return context;
};

export default SocketContext;
