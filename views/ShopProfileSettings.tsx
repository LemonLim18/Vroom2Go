import React, { useState } from 'react';
import { MOCK_SHOPS, MOCK_SERVICES, MOCK_BOOKINGS } from '../constants';
import { ServiceCategory, Shop } from '../types';
import { 
  Wrench, 
  MapPin, 
  Clock, 
  Star, 
  DollarSign, 
  Settings, 
  Shield, 
  User, 
  Bell,
  Camera,
  Edit,
  Save,
  CheckCircle,
  XCircle,
  Plus,
  Trash2,
  Phone,
  Mail,
  Award,
  Calendar,
  TrendingUp,
  BarChart3,
  Stethoscope
} from 'lucide-react';

type ShopSettingsTab = 'profile' | 'services' | 'settings';

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  [ServiceCategory.MAINTENANCE]: Wrench,
  [ServiceCategory.REPAIR]: Settings,
  [ServiceCategory.DIAGNOSTIC]: Stethoscope,
};

export const ShopProfileSettings: React.FC = () => {
  // Use first shop as the current shop for demo
  const shop = MOCK_SHOPS[0];
  const [activeTab, setActiveTab] = useState<ShopSettingsTab>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Show toast notification
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Shop form state
  const [shopData, setShopData] = useState({
    name: shop.name,
    description: shop.description,
    address: shop.address,
    phone: shop.phone || '(555) 123-4567',
    email: shop.email || 'contact@speedyfixauto.com',
    laborRate: shop.laborRate || 85,
    partsMarkup: shop.partsMarkup || 15,
    depositPercent: shop.depositPercent || 20,
    warrantyDays: shop.warrantyDays || 90,
  });

  // Get services this shop offers
  const shopServices = MOCK_SERVICES.filter(s => shop.services.includes(s.id));

  // Get recent bookings for this shop
  const recentBookings = MOCK_BOOKINGS.filter(b => b.shopId === shop.id);

  // Stats
  const stats = {
    totalBookings: recentBookings.length,
    completedJobs: recentBookings.filter(b => b.status === 'Completed').length,
    pendingJobs: recentBookings.filter(b => b.status === 'In Progress' || b.status === 'Confirmed').length,
    revenue: recentBookings.reduce((sum, b) => sum + b.estimatedTotal, 0),
  };

  const tabs = [
    { id: 'profile' as const, label: 'Shop Profile', icon: User },
    { id: 'services' as const, label: 'Services & Pricing', icon: Wrench },
    { id: 'settings' as const, label: 'Account Settings', icon: Settings },
  ];

  const handleInputChange = (field: string, value: string | number) => {
    setShopData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    setIsEditing(false);
    // Would save to backend here
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Shop Header */}
      <div className="glass-card rounded-3xl border border-white/5 overflow-hidden">
        <div className="h-40 relative bg-slate-800">
          <img 
            src={shop.image} 
            alt={shop.name}
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
          <button className="absolute top-4 right-4 btn btn-sm btn-ghost bg-black/30 gap-1">
            <Camera className="w-4 h-4" /> Change Cover
          </button>
        </div>
        
        <div className="p-6 -mt-12 relative">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            {/* Shop Avatar */}
            <div className="w-24 h-24 rounded-2xl bg-slate-800 border-4 border-slate-900 overflow-hidden">
              <img src={shop.image} alt={shop.name} className="w-full h-full object-cover" />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-black uppercase italic tracking-tighter">{shop.name}</h1>
                {shop.verified && (
                  <span className="badge badge-primary gap-1">
                    <Shield className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-primary fill-primary" />
                  {shop.rating} ({shop.reviewCount} reviews)
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {shop.address}
                </span>
              </div>
            </div>

            <button 
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              className="btn btn-primary gap-2 rounded-xl"
            >
              {isEditing ? <><Save className="w-4 h-4" /> Save Changes</> : <><Edit className="w-4 h-4" /> Edit Profile</>}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-5 border border-white/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm text-slate-400">Total Bookings</span>
          </div>
          <p className="text-3xl font-black">{stats.totalBookings}</p>
        </div>
        <div className="glass-card rounded-2xl p-5 border border-white/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-sm text-slate-400">Completed</span>
          </div>
          <p className="text-3xl font-black">{stats.completedJobs}</p>
        </div>
        <div className="glass-card rounded-2xl p-5 border border-white/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-sm text-slate-400">In Progress</span>
          </div>
          <p className="text-3xl font-black">{stats.pendingJobs}</p>
        </div>
        <div className="glass-card rounded-2xl p-5 border border-white/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-sm text-slate-400">Total Revenue</span>
          </div>
          <p className="text-3xl font-black">${stats.revenue.toLocaleString()}</p>
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

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Business Info */}
            <div className="glass-card rounded-2xl p-6 border border-white/5">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Business Information
              </h3>
              <div className="space-y-4">
                <div className="form-control">
                  <label className="label"><span className="label-text">Shop Name</span></label>
                  <input 
                    type="text"
                    value={shopData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    disabled={!isEditing}
                    className="input input-bordered bg-slate-800 border-white/10 disabled:opacity-70"
                  />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text">Description</span></label>
                  <textarea 
                    value={shopData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    disabled={!isEditing}
                    rows={3}
                    className="textarea textarea-bordered bg-slate-800 border-white/10 disabled:opacity-70"
                  />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text">Address</span></label>
                  <input 
                    type="text"
                    value={shopData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    disabled={!isEditing}
                    className="input input-bordered bg-slate-800 border-white/10 disabled:opacity-70"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label"><span className="label-text flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</span></label>
                    <input 
                      type="tel"
                      value={shopData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      disabled={!isEditing}
                      className="input input-bordered bg-slate-800 border-white/10 disabled:opacity-70"
                    />
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text flex items-center gap-1"><Mail className="w-3 h-3" /> Email</span></label>
                    <input 
                      type="email"
                      value={shopData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      disabled={!isEditing}
                      className="input input-bordered bg-slate-800 border-white/10 disabled:opacity-70"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Business Hours */}
            <div className="glass-card rounded-2xl p-6 border border-white/5">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Business Hours
              </h3>
              <div className="space-y-3">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, idx) => (
                  <div key={day} className="flex items-center justify-between">
                    <span className="font-medium w-28">{day}</span>
                    {idx < 5 ? (
                      <div className="flex items-center gap-2">
                        <input type="time" defaultValue="08:00" disabled={!isEditing} className="input input-sm input-bordered bg-slate-800 border-white/10" />
                        <span>-</span>
                        <input type="time" defaultValue="18:00" disabled={!isEditing} className="input input-sm input-bordered bg-slate-800 border-white/10" />
                      </div>
                    ) : idx === 5 ? (
                      <div className="flex items-center gap-2">
                        <input type="time" defaultValue="09:00" disabled={!isEditing} className="input input-sm input-bordered bg-slate-800 border-white/10" />
                        <span>-</span>
                        <input type="time" defaultValue="16:00" disabled={!isEditing} className="input input-sm input-bordered bg-slate-800 border-white/10" />
                      </div>
                    ) : (
                      <span className="text-slate-500">Closed</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Verification Status */}
            <div className={`glass-card rounded-2xl p-5 border ${shop.verified ? 'border-green-500/20 bg-green-500/5' : 'border-orange-500/20 bg-orange-500/5'}`}>
              <div className="flex items-center gap-3 mb-3">
                {shop.verified ? (
                  <CheckCircle className="w-6 h-6 text-green-400" />
                ) : (
                  <XCircle className="w-6 h-6 text-orange-400" />
                )}
                <div>
                  <p className="font-bold">{shop.verified ? 'Verified Shop' : 'Pending Verification'}</p>
                  <p className="text-xs text-slate-400">
                    {shop.verified 
                      ? `Verified since ${shop.verifiedDate || 'Jan 2022'}` 
                      : 'Submit documents to get verified'}
                  </p>
                </div>
              </div>
              {!shop.verified && (
                <button className="btn btn-warning btn-sm w-full">Complete Verification</button>
              )}
            </div>

            {/* Certifications */}
            <div className="glass-card rounded-2xl p-5 border border-white/5">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                Certifications
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  ASE Master Technician
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  EPA Certified
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  BBB Accredited
                </div>
              </div>
              <button className="btn btn-ghost btn-sm w-full mt-4 gap-1">
                <Plus className="w-4 h-4" /> Add Certification
              </button>
            </div>

            {/* Rating Summary */}
            <div className="glass-card rounded-2xl p-5 border border-white/5">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-primary fill-primary" />
                Rating Summary
              </h3>
              <div className="text-center mb-4">
                <p className="text-5xl font-black text-primary">{shop.rating}</p>
                <p className="text-slate-400 text-sm">{shop.reviewCount} total reviews</p>
              </div>
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map(stars => (
                  <div key={stars} className="flex items-center gap-2">
                    <span className="w-3 text-xs text-slate-400">{stars}</span>
                    <Star className="w-3 h-3 text-primary fill-primary" />
                    <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary" 
                        style={{ width: `${stars === 5 ? 70 : stars === 4 ? 20 : stars === 3 ? 7 : 3}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Services Tab */}
      {activeTab === 'services' && (
        <div className="space-y-6">
          {/* Pricing Settings */}
          <div className="glass-card rounded-2xl p-6 border border-white/5">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Pricing Configuration
            </h3>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="form-control">
                <label className="label"><span className="label-text">Labor Rate ($/hr)</span></label>
                <input 
                  type="number"
                  value={shopData.laborRate}
                  onChange={(e) => handleInputChange('laborRate', parseInt(e.target.value))}
                  disabled={!isEditing}
                  className="input input-bordered bg-slate-800 border-white/10"
                />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Parts Markup (%)</span></label>
                <input 
                  type="number"
                  value={shopData.partsMarkup}
                  onChange={(e) => handleInputChange('partsMarkup', parseInt(e.target.value))}
                  disabled={!isEditing}
                  className="input input-bordered bg-slate-800 border-white/10"
                />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Deposit (%)</span></label>
                <input 
                  type="number"
                  value={shopData.depositPercent}
                  onChange={(e) => handleInputChange('depositPercent', parseInt(e.target.value))}
                  disabled={!isEditing}
                  className="input input-bordered bg-slate-800 border-white/10"
                />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Warranty (days)</span></label>
                <input 
                  type="number"
                  value={shopData.warrantyDays}
                  onChange={(e) => handleInputChange('warrantyDays', parseInt(e.target.value))}
                  disabled={!isEditing}
                  className="input input-bordered bg-slate-800 border-white/10"
                />
              </div>
            </div>
          </div>

          {/* Services List */}
          <div className="glass-card rounded-2xl p-6 border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Wrench className="w-5 h-5 text-primary" />
                Services Offered ({shopServices.length})
              </h3>
              <button 
                onClick={() => setShowAddServiceModal(true)}
                className="btn btn-primary btn-sm gap-1"
              >
                <Plus className="w-4 h-4" /> Add Service
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Category</th>
                    <th>Your Price</th>
                    <th>Duration</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {shopServices.map(service => {
                    const CategoryIcon = CATEGORY_ICONS[service.category] || Wrench;
                    return (
                      <tr key={service.id} className="hover:bg-slate-800/50">
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <CategoryIcon className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{service.name}</p>
                              <p className="text-xs text-slate-400 line-clamp-1">{service.description}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-ghost badge-sm">{service.category}</span>
                        </td>
                        <td>
                          <input 
                            type="text"
                            defaultValue={shop.customPrices[service.id] || 'Quote'}
                            disabled={!isEditing}
                            className="input input-sm input-bordered bg-slate-800 border-white/10 w-24"
                          />
                        </td>
                        <td className="text-slate-400">{service.duration || 'Varies'}</td>
                        <td>
                          <div className="flex gap-1">
                            <button className="btn btn-ghost btn-xs"><Edit className="w-3 h-3" /></button>
                            <button className="btn btn-ghost btn-xs text-error"><Trash2 className="w-3 h-3" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
            {/* Notifications */}
            <div className="glass-card rounded-2xl p-6 border border-white/5">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Notification Preferences
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">New Booking Requests</p>
                    <p className="text-sm text-slate-400">Get notified when customers request bookings</p>
                  </div>
                  <input type="checkbox" className="toggle toggle-primary" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Quote Requests</p>
                    <p className="text-sm text-slate-400">Receive alerts for new quote requests</p>
                  </div>
                  <input type="checkbox" className="toggle toggle-primary" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Customer Messages</p>
                    <p className="text-sm text-slate-400">Notifications for direct messages</p>
                  </div>
                  <input type="checkbox" className="toggle toggle-primary" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Review Alerts</p>
                    <p className="text-sm text-slate-400">Get notified when customers leave reviews</p>
                  </div>
                  <input type="checkbox" className="toggle toggle-primary" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Payment Updates</p>
                    <p className="text-sm text-slate-400">Notifications for deposits and payouts</p>
                  </div>
                  <input type="checkbox" className="toggle toggle-primary" defaultChecked />
                </div>
              </div>
            </div>

            {/* Payout Settings */}
            <div className="glass-card rounded-2xl p-6 border border-white/5">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Payout Settings
              </h3>
              <div className="space-y-4">
                <div className="form-control">
                  <label className="label"><span className="label-text">Bank Account</span></label>
                  <div className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl">
                    <div className="w-10 h-6 bg-gradient-to-r from-green-600 to-green-800 rounded flex items-center justify-center text-white text-xs font-bold">
                      ✓
                    </div>
                    <span>Chase •••• 4589</span>
                    <span className="badge badge-success badge-xs">Default</span>
                    <button className="btn btn-ghost btn-xs ml-auto">Change</button>
                  </div>
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text">Payout Schedule</span></label>
                  <select className="select select-bordered bg-slate-800 border-white/10">
                    <option>Weekly (Every Monday)</option>
                    <option>Bi-weekly</option>
                    <option>Monthly</option>
                    <option>Manual</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Status */}
            <div className="glass-card rounded-2xl p-5 border border-green-500/20 bg-green-500/5">
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-400" />
                Account Status
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Status</span>
                  <span className="text-green-400 font-medium">Active</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Member Since</span>
                  <span>Jan 2022</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Plan</span>
                  <span className="text-primary font-medium">Professional</span>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="glass-card rounded-2xl p-5 border border-red-500/20 bg-red-500/5">
              <h3 className="font-bold mb-4 text-red-400">Danger Zone</h3>
              <div className="space-y-3">
                <button className="btn btn-outline btn-sm w-full text-slate-400 hover:text-white">
                  Pause Shop Listing
                </button>
                <button className="btn btn-outline btn-error btn-sm w-full">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast toast-end toast-bottom z-50">
          <div className="alert alert-success">
            <CheckCircle className="w-5 h-5" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Add Service Modal */}
      {showAddServiceModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-white/10">
            <h2 className="text-2xl font-bold mb-4">Add New Service</h2>
            <div className="space-y-4">
              <div className="form-control">
                <label className="label"><span className="label-text">Service Name</span></label>
                <input type="text" placeholder="e.g., Full Synthetic Oil Change" className="input input-bordered bg-slate-800 border-white/10" />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Category</span></label>
                <select className="select select-bordered bg-slate-800 border-white/10">
                  <option>Maintenance</option>
                  <option>Repair</option>
                  <option>Diagnostic</option>
                </select>
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Your Price</span></label>
                <input type="text" placeholder="$75.00" className="input input-bordered bg-slate-800 border-white/10" />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Estimated Duration</span></label>
                <input type="text" placeholder="45 mins" className="input input-bordered bg-slate-800 border-white/10" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddServiceModal(false)} className="btn btn-ghost flex-1">Cancel</button>
              <button onClick={() => { showToast('Service added successfully!'); setShowAddServiceModal(false); }} className="btn btn-primary flex-1">Add Service</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
