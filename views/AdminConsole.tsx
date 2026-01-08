import React, { useState } from 'react';
import { UserRole, Shop } from '../types';
import { MOCK_SHOPS, MOCK_BOOKINGS, MOCK_USERS } from '../constants';
import {
  ShieldCheck,
  ShieldX,
  Users,
  Store,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  BarChart3,
  Calendar,
  FileText,
  Search,
  Filter,
  ChevronRight,
  Eye,
  Ban,
  MessageSquare
} from 'lucide-react';

interface AdminConsoleProps {
  onBack?: () => void;
}

type AdminTab = 'overview' | 'verification' | 'disputes' | 'users';

// Mock pending verification shops
const PENDING_SHOPS = [
  {
    id: 'pending1',
    name: 'Quick Fix Garage',
    address: '555 Oak Street, Springfield',
    submittedAt: '2024-01-20',
    documents: ['Business License', 'Insurance'],
    contact: 'bob@quickfix.com',
    status: 'pending' as const,
  },
  {
    id: 'pending2',
    name: 'Elite Auto Works',
    address: '789 Maple Ave, Springfield',
    submittedAt: '2024-01-18',
    documents: ['Business License', 'Insurance', 'ASE Certification'],
    contact: 'info@eliteauto.com',
    status: 'pending' as const,
  },
];

// Mock disputes
const MOCK_DISPUTES = [
  {
    id: 'd1',
    bookingId: 'b2',
    userId: 'user1',
    shopId: 'shop1',
    reason: 'Final invoice 25% higher than quote',
    status: 'open' as const,
    createdAt: '2024-01-15',
  },
];

