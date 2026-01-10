import React, { useState } from 'react';
import { Quote, QuoteStatus, Shop } from '../types';
import { MOCK_QUOTES, MOCK_SHOPS, getShopById } from '../constants';
import { formatCurrency, getConfidenceLabel, calculateDeposit } from '../services/quoteService';
import api from '../services/api';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ShieldCheck,
  Star,
  MapPin,
  FileText,
  ChevronRight,
  Calendar,
  CreditCard,
  Info,
  ArrowRight,
  Loader2
} from 'lucide-react';

interface QuoteDetailViewProps {
  quoteId?: string;
  quote?: Quote;
  onBack?: () => void;
  onAccept?: (quote: Quote) => void;
  onReject?: (quote: Quote) => void;
  onCompare?: () => void;
}

const getStatusIcon = (status: QuoteStatus) => {
  switch (status) {
    case QuoteStatus.PENDING: return <FileText className="w-5 h-5" />;
    case QuoteStatus.QUOTED: return <Clock className="w-5 h-5 text-blue-400" />;
    case QuoteStatus.ACCEPTED: return <CheckCircle className="w-5 h-5 text-green-400" />;
    case QuoteStatus.REJECTED: return <XCircle className="w-5 h-5 text-red-400" />;
    case QuoteStatus.EXPIRED: return <AlertCircle className="w-5 h-5 text-yellow-400" />;
    default: return null;
  }
};

const getStatusColor = (status: QuoteStatus) => {
  switch (status) {
    case QuoteStatus.PENDING: return 'badge-ghost';
    case QuoteStatus.QUOTED: return 'badge-info';
    case QuoteStatus.ACCEPTED: return 'badge-success';
    case QuoteStatus.REJECTED: return 'badge-error';
    case QuoteStatus.EXPIRED: return 'badge-warning';
    default: return 'badge-ghost';
  }
};

