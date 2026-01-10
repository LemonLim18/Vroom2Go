import React, { useState } from 'react';
import { ShopChatInterface } from '../components/ShopChatInterface';
import { MOCK_BOOKINGS, MOCK_QUOTES, MOCK_QUOTE_REQUESTS } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { 
  Calendar, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  FileText, 
  MessageSquare, 
  TrendingUp,
  Star,
  AlertCircle,
  ChevronRight,
  Eye,
  Send,
  XCircle,
  Users,
  Wrench
} from 'lucide-react';

type DashboardTab = 'overview' | 'messages' | 'quotes' | 'calendar' | 'analytics';

const revenueData = [
  { name: 'Mon', revenue: 400 },
  { name: 'Tue', revenue: 300 },
  { name: 'Wed', revenue: 600 },
  { name: 'Thu', revenue: 800 },
  { name: 'Fri', revenue: 500 },
  { name: 'Sat', revenue: 900 },
  { name: 'Sun', revenue: 200 },
];

const monthlyData = [
  { month: 'Jan', bookings: 45, revenue: 12500 },
  { month: 'Feb', bookings: 52, revenue: 14200 },
  { month: 'Mar', bookings: 48, revenue: 13100 },
  { month: 'Apr', bookings: 61, revenue: 16800 },
  { month: 'May', bookings: 55, revenue: 15400 },
  { month: 'Jun', bookings: 67, revenue: 18900 },
];

const serviceBreakdown = [
  { name: 'Oil Change', value: 35, color: '#facc15' },
  { name: 'Brake', value: 25, color: '#3b82f6' },
  { name: 'Diagnostic', value: 20, color: '#10b981' },
  { name: 'Tire', value: 12, color: '#8b5cf6' },
  { name: 'Other', value: 8, color: '#6b7280' },
];

// Mock calendar data
const CALENDAR_SLOTS = [
  { time: '9:00 AM', mon: 'Booked', tue: 'Available', wed: 'Booked', thu: 'Available', fri: 'Booked', sat: 'Booked' },
  { time: '10:00 AM', mon: 'Available', tue: 'Booked', wed: 'Available', thu: 'Booked', fri: 'Available', sat: 'Available' },
  { time: '11:00 AM', mon: 'Booked', tue: 'Available', wed: 'Booked', thu: 'Available', fri: 'Booked', sat: 'Booked' },
  { time: '1:00 PM', mon: 'Available', tue: 'Available', wed: 'Available', thu: 'Booked', fri: 'Available', sat: 'Available' },
  { time: '2:00 PM', mon: 'Booked', tue: 'Booked', wed: 'Available', thu: 'Available', fri: 'Booked', sat: 'Booked' },
  { time: '3:00 PM', mon: 'Available', tue: 'Available', wed: 'Booked', thu: 'Booked', fri: 'Available', sat: 'Available' },
  { time: '4:00 PM', mon: 'Booked', tue: 'Available', wed: 'Available', thu: 'Available', fri: 'Booked', sat: 'Booked' },
];