export const AdminConsole: React.FC<AdminConsoleProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [searchTerm, setSearchTerm] = useState('');

  const stats = {
    totalUsers: MOCK_USERS.length,
    totalShops: MOCK_SHOPS.filter(s => s.verified).length,
    pendingVerifications: PENDING_SHOPS.length,
    openDisputes: MOCK_DISPUTES.filter(d => d.status === 'open').length,
    totalBookings: MOCK_BOOKINGS.length,
    revenue: MOCK_BOOKINGS.reduce((sum, b) => sum + b.estimatedTotal, 0),
  };

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: BarChart3 },
    { id: 'verification' as const, label: 'Verification', icon: ShieldCheck, badge: stats.pendingVerifications },
    { id: 'disputes' as const, label: 'Disputes', icon: AlertTriangle, badge: stats.openDisputes },
    { id: 'users' as const, label: 'Users', icon: Users },
  ];

  return (
    <div className="animate-in fade-in duration-500">
      {/* Header */}
      <div className="mb-8">
        {onBack && (
          <button onClick={onBack} className="btn btn-ghost btn-sm mb-4">← Back</button>
        )}
        <h1 className="text-3xl font-black uppercase italic tracking-tighter">
          Admin <span className="text-primary">Console</span>
        </h1>
        <p className="text-slate-400">Platform management and analytics</p>
      </div>

      {/* Tab Navigation */}
      <div className="tabs tabs-boxed bg-slate-800/50 p-1 mb-8 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab gap-2 ${activeTab === tab.id ? 'tab-active bg-primary text-black' : ''}`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.badge && tab.badge > 0 && (
              <span className="badge badge-error badge-xs">{tab.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card rounded-2xl p-5 border border-white/5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-slate-400 text-sm">Total Users</span>
              </div>
              <p className="text-3xl font-black">{stats.totalUsers}</p>
            </div>

            <div className="glass-card rounded-2xl p-5 border border-white/5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <Store className="w-5 h-5 text-green-400" />
                </div>
                <span className="text-slate-400 text-sm">Verified Shops</span>
              </div>
              <p className="text-3xl font-black">{stats.totalShops}</p>
            </div>

            <div className="glass-card rounded-2xl p-5 border border-white/5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <span className="text-slate-400 text-sm">Total Bookings</span>
              </div>
              <p className="text-3xl font-black">{stats.totalBookings}</p>
            </div>

            <div className="glass-card rounded-2xl p-5 border border-white/5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-purple-400" />
                </div>
                <span className="text-slate-400 text-sm">Platform Revenue</span>
              </div>
              <p className="text-3xl font-black">${(stats.revenue * 0.12).toFixed(0)}</p>
              <p className="text-xs text-slate-500">12% commission</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass-card rounded-2xl p-6 border border-white/5">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Pending Actions
              </h3>
              <div className="space-y-3">
                {stats.pendingVerifications > 0 && (
                  <button 
                    onClick={() => setActiveTab('verification')}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="w-5 h-5 text-orange-400" />
                      <span>{stats.pendingVerifications} shops awaiting verification</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </button>
                )}
                {stats.openDisputes > 0 && (
                  <button 
                    onClick={() => setActiveTab('disputes')}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                      <span>{stats.openDisputes} open disputes</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </button>
                )}
                {stats.pendingVerifications === 0 && stats.openDisputes === 0 && (
                  <p className="text-slate-400 text-center py-4">No pending actions</p>
                )}
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6 border border-white/5">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Recent Activity
              </h3>
              <div className="space-y-3">
                {MOCK_BOOKINGS.slice(0, 3).map(booking => (
                  <div key={booking.id} className="flex items-center gap-3 text-sm">
                    <div className={`w-2 h-2 rounded-full ${
                      booking.status === 'Completed' ? 'bg-green-400' : 'bg-blue-400'
                    }`} />
                    <span className="flex-1 truncate">{booking.serviceName}</span>
                    <span className="text-slate-500">{booking.shopName}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verification Tab */}
      {activeTab === 'verification' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Shop Verification Queue</h2>
            <div className="join">
              <input 
                type="text"
                placeholder="Search shops..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input input-bordered input-sm join-item bg-base-100 border-white/10"
              />
              <button className="btn btn-sm join-item">
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          {PENDING_SHOPS.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center border border-white/5">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">All Caught Up!</h3>
              <p className="text-slate-400">No pending verifications</p>
            </div>
          ) : (
            <div className="space-y-4">
              {PENDING_SHOPS.map(shop => (
                <div key={shop.id} className="glass-card rounded-2xl p-6 border border-white/5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold">{shop.name}</h3>
                      <p className="text-sm text-slate-400">{shop.address}</p>
                      <p className="text-xs text-slate-500 mt-1">Submitted: {shop.submittedAt}</p>
                    </div>
                    <span className="badge badge-warning">Pending Review</span>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {shop.documents.map(doc => (
                      <span key={doc} className="badge badge-ghost gap-1">
                        <FileText className="w-3 h-3" /> {doc}
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button className="btn btn-sm btn-ghost gap-1">
                      <Eye className="w-4 h-4" /> Review Documents
                    </button>
                    <button className="btn btn-sm btn-success gap-1">
                      <CheckCircle className="w-4 h-4" /> Approve
                    </button>
                    <button className="btn btn-sm btn-error gap-1">
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Disputes Tab */}
      {activeTab === 'disputes' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Dispute Resolution</h2>
            <div className="flex gap-2">
              <select className="select select-sm select-bordered bg-base-100 border-white/10">
                <option>All Status</option>
                <option>Open</option>
                <option>Under Review</option>
                <option>Resolved</option>
              </select>
            </div>
          </div>

          {MOCK_DISPUTES.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center border border-white/5">
              <ShieldCheck className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">No Disputes</h3>
              <p className="text-slate-400">All transactions are running smoothly</p>
            </div>
          ) : (
            <div className="space-y-4">
              {MOCK_DISPUTES.map(dispute => (
                <div key={dispute.id} className="glass-card rounded-2xl p-6 border border-red-500/20">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                        Dispute #{dispute.id.toUpperCase()}
                      </h3>
                      <p className="text-sm text-slate-400 mt-1">{dispute.reason}</p>
                    </div>
                    <span className={`badge ${
                      dispute.status === 'open' ? 'badge-error' : 
                      dispute.status === 'under_review' ? 'badge-warning' : 'badge-success'
                    }`}>
                      {dispute.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <p className="text-slate-500">User</p>
                      <p>User #{dispute.userId}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Shop</p>
                      <p>{MOCK_SHOPS.find(s => s.id === dispute.shopId)?.name}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button className="btn btn-sm btn-ghost gap-1">
                      <Eye className="w-4 h-4" /> View Details
                    </button>
                    <button className="btn btn-sm btn-outline gap-1">
                      <MessageSquare className="w-4 h-4" /> Contact Parties
                    </button>
                    <button className="btn btn-sm btn-success gap-1">
                      <CheckCircle className="w-4 h-4" /> Resolve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">User Management</h2>
            <div className="join">
              <input 
                type="text"
                placeholder="Search users..."
                className="input input-bordered input-sm join-item bg-base-100 border-white/10"
              />
              <button className="btn btn-sm join-item">
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Email</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_USERS.map(user => (
                  <tr key={user.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        {user.avatar && (
                          <img src={user.avatar} alt="" className="w-8 h-8 rounded-full" />
                        )}
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-sm ${
                        user.role === UserRole.ADMIN ? 'badge-error' :
                        user.role === UserRole.SHOP ? 'badge-primary' : 'badge-ghost'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="text-slate-400">{user.email}</td>
                    <td className="text-slate-400">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span className="badge badge-success badge-sm">Active</span>
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <button className="btn btn-ghost btn-xs"><Eye className="w-3 h-3" /></button>
                        <button className="btn btn-ghost btn-xs text-error"><Ban className="w-3 h-3" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