export const QuoteDetailView: React.FC<QuoteDetailViewProps> = ({
  quoteId,
  quote: propQuote,
  onBack,
  onAccept,
  onReject,
  onCompare,
}) => {
  const quote = propQuote || MOCK_QUOTES.find(q => q.id === quoteId) || MOCK_QUOTES[0];
  const shop = getShopById(quote.shopId);
  const confidence = getConfidenceLabel(quote.confidence);
  const depositAmount = shop ? calculateDeposit(quote.estimatedTotal, shop.depositPercent) : 0;

  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const handleAccept = async () => {
    if (!selectedDate || !selectedTime) return;
    
    setIsProcessing(true);
    try {
      // Accept the quote
      await api.put(`/quotes/${quote.id}/accept`);
      
      // Create booking with the accepted quote
      await api.post('/bookings', {
        shopId: quote.shopId,
        vehicleId: quote.vehicleId,
        quoteId: quote.id,
        scheduledDate: selectedDate,
        scheduledTime: `${selectedDate}T${selectedTime}:00`,
        method: 'DROP_OFF',
        notes: `Booking from accepted quote #${quote.id}`
      });
      
      setBookingSuccess(true);
      setTimeout(() => {
        setShowAcceptModal(false);
        onAccept?.(quote);
      }, 2000);
    } catch (error) {
      console.error('Failed to accept quote/create booking:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!quote) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
        <p className="text-slate-400">Quote not found</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      {/* Header */}
      <div>
        {onBack && (
          <button onClick={onBack} className="btn btn-ghost btn-sm mb-4">← Back</button>
        )}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-black uppercase italic tracking-tighter">
              Quote <span className="text-primary">Details</span>
            </h1>
            <p className="text-slate-400">Quote #{String(quote.id).toUpperCase()}</p>
          </div>
          <div className={`badge ${getStatusColor(quote.status)} gap-1 text-sm py-3 px-4`}>
            {getStatusIcon(quote.status)}
            {quote.status}
          </div>
        </div>
      </div>

      {/* Shop Info */}
      {shop && (
        <div className="glass-card rounded-2xl p-5 border border-white/5 flex items-center gap-4">
          <img src={shop.image} alt={shop.name} className="w-16 h-16 rounded-xl object-cover" />
          <div className="flex-1">
            <h3 className="font-bold text-lg">{shop.name}</h3>
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 text-primary fill-primary" /> {shop.rating}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" /> {shop.distance}
              </span>
              {shop.verified && (
                <span className="flex items-center gap-1 text-primary">
                  <ShieldCheck className="w-4 h-4" /> Verified
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Line Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quote Summary */}
          <div className="glass-card rounded-2xl p-6 border border-white/5">
            {quote.lineItems && quote.lineItems.length > 0 && (
              <>
                <h3 className="font-bold text-lg mb-4">Itemized Quote</h3>
                <div className="overflow-x-auto">
                  <table className="table table-zebra w-full">
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th className="text-right">Parts</th>
                        <th className="text-right">Labor</th>
                        <th className="text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quote.lineItems.map(item => (
                        <tr key={item.id}>
                          <td>
                            <p className="font-medium">{item.description}</p>
                            {item.partSku && (
                              <p className="text-xs text-slate-500">SKU: {item.partSku}</p>
                            )}
                          </td>
                          <td className="text-right">{formatCurrency(item.partCost)}</td>
                          <td className="text-right">
                            {item.laborHours > 0 && (
                              <span className="text-xs text-slate-400">
                                {item.laborHours}hr × ${item.laborRate}
                              </span>
                            )}
                            <br />
                            {formatCurrency(item.laborHours * item.laborRate)}
                          </td>
                          <td className="text-right font-bold">{formatCurrency(item.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* Totals */}
            <h3 className="font-extrabold text-xl mb-2 uppercase tracking-wider">Service Fee Breakdown</h3>
            <div className="border-t-2 border-white/10 mt-5 pt-5 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Parts Total</span>
                <span>{formatCurrency(quote.partsCostTotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Labor Total</span>
                <span>{formatCurrency(quote.laborCostTotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Shop Fees</span>
                <span>{formatCurrency(quote.shopFees)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Taxes</span>
                <span>{formatCurrency(quote.taxes)}</span>
              </div>
              <div className="divider my-2"></div>
              <div className="flex justify-between text-lg font-bold">
                <span>Estimated Total</span>
                <span className="text-primary">{formatCurrency(quote.estimatedTotal)}</span>
              </div>
              {quote.estimatedRange && (
                <p className="text-xs text-slate-500">
                  Range: {formatCurrency(quote.estimatedRange.min)} - {formatCurrency(quote.estimatedRange.max)}
                </p>
              )}
            </div>
          </div>

          {/* Notes */}
          {quote.notes && (
            <div className="glass-card rounded-2xl p-5 border border-white/5">
              <h3 className="font-bold mb-2">Shop Notes</h3>
              <p className="text-slate-300">{quote.notes}</p>
            </div>
          )}
        </div>

        {/* Right: Actions & Info */}
        <div className="space-y-6">
          {/* Confidence & Guarantee */}
          <div className="glass-card rounded-2xl p-5 border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Confidence</span>
              <span className={`badge badge-${confidence.color}`}>{confidence.label}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Guarantee</span>
              {quote.guaranteed ? (
                <span className="badge badge-success gap-1">
                  <CheckCircle className="w-3 h-3" /> Price Guaranteed
                </span>
              ) : (
                <span className="badge badge-warning gap-1">
                  <AlertCircle className="w-3 h-3" /> Estimate Only
                </span>
              )}
            </div>
            {quote.guaranteeValidDays && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Valid For</span>
                <span>{quote.guaranteeValidDays} days</span>
              </div>
            )}
            {quote.expiresAt && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Expires</span>
                <span>{new Date(quote.expiresAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {/* Deposit Info */}
          {shop && (
            <div className="glass-card rounded-2xl p-5 border border-primary/20 bg-primary/5">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="w-5 h-5 text-primary" />
                <span className="font-bold">Required Deposit</span>
              </div>
              <p className="text-3xl font-black text-primary">{formatCurrency(depositAmount)}</p>
              <p className="text-sm text-slate-400 mt-1">
                {shop.depositPercent}% of estimated total • Refundable
              </p>
            </div>
          )}

          {/* Disclaimer */}
          <div className="alert bg-slate-800 border-none text-sm">
            <Info className="w-5 h-5 text-blue-400" />
            <span>
              {quote.guaranteed 
                ? "This price is guaranteed for the quoted work. Additional repairs discovered during service require approval."
                : "This is a non-binding estimate. Final price may vary based on inspection."}
            </span>
          </div>

          {/* Actions */}
          {(quote.status === QuoteStatus.QUOTED || quote.status === QuoteStatus.PENDING) && (
            <div className="space-y-3">
              <button 
                onClick={() => setShowAcceptModal(true)}
                className="btn btn-primary btn-lg w-full rounded-xl gap-2"
              >
                Accept Quote <ArrowRight className="w-5 h-5" />
              </button>
              <button 
                onClick={() => onReject?.(quote)}
                className="btn btn-ghost w-full rounded-xl"
              >
                Decline Quote
              </button>
              {onCompare && (
                <button 
                  onClick={onCompare}
                  className="btn btn-outline w-full rounded-xl"
                >
                  Compare Other Shops
                </button>
              )}
            </div>
          )}

          {quote.status === QuoteStatus.ACCEPTED && (
            <div className="alert alert-success">
              <CheckCircle className="w-5 h-5" />
              <span>Quote accepted! Proceed to booking.</span>
            </div>
          )}
        </div>
      </div>

      {/* Accept & Book Modal */}
      {showAcceptModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-white/10">
            {bookingSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Booking Confirmed!</h2>
                <p className="text-slate-400">Your service is scheduled. We'll notify you with updates.</p>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-primary" /> Schedule Your Service
                </h2>
                <p className="text-slate-400 mb-6">
                  Select your preferred date and time for service at <span className="text-white font-bold">{shop?.name}</span>.
                </p>
                
                {/* Date & Time Selection */}
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="label text-xs uppercase font-bold text-slate-500">Preferred Date</label>
                    <input 
                      type="date" 
                      className="input bg-slate-800 border-white/10 w-full rounded-xl"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <label className="label text-xs uppercase font-bold text-slate-500">Preferred Time</label>
                    <select 
                      className="select bg-slate-800 border-white/10 w-full rounded-xl"
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                    >
                      <option value="">Select a time slot</option>
                      <option value="09:00">9:00 AM</option>
                      <option value="10:00">10:00 AM</option>
                      <option value="11:00">11:00 AM</option>
                      <option value="13:00">1:00 PM</option>
                      <option value="14:00">2:00 PM</option>
                      <option value="15:00">3:00 PM</option>
                      <option value="16:00">4:00 PM</option>
                    </select>
                  </div>
                </div>

                {/* Quote Summary */}
                <div className="glass-card rounded-xl p-4 mb-6 border border-white/5">
                  <div className="flex justify-between mb-2">
                    <span className="text-slate-400">Estimated Total</span>
                    <span className="font-bold">{formatCurrency(quote.estimatedTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Required Deposit</span>
                    <span className="font-bold text-primary">{formatCurrency(depositAmount)}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowAcceptModal(false)}
                    className="btn btn-ghost flex-1"
                    disabled={isProcessing}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleAccept}
                    className="btn btn-primary flex-1 gap-2"
                    disabled={!selectedDate || !selectedTime || isProcessing}
                  >
                    {isProcessing ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                    ) : (
                      <>Confirm Booking</>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
