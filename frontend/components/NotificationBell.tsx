import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, X, FileText, MessageSquare, Star, CreditCard, Settings } from 'lucide-react';
import api from '../services/api';
import { io, Socket } from 'socket.io-client';

interface Notification {
  id: string;
  type: string;
  title: string;
  message?: string;
  actionUrl?: string;
  read: boolean;
  createdAt: string;
}

interface NotificationBellProps {
  onNavigate?: (view: string) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ onNavigate }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();
    setupSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupSocket = () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Decode token to get user ID (simple base64 decode of payload)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.id;

      const socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000', {
        transports: ['websocket', 'polling']
      });

      socket.on('connect', () => {
        console.log('Socket connected for notifications');
        socket.emit('join_room', `user_${userId}`);
      });

      socket.on('new_notification', (notification: Notification) => {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Optional: Show browser notification
        if (Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/vite.svg'
          });
        }
      });

      socketRef.current = socket;
    } catch (error) {
      console.error('Failed to setup socket:', error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    if (notification.actionUrl && onNavigate) {
      // Parse action URL and navigate
      // e.g., /quotes/123 -> navigate to quotes view
      const path = notification.actionUrl;
      if (path.includes('quotes')) onNavigate('quotes');
      else if (path.includes('bookings')) onNavigate('bookings');
      else if (path.includes('messages')) onNavigate('messages');
      else if (path.includes('dashboard')) onNavigate('dashboard');
      else if (path.includes('invoice')) onNavigate('bookings');
    }

    setIsOpen(false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'quote': return <FileText className="w-4 h-4 text-blue-400" />;
      case 'booking': return <FileText className="w-4 h-4 text-green-400" />;
      case 'message': return <MessageSquare className="w-4 h-4 text-purple-400" />;
      case 'review': return <Star className="w-4 h-4 text-yellow-400" />;
      case 'payment': return <CreditCard className="w-4 h-4 text-emerald-400" />;
      default: return <Settings className="w-4 h-4 text-slate-400" />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-ghost btn-circle relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-h-[70vh] bg-slate-900 rounded-2xl shadow-2xl border border-white/10 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="font-bold">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-primary hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="overflow-y-auto max-h-[50vh]">
            {loading ? (
              <div className="p-8 text-center">
                <span className="loading loading-spinner loading-md text-primary"></span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {notifications.slice(0, 20).map(notification => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 cursor-pointer hover:bg-slate-800/50 transition-colors ${
                      !notification.read ? 'bg-primary/5' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${!notification.read ? 'text-white' : 'text-slate-300'}`}>
                          {notification.title}
                        </p>
                        {notification.message && (
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>
                        )}
                        <p className="text-xs text-slate-600 mt-1">
                          {formatTime(notification.createdAt)}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="flex-shrink-0">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-white/5">
              <button
                onClick={() => { setIsOpen(false); onNavigate?.('notifications'); }}
                className="btn btn-ghost btn-sm w-full text-primary"
              >
                View All Notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
