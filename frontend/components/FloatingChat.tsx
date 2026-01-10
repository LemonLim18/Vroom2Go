import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Search } from 'lucide-react';
import { Shop } from '../types';
import api from '../services/api';
import { socket } from '../services/socket';

interface FloatingChatProps {
  onOpenChat: (shop: Shop) => void;
  onViewAll: () => void;
}

interface BackendConversation {
    id: number;
    lastMessageAt: string;
    messages: { message: string, createdAt: string, isRead: boolean }[];
    shop: Shop | null;
    user1Id: number;
    user2Id: number;
    user1: { id: number, name: string, avatarUrl: string };
    user2: { id: number, name: string, avatarUrl: string };
}

interface ConversationDisplay {
  id: number;
  shop: Shop;
  lastMessage: string;
  timestamp: string;
  unread: number;
  online: boolean;
}

export const FloatingChat: React.FC<FloatingChatProps> = ({ onOpenChat, onViewAll }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [conversations, setConversations] = useState<ConversationDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const modalRef = useRef<HTMLDivElement>(null);

  // Helper to format time
  const formatTime = (dateStr: string) => {
      const date = new Date(dateStr);
      const now = new Date();
      if (date.toDateString() === now.toDateString()) {
          return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      }
      return date.toLocaleDateString();
  }

  const fetchConversations = async () => {
      try {
          const { data } = await api.get('/conversations');
          const userId = JSON.parse(localStorage.getItem('user') || '{}').id;

          const formatted: ConversationDisplay[] = data.map((c: BackendConversation) => {
              let shopData: Shop | any = {};

              if (c.shop) {
                   const otherUser = c.user1Id === userId ? c.user2 : c.user1;
                   // If I am the shop owner, show the customer's info
                   // If I am the customer, show the shop's info
                   const isMyShop = c.shop.userId === userId;
                   
                   shopData = {
                       id: c.shop.id,
                       name: isMyShop ? otherUser.name : c.shop.name,
                       imageUrl: isMyShop ? otherUser.avatarUrl : c.shop.imageUrl,
                       userId: otherUser.id,
                       rating: 5,
                       reviewCount: 0,
                       address: isMyShop ? 'Customer' : 'Online',
                       verified: isMyShop ? false : true
                   };
              } else {
                  const otherUser = c.user1Id === userId ? c.user2 : c.user1;
                  shopData = {
                      id: 0,
                      userId: otherUser.id,
                      name: otherUser.name,
                      imageUrl: otherUser.avatarUrl,
                       rating: 5,
                       reviewCount: 0,
                       address: 'Private Message',
                       verified: false
                  };
              }

              const lastMsg = c.messages[0];

              return {
                  id: c.id,
                  shop: shopData,
                  lastMessage: lastMsg ? lastMsg.message : 'Start of conversation',
                  timestamp: c.lastMessageAt ? formatTime(c.lastMessageAt) : '',
                  unread: 0, // TODO: calculate unread
                  online: false // TODO: socket presence
              };
          });
          
          setConversations(formatted);
          setLoading(false);
      } catch (err) {
          console.error("Failed to fetch conversations", err);
          setLoading(false);
      }
  };

  useEffect(() => {
      if (isOpen) {
          fetchConversations();
      }
  }, [isOpen]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread, 0);

  const filteredConversations = conversations.filter(conv =>
    conv.shop.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleConversationClick = (conv: ConversationDisplay) => {
    onOpenChat(conv.shop);
    setIsOpen(false);
  };

  return (
    <div ref={modalRef}>
      {/* Floating Button */}
      {!isOpen && (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl transition-all duration-300 flex items-center justify-center bg-primary hover:bg-primary-focus hover:scale-110 shadow-primary/30"
      >
        <MessageCircle className="w-6 h-6 text-black" />
        {totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs font-bold flex items-center justify-center animate-pulse">
            {totalUnread}
          </span>
        )}
      </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div 
          className="fixed bottom-6 right-6 z-50 w-80 md:w-96 bg-slate-900 rounded-2xl shadow-2xl border border-white/10 overflow-hidden animate-scale-in origin-bottom-right h-[480px] transition-all duration-300 flex flex-col"
        >
          {/* Header */}
          <div className="bg-slate-800 px-4 py-3 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-black" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Messaging</h3>
                <p className="text-[10px] text-slate-400">
                   Recent Chats
                </p>
              </div>
            </div>
            {totalUnread > 0 && (
              <span className="badge badge-primary badge-sm">{totalUnread}</span>
            )}
            {/* Removed ChevronDown/Minimize Button */}
          </div>

          {/* Search */}
          <div className="p-3 border-b border-white/5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input input-sm w-full pl-9 bg-slate-800 border-white/5 focus:border-primary text-sm"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {loading ? (
                <div className="p-8 text-center text-slate-500">Loading chats...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-8 px-4">
                <MessageCircle className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No conversations found</p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => handleConversationClick(conv)}
                  className={`px-4 py-3 flex items-start gap-3 cursor-pointer transition-colors hover:bg-slate-800/50 ${
                    conv.unread > 0 ? 'bg-primary/5' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={conv.shop.imageUrl || conv.shop.image || 'https://images.unsplash.com/photo-1486006920555-c77dcf18193c?auto=format&fit=crop&q=80&w=1000'}
                      alt={conv.shop.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-white/10"
                    />
                    {conv.online && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900"></div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className={`text-sm truncate ${conv.unread > 0 ? 'font-bold' : 'font-medium'}`}>
                        {conv.shop.name}
                      </h4>
                      <span className="text-[10px] text-slate-500 flex-shrink-0 ml-2">
                        {conv.timestamp}
                      </span>
                    </div>
                    <p className={`text-xs truncate ${conv.unread > 0 ? 'text-white' : 'text-slate-400'}`}>
                      {conv.lastMessage}
                    </p>
                  </div>

                  {/* Unread badge */}
                  {conv.unread > 0 && (
                    <span className="w-5 h-5 bg-primary rounded-full text-black text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                      {conv.unread}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-white/5 bg-slate-800/50 z-10">
            <button 
              className="btn btn-sm btn-ghost w-full text-primary font-medium text-xs"
              onClick={() => {
                setIsOpen(false);
                onViewAll();
              }}
            >
              View All Messages
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
