import React, { useState, useEffect } from 'react';
import { Booking, JobStatus, Shop } from '../types';
import { formatCurrency } from '../services/quoteService';
import api from '../services/api';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Package,
  Wrench,
  Calendar,
  MapPin,
  Phone,
  MessageSquare,
  Car,
  Camera,
  ChevronRight,
  Timer,
  TrendingUp
} from 'lucide-react';

interface JobProgressViewProps {
  bookingId?: string;
  booking?: Booking;
  onBack?: () => void;
  onChat?: (shop: Shop) => void;
  onViewInvoice?: () => void;
}

const JOB_STEPS: { status: JobStatus; label: string; icon: React.ReactNode }[] = [
  { status: JobStatus.SCHEDULED, label: 'Scheduled', icon: <Calendar className="w-5 h-5" /> },
  { status: JobStatus.IN_PROGRESS, label: 'In Progress', icon: <Wrench className="w-5 h-5" /> },
  { status: JobStatus.WAITING_PARTS, label: 'Waiting Parts', icon: <Package className="w-5 h-5" /> },
  { status: JobStatus.COMPLETED, label: 'Completed', icon: <CheckCircle className="w-5 h-5" /> },
];

const getStepIndex = (status: JobStatus): number => {
  const index = JOB_STEPS.findIndex(s => s.status === status);
  return index >= 0 ? index : 0;
};

