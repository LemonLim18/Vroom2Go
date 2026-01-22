import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Calendar,
  Clock,
  MapPin,
  Car,
  CheckCircle,
  AlertCircle,
  XCircle,
  MessageCircle,
  ChevronRight,
  Wrench,
  Loader2,
  Phone,
  X,
  FileText,
  DollarSign,
  Star,
  Camera,
  ImageIcon
} from 'lucide-react';
import { showAlert } from '../utils/alerts';

type BookingTab = 'upcoming' | 'inProgress' | 'completed';

interface Booking {
  id: number;
  scheduledDate: string;
  scheduledTime: string;
  status: string;
  method: string;
  notes?: string;
  userId?: number;
  shopId?: number;
  shop: {
    name: string;
    address: string;
    imageUrl?: string;
    phone?: string;
    userId?: number;
  };
  vehicle: {
    make: string;
    model: string;
    year: number;
    licensePlate?: string;
  };
  service?: {
    name: string;
  };
  quote?: {
    totalEstimate: number;
  };
}

interface MyBookingsViewProps {
  onNavigate?: (view: string, data?: any) => void;
}

export const MyBookingsView: React.FC<MyBookingsViewProps> = ({ onNavigate }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<BookingTab>('upcoming');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Review state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewImages, setReviewImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewedBookings, setReviewedBookings] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/bookings');
      
      // Merge with locally saved mock bookings (for demo purposes)
      const localMocks = JSON.parse(localStorage.getItem('vroom_mock_bookings') || '[]');
      // Combine and sort by date descending
      const allBookings = [...localMocks, ...data].sort((a: any, b: any) => 
        new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime()
      );

      setBookings(allBookings);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filter bookings by status
  const upcomingBookings = bookings.filter(b => 
    b.status === 'PENDING' || b.status === 'CONFIRMED'
  );
  const inProgressBookings = bookings.filter(b => b.status === 'IN_PROGRESS');
  const completedBookings = bookings.filter(b => 
    b.status === 'COMPLETED' || b.status === 'CANCELLED'
  );

  const getFilteredBookings = () => {
    switch (activeTab) {
      case 'upcoming': return upcomingBookings;
      case 'inProgress': return inProgressBookings;
      case 'completed': return completedBookings;
      default: return [];
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="badge badge-warning gap-1"><Clock className="w-3 h-3" /> Pending</span>;
      case 'CONFIRMED':
        return <span className="badge badge-info gap-1"><CheckCircle className="w-3 h-3" /> Confirmed</span>;
      case 'IN_PROGRESS':
        return <span className="badge badge-primary gap-1"><Wrench className="w-3 h-3" /> In Progress</span>;
      case 'COMPLETED':
        return <span className="badge badge-success gap-1"><CheckCircle className="w-3 h-3" /> Completed</span>;
      case 'CANCELLED':
        return <span className="badge badge-error gap-1"><XCircle className="w-3 h-3" /> Cancelled</span>;
      default:
        return <span className="badge badge-ghost">{status}</span>;
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    const confirmed = await showAlert.confirm('Are you sure you want to cancel this booking?');
    if (!confirmed) return;
    
    setCancellingId(bookingId);
    try {
      await api.put(`/bookings/${bookingId}/status`, { status: 'CANCELLED' });
      showAlert.success('Booking cancelled successfully');
      fetchBookings();
      setSelectedBooking(null);
    } catch (error) {
      console.error('Failed to cancel booking:', error);
      showAlert.error('Failed to cancel booking');
    } finally {
      setCancellingId(null);
    }
  };

  const handleMessageShop = (booking: Booking) => {
    // Navigate to messages with the shop's user ID
    if (booking.shop?.userId) {
      onNavigate?.('messages', { targetUserId: booking.shop.userId });
    } else {
      onNavigate?.('messages');
    }
  };

  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking);
  };

  const handleOpenReview = (booking: Booking) => {
    setReviewBooking(booking);
    setReviewRating(5);
    setReviewComment('');
    setReviewImages([]);
    setShowReviewModal(true);
    setSelectedBooking(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploadingImage(true);
    try {
      for (const file of Array.from(files)) {
        if (reviewImages.length >= 5) break; // Max 5 images
        
        const formData = new FormData();
        formData.append('image', file);
        
        const { data } = await api.post('/upload/image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        // Prepend API base URL for image display
        const fullUrl = data.url.startsWith('http') ? data.url : `http://localhost:5000${data.url}`;
        setReviewImages(prev => [...prev, fullUrl]);
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
      showAlert.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeReviewImage = (index: number) => {
    setReviewImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitReview = async () => {
    if (!reviewBooking) return;
    
    setSubmittingReview(true);
    try {
      await api.post('/reviews', {
        bookingId: reviewBooking.id,
        shopId: reviewBooking.shopId,
        rating: reviewRating,
        comment: reviewComment,
        images: reviewImages
      });
      
      setReviewedBookings(prev => new Set([...prev, reviewBooking.id]));
      showAlert.success('Review submitted successfully!');
      setShowReviewModal(false);
      setReviewBooking(null);
      setReviewImages([]);
    } catch (error: any) {
      console.error('Failed to submit review:', error);
      showAlert.error(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const TabButton = ({ id, label, count }: { id: BookingTab; label: string; count: number }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all font-bold ${
        activeTab === id
          ? 'bg-primary text-black shadow-[0_0_20px_rgba(250,204,21,0.3)]'
          : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      {label}
      {count > 0 && (
        <span className={`badge badge-sm border-none ${
          activeTab === id ? 'bg-black/20 text-black' : 'bg-slate-700 text-slate-300'
        }`}>
          {count}
        </span>
      )}
    </button>
  );

  const filteredBookings = getFilteredBookings();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase italic tracking-tighter">
            My <span className="text-primary">Bookings</span>
          </h1>
          <p className="text-slate-400">Track your scheduled and past services</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        <TabButton id="upcoming" label="Upcoming" count={upcomingBookings.length} />
        <TabButton id="inProgress" label="In Progress" count={inProgressBookings.length} />
        <TabButton id="completed" label="Completed" count={completedBookings.length} />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center p-20">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-white/5 rounded-3xl bg-slate-900/50">
          <Calendar className="w-16 h-16 text-slate-600 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold text-slate-300">
            {activeTab === 'upcoming' && 'No upcoming bookings'}
            {activeTab === 'inProgress' && 'No jobs in progress'}
            {activeTab === 'completed' && 'No completed bookings yet'}
          </h3>
          <p className="text-slate-500 mt-2">
            {activeTab === 'upcoming' && 'Book a service to get started'}
          </p>
          {activeTab === 'upcoming' && (
            <button onClick={() => onNavigate?.('home')} className="btn btn-primary mt-4">
              Find Shops
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map(booking => (
            <div
              key={booking.id}
              className="glass-card rounded-2xl p-6 border border-white/5 hover:border-primary/30 transition-all cursor-pointer"
              onClick={() => handleViewDetails(booking)}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Shop & Service Info */}
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-xl bg-slate-800 flex items-center justify-center overflow-hidden">
                    {booking.shop.imageUrl ? (
                      <img src={booking.shop.imageUrl} alt={booking.shop.name} className="w-full h-full object-cover" />
                    ) : (
                      <Wrench className="w-8 h-8 text-slate-500" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{booking.shop.name}</h3>
                    <p className="text-sm text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {booking.shop.address}
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {getStatusBadge(booking.status)}
                      {booking.service && (
                        <span className="badge badge-outline badge-sm truncate max-w-[150px]" title={booking.service.name}>{booking.service.name}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Vehicle & Date */}
                <div className="flex flex-col md:items-end gap-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Car className="w-4 h-4 text-primary" />
                    <span className="font-medium">
                      {booking.vehicle.year} {booking.vehicle.make} {booking.vehicle.model}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(booking.scheduledDate).toLocaleDateString()}</span>
                    <Clock className="w-4 h-4 ml-2" />
                    <span>{new Date(booking.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button 
                    onClick={() => handleMessageShop(booking)}
                    className="btn btn-ghost btn-sm gap-1"
                  >
                    <MessageCircle className="w-4 h-4" /> Message
                  </button>
                  {(booking.status === 'PENDING') && (
                    <button
                      onClick={() => handleCancelBooking(booking.id)}
                      disabled={cancellingId === booking.id}
                      className="btn btn-ghost btn-sm text-error gap-1"
                    >
                      {cancellingId === booking.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      Cancel
                    </button>
                  )}
                  {booking.status === 'COMPLETED' && !reviewedBookings.has(booking.id) && (
                    <button
                      onClick={() => handleOpenReview(booking)}
                      className="btn btn-primary btn-sm gap-1"
                    >
                      <Star className="w-4 h-4" /> Leave Review
                    </button>
                  )}
                  {booking.status === 'COMPLETED' && reviewedBookings.has(booking.id) && (
                    <span className="badge badge-success gap-1">
                      <CheckCircle className="w-3 h-3" /> Reviewed
                    </span>
                  )}
                  <button className="btn btn-ghost btn-sm">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Notes if any */}
              {booking.notes && (
                <div className="mt-4 pt-4 border-t border-white/5 text-sm text-slate-400">
                  <span className="font-medium text-slate-300">Notes:</span> {booking.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedBooking(null)}>
          <div className="bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-white/10 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Booking Details</h2>
              <button onClick={() => setSelectedBooking(null)} className="btn btn-ghost btn-sm btn-circle">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status */}
            <div className="flex justify-center mb-6">
              {getStatusBadge(selectedBooking.status)}
            </div>

            {/* Shop Info */}
            <div className="glass-card rounded-xl p-4 mb-4 border border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-slate-800 flex items-center justify-center overflow-hidden">
                  {selectedBooking.shop.imageUrl ? (
                    <img src={selectedBooking.shop.imageUrl} alt={selectedBooking.shop.name} className="w-full h-full object-cover" />
                  ) : (
                    <Wrench className="w-7 h-7 text-slate-500" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{selectedBooking.shop.name}</h3>
                  <p className="text-sm text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {selectedBooking.shop.address}
                  </p>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-card rounded-xl p-4 border border-white/5">
                  <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                    <Calendar className="w-3 h-3" /> Date
                  </div>
                  <p className="font-bold">{new Date(selectedBooking.scheduledDate).toLocaleDateString()}</p>
                </div>
                <div className="glass-card rounded-xl p-4 border border-white/5">
                  <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                    <Clock className="w-3 h-3" /> Time
                  </div>
                  <p className="font-bold">{new Date(selectedBooking.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>

              <div className="glass-card rounded-xl p-4 border border-white/5">
                <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                  <Car className="w-3 h-3" /> Vehicle
                </div>
                <p className="font-bold">{selectedBooking.vehicle.year} {selectedBooking.vehicle.make} {selectedBooking.vehicle.model}</p>
                {selectedBooking.vehicle.licensePlate && (
                  <p className="text-sm text-slate-400">Plate: {selectedBooking.vehicle.licensePlate}</p>
                )}
              </div>

              {selectedBooking.service && (
                <div className="glass-card rounded-xl p-4 border border-white/5">
                  <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                    <FileText className="w-3 h-3" /> Service
                  </div>
                  <p className="font-bold">{selectedBooking.service.name}</p>
                </div>
              )}

              {selectedBooking.quote && (
                <div className="glass-card rounded-xl p-4 border border-primary/20 bg-primary/5">
                  <div className="flex items-center gap-2 text-primary text-xs mb-1">
                    <DollarSign className="w-3 h-3" /> Estimated Total
                  </div>
                  <p className="font-black text-2xl text-primary">${Number(selectedBooking.quote.totalEstimate).toFixed(2)}</p>
                </div>
              )}

              {selectedBooking.notes && (
                <div className="glass-card rounded-xl p-4 border border-white/5">
                  <div className="text-slate-400 text-xs mb-1">Notes</div>
                  <p className="text-sm">{selectedBooking.notes}</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button 
                onClick={() => {
                  handleMessageShop(selectedBooking);
                  setSelectedBooking(null);
                }} 
                className="btn btn-primary w-full gap-2"
              >
                <MessageCircle className="w-4 h-4" /> Message Shop
              </button>
              
              {selectedBooking.shop.phone && (
                <a href={`tel:${selectedBooking.shop.phone}`} className="btn btn-outline w-full gap-2">
                  <Phone className="w-4 h-4" /> Call Shop
                </a>
              )}

              {selectedBooking.status === 'COMPLETED' && !reviewedBookings.has(selectedBooking.id) && (
                <button 
                  onClick={() => handleOpenReview(selectedBooking)}
                  className="btn btn-secondary w-full gap-2"
                >
                  <Star className="w-4 h-4" /> Leave a Review
                </button>
              )}

              {selectedBooking.status === 'COMPLETED' && reviewedBookings.has(selectedBooking.id) && (
                <div className="text-center py-2 text-green-400 flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" /> You've reviewed this service
                </div>
              )}

              {selectedBooking.status === 'PENDING' && (
                <button 
                  onClick={() => handleCancelBooking(selectedBooking.id)}
                  disabled={cancellingId === selectedBooking.id}
                  className="btn btn-ghost w-full text-error gap-2"
                >
                  {cancellingId === selectedBooking.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  Cancel Booking
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && reviewBooking && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowReviewModal(false)}>
          <div className="bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-white/10" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Leave a Review</h2>
              <button onClick={() => setShowReviewModal(false)} className="btn btn-ghost btn-sm btn-circle">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Shop Info */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-xl bg-slate-800 flex items-center justify-center overflow-hidden">
                {reviewBooking.shop.imageUrl ? (
                  <img src={reviewBooking.shop.imageUrl} alt={reviewBooking.shop.name} className="w-full h-full object-cover" />
                ) : (
                  <Wrench className="w-7 h-7 text-slate-500" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-lg">{reviewBooking.shop.name}</h3>
                <p className="text-sm text-slate-400">{reviewBooking.service?.name || 'Service'}</p>
              </div>
            </div>

            {/* Star Rating */}
            <div className="mb-6">
              <label className="label text-sm text-slate-400">Your Rating</label>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReviewRating(star)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-10 h-10 ${
                        star <= reviewRating ? 'fill-primary text-primary' : 'text-slate-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-center mt-2 text-sm text-slate-400">
                {reviewRating === 5 && 'Excellent!'}
                {reviewRating === 4 && 'Great!'}
                {reviewRating === 3 && 'Good'}
                {reviewRating === 2 && 'Fair'}
                {reviewRating === 1 && 'Poor'}
              </p>
            </div>

            {/* Comment */}
            <div className="mb-4">
              <label className="label text-sm text-slate-400">Your Review (Optional)</label>
              <textarea
                className="textarea textarea-bordered bg-slate-800 border-white/10 w-full h-24 resize-none"
                placeholder="Tell others about your experience..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
              />
            </div>

            {/* Image Upload */}
            <div className="mb-6">
              <label className="label text-sm text-slate-400">Add Photos (Optional)</label>
              
              {/* Image Previews */}
              {reviewImages.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {reviewImages.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img 
                        src={img} 
                        alt={`Review ${idx + 1}`} 
                        className="w-20 h-20 object-cover rounded-lg border border-white/10"
                      />
                      <button
                        onClick={() => removeReviewImage(idx)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-error rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Upload Button */}
              {reviewImages.length < 5 && (
                <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-white/10 rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                  {uploadingImage ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Uploading...</>
                  ) : (
                    <>
                      <Camera className="w-5 h-5 text-slate-400" />
                      <span className="text-slate-400">Add photos ({reviewImages.length}/5)</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                  />
                </label>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button 
                onClick={() => setShowReviewModal(false)}
                className="btn btn-ghost flex-1"
                disabled={submittingReview}
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmitReview}
                className="btn btn-primary flex-1 gap-2"
                disabled={submittingReview}
              >
                {submittingReview ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                ) : (
                  <>Submit Review</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast toast-end toast-bottom z-50">
          <div className="alert alert-info">
            <CheckCircle className="w-5 h-5" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};
