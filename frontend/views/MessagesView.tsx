import React from 'react';
import { Shop } from '../types';
import { ShopChatInterface } from '../components/ShopChatInterface';

interface MessagesViewProps {
  onSelectConversation: (shop: Shop) => void;
  targetUserId?: number; // Optional target user ID for auto-selection
}

export const MessagesView: React.FC<MessagesViewProps> = ({ onSelectConversation, targetUserId }) => {
  return (
    <div className="animate-in fade-in duration-500 container mx-auto h-[calc(100vh-140px)] flex flex-col pt-4">
      <div className="mb-4 flex-none">
        <h1 className="text-3xl font-black uppercase italic tracking-tighter">
          Message <span className="text-primary">History</span>
        </h1>
        <p className="text-slate-400">View and manage all your conversations.</p>
      </div>

      <div className="flex-1 min-h-0">
        <ShopChatInterface initialTargetUserId={targetUserId} />
      </div>
    </div>
  );
};