export const JobProgressView: React.FC<JobProgressViewProps> = ({
  bookingId,
  booking: propBooking,
  onBack,
  onChat,
  onViewInvoice,
}) => {
  const [booking, setBooking] = useState<any>(propBooking || null);
  const [loading, setLoading] = useState(!propBooking);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch booking data from API
  useEffect(() => {
    if (propBooking) {
      setBooking(propBooking);
      setLoading(false);
      return;
    }
    
    if (!bookingId) {
      setError('No booking ID provided');
      setLoading(false);
      return;
    }

    const fetchBooking = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/bookings/${bookingId}`);
        setBooking(data);
      } catch (err) {
        console.error('Failed to fetch booking:', err);
        setError('Failed to load booking');
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [bookingId, propBooking]);

  const shop = booking?.shop || null;
  const currentStepIndex = booking ? getStepIndex(booking.jobStatus || booking.status) : 0;
  
  // Job updates from API or empty
  const [updates] = useState<any[]>(booking?.jobUpdates || []);

  if (!booking) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
        <p className="text-slate-400">Booking not found</p>
      </div>
    );
  }

  const isCompleted = booking.jobStatus === JobStatus.COMPLETED;
  const isInProgress = booking.jobStatus === JobStatus.IN_PROGRESS;

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      {/* Header */}
      <div>
        {onBack && (
          <button onClick={onBack} className="btn btn-ghost btn-sm mb-4">← Back</button>
        )}
        <h1 className="text-3xl font-black uppercase italic tracking-tighter">
          Job <span className="text-primary">Progress</span>
        </h1>
        <p className="text-slate-400">Booking #{booking.id.toUpperCase()}</p>
      </div>

      {/* Status Banner */}
      <div className={`rounded-2xl p-6 ${
        isCompleted 
          ? 'bg-green-500/10 border border-green-500/20' 
          : isInProgress
            ? 'bg-primary/10 border border-primary/20'
            : 'bg-slate-800 border border-white/5'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
            isCompleted ? 'bg-green-500/20' : isInProgress ? 'bg-primary/20' : 'bg-slate-700'
          }`}>
            {isCompleted ? (
              <CheckCircle className="w-7 h-7 text-green-400" />
            ) : isInProgress ? (
              <Wrench className="w-7 h-7 text-primary animate-pulse" />
            ) : (
              <Clock className="w-7 h-7 text-slate-400" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold">
              {isCompleted ? 'Job Completed!' : isInProgress ? 'Work In Progress' : 'Scheduled'}
            </h2>
            <p className="text-slate-400">
              {booking.serviceName} at {shop?.name}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Stepper */}
      <div className="glass-card rounded-2xl p-6 border border-white/5">
        <h3 className="font-bold mb-6">Job Status</h3>
        <ul className="steps steps-vertical lg:steps-horizontal w-full">
          {JOB_STEPS.filter(s => s.status !== JobStatus.WAITING_PARTS || booking.jobStatus === JobStatus.WAITING_PARTS).map((step, index) => {
            const isActive = index <= currentStepIndex;
            const isCurrent = step.status === booking.jobStatus;
            
            return (
              <li 
                key={step.status} 
                className={`step ${isActive ? 'step-primary' : ''}`}
                data-content={isActive ? '✓' : index + 1}
              >
                <div className={`flex items-center gap-2 ${isCurrent ? 'text-primary font-bold' : ''}`}>
                  {step.icon}
                  <span>{step.label}</span>
                </div>
              </li>
            );
          })}
        </ul>

        {/* ETA */}
        {!isCompleted && booking.estimatedCompletion && (
          <div className="mt-6 flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl">
            <Timer className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm text-slate-400">Estimated Completion</p>
              <p className="font-bold">{new Date(booking.estimatedCompletion).toLocaleString()}</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Updates Feed */}
        <div className="lg:col-span-2 space-y-6">
          {/* Live Updates */}
          <div className="glass-card rounded-2xl p-6 border border-white/5">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Live Updates
            </h3>
            
            <div className="space-y-4">
              {updates.map((update, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${
                      update.type === 'progress' ? 'bg-primary' : 'bg-slate-500'
                    }`} />
                    {index < updates.length - 1 && (
                      <div className="w-0.5 h-full bg-slate-700 my-1" />
                    )}
                  </div>
                  <div className="pb-4">
                    <p className="text-xs text-slate-500 mb-1">{update.time}</p>
                    <p className="text-slate-300">{update.message}</p>
                  </div>
                </div>
              ))}
              
              {isInProgress && (
                <div className="flex gap-4">
                  <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                  <p className="text-sm text-slate-400">Waiting for next update...</p>
                </div>
              )}
            </div>
          </div>

          {/* Photo Updates (placeholder) */}
          {booking.photos && booking.photos.length > 0 && (
            <div className="glass-card rounded-2xl p-6 border border-white/5">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Camera className="w-5 h-5 text-primary" />
                Photo Updates
              </h3>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {booking.photos.map((photo, index) => (
                  <img 
                    key={index}
                    src={photo}
                    alt={`Update ${index + 1}`}
                    className="w-32 h-24 rounded-xl object-cover flex-shrink-0"
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Booking Info */}
        <div className="space-y-6">
          {/* Vehicle */}
          <div className="glass-card rounded-2xl p-5 border border-white/5">
            <div className="flex items-center gap-3 mb-3">
              <Car className="w-5 h-5 text-primary" />
              <span className="font-bold">Vehicle</span>
            </div>
            <p className="text-lg">{booking.vehicle}</p>
          </div>

          {/* Shop Contact */}
          {shop && (
            <div className="glass-card rounded-2xl p-5 border border-white/5">
              <div className="flex items-center gap-3 mb-4">
                <img src={shop.image} alt={shop.name} className="w-12 h-12 rounded-xl object-cover" />
                <div>
                  <p className="font-bold">{shop.name}</p>
                  <p className="text-sm text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {shop.distance}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                {shop.phone && (
                  <a href={`tel:${shop.phone}`} className="btn btn-sm btn-ghost w-full justify-start gap-2">
                    <Phone className="w-4 h-4" /> {shop.phone}
                  </a>
                )}
                {onChat && (
                  <button 
                    onClick={() => onChat(shop)}
                    className="btn btn-sm btn-outline w-full gap-2"
                  >
                    <MessageSquare className="w-4 h-4" /> Send Message
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Payment Summary */}
          <div className="glass-card rounded-2xl p-5 border border-white/5">
            <h3 className="font-bold mb-3">Payment</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Estimated Total</span>
                <span>{formatCurrency(booking.estimatedTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Deposit Paid</span>
                <span className={booking.depositPaid ? 'text-green-400' : 'text-yellow-400'}>
                  {booking.depositPaid ? formatCurrency(booking.depositAmount) : 'Pending'}
                </span>
              </div>
              <div className="flex justify-between font-bold pt-2 border-t border-white/5">
                <span>Balance Due</span>
                <span className="text-primary">
                  {formatCurrency(booking.estimatedTotal - (booking.depositPaid ? booking.depositAmount : 0))}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          {isCompleted && (
            <button 
              onClick={onViewInvoice}
              className="btn btn-primary w-full rounded-xl gap-2"
            >
              View Final Invoice <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {booking.jobStatus === JobStatus.DISPUTED && (
            <div className="alert alert-error">
              <AlertCircle className="w-5 h-5" />
              <span>Dispute in progress</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
