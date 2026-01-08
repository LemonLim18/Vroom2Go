import React, { useState } from 'react';
import { MessageCircle, X, ChevronDown, Search, Send } from 'lucide-react';
import { Shop } from '../types';
import { MOCK_SHOPS } from '../constants';

interface FloatingChatProps {
  onOpenChat: (shop: Shop) => void;
}

interface Conversation {
  id: string;
  shop: Shop;
  lastMessage: string;
  timestamp: string;
  unread: number;
  online: boolean;
}

// Mock conversations data
const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv1',
    shop: MOCK_SHOPS[0],
    lastMessage: "Your vehicle is ready for pickup! We've completed the brake service.",
    timestamp: '2 min ago',
    unread: 2,
    online: true,
  },
  {
    id: 'conv2',
    shop: MOCK_SHOPS[1],
    lastMessage: "Thanks for your inquiry. We can schedule you for tomorrow at 10 AM.",
    timestamp: '1 hour ago',
    unread: 0,
    online: true,
  },
  {
    id: 'conv3',
    shop: MOCK_SHOPS[2],
    lastMessage: "The diagnostic scan is complete. Here's what we found...",
    timestamp: 'Yesterday',
    unread: 0,
    online: false,
  },
];

export const FloatingChat: React.FC<FloatingChatProps> = ({ onOpenChat }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);

  const totalUnread = MOCK_CONVERSATIONS.reduce((sum, c) => sum + c.unread, 0);

  const filteredConversations = MOCK_CONVERSATIONS.filter(conv =>
    conv.shop.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleConversationClick = (conv: Conversation) => {
    onOpenChat(conv.shop);
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl transition-all duration-300 flex items-center justify-center ${
          isOpen 
            ? 'bg-slate-700 rotate-0' 
            : 'bg-primary hover:bg-primary-focus hover:scale-110 shadow-primary/30'
        }`}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <>
            <MessageCircle className="w-6 h-6 text-black" />
            {totalUnread > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs font-bold flex items-center justify-center animate-pulse">
                {totalUnread}
              </span>
            )}
          </>
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div 
          className={`fixed bottom-24 right-6 z-50 w-80 md:w-96 bg-slate-900 rounded-2xl shadow-2xl border border-white/10 overflow-hidden animate-scale-in origin-bottom-right ${
            isMinimized ? 'h-14' : 'h-[480px]'
          } transition-all duration-300`}
        >
          {/* Header */}
          <div 
            className="bg-slate-800 px-4 py-3 flex items-center justify-between cursor-pointer border-b border-white/5"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-black" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Messaging</h3>
                <p className="text-[10px] text-slate-400">
                  {MOCK_CONVERSATIONS.filter(c => c.online).length} shops online
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {totalUnread > 0 && (
                <span className="badge badge-primary badge-sm">{totalUnread}</span>
              )}
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isMinimized ? 'rotate-180' : ''}`} />
            </div>
          </div>

          {!isMinimized && (
            <>
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
              <div className="flex-1 overflow-y-auto max-h-[340px]">
                {filteredConversations.length === 0 ? (
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
                          src={conv.shop.image}
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
              <div className="p-3 border-t border-white/5 bg-slate-800/50">
                <button className="btn btn-sm btn-ghost w-full text-primary font-medium text-xs">
                  View All Messages
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};
