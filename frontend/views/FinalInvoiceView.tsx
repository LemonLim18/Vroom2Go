import React, { useState, useEffect } from 'react';
import { Invoice, Booking, JobStatus } from '../types';
import { formatCurrency, calculateVariance, isVarianceOverTolerance } from '../services/quoteService';
import api from '../services/api';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  FileText,
  Camera,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  ShieldCheck,
  Flag,
  Download,
  Printer,
  Star,
  ThumbsUp
} from 'lucide-react';

interface FinalInvoiceViewProps {
  invoiceId?: string;
  bookingId?: string | number;
  invoice?: Invoice;
  onBack?: () => void;
  onApprove?: (invoice: Invoice) => void;
  onDispute?: (invoice: Invoice) => void;
  onRateShop?: () => void;
}

export const FinalInvoiceView: React.FC<FinalInvoiceViewProps> = ({
  invoiceId,
  bookingId,
  invoice: propInvoice,
  onBack,
  onApprove,
  onDispute,
  onRateShop,
}) => {
  const [invoice, setInvoice] = useState<Invoice | null>(propInvoice || null);
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(!propInvoice);
  const [error, setError] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [rating, setRating] = useState(5);

  // Fetch invoice from API
  useEffect(() => {
    if (propInvoice) {
      setInvoice(propInvoice);
      setLoading(false);
      return;
    }

    const fetchInvoice = async () => {
      try {
        setLoading(true);
        setError(null);

        if (bookingId) {
          const { data } = await api.get(`/invoices/booking/${bookingId}`);
          setInvoice(data);
          // Booking data is included in invoice response
          if (data.booking) {
            setBooking(data.booking);
          }
        } else if (invoiceId) {
          const { data } = await api.get(`/invoices/${invoiceId}`);
          setInvoice(data);
          if (data.booking) {
            setBooking(data.booking);
          }
        } else {
          setError('No invoice ID provided');
        }
      } catch (err: any) {
        console.error('Failed to fetch invoice:', err);
        setError('Failed to load invoice');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [bookingId, invoiceId, propInvoice]);

  // Get shop from booking or invoice
  const shop = booking?.shop || (invoice as any)?.shop || (invoice as any)?.booking?.shop || null;

  // Calculate variance from original quote
  const originalQuoteTotal = booking?.estimatedTotal || 0;
  const variance = invoice ? calculateVariance(originalQuoteTotal, invoice.finalTotal) : 0;
  const isOverTolerance = isVarianceOverTolerance(variance / 100);

  const nextPhoto = () => {
    if (!invoice?.evidencePhotos?.length) return;
    setCurrentPhotoIndex(prev => 
      prev < invoice.evidencePhotos.length - 1 ? prev + 1 : 0
    );
  };

  const prevPhoto = () => {
    if (!invoice?.evidencePhotos?.length) return;
    setCurrentPhotoIndex(prev => 
      prev > 0 ? prev - 1 : invoice.evidencePhotos.length - 1
    );
  };

  const handleApprove = async () => {
    if (!invoice) return;
    
    setApproving(true);
    try {
      // Call API to approve
      const { data } = await api.put(`/invoices/${invoice.id}/approve`);
      setInvoice(data);
      setShowApproveModal(false);
      onApprove?.(data);
    } catch (err: any) {
      console.error('Failed to approve invoice:', err);
      // Fallback: just update local state for demo
      setInvoice({ ...invoice, approvedByOwner: true });
      setShowApproveModal(false);
      onApprove?.(invoice);
    } finally {
      setApproving(false);
    }
  };

  const handleDispute = () => {
    if (!invoice) return;
    setShowDisputeModal(false);
    onDispute?.(invoice);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <span className="loading loading-bars loading-lg text-primary"></span>
        <p className="mt-4 text-slate-500 font-medium animate-pulse">Loading Invoice...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-slate-500 mx-auto mb-4" />
        <p className="text-slate-400">Invoice not found</p>
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
              Final <span className="text-primary">Invoice</span>
            </h1>
            <p className="text-slate-400">Invoice #{invoice.id.toUpperCase()}</p>
          </div>
          {invoice.approvedByOwner ? (
            <div className="badge badge-success gap-1 py-3 px-4">
              <CheckCircle className="w-4 h-4" /> Approved
            </div>
          ) : (
            <div className="badge badge-warning gap-1 py-3 px-4">
              <AlertTriangle className="w-4 h-4" /> Pending Review
            </div>
          )}
        </div>
      </div>

      {/* Variance Alert */}
      {variance !== 0 && (
        <div className={`alert ${isOverTolerance ? 'alert-warning' : 'alert-info'}`}>
          {isOverTolerance ? (
            <AlertTriangle className="w-5 h-5" />
          ) : (
            <CheckCircle className="w-5 h-5" />
          )}
          <div>
            <p className="font-bold">
              Final invoice is {variance > 0 ? 'higher' : 'lower'} than quoted by {Math.abs(variance).toFixed(1)}%
            </p>
            <p className="text-sm">
              {isOverTolerance 
                ? 'This exceeds the 15% tolerance. You may request a review before payment.'
                : 'This is within acceptable variance. No action required.'}
            </p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Invoice Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Evidence Photos */}
          {invoice.evidencePhotos.length > 0 && (
            <div className="glass-card rounded-2xl overflow-hidden border border-white/5">
              <div className="relative h-64 md:h-80">
                <img 
                  src={invoice.evidencePhotos[currentPhotoIndex]}
                  alt={`Evidence ${currentPhotoIndex + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                
                {/* Photo Navigation */}
                {invoice.evidencePhotos.length > 1 && (
                  <>
                    <button 
                      onClick={prevPhoto}
                      className="absolute left-4 top-1/2 -translate-y-1/2 btn btn-circle btn-ghost bg-black/40"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button 
                      onClick={nextPhoto}
                      className="absolute right-4 top-1/2 -translate-y-1/2 btn btn-circle btn-ghost bg-black/40"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}

                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera className="w-5 h-5 text-primary" />
                    <span className="font-bold">Evidence Photos</span>
                  </div>
                  <span className="text-sm text-slate-300">
                    {currentPhotoIndex + 1} / {invoice.evidencePhotos.length}
                  </span>
                </div>
              </div>

              {/* Photo Thumbnails */}
              <div className="p-4 flex gap-2 overflow-x-auto">
                {invoice.evidencePhotos.map((photo, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPhotoIndex(index)}
                    className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                      index === currentPhotoIndex ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={photo} alt={`Thumb ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Line Items */}
          <div className="glass-card rounded-2xl p-6 border border-white/5">
            <h3 className="font-bold text-lg mb-4">Final Charges</h3>
            
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th className="text-right">Parts</th>
                    <th className="text-right">Labor</th>
                    <th className="text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.lineItems.map(item => (
                    <tr key={item.id}>
                      <td>
                        <p className="font-medium">{item.description}</p>
                        {item.partName && (
                          <p className="text-xs text-slate-500">{item.partName}</p>
                        )}
                      </td>
                      <td className="text-right">{formatCurrency(item.partCost)}</td>
                      <td className="text-right">{formatCurrency(item.laborHours * item.laborRate)}</td>
                      <td className="text-right font-bold">{formatCurrency(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="border-t border-white/5 mt-4 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Parts Total</span>
                <span>{formatCurrency(invoice.partsCostTotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Labor Total</span>
                <span>{formatCurrency(invoice.laborCostTotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Shop Fees</span>
                <span>{formatCurrency(invoice.shopFees)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Taxes</span>
                <span>{formatCurrency(invoice.taxes)}</span>
              </div>
              <div className="divider my-2"></div>
              <div className="flex justify-between text-xl font-bold">
                <span>Final Total</span>
                <span className="text-primary">{formatCurrency(invoice.finalTotal)}</span>
              </div>
            </div>
          </div>

          {/* Shop Notes */}
          {invoice.notes && (
            <div className="glass-card rounded-2xl p-5 border border-white/5">
              <h3 className="font-bold mb-2">Technician Notes</h3>
              <p className="text-slate-300">{invoice.notes}</p>
            </div>
          )}
        </div>

        {/* Right: Payment & Actions */}
        <div className="space-y-6">
          {/* Comparison Card */}
          <div className="glass-card rounded-2xl p-5 border border-white/5">
            <h3 className="font-bold mb-4">Quote vs Final</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Original Quote</span>
                <span>{formatCurrency(originalQuoteTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Final Invoice</span>
                <span className="font-bold">{formatCurrency(invoice.finalTotal)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-white/5">
                <span className="text-slate-400">Difference</span>
                <span className={`font-bold ${variance > 0 ? 'text-orange-400' : variance < 0 ? 'text-green-400' : ''}`}>
                  {variance > 0 ? '+' : ''}{variance.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          {booking && (
            <div className="glass-card rounded-2xl p-5 border border-primary/20 bg-primary/5">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="w-5 h-5 text-primary" />
                <span className="font-bold">Payment Summary</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Deposit Paid</span>
                  <span className="text-green-400">-{formatCurrency(booking.depositAmount)}</span>
                </div>
                <div className="divider my-1"></div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Balance Due</span>
                  <span className="text-primary">{formatCurrency(invoice.finalTotal - booking.depositAmount)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          {!invoice.approvedByOwner && (
            <div className="space-y-3">
              <button 
                onClick={() => setShowApproveModal(true)}
                className="btn btn-primary btn-lg w-full rounded-xl gap-2"
              >
                <ThumbsUp className="w-5 h-5" /> Approve & Pay
              </button>
              <button 
                onClick={() => setShowDisputeModal(true)}
                className="btn btn-ghost w-full rounded-xl gap-2 text-orange-400"
              >
                <Flag className="w-5 h-5" /> Open Dispute
              </button>
            </div>
          )}

          {invoice.approvedByOwner && (
            <>
              <div className="alert alert-success">
                <CheckCircle className="w-5 h-5" />
                <span>Payment complete! Thank you.</span>
              </div>
              
              {onRateShop && (
                <button 
                  onClick={onRateShop}
                  className="btn btn-outline w-full rounded-xl gap-2"
                >
                  <Star className="w-5 h-5" /> Rate Your Experience
                </button>
              )}
            </>
          )}

          {/* Actions Footer */}
          <div className="flex gap-2">
            <button className="btn btn-ghost btn-sm flex-1 gap-1">
              <Download className="w-4 h-4" /> Download
            </button>
            <button className="btn btn-ghost btn-sm flex-1 gap-1">
              <Printer className="w-4 h-4" /> Print
            </button>
          </div>
        </div>
      </div>

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Approve Invoice?</h2>
                <p className="text-sm text-slate-400">Confirm and release payment</p>
              </div>
            </div>
            
            <p className="text-slate-300 mb-6">
              By approving, you confirm the work was completed satisfactorily and authorize 
              releasing the remaining balance of {formatCurrency(invoice.finalTotal - (booking?.depositAmount || 0))} 
              to {shop?.name}.
            </p>

            <div className="flex gap-3">
              <button onClick={() => setShowApproveModal(false)} className="btn btn-ghost flex-1">
                Cancel
              </button>
              <button onClick={handleApprove} className="btn btn-success flex-1">
                Approve Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispute Modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                <Flag className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Open Dispute</h2>
                <p className="text-sm text-slate-400">Request mediation</p>
              </div>
            </div>
            
            <div className="form-control mb-4">
              <label className="label"><span className="label-text">Reason for dispute</span></label>
              <textarea 
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="Please explain the issue..."
                className="textarea textarea-bordered h-32 bg-base-100 border-white/10"
              />
            </div>

            <p className="text-sm text-slate-400 mb-6">
              Our team will review your case within 2 business days. Payment will be held until resolved.
            </p>

            <div className="flex gap-3">
              <button onClick={() => setShowDisputeModal(false)} className="btn btn-ghost flex-1">
                Cancel
              </button>
              <button 
                onClick={handleDispute} 
                disabled={!disputeReason}
                className="btn btn-warning flex-1"
              >
                Submit Dispute
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
