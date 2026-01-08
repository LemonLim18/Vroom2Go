import React, { useState } from 'react';
import { MOCK_VEHICLES, MOCK_BOOKINGS, MOCK_USERS } from '../constants';
import { 
  Car, 
  Wrench, 
  CreditCard, 
  Plus, 
  Clock, 
  FileText, 
  Settings, 
  Shield, 
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Trash2,
  Edit,
  Star,
  User,
  Bell,
  LogOut,
  Calendar
} from 'lucide-react';

type ProfileTab = 'vehicles' | 'history' | 'settings';

interface ServiceHistoryItem {
  id: string;
  serviceName: string;
  shopName: string;
  date: string;
  status: 'completed' | 'warranty';
  total: number;
  warrantyUntil?: string;
}

// Mock service history with warranty info
const SERVICE_HISTORY: ServiceHistoryItem[] = [
  {
    id: 'sh1',
    serviceName: 'Brake Pad Replacement',
    shopName: 'Speedy Fix Auto',
    date: '2024-01-10',
    status: 'warranty',
    total: 350,
    warrantyUntil: '2025-01-10'
  },
  {
    id: 'sh2',
    serviceName: 'Full Synthetic Oil Change',
    shopName: 'Turbo Tune Garage',
    date: '2023-12-15',
    status: 'completed',
    total: 85
  },
  {
    id: 'sh3',
    serviceName: 'Tire Rotation',
    shopName: 'Speedy Fix Auto',
    date: '2023-11-20',
    status: 'completed',
    total: 45
  },
];

