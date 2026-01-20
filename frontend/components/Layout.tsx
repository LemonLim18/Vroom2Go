import React, { useState, useEffect } from 'react';
import { UserRole, Shop } from '../types';
import { Home, Search, Calendar, MessageSquare, User, ShieldCheck, Wrench, Menu, X, ChevronDown, FileText } from 'lucide-react';
import { FloatingChat } from './FloatingChat';
import { NotificationBell } from './NotificationBell';
import api from '../services/api';

interface LayoutProps {
  children: React.ReactNode;
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenChat?: (shop: Shop) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentRole, onRoleChange, currentView, onNavigate, onOpenChat }) => {
  const [conversations, setConversations] = useState<any[]>([]); // Using 'any' for now to match structure, ideally use Interface
  const [totalUnread, setTotalUnread] = useState(0);
  const [userId, setUserId] = useState<number>(0);
  // Track online status of users we know about
  const [userStatuses, setUserStatuses] = useState<Record<number, { isOnline: boolean, lastActive?: string }>>({});
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Initialize and Fetch
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
       const u = JSON.parse(userStr);
       setUserId(u.id);
       fetchConversations(u.id);
    }
  }, [currentRole]); // Re-fetch on role change safely

  const fetchConversations = async (uid: number) => {
      try {
          const { data } = await api.get('/conversations');
          
          let count = 0;
          const statuses: Record<number, { isOnline: boolean, lastActive?: string }> = {};

          data.forEach((c: any) => {
              const unread = c._count?.messages || 0;
              count += unread;
              
              // Extract other user's initial status if available (backend needs to return it)
              // Currently backend `listConversations` returns User objects. 
              // We should check if `isOnline` is returned.
              // Assuming I'll update `listConversations` to include `isOnline`?
              // The schema update added it, but I didn't update the controller `include`?
              // `prisma.findMany` returns fields of the model by default unless `select` is used.
              // In `listConversations`, we used `select` for user1/user2!
              // So I DO need to update backend controller to return `isOnline` and `lastActive`.
              
              // For now, let's assume we will fix backend controller next.
              const otherUser = c.user1Id === uid ? c.user2 : c.user1;
              if (otherUser) {
                  statuses[otherUser.id] = { 
                      isOnline: otherUser.isOnline || false, 
                      lastActive: otherUser.lastActive 
                  };
              }
          });
          setTotalUnread(count);
          setConversations(data);
          setUserStatuses(prev => ({ ...prev, ...statuses }));
      } catch (err) {
          console.error("Failed to fetch global conversations", err);
      }
  };

  // Global socket listener for badges and status
  useEffect(() => {
    if (!userId) return;

    import('../services/socket').then(({ socket }) => {
      if (!socket.connected) socket.connect();
      
      // Join user-specific room for global notifications
      socket.emit('join_room', `user_${userId}`);
      
      // Also join existing conversation rooms
      if (conversations.length > 0) {
        conversations.forEach(c => {
          socket.emit('join_room', `conversation_${c.id}`);
        });
      }

      const handleReceive = (msg: any) => {
        if (msg.senderId !== userId) {
          setTotalUnread(prev => prev + 1);
          
          setConversations(prev => {
            const exists = prev.find(c => c.id === msg.conversationId);
            if (!exists) {
               // If it's a new conversation, we might need to refetch list or add it
               // For now, refetching is safest to get all owner/shop details
               fetchConversations(userId);
               return prev;
            }
            return prev.map(c => {
              if (c.id === msg.conversationId) {
                return {
                  ...c,
                  _count: { messages: (c._count?.messages || 0) + 1 },
                  lastMessageAt: new Date().toISOString(),
                  messages: [{ message: msg.text, createdAt: msg.time, isRead: false }] 
                };
              }
              return c;
            });
          });
          
          // Ensure we are joined to the room if it's new
          socket.emit('join_room', `conversation_${msg.conversationId}`);
        }
      };
      
      const handleRead = (data: any) => {
        if (data.userId === userId) {
          setConversations(prev => {
            const target = prev.find(c => c.id === data.conversationId);
            if (target) {
              const amount = target._count?.messages || 0;
              setTotalUnread(current => Math.max(0, current - amount));
              
              return prev.map(c => {
                if (c.id === data.conversationId) {
                  return { ...c, _count: { messages: 0 }};
                }
                return c;
              });
            }
            return prev;
          });
        }
      };

      const handleStatusChange = (data: { userId: number, isOnline: boolean, lastActive?: string }) => {
        setUserStatuses(prev => ({
          ...prev,
          [data.userId]: { isOnline: data.isOnline, lastActive: data.lastActive }
        }));
      };

      socket.on('receive_message', handleReceive);
      socket.on('conversation_read', handleRead);
      socket.on('user_status_change', handleStatusChange);
      
      return () => {
        socket.off('receive_message', handleReceive);
        socket.off('conversation_read', handleRead);
        socket.off('user_status_change', handleStatusChange);
      };
    });
  }, [userId, conversations.length]); // Re-run if userId changes or new conversation added to join its room

  const navItems = [
    { id: 'home', label: 'Home', icon: Home, roles: [UserRole.DRIVER] },
    { id: 'catalog', label: 'Services', icon: Search, roles: [UserRole.DRIVER] },
    { id: 'dashboard', label: 'Garage', icon: Wrench, roles: [UserRole.SHOP] },
    { id: 'admin', label: 'HQ', icon: ShieldCheck, roles: [UserRole.ADMIN] },
    { id: 'quotes', label: 'Quotes', icon: FileText, roles: [UserRole.DRIVER] },
    { id: 'messages', label: 'Messages', icon: MessageSquare, roles: [UserRole.DRIVER], badge: totalUnread },
    { id: 'bookings', label: 'Bookings', icon: Calendar, roles: [UserRole.DRIVER] },
    { id: 'forum', label: 'Forum', icon: MessageSquare, roles: [UserRole.DRIVER, UserRole.SHOP] },
    { id: 'profile', label: 'Profile', icon: User, roles: [UserRole.DRIVER, UserRole.SHOP, UserRole.ADMIN] },
  ];

  const filteredNav = navItems.filter(item => item.roles.includes(currentRole));

  return (
    <div className="flex flex-col h-screen bg-base-200 overflow-hidden font-sans">
      {/* Top Navigation */}
      <div className="navbar bg-base-100/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-[200] px-6">
        <div className="flex-1">
          <button 
            className="flex items-center gap-2 group"
            onClick={() => onNavigate('home')}
          >
            <div className="w-10 h-10 bg-primary flex items-center justify-center rounded-lg rotate-3 group-hover:rotate-0 transition-transform shadow-lg shadow-primary/20">
               <Wrench className="w-6 h-6 text-black" />
            </div>
            <span className="text-2xl font-black tracking-tighter uppercase italic">
              Vroom2<span className="text-primary text-3xl">.</span>Go
            </span>
          </button>
        </div>
        
        {/* Desktop Menu */}
        <div className="hidden md:flex flex-none gap-1">
          {filteredNav.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`btn btn-sm btn-ghost gap-2 normal-case font-semibold relative ${
                currentView === item.id ? 'text-primary' : 'text-slate-400 hover:text-white'
              }`}
            >
              <item.icon className={`w-4 h-4 ${currentView === item.id ? 'text-primary' : ''}`} />
              {item.label}
              {(item.badge ?? 0) > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span>
              )}
              {currentView === item.id && <div className="absolute -bottom-4 left-0 w-full h-1 bg-primary rounded-t-full shadow-[0_0_10px_#FACC15]"></div>}
            </button>
          ))}
          
          {/* Notification Bell */}
          <NotificationBell onNavigate={onNavigate} />
          
          <div className="dropdown dropdown-end ml-4">
            <div tabIndex={0} role="button" className="btn btn-sm bg-slate-800 border-none text-white hover:bg-slate-700 gap-2">
              <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_5px_#FACC15]"></div>
              {currentRole}
              <ChevronDown className="w-3 h-3 opacity-50" />
            </div>
            <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-2xl bg-slate-900 border border-white/5 rounded-xl w-52 mt-4">
              <li className="menu-title text-xs uppercase">Switch Profile</li>
              <li><button className="hover:text-primary" onClick={() => onRoleChange(UserRole.DRIVER)}>Vehicle Driver</button></li>
              <li><button className="hover:text-primary" onClick={() => onRoleChange(UserRole.SHOP)}>Mechanic Shop</button></li>
              <li><button className="hover:text-primary" onClick={() => onRoleChange(UserRole.ADMIN)}>Platform Admin</button></li>
            </ul>
          </div>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex-none md:hidden">
            <button className="btn btn-square btn-ghost" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X /> : <Menu />}
              {totalUnread > 0 && !isMobileMenuOpen && (
                 <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-900"></span>
              )}
            </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/95 backdrop-blur-xl md:hidden animate-in fade-in slide-in-from-top-10 duration-200">
          <div className="flex flex-col h-full p-6 pt-24 space-y-6 overflow-y-auto">
            
            {/* Mobile Navigation Links */}
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase text-slate-500 mb-2">Navigation</p>
              {filteredNav.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
                    currentView === item.id 
                      ? 'bg-primary text-black font-bold shadow-[0_0_20px_rgba(250,204,21,0.3)]' 
                      : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-4">
                      <item.icon className="w-6 h-6" />
                      <span className="text-lg">{item.label}</span>
                  </div>
                  {item.badge && item.badge > 0 && (
                    <span className="badge badge-error text-white font-bold">
                      {item.badge > 4 ? '4+' : item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="h-px bg-white/10 my-2" />

            {/* Mobile Role Switcher */}
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase text-slate-500 mb-2">Switch Profile</p>
              <div className="grid grid-cols-1 gap-3">
                 <button 
                  onClick={() => { onRoleChange(UserRole.DRIVER); setIsMobileMenuOpen(false); }}
                  className={`btn ${currentRole === UserRole.DRIVER ? 'btn-primary' : 'btn-outline'} justify-start gap-3`}
                 >
                   <User className="w-5 h-5" /> Vehicle Driver
                 </button>
                 <button 
                  onClick={() => { onRoleChange(UserRole.SHOP); setIsMobileMenuOpen(false); }}
                  className={`btn ${currentRole === UserRole.SHOP ? 'btn-primary' : 'btn-outline'} justify-start gap-3`}
                 >
                   <Wrench className="w-5 h-5" /> Mechanic Shop
                 </button>
                 <button 
                  onClick={() => { onRoleChange(UserRole.ADMIN); setIsMobileMenuOpen(false); }}
                  className={`btn ${currentRole === UserRole.ADMIN ? 'btn-primary' : 'btn-outline'} justify-start gap-3`}
                 >
                   <ShieldCheck className="w-5 h-5" /> Admin Console
                 </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 md:pt-12 pb-20">
        <div className="max-w-6xl mx-auto ">
           {children}
        </div>
      </main>

      {/* Floating Chat Widget */}
      {currentRole !== UserRole.ADMIN && (
        <FloatingChat 
          onOpenChat={(shop) => onOpenChat ? onOpenChat(shop) : onNavigate('messages')}
          onViewAll={() => onNavigate('messages')}
          conversations={conversations} // Pass managed conversations
          globalUnread={totalUnread}
          userStatuses={userStatuses}
        />
      )}
    </div>
  );
};