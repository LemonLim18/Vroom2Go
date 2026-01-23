import React, { useState } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';
import { themeConfig } from '../utils/alerts';
import { ShopChatInterface } from '../components/ShopChatInterface';
import { QuoteRequest, Booking } from '../types';
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
  Wrench,
  BarChart as BarChartIcon
} from 'lucide-react';
import { ShopQuoteRequestsView } from './ShopQuoteRequestsView';

// Helper to format date as YYYY-MM-DD without timezone conversion
const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

type DashboardTab = 'overview' | 'messages' | 'quotes' | 'bookings' | 'reviews' | 'calendar' | 'analytics';

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
  const [selectedRequest, setSelectedRequest] = useState<QuoteRequest | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedBookingForReschedule, setSelectedBookingForReschedule] = useState<any | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleSlots, setRescheduleSlots] = useState<any[]>([]);
  const [loadingRescheduleSlots, setLoadingRescheduleSlots] = useState(false);
  const [selectedRescheduleSlotId, setSelectedRescheduleSlotId] = useState<string>('');
  const [quoteRequests, setQuoteRequests] = useState<any[]>([]);
  const [shopMetrics, setShopMetrics] = useState({
    weeklyRevenue: 0,
    newBookings: 0,
    pendingBookings: 0,
    avgResponseMinutes: 0,
    rating: 0,
    reviewCount: 0,
    charts: {
      revenue: [],
      monthly: [],
      services: []
    }
  });
  const [shopBookings, setShopBookings] = useState<any[]>([]);
  const [updatingBookingId, setUpdatingBookingId] = useState<number | null>(null);
  const [shopReviews, setShopReviews] = useState<any[]>([]);
  const [respondingReviewId, setRespondingReviewId] = useState<number | null>(null);
  const [responseText, setResponseText] = useState('');
  
  // Availability calendar state
  const [weekStart, setWeekStart] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday as start
    today.setDate(today.getDate() - diff);
    return today;
  });
  const [timeSlots, setTimeSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [creatingSlot, setCreatingSlot] = useState(false);
  const [deletingSlotId, setDeletingSlotId] = useState<number | null>(null);
  const [shopId, setShopId] = useState<number | null>(null);

  // Fetch shop ID for the current user
  React.useEffect(() => {
    const fetchShopId = async () => {
      try {
        const { data } = await api.get('/shops/my');
        if (data?.id) setShopId(data.id);
      } catch (error) {
        console.error('Failed to fetch shop ID', error);
      }
    };
    fetchShopId();
  }, []);

  // Fetch time slots for the current week
  React.useEffect(() => {
    if (!shopId) return;
    const fetchSlots = async () => {
      setLoadingSlots(true);
      try {
        const startDate = formatLocalDate(weekStart);
        const { data } = await api.get(`/shops/${shopId}/availability/week?startDate=${startDate}`);
        setTimeSlots(data);
      } catch (error) {
        console.error('Failed to fetch time slots', error);
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
    
    // Auto-refresh every 30 seconds to catch reschedule updates
    const interval = setInterval(fetchSlots, 30000);
    return () => clearInterval(interval);
  }, [shopId, weekStart]);
  
  // Fetch real quote requests
  React.useEffect(() => {
      const fetchRequests = async () => {
          try {
              const { data } = await api.get('/quotes/requests/shop');
              const mapped = data.map((r: any) => ({
                  ...r,
                  vehicleInfo: r.vehicle || r.vehicleInfo
              }));
              setQuoteRequests(mapped);
          } catch (error) {
              console.error('Failed to fetch quote requests', error);
          }
      };
      fetchRequests();
      
      // Poll every 30s
      const interval = setInterval(fetchRequests, 30000);
      return () => clearInterval(interval);
  }, []);

  // Fetch shop analytics/metrics
  React.useEffect(() => {
      const fetchAnalytics = async () => {
          try {
              const { data } = await api.get('/shops/analytics');
              setShopMetrics(data);
          } catch (error) {
              console.error('Failed to fetch shop analytics', error);
          }
      };
      fetchAnalytics();
  }, []);

  // Fetch shop bookings
  React.useEffect(() => {
      const fetchBookings = async () => {
          try {
              const { data } = await api.get('/bookings');
              setShopBookings(data);
          } catch (error) {
              console.error('Failed to fetch bookings', error);
          }
      };
      fetchBookings();
      
      // Refresh every 60s
      const interval = setInterval(fetchBookings, 60000);
      return () => clearInterval(interval);
  }, []);

  // Fetch shop reviews
  React.useEffect(() => {
      const fetchReviews = async () => {
          try {
              // Get shop ID from current user's shop
              const shopRes = await api.get('/shops/my');
              if (shopRes.data?.id) {
                  const { data } = await api.get(`/reviews/shop/${shopRes.data.id}`);
                  setShopReviews(data.reviews || []);
              }
          } catch (error) {
              console.error('Failed to fetch reviews', error);
          }
      };
      fetchReviews();
  }, []);

  // Handle respond to review
  const handleRespondToReview = async (reviewId: number) => {
      if (!responseText.trim()) return;
      try {
          await api.put(`/reviews/${reviewId}/respond`, { response: responseText });
          // Refresh reviews
          const shopRes = await api.get('/shops/my');
          if (shopRes.data?.id) {
              const { data } = await api.get(`/reviews/shop/${shopRes.data.id}`);
              setShopReviews(data.reviews || []);
          }
          setRespondingReviewId(null);
          setResponseText('');
          showToast('Response posted successfully!');
      } catch (error) {
          console.error('Failed to respond:', error);
          showToast('Failed to post response', 'error');
      }
  };

  // Update booking status
  const handleUpdateBookingStatus = async (bookingId: number, newStatus: string) => {
      // For COMPLETED status, show SweetAlert2 confirmation
      if (newStatus === 'COMPLETED') {
          const result = await Swal.fire({
              ...themeConfig,
              title: 'Complete this service?',
              text: 'This will mark the job as completed. The customer will be notified and can leave a review.',
              icon: 'question',
              showCancelButton: true,
              confirmButtonText: 'Yes, complete it!',
              cancelButtonText: 'Not yet',
          });
          
          if (!result.isConfirmed) {
              return;
          }
      }
      
      // For CANCELLED status - different handling for different booking states
      if (newStatus === 'CANCELLED') {
          // Check current booking status
          const booking = shopBookings.find((b: any) => b.id === bookingId);
          const isPending = booking?.status === 'PENDING';
          
          if (isPending) {
              // Pending bookings can be declined more easily
              const result = await Swal.fire({
                  ...themeConfig,
                  title: 'Decline this request?',
                  text: 'This is a new booking request. The customer will be notified that you are unable to accommodate them.',
                  icon: 'warning',
                  showCancelButton: true,
                  confirmButtonColor: '#ef4444',
                  confirmButtonText: 'Decline Request',
                  cancelButtonText: 'Keep it',
              });
              
              if (!result.isConfirmed) return;
          } else {
              // Confirmed or In-Progress bookings need more care
              const result = await Swal.fire({
                  ...themeConfig,
                  title: 'Cancel confirmed booking?',
                  html: `
                    <p class="mb-4">This customer has already confirmed their booking. Please provide a reason:</p>
                    <textarea id="cancel-reason" class="swal2-textarea" placeholder="Reason for cancellation (e.g., equipment issue, emergency closure)..." style="min-height: 80px;"></textarea>
                    <p class="text-xs text-slate-400 mt-4">💡 Consider messaging the customer first to discuss alternatives or reschedule options.</p>
                  `,
                  icon: 'warning',
                  showCancelButton: true,
                  confirmButtonColor: '#ef4444',
                  confirmButtonText: 'Cancel Booking',
                  cancelButtonText: 'Go Back',
                  showDenyButton: true,
                  denyButtonText: 'Message Customer Instead',
                  denyButtonColor: '#3b82f6',
                  preConfirm: () => {
                      const reason = (document.getElementById('cancel-reason') as HTMLTextAreaElement)?.value;
                      if (!reason || reason.trim().length < 10) {
                          Swal.showValidationMessage('Please provide a reason (at least 10 characters)');
                          return false;
                      }
                      return reason;
                  }
              });
              
              if (result.isDenied) {
                  // User chose to message customer instead
                  setActiveTab('messages');
                  showToast('Opening messages - please contact the customer');
                  return;
              }
              
              if (!result.isConfirmed) return;
              
              // Store reason for the API call (could be sent to backend)
              console.log('Cancellation reason:', result.value);
          }
      }
      
      setUpdatingBookingId(bookingId);
      try {
          await api.put(`/bookings/${bookingId}/status`, { status: newStatus });
          // Refresh bookings
          const { data } = await api.get('/bookings');
          setShopBookings(data);
          
          // Show success message
          if (newStatus === 'COMPLETED') {
              Swal.fire({
                  ...themeConfig,
                  title: 'Job Completed!',
                  text: 'Great work! The customer has been notified.',
                  icon: 'success',
              });
          } else {
              showToast(`Booking ${newStatus.toLowerCase().replace('_', ' ')} successfully!`);
          }
      } catch (error) {
          console.error('Failed to update booking:', error);
          showToast('Failed to update booking', 'error');
      } finally {
          setUpdatingBookingId(null);
      }
  };

  // Show toast notification
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text: message, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Handle actions
  const handleSendQuote = () => {
    showToast(`Quote sent successfully for ${selectedRequest?.vehicleInfo?.make} ${selectedRequest?.vehicleInfo?.model}!`);
    setShowQuoteModal(false);
    setSelectedRequest(null);
  };

  const handleDecline = (request: QuoteRequest) => {
    showToast(`Request declined for ${request.vehicleInfo?.make} ${request.vehicleInfo?.model}`);
  };

  const handleMessage = (request: QuoteRequest) => {
    setSelectedRequest(request);
    setShowMessageModal(true);
  };

  const handleOpenQuoteModal = (request: QuoteRequest) => {
    setSelectedRequest(request);
    setShowQuoteModal(true);
  };

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: TrendingUp },
    { id: 'messages' as const, label: 'Messages', icon: MessageSquare },
    { id: 'quotes' as const, label: 'Quotes', icon: FileText, badge: quoteRequests.length },
    { id: 'bookings' as const, label: 'Bookings', icon: Calendar, badge: shopBookings.filter(b => b.status === 'PENDING').length },
    { id: 'reviews' as const, label: 'Reviews', icon: Star, badge: shopReviews.length },
    { id: 'calendar' as const, label: 'Availability', icon: Clock },
    { id: 'analytics' as const, label: 'Analytics', icon: BarChartIcon },
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
      <div className="tabs tabs-boxed bg-slate-800/50 p-1 w-full overflow-x-auto flex-nowrap justify-start md:w-fit scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab gap-2 h-auto py-2 min-h-[3rem] flex-shrink-0 ${activeTab === tab.id ? 'tab-active bg-primary text-black' : ''}`}
          >
            <tab.icon className="w-4 h-4 flex-shrink-0" />
            <span className="text-xs md:text-sm text-left">{tab.label}</span>
            {(tab.badge || 0) > 0 && (
              <span className="badge badge-error badge-xs flex-shrink-0">{tab.badge}</span>
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
                {shopMetrics.weeklyRevenue > 0 && <span className="text-xs text-green-400">↗ Active</span>}
              </div>
              <p className="text-sm text-slate-400">Weekly Revenue</p>
              <p className="text-2xl font-black">${shopMetrics.weeklyRevenue.toLocaleString()}</p>
            </div>

            <div className="glass-card rounded-2xl p-5 border border-white/5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                {shopMetrics.pendingBookings > 0 && (
                  <span className="badge badge-warning badge-xs">{shopMetrics.pendingBookings} pending</span>
                )}
              </div>
              <p className="text-sm text-slate-400">New Bookings</p>
              <p className="text-2xl font-black">{shopMetrics.newBookings}</p>
            </div>

            <div className="glass-card rounded-2xl p-5 border border-white/5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-400" />
                </div>
                {shopMetrics.avgResponseMinutes < 30 && <span className="text-xs text-blue-400">Fast</span>}
              </div>
              <p className="text-sm text-slate-400">Avg Response</p>
              <p className="text-2xl font-black">{shopMetrics.avgResponseMinutes}m</p>
            </div>

            <div className="glass-card rounded-2xl p-5 border border-white/5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Star className="w-5 h-5 text-purple-400" />
                </div>
                {shopMetrics.reviewCount > 0 && <span className="text-xs text-slate-400">{shopMetrics.reviewCount} reviews</span>}
              </div>
              <p className="text-sm text-slate-400">Rating</p>
              <p className="text-2xl font-black">{shopMetrics.rating.toFixed(1)} ★</p>
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
                {shopBookings.slice(0, 4).map((booking: any) => (
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
          {quoteRequests.length > 0 ? (
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
                {quoteRequests.slice(0, 3).map(request => (
                  <div key={request.id} className="bg-slate-800 rounded-xl p-4 min-w-[280px] flex-shrink-0">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-bold">{request.vehicle?.make} {request.vehicle?.model}</p>
                      <span className="badge badge-warning badge-xs">{request.status}</span>
                    </div>
                    <p className="text-sm text-slate-400 line-clamp-2 mb-3">{request.description}</p>
                    <div className="flex gap-2">
                      <button onClick={() => { setActiveTab('quotes'); }} className="btn btn-xs btn-ghost gap-1"><Eye className="w-3 h-3" /> View</button>
                      <button onClick={() => { setActiveTab('quotes'); }} className="btn btn-xs btn-primary gap-1"><Send className="w-3 h-3" /> Quote</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
             <div className="glass-card rounded-2xl p-6 border border-white/5 opacity-70 border-dashed">
                <div className="flex items-center justify-center flex-col text-center py-4">
                     <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-3">
                         <FileText className="w-6 h-6 text-slate-500" />
                     </div>
                     <p className="font-bold text-slate-400">No New Requests</p>
                     <p className="text-xs text-slate-500">You're all caught up!</p>
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
        <ShopQuoteRequestsView />
      )}

      {/* Bookings Tab */}
      {activeTab === 'bookings' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg">Manage Bookings</h3>
            <div className="flex gap-2">
              <span className="badge badge-warning gap-1">
                {shopBookings.filter(b => b.status === 'PENDING').length} Pending
              </span>
              <span className="badge badge-info gap-1">
                {shopBookings.filter(b => b.status === 'CONFIRMED').length} Confirmed
              </span>
              <span className="badge badge-primary gap-1">
                {shopBookings.filter(b => b.status === 'IN_PROGRESS').length} In Progress
              </span>
            </div>
          </div>

          {shopBookings.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-white/5 rounded-3xl bg-slate-900/50">
              <Calendar className="w-16 h-16 text-slate-600 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold text-slate-300">No bookings yet</h3>
              <p className="text-slate-500">Incoming bookings will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {shopBookings.map((booking: any) => (
                <div key={booking.id} className="glass-card rounded-2xl p-5 border border-white/5 hover:border-primary/30 transition-all">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Customer & Vehicle Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`badge ${
                          booking.status === 'PENDING' ? 'badge-warning' :
                          booking.status === 'CONFIRMED' ? 'badge-info' :
                          booking.status === 'IN_PROGRESS' ? 'badge-primary' :
                          booking.status === 'COMPLETED' ? 'badge-success' : 'badge-ghost'
                        }`}>
                          {booking.status}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(booking.scheduledDate).toLocaleDateString()} @ {(() => {
                            // FIX: Project UTC time onto today to avoid 1970 timezone issues
                            const raw = new Date(booking.scheduledTime);
                            const projected = new Date();
                            projected.setUTCHours(raw.getUTCHours(), raw.getUTCMinutes(), 0, 0);
                            return projected.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                          })()}
                        </span>
                      </div>
                      {/* Customer Name */}
                      {booking.user && (
                        <p className="text-sm text-primary font-medium mb-1">
                          <Users className="w-3 h-3 inline mr-1" />
                          {booking.user.name}
                        </p>
                      )}
                      <h4 className="font-bold">
                        {booking.vehicle?.year} {booking.vehicle?.make} {booking.vehicle?.model}
                      </h4>
                      <p className="text-sm text-slate-400">
                        {booking.vehicle?.licensePlate && `Plate: ${booking.vehicle.licensePlate}`}
                      </p>
                      {booking.notes && (
                        <p className="text-sm text-slate-500 mt-1">Notes: {booking.notes}</p>
                      )}
                    </div>

                    {/* Status Selector & Actions */}
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Status Dropdown */}
                      {booking.status !== 'COMPLETED' && booking.status !== 'CANCELLED' && (
                        <select
                          className="select select-bordered select-sm bg-slate-800 border-white/10 min-w-[140px]"
                          value={booking.status}
                          disabled={updatingBookingId === booking.id}
                          onChange={(e) => handleUpdateBookingStatus(booking.id, e.target.value)}
                        >
                          <option value="PENDING">⏳ Pending</option>
                          <option value="CONFIRMED">✅ Confirmed</option>
                          <option value="IN_PROGRESS">🔧 In Progress</option>
                          <option value="COMPLETED">✔️ Completed</option>
                          <option value="CANCELLED">❌ Cancelled</option>
                        </select>
                      )}
                      
                      {/* Quick Action Buttons */}
                      {booking.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleUpdateBookingStatus(booking.id, 'CONFIRMED')}
                            disabled={updatingBookingId === booking.id}
                            className="btn btn-success btn-sm gap-1"
                          >
                            {updatingBookingId === booking.id ? (
                              <span className="loading loading-spinner loading-xs" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                            Confirm
                          </button>
                          <button
                            onClick={() => handleUpdateBookingStatus(booking.id, 'CANCELLED')}
                            disabled={updatingBookingId === booking.id}
                            className="btn btn-ghost btn-sm text-error"
                          >
                            <XCircle className="w-4 h-4" /> Decline
                          </button>
                        </>
                      )}
                      {booking.status === 'CONFIRMED' && (
                        <button
                          onClick={() => handleUpdateBookingStatus(booking.id, 'IN_PROGRESS')}
                          disabled={updatingBookingId === booking.id}
                          className="btn btn-primary btn-sm gap-1"
                        >
                          {updatingBookingId === booking.id ? (
                            <span className="loading loading-spinner loading-xs" />
                          ) : (
                            <Wrench className="w-4 h-4" />
                          )}
                          Start Job
                        </button>
                      )}
                      {booking.status === 'IN_PROGRESS' && (
                        <button
                          onClick={() => handleUpdateBookingStatus(booking.id, 'COMPLETED')}
                          disabled={updatingBookingId === booking.id}
                          className="btn btn-success btn-sm gap-1"
                        >
                          {updatingBookingId === booking.id ? (
                            <span className="loading loading-spinner loading-xs" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                          Complete
                        </button>
                      )}
                      
                      {/* Completed/Cancelled Badge */}
                      {booking.status === 'COMPLETED' && (
                        <span className="badge badge-success gap-1">
                          <CheckCircle className="w-3 h-3" /> Completed
                        </span>
                      )}
                      {booking.status === 'CANCELLED' && (
                        <span className="badge badge-error gap-1">
                          <XCircle className="w-3 h-3" /> Cancelled
                        </span>
                      )}
                      
                      {/* Message Button */}
                      {booking.userId && (
                        <button 
                          onClick={() => window.location.href = `/messages?userId=${booking.userId}`}
                          className="btn btn-ghost btn-sm"
                        >
                          <MessageSquare className="w-4 h-4" /> Message
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reviews Tab */}
      {activeTab === 'reviews' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg">Customer Reviews</h3>
            <div className="flex gap-2">
              <span className="badge badge-primary gap-1">
                {shopReviews.length} Total
              </span>
            </div>
          </div>

          {shopReviews.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-white/5 rounded-3xl bg-slate-900/50">
              <Star className="w-16 h-16 text-slate-600 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold text-slate-300">No reviews yet</h3>
              <p className="text-slate-500">Customer reviews will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {shopReviews.map((review: any) => {
                const authorName = review.user?.name || 'Anonymous';
                const authorAvatar = review.user?.avatarUrl;
                const reviewImages = Array.isArray(review.images) ? review.images : [];
                const serviceName = review.booking?.service?.name;

                return (
                  <div key={review.id} className="glass-card rounded-2xl p-5 border border-white/5">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="avatar placeholder">
                          {authorAvatar ? (
                            <div className="w-12 rounded-xl overflow-hidden">
                              <img src={authorAvatar.startsWith('http') ? authorAvatar : `http://localhost:5000${authorAvatar}`} alt={authorName} />
                            </div>
                          ) : (
                            <div className="bg-slate-800 text-primary border border-white/10 rounded-xl w-12 font-black">
                              <span>{authorName.charAt(0)}</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-bold">{authorName}</div>
                          <div className="text-xs text-slate-500">{new Date(review.createdAt).toLocaleDateString()}</div>
                          {serviceName && (
                            <div className="badge badge-ghost badge-xs mt-1">{serviceName}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex text-primary">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-slate-700'}`} />
                        ))}
                      </div>
                    </div>
                    
                    {review.comment && (
                      <p className="text-slate-300 mb-4">"{review.comment}"</p>
                    )}
                    
                    {/* Review Images */}
                    {reviewImages.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {reviewImages.map((img: string, idx: number) => (
                          <img 
                            key={idx}
                            src={img.startsWith('http') ? img : `http://localhost:5000${img}`}
                            alt={`Review photo ${idx + 1}`}
                            className="w-20 h-20 object-cover rounded-lg border border-white/10"
                          />
                        ))}
                      </div>
                    )}

                    {/* Shop Response */}
                    {review.shopResponse ? (
                      <div className="ml-6 pl-4 border-l-2 border-primary/50 mt-4">
                        <p className="text-xs text-primary font-bold mb-1">Your Response</p>
                        <p className="text-sm text-slate-400">{review.shopResponse}</p>
                      </div>
                    ) : (
                      <div className="mt-4">
                        {respondingReviewId === review.id ? (
                          <div className="space-y-2">
                            <textarea
                              className="textarea textarea-bordered bg-slate-800 border-white/10 w-full h-20 resize-none"
                              placeholder="Write your response..."
                              value={responseText}
                              onChange={(e) => setResponseText(e.target.value)}
                            />
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleRespondToReview(review.id)}
                                className="btn btn-primary btn-sm"
                                disabled={!responseText.trim()}
                              >
                                Post Response
                              </button>
                              <button 
                                onClick={() => { setRespondingReviewId(null); setResponseText(''); }}
                                className="btn btn-ghost btn-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setRespondingReviewId(review.id)}
                            className="btn btn-ghost btn-sm gap-1"
                          >
                            <MessageSquare className="w-4 h-4" /> Respond
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Calendar Tab */}
      {activeTab === 'calendar' && (
        <div className="space-y-6">
          {/* Week Navigation */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => {
                  const newStart = new Date(weekStart);
                  newStart.setDate(newStart.getDate() - 7);
                  setWeekStart(newStart);
                }}
                className="btn btn-ghost btn-sm"
              >
                ← Prev Week
              </button>
              <h3 className="font-bold text-lg">
                {weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(weekStart.getTime() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </h3>
              <button 
                onClick={() => {
                  const newStart = new Date(weekStart);
                  newStart.setDate(newStart.getDate() + 7);
                  setWeekStart(newStart);
                }}
                className="btn btn-ghost btn-sm"
              >
                Next Week →
              </button>
            </div>
            <button 
              onClick={() => setShowEditScheduleModal(true)}
              className="btn btn-primary btn-sm gap-2"
            >
              <Calendar className="w-4 h-4" /> Add Slots
            </button>
          </div>

          {/* Interactive Calendar Grid */}
          <div className="glass-card rounded-2xl p-6 border border-white/5 overflow-x-auto">
            {loadingSlots ? (
              <div className="flex justify-center py-10"><span className="loading loading-spinner text-primary"></span></div>
            ) : (
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Time</th>
                    {[0, 1, 2, 3, 4, 5].map(offset => {
                      const day = new Date(weekStart);
                      day.setDate(day.getDate() + offset);
                      return (
                        <th key={offset} className="text-center">
                          <div>{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][offset]}</div>
                          <div className="text-xs text-slate-500">{day.getDate()}</div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map(time => {
                    const hour = parseInt(time.split(':')[0]);
                    const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
                    const period = hour >= 12 ? 'PM' : 'AM';
                    const formattedTime = `${displayHour}:00 ${period}`;
                    return (
                    <tr key={time}>
                      <td className="font-medium">{formattedTime}</td>
                      {[0, 1, 2, 3, 4, 5].map(offset => {
                        const day = new Date(weekStart);
                        day.setDate(day.getDate() + offset);
                        const dateStr = formatLocalDate(day);
                        
                        // Find slot for this day/time
                        // FIX: Project UTC time onto current date to avoid historical timezone offsets (1970 was +7.5)
                        const slot = timeSlots.find(s => {
                          const sDate = new Date(s.date);
                          const sTimeRaw = new Date(s.startTime);
                          
                          // Project to TODAY to use modern timezone (UTC+8)
                          const sTime = new Date();
                          sTime.setUTCHours(sTimeRaw.getUTCHours(), sTimeRaw.getUTCMinutes(), 0, 0);
                          
                          // Match Date (Local)
                          const isDateMatch = 
                            sDate.getDate() === day.getDate() &&
                            sDate.getMonth() === day.getMonth() &&
                            sDate.getFullYear() === day.getFullYear();

                          // Match Time (Local - now correctly using modern offset)
                          const h = sTime.getHours().toString().padStart(2, '0');
                          const m = sTime.getMinutes().toString().padStart(2, '0');
                          const isTimeMatch = `${h}:${m}` === time;
                          
                          return isDateMatch && isTimeMatch;
                        });

                        return (
                          <td key={offset} className="text-center p-1">
                            {slot ? (
                              slot.isBooked ? (
                                <div className="dropdown dropdown-hover">
                                  <div tabIndex={0} role="button" className={`badge badge-sm cursor-pointer hover:brightness-110 transition-all ${
                                    slot.booking?.status === 'PENDING' ? 'badge-warning text-black' : 
                                    slot.booking?.status === 'CONFIRMED' ? 'badge-info text-white' : 
                                    slot.booking?.status === 'COMPLETED' ? 'badge-success text-white' : 'badge-primary'
                                  }`}>
                                    {slot.booking?.status === 'PENDING' ? 'Pending' : 'Booked'}
                                  </div>
                                  <ul tabIndex={0} className="dropdown-content z-20 menu p-2 shadow-xl bg-slate-800 rounded-xl w-64 border border-white/10">
                                    <li className="menu-title text-xs flex items-center gap-2">
                                      <span className={`w-2 h-2 rounded-full animate-pulse ${
                                        slot.booking?.status === 'PENDING' ? 'bg-orange-400' : 'bg-blue-400'
                                      }`}></span>
                                      <span>{slot.booking?.user?.name || 'Customer'}</span>
                                    </li>
                                    <li className="text-xs text-slate-400 px-4 pb-2">
                                      {slot.booking?.vehicle?.make} {slot.booking?.vehicle?.model}
                                      {slot.booking?.vehicle?.year && ` (${slot.booking.vehicle.year})`}
                                    </li>
                                    <div className="divider my-1 px-2"></div>
                                    <li>
                                      <button 
                                        onClick={() => {
                                          // Navigate to messages with this customer
                                          setActiveTab('messages');
                                          showToast('Opening chat with customer...');
                                        }}
                                        className="flex items-center gap-2"
                                      >
                                        <MessageSquare className="w-4 h-4" />
                                        Message Customer
                                      </button>
                                    </li>
                                    <li>
                                      <button 
                                        onClick={() => {
                                          if (!slot.booking) return;
                                          setSelectedBookingForReschedule({
                                            ...slot.booking,
                                            scheduledDate: slot.date,
                                            scheduledTime: slot.startTime
                                          });
                                          setShowRescheduleModal(true);
                                        }}
                                        className="flex items-center gap-2"
                                      >
                                        <Calendar className="w-4 h-4" />
                                        Propose Reschedule
                                      </button>
                                    </li>
                                    <div className="divider my-1 px-2"></div>
                                    <li className="text-[10px] text-slate-500 px-4 py-1">
                                      💡 To cancel, please message the customer first to discuss alternatives.
                                    </li>
                                  </ul>
                                </div>
                              ) : (
                                <div className="dropdown dropdown-hover">
                                  <div tabIndex={0} role="button" className="badge badge-success badge-sm cursor-pointer hover:badge-error transition-colors">
                                    {deletingSlotId === slot.id ? <span className="loading loading-spinner loading-xs" /> : 'Available'}
                                  </div>
                                  <ul tabIndex={0} className="dropdown-content z-20 menu p-2 shadow-xl bg-slate-800 rounded-xl w-44 border border-white/10">
                                    <li>
                                      <button 
                                        onClick={async () => {
                                          if (deletingSlotId) return;
                                          setDeletingSlotId(slot.id);
                                          try {
                                            await api.delete(`/shops/availability/${slot.id}`);
                                            // Refresh slots
                                            const startDate = formatLocalDate(weekStart);
                                            const { data } = await api.get(`/shops/${shopId}/availability/week?startDate=${startDate}`);
                                            setTimeSlots(data);
                                            showToast('Slot removed');
                                          } catch (error) {
                                            console.error('Failed to delete slot', error);
                                            showToast('Failed to remove slot', 'error');
                                          } finally {
                                            setDeletingSlotId(null);
                                          }
                                        }}
                                        className="text-error hover:bg-error/20"
                                      >
                                        Remove Slot
                                      </button>
                                    </li>
                                  </ul>
                                </div>
                              )
                            ) : (
                              <button 
                                onClick={async () => {
                                  if (creatingSlot) return;
                                  setCreatingSlot(true);
                                  try {
                                    const endHour = (parseInt(time.split(':')[0]) + 1).toString().padStart(2, '0');
                                    await api.post('/shops/availability', {
                                      slots: [{ date: dateStr, startTime: time, endTime: `${endHour}:00` }]
                                    });
                                    // Refresh slots
                                    const startDate = formatLocalDate(weekStart);
                                    const { data } = await api.get(`/shops/${shopId}/availability/week?startDate=${startDate}`);
                                    setTimeSlots(data);
                                    showToast('Slot created!');
                                  } catch (error) {
                                    console.error('Failed to create slot', error);
                                    showToast('Failed to create slot', 'error');
                                  } finally {
                                    setCreatingSlot(false);
                                  }
                                }}
                                className="btn btn-ghost btn-xs opacity-50 hover:opacity-100"
                                disabled={creatingSlot}
                              >
                                +
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass-card rounded-2xl p-5 border border-white/5">
              <h4 className="font-bold mb-3">Today's Schedule</h4>
              <div className="space-y-2">
                {timeSlots.filter(s => {
                  const today = formatLocalDate(new Date());
                  const slotDate = formatLocalDate(new Date(s.date));
                  return slotDate === today && s.isBooked;
                }).length === 0 ? (
                  <p className="text-slate-500 text-sm">No bookings today</p>
                ) : (
                  timeSlots.filter(s => {
                    const today = formatLocalDate(new Date());
                    const slotDate = formatLocalDate(new Date(s.date));
                    return slotDate === today && s.isBooked;
                  }).map(slot => (
                    <div key={slot.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                      <div>
                        <p className="font-medium">{new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        <p className="text-xs text-slate-400">{slot.booking?.vehicle?.make} {slot.booking?.vehicle?.model}</p>
                      </div>
                      <span className="badge badge-primary badge-sm">Booked</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="glass-card rounded-2xl p-5 border border-white/5">
              <h4 className="font-bold mb-3">Quick Stats</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Available Slots This Week</span>
                  <span className="font-bold">{timeSlots.filter(s => !s.isBooked).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Booked Slots</span>
                  <span className="font-bold text-primary">{timeSlots.filter(s => s.isBooked).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Utilization Rate</span>
                  <span className="font-bold text-green-400">
                    {timeSlots.length > 0 ? Math.round((timeSlots.filter(s => s.isBooked).length / timeSlots.length) * 100) : 0}%
                  </span>
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
                  <LineChart data={shopMetrics.charts?.monthly?.length ? shopMetrics.charts.monthly : monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
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
                      data={shopMetrics.charts?.services?.length ? shopMetrics.charts.services : serviceBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {(shopMetrics.charts?.services?.length ? shopMetrics.charts.services : serviceBreakdown).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color || ['#facc15', '#3b82f6', '#10b981', '#8b5cf6', '#6b7280'][index % 5]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {(shopMetrics.charts?.services?.length ? shopMetrics.charts.services : serviceBreakdown).map((item: any, index: number) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color || ['#facc15', '#3b82f6', '#10b981', '#8b5cf6', '#6b7280'][index % 5] }}></div>
                    <span className="text-xs text-slate-400">{item.name} ({item.value}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-card rounded-2xl p-5 border border-white/5 text-center">
              <p className="text-3xl font-black text-green-400">{shopMetrics.rating || '-'}</p>
              <p className="text-sm text-slate-400">Shop Rating</p>
            </div>
            <div className="glass-card rounded-2xl p-5 border border-white/5 text-center">
              <p className="text-3xl font-black">${shopMetrics.weeklyRevenue?.toLocaleString() || '0'}</p>
              <p className="text-sm text-slate-400">Weekly Revenue</p>
            </div>
            <div className="glass-card rounded-2xl p-5 border border-white/5 text-center">
              <p className="text-3xl font-black text-primary">{shopMetrics.newBookings || '0'}</p>
              <p className="text-sm text-slate-400">New Bookings</p>
            </div>
            <div className="glass-card rounded-2xl p-5 border border-white/5 text-center">
              <p className="text-3xl font-black">{shopMetrics.reviewCount || '0'}</p>
              <p className="text-sm text-slate-400">Total Reviews</p>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast toast-end toast-bottom z-50">
          <div className={`alert ${toastMessage.type === 'error' ? 'alert-error' : 'alert-success'}`}>
            {toastMessage.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
            <span>{toastMessage.text}</span>
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
                {shopBookings.map((booking: any) => (
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
      {/* Reschedule Modal - SLOT-BASED */}
      {showRescheduleModal && selectedBookingForReschedule && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-white/10">
            <h2 className="text-2xl font-bold mb-4">Propose Reschedule</h2>
            <div className="bg-slate-800/50 p-4 rounded-xl mb-4">
              <p className="text-sm text-slate-400">Current Booking:</p>
              <p className="font-bold">
                {new Date(selectedBookingForReschedule.scheduledDate).toLocaleDateString()} @ {(() => {
                    const raw = new Date(selectedBookingForReschedule.scheduledTime);
                    const projected = new Date();
                    projected.setUTCHours(raw.getUTCHours(), raw.getUTCMinutes(), 0, 0);
                    return projected.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                })()}
              </p>
              <p className="text-xs text-slate-500">{selectedBookingForReschedule.vehicle?.make} {selectedBookingForReschedule.vehicle?.model}</p>
            </div>
            
            <div className="space-y-4">
              {/* Date Selection */}
              <div className="form-control">
                <label className="label"><span className="label-text">Select Available Date</span></label>
                <input 
                  type="date" 
                  className="input input-bordered bg-slate-800 border-white/10" 
                  value={rescheduleDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={async (e) => {
                    const date = e.target.value;
                    setRescheduleDate(date);
                    setSelectedRescheduleSlotId('');
                    
                    if (!date || !shopId) return;
                    
                    // Fetch available slots for this date
                    setLoadingRescheduleSlots(true);
                    try {
                      const { data } = await api.get(`/shops/${shopId}/availability?date=${date}`);
                      // Only show unbooked slots
                      const available = data.filter((s: any) => !s.isBooked);
                      setRescheduleSlots(available);
                    } catch (error) {
                      console.error('Failed to fetch slots', error);
                      setRescheduleSlots([]);
                      showToast('Failed to load available slots', 'error');
                    } finally {
                      setLoadingRescheduleSlots(false);
                    }
                  }}
                />
              </div>

              {/* Time Slot Selection */}
              {rescheduleDate && (
                <div className="form-control">
                  <label className="label"><span className="label-text">Select Available Time Slot</span></label>
                  <div className={`grid grid-cols-3 gap-2 ${loadingRescheduleSlots ? 'opacity-50 pointer-events-none' : ''}`}>
                    {loadingRescheduleSlots ? (
                      <div className="col-span-full text-center py-4">
                        <span className="loading loading-dots loading-md text-primary" />
                      </div>
                    ) : rescheduleSlots.length > 0 ? (
                      rescheduleSlots.map(slot => {
                        const slotDate = new Date(slot.startTime);
                        const time = new Date();
                        time.setUTCHours(slotDate.getUTCHours(), slotDate.getUTCMinutes(), 0, 0);
                        const timeStr = time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
                        const isSelected = selectedRescheduleSlotId === slot.id.toString();
                        
                        return (
                          <button
                            key={slot.id}
                            onClick={() => setSelectedRescheduleSlotId(slot.id.toString())}
                            className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-ghost bg-slate-800 border-white/10'}`}
                          >
                            <Clock className="w-3 h-3" /> {timeStr}
                          </button>
                        );
                      })
                    ) : (
                      <div className="col-span-full text-center py-6 border border-dashed border-white/10 rounded-xl bg-slate-800/30">
                        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-warning opacity-50" />
                        <p className="text-sm text-slate-400">No available slots for this date</p>
                        <p className="text-xs text-slate-500 mt-1">Please add slots to your calendar first</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Reason/Message */}
              <div className="form-control">
                <label className="label"><span className="label-text">Message to Customer</span></label>
                <textarea 
                  className="textarea textarea-bordered bg-slate-800 border-white/10 h-24" 
                  placeholder="e.g. Sorry, we are double booked. Would this time work for you?"
                  id="reschedule-reason"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => { 
                  setShowRescheduleModal(false); 
                  setSelectedBookingForReschedule(null);
                  setRescheduleDate('');
                  setRescheduleSlots([]);
                  setSelectedRescheduleSlotId('');
                }} 
                className="btn btn-ghost flex-1"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                   if (!rescheduleDate || !selectedRescheduleSlotId) {
                     showToast('Please select date and time slot', 'error');
                     return;
                   }
                   
                   const selectedSlot = rescheduleSlots.find(s => s.id.toString() === selectedRescheduleSlotId);
                   if (!selectedSlot) {
                     showToast('Invalid slot selection', 'error');
                     return;
                   }
                   
                   // Format time from slot
                   const slotDate = new Date(selectedSlot.startTime);
                   const time = new Date();
                   time.setUTCHours(slotDate.getUTCHours(), slotDate.getUTCMinutes(), 0, 0);
                   const timeString = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
                   
                   const reason = (document.getElementById('reschedule-reason') as HTMLTextAreaElement)?.value || '';
                   
                   // Logic to send message / persist proposal
                   const proposalText = `\n\n[RESCHEDULE PROPOSED]\nNew Date: ${rescheduleDate}\nNew Time: ${timeString}\nMessage: ${reason}`;
                   const updatedNotes = (selectedBookingForReschedule.notes || '') + proposalText;

                   try {
                     // Update booking notes with reschedule proposal
                     await api.put(`/bookings/${selectedBookingForReschedule.id}/status`, {
                        status: selectedBookingForReschedule.status, // Keep status same
                        notes: updatedNotes
                     });
                     showToast('Reschedule proposal sent to customer!');
                   } catch (err) {
                     console.error('Failed to propose reschedule', err);
                     showToast('Failed to send proposal', 'error');
                   }
                   
                   setShowRescheduleModal(false); 
                   setSelectedBookingForReschedule(null);
                   setRescheduleDate('');
                   setRescheduleSlots([]);
                   setSelectedRescheduleSlotId('');
                }} 
                disabled={!rescheduleDate || !selectedRescheduleSlotId}
                className="btn btn-primary flex-1 gap-2"
              >
                <Send className="w-4 h-4" /> Send Proposal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