export const UserProfile: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ProfileTab>('vehicles');
  const user = MOCK_USERS[0]; // First user as current user

  const tabs = [
    { id: 'vehicles' as const, label: 'My Garage', icon: Car },
    { id: 'history' as const, label: 'Service History', icon: Clock },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ];

  const activeWarranties = SERVICE_HISTORY.filter(s => s.status === 'warranty');

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-primary">{user.name.charAt(0)}</span>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-black uppercase italic tracking-tighter">
              {user.name}
            </h1>
            <p className="text-slate-400">{user.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="badge badge-primary badge-sm">Member since 2021</span>
              <span className="badge badge-ghost badge-sm gap-1">
                <Star className="w-3 h-3 fill-primary text-primary" /> 4.9 Rating
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs tabs-boxed bg-slate-800/50 p-1 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab gap-2 ${activeTab === tab.id ? 'tab-active bg-primary text-black' : ''}`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Vehicles Tab */}
      {activeTab === 'vehicles' && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Vehicles List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">My Vehicles</h2>
              <button className="btn btn-primary btn-sm gap-1">
                <Plus className="w-4 h-4" /> Add Vehicle
              </button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              {MOCK_VEHICLES.map(vehicle => (
                <div key={vehicle.id} className="glass-card rounded-2xl overflow-hidden border border-white/5 group hover:border-primary/20 transition-all">
                  <div className="h-32 relative">
                    <img src={vehicle.image} alt={vehicle.model} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
                    <div className="absolute bottom-3 left-3">
                      <span className="text-xs text-slate-400">{vehicle.type}</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg">{vehicle.year} {vehicle.make} {vehicle.model}</h3>
                    <p className="text-xs text-slate-400 font-mono">VIN: {vehicle.vin.slice(0, 11)}...</p>
                    {vehicle.mileage && (
                      <p className="text-sm text-slate-300 mt-1">{vehicle.mileage.toLocaleString()} miles</p>
                    )}
                    <div className="flex gap-2 mt-3">
                      <button className="btn btn-xs btn-ghost gap-1"><Edit className="w-3 h-3" /> Edit</button>
                      <button className="btn btn-xs btn-ghost text-error gap-1"><Trash2 className="w-3 h-3" /> Remove</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Active Warranties */}
            <div className="glass-card rounded-2xl p-5 border border-green-500/20 bg-green-500/5">
              <h3 className="font-bold flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-green-400" />
                Active Warranties
              </h3>
              {activeWarranties.length > 0 ? (
                <div className="space-y-3">
                  {activeWarranties.map(item => (
                    <div key={item.id} className="p-3 bg-slate-800/50 rounded-xl">
                      <p className="font-medium text-sm">{item.serviceName}</p>
                      <p className="text-xs text-slate-400">{item.shopName}</p>
                      <p className="text-xs text-green-400 mt-1">
                        <CheckCircle className="w-3 h-3 inline mr-1" />
                        Covered until {item.warrantyUntil}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">No active warranties</p>
              )}
            </div>

            {/* Payment Methods */}
            <div className="glass-card rounded-2xl p-5 border border-white/5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  Payment Methods
                </h3>
                <button className="btn btn-ghost btn-xs"><Plus className="w-4 h-4" /></button>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-6 bg-gradient-to-r from-blue-600 to-blue-800 rounded"></div>
                    <span>•••• 4242</span>
                  </div>
                  <span className="badge badge-xs badge-primary">Default</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-6 bg-gradient-to-r from-orange-500 to-red-500 rounded"></div>
                    <span>•••• 1234</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-card rounded-2xl p-5 border border-white/5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
              </div>
              <p className="text-2xl font-black">12</p>
              <p className="text-sm text-slate-400">Total Services</p>
            </div>
            <div className="glass-card rounded-2xl p-5 border border-white/5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <Wrench className="w-5 h-5 text-green-400" />
                </div>
              </div>
              <p className="text-2xl font-black">$2,450</p>
              <p className="text-sm text-slate-400">Total Spent</p>
            </div>
            <div className="glass-card rounded-2xl p-5 border border-white/5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-400" />
                </div>
              </div>
              <p className="text-2xl font-black">{activeWarranties.length}</p>
              <p className="text-sm text-slate-400">Active Warranties</p>
            </div>
            <div className="glass-card rounded-2xl p-5 border border-white/5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Star className="w-5 h-5 text-purple-400" />
                </div>
              </div>
              <p className="text-2xl font-black">$400</p>
              <p className="text-sm text-slate-400">Est. Savings</p>
            </div>
          </div>

          {/* Service History Timeline */}
          <div className="glass-card rounded-2xl p-6 border border-white/5">
            <h3 className="font-bold text-lg mb-6">Service History</h3>
            <div className="space-y-4">
              {SERVICE_HISTORY.map((item, i) => (
                <div key={item.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      item.status === 'warranty' ? 'bg-green-500/20' : 'bg-slate-700'
                    }`}>
                      <CheckCircle className={`w-5 h-5 ${
                        item.status === 'warranty' ? 'text-green-400' : 'text-slate-400'
                      }`} />
                    </div>
                    {i < SERVICE_HISTORY.length - 1 && (
                      <div className="w-0.5 h-12 bg-slate-700 mt-2"></div>
                    )}
                  </div>
                  <div className="flex-1 pb-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold">{item.serviceName}</h4>
                        <p className="text-sm text-slate-400">{item.shopName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">${item.total}</p>
                        <p className="text-xs text-slate-400">{item.date}</p>
                      </div>
                    </div>
                    {item.status === 'warranty' && (
                      <div className="mt-2 badge badge-success badge-sm gap-1">
                        <Shield className="w-3 h-3" />
                        Warranty until {item.warrantyUntil}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Bookings Table */}
          <div className="glass-card rounded-2xl p-6 border border-white/5">
            <h3 className="font-bold text-lg mb-4">Recent Bookings</h3>
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Shop</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_BOOKINGS.map(booking => (
                    <tr key={booking.id} className="hover:bg-slate-800/50">
                      <td className="font-medium">{booking.serviceName}</td>
                      <td className="text-slate-400">{booking.shopName}</td>
                      <td className="text-slate-400">{booking.date}</td>
                      <td>
                        <span className={`badge badge-sm ${
                          booking.status === 'Completed' ? 'badge-success' :
                          booking.status === 'Confirmed' ? 'badge-primary' :
                          booking.status === 'In Progress' ? 'badge-warning' : 'badge-ghost'
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="font-medium">{booking.price}</td>
                      <td>
                        <button className="btn btn-ghost btn-xs">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Settings */}
            <div className="glass-card rounded-2xl p-6 border border-white/5">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Profile Information
              </h3>
              <div className="space-y-4">
                <div className="form-control">
                  <label className="label"><span className="label-text">Full Name</span></label>
                  <input type="text" defaultValue={user.name} className="input input-bordered bg-slate-800 border-white/10" />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text">Email</span></label>
                  <input type="email" defaultValue={user.email} className="input input-bordered bg-slate-800 border-white/10" />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text">Phone</span></label>
                  <input type="tel" defaultValue="+1 (555) 123-4567" className="input input-bordered bg-slate-800 border-white/10" />
                </div>
                <button className="btn btn-primary">Save Changes</button>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="glass-card rounded-2xl p-6 border border-white/5">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Notifications
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Booking Updates</p>
                    <p className="text-sm text-slate-400">Get notified about booking status changes</p>
                  </div>
                  <input type="checkbox" className="toggle toggle-primary" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Quote Responses</p>
                    <p className="text-sm text-slate-400">Receive alerts when shops respond to quotes</p>
                  </div>
                  <input type="checkbox" className="toggle toggle-primary" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Promotions</p>
                    <p className="text-sm text-slate-400">Get notified about deals and discounts</p>
                  </div>
                  <input type="checkbox" className="toggle toggle-primary" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Service Reminders</p>
                    <p className="text-sm text-slate-400">Reminders for recommended maintenance</p>
                  </div>
                  <input type="checkbox" className="toggle toggle-primary" defaultChecked />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Security */}
            <div className="glass-card rounded-2xl p-5 border border-white/5">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security
              </h3>
              <div className="space-y-3">
                <button className="btn btn-ghost btn-sm w-full justify-start gap-2">
                  Change Password
                </button>
                <button className="btn btn-ghost btn-sm w-full justify-start gap-2">
                  Two-Factor Authentication
                </button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="glass-card rounded-2xl p-5 border border-red-500/20 bg-red-500/5">
              <h3 className="font-bold mb-4 text-red-400">Danger Zone</h3>
              <button className="btn btn-outline btn-error btn-sm w-full gap-2">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};