export const ShopDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [showAllJobsModal, setShowAllJobsModal] = useState(false);
  const [showEditScheduleModal, setShowEditScheduleModal] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<typeof MOCK_QUOTE_REQUESTS[0] | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Show toast notification
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Handle actions
  const handleSendQuote = () => {
    showToast(`Quote sent successfully for ${selectedRequest?.vehicleInfo?.make} ${selectedRequest?.vehicleInfo?.model}!`);
    setShowQuoteModal(false);
    setSelectedRequest(null);
  };

  const handleDecline = (request: typeof MOCK_QUOTE_REQUESTS[0]) => {
    showToast(`Request declined for ${request.vehicleInfo?.make} ${request.vehicleInfo?.model}`);
  };

  const handleMessage = (request: typeof MOCK_QUOTE_REQUESTS[0]) => {
    setSelectedRequest(request);
    setShowMessageModal(true);
  };

  const handleOpenQuoteModal = (request: typeof MOCK_QUOTE_REQUESTS[0]) => {
    setSelectedRequest(request);
    setShowQuoteModal(true);
  };

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: TrendingUp },
    { id: 'messages' as const, label: 'Messages', icon: MessageSquare },
    { id: 'quotes' as const, label: 'Quote Requests', icon: FileText, badge: MOCK_QUOTE_REQUESTS.length },
    { id: 'calendar' as const, label: 'Availability', icon: Calendar },
    { id: 'analytics' as const, label: 'Analytics', icon: BarChart },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black uppercase italic tracking-tighter">
            Shop <span className="text-primary">Dashboard</span>
          </h1>
          <p className="text-slate-400">Manage your services and bookings</p>
        </div>
        <button 
          onClick={() => setShowAddServiceModal(true)}
          className="btn btn-primary gap-2"
        >
          <Wrench className="w-4 h-4" /> Add Service
        </button>
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
            {tab.badge && tab.badge > 0 && (
              <span className="badge badge-error badge-xs">{tab.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="glass-card rounded-2xl p-5 border border-white/5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-400" />
                </div>
                <span className="text-xs text-green-400">↗ 14%</span>
              </div>
              <p className="text-sm text-slate-400">Weekly Revenue</p>
              <p className="text-2xl font-black">$3,700</p>
            </div>

            <div className="glass-card rounded-2xl p-5 border border-white/5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <span className="badge badge-warning badge-xs">4 pending</span>
              </div>
              <p className="text-sm text-slate-400">New Bookings</p>
              <p className="text-2xl font-black">12</p>
            </div>

            <div className="glass-card rounded-2xl p-5 border border-white/5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-xs text-blue-400">Top 5%</span>
              </div>
              <p className="text-sm text-slate-400">Avg Response</p>
              <p className="text-2xl font-black">18m</p>
            </div>

            <div className="glass-card rounded-2xl p-5 border border-white/5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Star className="w-5 h-5 text-purple-400" />
                </div>
              </div>
              <p className="text-sm text-slate-400">Rating</p>
              <p className="text-2xl font-black">4.9 ★</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Chart */}
            <div className="lg:col-span-2 glass-card rounded-2xl p-6 border border-white/5">
              <h2 className="font-bold text-lg mb-4">Revenue This Week</h2>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                      cursor={{fill: 'rgba(250,204,21,0.1)'}}
                    />
                    <Bar dataKey="revenue" fill="#facc15" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Upcoming Jobs */}
            <div className="glass-card rounded-2xl p-6 border border-white/5">
              <h2 className="font-bold text-lg mb-4">Upcoming Jobs</h2>
              <div className="space-y-3">
                {MOCK_BOOKINGS.slice(0, 4).map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                    <div>
                      <p className="font-bold text-sm">{booking.serviceName}</p>
                      <p className="text-xs text-slate-400">{booking.date}</p>
                    </div>
                    <span className={`badge badge-sm ${
                      booking.status === 'Confirmed' ? 'badge-primary' : 
                      booking.status === 'Completed' ? 'badge-success' : 'badge-ghost'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                ))}
                <button 
                  onClick={() => setShowAllJobsModal(true)}
                  className="btn btn-sm btn-ghost w-full"
                >
                  View All
                </button>
              </div>
            </div>
          </div>

          {/* Incoming Quote Requests */}
          {MOCK_QUOTE_REQUESTS.length > 0 && (
            <div className="glass-card rounded-2xl p-6 border border-primary/20 bg-primary/5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  New Quote Requests
                </h2>
                <button 
                  onClick={() => setActiveTab('quotes')}
                  className="btn btn-sm btn-primary"
                >
                  View All
                </button>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {MOCK_QUOTE_REQUESTS.slice(0, 3).map(request => (
                  <div key={request.id} className="bg-slate-800 rounded-xl p-4 min-w-[280px] flex-shrink-0">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-bold">{request.vehicleInfo?.make} {request.vehicleInfo?.model}</p>
                      <span className="badge badge-warning badge-xs">{request.status}</span>
                    </div>
                    <p className="text-sm text-slate-400 line-clamp-2 mb-3">{request.description}</p>
                    <div className="flex gap-2">
                      <button className="btn btn-xs btn-ghost gap-1"><Eye className="w-3 h-3" /> View</button>
                      <button className="btn btn-xs btn-primary gap-1"><Send className="w-3 h-3" /> Quote</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Messages Tab */}
      {activeTab === 'messages' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
           <ShopChatInterface />
        </div>
      )}

      {/* Quotes Tab */}
      {activeTab === 'quotes' && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="glass-card rounded-2xl p-5 border border-white/5">
              <p className="text-sm text-slate-400">Pending Requests</p>
              <p className="text-3xl font-black text-primary">{MOCK_QUOTE_REQUESTS.filter(r => r.status === 'pending').length}</p>
            </div>
            <div className="glass-card rounded-2xl p-5 border border-white/5">
              <p className="text-sm text-slate-400">Quotes Sent</p>
              <p className="text-3xl font-black">{MOCK_QUOTES.length}</p>
            </div>
            <div className="glass-card rounded-2xl p-5 border border-white/5">
              <p className="text-sm text-slate-400">Accepted Rate</p>
              <p className="text-3xl font-black text-green-400">72%</p>
            </div>
          </div>

          <h3 className="font-bold text-lg">Incoming Requests</h3>
          <div className="space-y-4">
            {MOCK_QUOTE_REQUESTS.map(request => (
              <div key={request.id} className="glass-card rounded-2xl p-5 border border-white/5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-bold text-lg">
                      {request.vehicleInfo?.year} {request.vehicleInfo?.make} {request.vehicleInfo?.model}
                    </h4>
                    <p className="text-sm text-slate-400">Request #{request.id.toUpperCase()}</p>
                  </div>
                  <span className={`badge ${
                    request.status === 'pending' ? 'badge-warning' :
                    request.status === 'quoted' ? 'badge-info' : 'badge-ghost'
                  }`}>
                    {request.status}
                  </span>
                </div>

                <p className="text-slate-300 mb-3">{request.description}</p>

                {request.symptoms && request.symptoms.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {request.symptoms.map((symptom, i) => (
                      <span key={i} className="badge badge-ghost badge-sm">{symptom}</span>
                    ))}
                  </div>
                )}

                {request.photos && request.photos.length > 0 && (
                  <div className="flex gap-2 mb-4">
                    {request.photos.map((photo, i) => (
                      <img key={i} src={photo} alt={`Photo ${i+1}`} className="w-16 h-12 rounded-lg object-cover" />
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <button 
                    onClick={() => handleMessage(request)}
                    className="btn btn-sm btn-ghost gap-1"
                  >
                    <MessageSquare className="w-4 h-4" /> Message
                  </button>
                  <button 
                    onClick={() => handleDecline(request)}
                    className="btn btn-sm btn-outline gap-1"
                  >
                    <XCircle className="w-4 h-4" /> Decline
                  </button>
                  <button 
                    onClick={() => handleOpenQuoteModal(request)}
                    className="btn btn-sm btn-primary gap-1"
                  >
                    <Send className="w-4 h-4" /> Send Quote
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Calendar Tab */}
      {activeTab === 'calendar' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg">Weekly Availability</h3>
            <button 
              onClick={() => setShowEditScheduleModal(true)}
              className="btn btn-primary btn-sm"
            >
              Edit Schedule
            </button>
          </div>

          <div className="glass-card rounded-2xl p-6 border border-white/5 overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Time</th>
                  <th className="text-center">Mon</th>
                  <th className="text-center">Tue</th>
                  <th className="text-center">Wed</th>
                  <th className="text-center">Thu</th>
                  <th className="text-center">Fri</th>
                  <th className="text-center">Sat</th>
                </tr>
              </thead>
              <tbody>
                {CALENDAR_SLOTS.map((slot, i) => (
                  <tr key={i}>
                    <td className="font-medium">{slot.time}</td>
                    {['mon', 'tue', 'wed', 'thu', 'fri', 'sat'].map((day) => (
                      <td key={day} className="text-center">
                        <span className={`badge badge-sm ${
                          slot[day as keyof typeof slot] === 'Booked' ? 'badge-primary' : 'badge-ghost'
                        }`}>
                          {slot[day as keyof typeof slot]}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass-card rounded-2xl p-5 border border-white/5">
              <h4 className="font-bold mb-3">Today's Schedule</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                  <div>
                    <p className="font-medium">10:00 AM - Oil Change</p>
                    <p className="text-xs text-slate-400">2023 Honda Civic</p>
                  </div>
                  <span className="badge badge-primary badge-sm">Confirmed</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                  <div>
                    <p className="font-medium">2:00 PM - Brake Inspection</p>
                    <p className="text-xs text-slate-400">2022 Toyota RAV4</p>
                  </div>
                  <span className="badge badge-warning badge-sm">Pending</span>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-5 border border-white/5">
              <h4 className="font-bold mb-3">Quick Stats</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Available Slots This Week</span>
                  <span className="font-bold">18</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Booked Slots</span>
                  <span className="font-bold text-primary">24</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Utilization Rate</span>
                  <span className="font-bold text-green-400">57%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Monthly Trend */}
            <div className="glass-card rounded-2xl p-6 border border-white/5">
              <h3 className="font-bold text-lg mb-4">Monthly Performance</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} />
                    <YAxis yAxisId="left" axisLine={false} tickLine={false} />
                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                    <Line yAxisId="left" type="monotone" dataKey="bookings" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
                    <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#facc15" strokeWidth={2} dot={{ fill: '#facc15' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm text-slate-400">Bookings</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  <span className="text-sm text-slate-400">Revenue ($)</span>
                </div>
              </div>
            </div>

            {/* Service Breakdown */}
            <div className="glass-card rounded-2xl p-6 border border-white/5">
              <h3 className="font-bold text-lg mb-4">Service Breakdown</h3>
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={serviceBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {serviceBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {serviceBreakdown.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-xs text-slate-400">{item.name} ({item.value}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-card rounded-2xl p-5 border border-white/5 text-center">
              <p className="text-3xl font-black text-green-400">98%</p>
              <p className="text-sm text-slate-400">Completion Rate</p>
            </div>
            <div className="glass-card rounded-2xl p-5 border border-white/5 text-center">
              <p className="text-3xl font-black">$245</p>
              <p className="text-sm text-slate-400">Avg Ticket Size</p>
            </div>
            <div className="glass-card rounded-2xl p-5 border border-white/5 text-center">
              <p className="text-3xl font-black text-primary">156</p>
              <p className="text-sm text-slate-400">Total Customers</p>
            </div>
            <div className="glass-card rounded-2xl p-5 border border-white/5 text-center">
              <p className="text-3xl font-black">0</p>
              <p className="text-sm text-slate-400">Disputes</p>
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

      {/* View All Jobs Modal */}
      {showAllJobsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-hidden border border-white/10">
            <div className="sticky top-0 bg-slate-900 p-6 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-2xl font-bold">All Upcoming Jobs</h2>
              <button onClick={() => setShowAllJobsModal(false)} className="btn btn-ghost btn-circle btn-sm">✕</button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-3">
                {MOCK_BOOKINGS.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
                    <div>
                      <p className="font-bold">{booking.serviceName}</p>
                      <p className="text-sm text-slate-400">{booking.vehicle}</p>
                      <p className="text-xs text-slate-500">{booking.date}</p>
                    </div>
                    <div className="text-right">
                      <span className={`badge ${booking.status === 'Confirmed' ? 'badge-primary' : booking.status === 'Completed' ? 'badge-success' : 'badge-ghost'}`}>
                        {booking.status}
                      </span>
                      <p className="text-sm font-bold mt-1">{booking.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send Quote Modal */}
      {showQuoteModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-white/10">
            <h2 className="text-2xl font-bold mb-2">Send Quote</h2>
            <p className="text-slate-400 mb-4">
              {selectedRequest.vehicleInfo?.year} {selectedRequest.vehicleInfo?.make} {selectedRequest.vehicleInfo?.model}
            </p>
            <div className="bg-slate-800/50 p-4 rounded-xl mb-4">
              <p className="text-sm text-slate-400 mb-2">Customer Issue:</p>
              <p>{selectedRequest.description}</p>
            </div>
            <div className="space-y-4">
              <div className="form-control">
                <label className="label"><span className="label-text">Estimated Total</span></label>
                <input type="text" placeholder="$350.00" className="input input-bordered bg-slate-800 border-white/10" />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Labor Hours</span></label>
                <input type="number" placeholder="2" className="input input-bordered bg-slate-800 border-white/10" />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Notes for Customer</span></label>
                <textarea placeholder="Additional details..." className="textarea textarea-bordered bg-slate-800 border-white/10 h-20" />
              </div>
              <div className="form-control">
                <label className="cursor-pointer label justify-start gap-3">
                  <input type="checkbox" className="checkbox checkbox-primary" />
                  <span className="label-text">Guarantee this price</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowQuoteModal(false); setSelectedRequest(null); }} className="btn btn-ghost flex-1">Cancel</button>
              <button onClick={handleSendQuote} className="btn btn-primary flex-1 gap-2">
                <Send className="w-4 h-4" /> Send Quote
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {showMessageModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-white/10">
            <h2 className="text-2xl font-bold mb-2">Send Message</h2>
            <p className="text-slate-400 mb-4">
              To: Customer ({selectedRequest.vehicleInfo?.make} {selectedRequest.vehicleInfo?.model} owner)
            </p>
            <div className="form-control">
              <textarea placeholder="Type your message..." className="textarea textarea-bordered bg-slate-800 border-white/10 h-32" />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowMessageModal(false); setSelectedRequest(null); }} className="btn btn-ghost flex-1">Cancel</button>
              <button onClick={() => { showToast('Message sent successfully!'); setShowMessageModal(false); setSelectedRequest(null); }} className="btn btn-primary flex-1 gap-2">
                <MessageSquare className="w-4 h-4" /> Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Schedule Modal */}
      {showEditScheduleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-white/10">
            <h2 className="text-2xl font-bold mb-4">Edit Weekly Schedule</h2>
            <div className="space-y-3">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, idx) => (
                <div key={day} className="flex items-center justify-between">
                  <label className="cursor-pointer label justify-start gap-3">
                    <input type="checkbox" className="checkbox checkbox-primary checkbox-sm" defaultChecked={idx < 6} />
                    <span className="font-medium w-24">{day}</span>
                  </label>
                  {idx < 6 && (
                    <div className="flex items-center gap-2">
                      <input type="time" defaultValue={idx < 5 ? "08:00" : "09:00"} className="input input-sm input-bordered bg-slate-800 border-white/10" />
                      <span>-</span>
                      <input type="time" defaultValue={idx < 5 ? "18:00" : "16:00"} className="input input-sm input-bordered bg-slate-800 border-white/10" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowEditScheduleModal(false)} className="btn btn-ghost flex-1">Cancel</button>
              <button onClick={() => { showToast('Schedule updated successfully!'); setShowEditScheduleModal(false); }} className="btn btn-primary flex-1">Save Schedule</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
