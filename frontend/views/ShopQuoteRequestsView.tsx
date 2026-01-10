import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Search, 
  MapPin, 
  Calendar, 
  ChevronRight, 
  DollarSign, 
  CheckCircle,
  AlertCircle,
  Clock,
  Car
} from 'lucide-react';
import Swal from 'sweetalert2';

interface ShopQuoteRequestsViewProps {
  onBack?: () => void;
}

export const ShopQuoteRequestsView: React.FC<ShopQuoteRequestsViewProps> = ({ onBack }) => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);

  // Quote Form State
  const [quoteForm, setQuoteForm] = useState({
    description: '',
    partsEstimate: '',
    laborEstimate: '',
    totalEstimate: '',
    validUntil: ''
  });

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/quotes/requests/shop');
      setRequests(data);
    } catch (error) {
      console.error('Failed to fetch requests', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    const parts = parseFloat(quoteForm.partsEstimate) || 0;
    const labor = parseFloat(quoteForm.laborEstimate) || 0;
    setQuoteForm(prev => ({ ...prev, totalEstimate: (parts + labor).toFixed(2) }));
  };

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    try {
      await api.post(`/quotes/requests/${selectedRequest.id}/respond`, {
        ...quoteForm,
        totalEstimate: parseFloat(quoteForm.totalEstimate)
      });
      
      Swal.fire({
        icon: 'success',
        title: 'Quote Sent!',
        text: 'The driver has been notified of your estimate.',
        background: '#0f172a',
        color: '#fff'
      });
      
      setSelectedRequest(null);
      fetchRequests(); // Refresh list (maybe remove the responded one if desired)
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Failed to send quote',
        text: error.response?.data?.message || 'Unknown error',
        background: '#0f172a',
        color: '#fff'
      });
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black uppercase italic tracking-tighter">
            Incoming <span className="text-primary">Requests</span>
          </h1>
          <p className="text-slate-400">Review vehicle issues and send quotes to potential customers</p>
        </div>
        <div className="join">
          <button className="btn btn-active join-item">Open</button>
          <button className="btn join-item">Responded</button>
          <button className="btn join-item">Won</button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Request List */}
        <div className="md:col-span-1 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
          {loading ? (
            <div className="flex justify-center p-10"><span className="loading loading-spinner text-primary"></span></div>
          ) : requests.length === 0 ? (
            <div className="text-center py-20 px-10 text-slate-500">No open requests found.</div>
          ) : (
            requests.map(req => (
              <div 
                key={req.id}
                onClick={() => {
                    setSelectedRequest(req);
                    setQuoteForm(prev => ({ ...prev, description: `Repairs for: ${req.description.substring(0, 50)}...` }));
                }}
                className={`glass-card p-4 rounded-xl cursor-pointer transition-all border ${
                  selectedRequest?.id === req.id 
                    ? 'border-primary bg-primary/5' 
                    : 'border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="badge badge-sm badge-ghost">{new Date(req.createdAt).toLocaleDateString()}</span>
                  <span className="text-xs text-primary font-bold uppercase">{req.vehicle.make}</span>
                </div>
                <h3 className="font-bold text-sm mb-1">{req.vehicle.year} {req.vehicle.model}</h3>
                <p className="text-xs text-slate-400 line-clamp-2">{req.description}</p>
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                  <MapPin className="w-3 h-3" />
                  <span>{req.radius || 10} mi radius</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Detail & Quote Form */}
        <div className="md:col-span-2">
          {selectedRequest ? (
            <div className="glass-card rounded-3xl p-6 border border-white/5 h-full flex flex-col">
              {/* Header */}
              <div className="flex items-start justify-between mb-6 border-b border-white/10 pb-6">
                <div className="flex items-center gap-4">
                  {selectedRequest.vehicle.image ? (
                    <img 
                      src={selectedRequest.vehicle.image} 
                      alt="Vehicle" 
                      className="w-20 h-20 rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-slate-800 flex items-center justify-center">
                      <Car className="text-slate-500" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-2xl font-black uppercase italic">
                      {selectedRequest.vehicle.year} {selectedRequest.vehicle.make} {selectedRequest.vehicle.model}
                    </h2>
                    <div className="flex items-center gap-3 text-sm text-slate-400 mt-1">
                      <span>{selectedRequest.vehicle.type}</span>
                      <span>•</span>
                      <span>{selectedRequest.vehicle.mileage?.toLocaleString()} miles</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                    <button onClick={() => setSelectedRequest(null)} className="btn btn-ghost btn-sm mb-2">Close</button>
                    <p className="text-xs text-slate-500">Request ID: #{selectedRequest.id}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-warning" /> Customer Report
                  </h3>
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 text-sm leading-relaxed">
                    {selectedRequest.description}
                  </div>
                  
                  {selectedRequest.symptoms && selectedRequest.symptoms.length > 0 && (
                    <div className="mt-4">
                        <p className="text-xs font-bold text-slate-500 mb-2 uppercase">Symptoms</p>
                        <div className="flex flex-wrap gap-2">
                            {selectedRequest.symptoms.map((s: string, i: number) => (
                                <span key={i} className="badge badge-warning badge-outline">{s}</span>
                            ))}
                        </div>
                    </div>
                  )}
                </div>

                {/* Photos */}
                <div>
                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <Search className="w-5 h-5 text-info" /> Photos
                  </h3>
                  {selectedRequest.photos && selectedRequest.photos.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {selectedRequest.photos.map((url: string, i: number) => (
                        <img 
                            key={i} 
                            src={url} 
                            alt={`Damage ${i}`} 
                            className="rounded-lg border border-white/10 hover:scale-105 transition-transform cursor-zoom-in" 
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="h-32 bg-slate-900/50 rounded-xl border border-white/5 border-dashed flex items-center justify-center text-slate-500 text-sm">
                      No photos provided
                    </div>
                  )}
                </div>
              </div>

              {/* Quote Form */}
              <div className="mt-auto bg-slate-900 rounded-2xl p-6 border border-white/10">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-success" /> Prepare Quote
                </h3>
                
                <form onSubmit={handleSubmitQuote} className="space-y-4">
                    <div className="form-control">
                        <label className="label text-xs uppercase font-bold text-slate-500">Scope of Work</label>
                        <textarea 
                            className="textarea textarea-bordered bg-base-100" 
                            placeholder="Describe the parts and labor required..."
                            value={quoteForm.description}
                            onChange={e => setQuoteForm({...quoteForm, description: e.target.value})}
                            required
                        ></textarea>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                        <div className="form-control">
                            <label className="label text-xs uppercase font-bold text-slate-500">Parts ($)</label>
                            <input 
                                type="number" 
                                className="input input-bordered bg-base-100" 
                                placeholder="0.00"
                                value={quoteForm.partsEstimate}
                                onChange={e => setQuoteForm({...quoteForm, partsEstimate: e.target.value})}
                                onBlur={calculateTotal}
                                step="0.01"
                            />
                        </div>
                        <div className="form-control">
                            <label className="label text-xs uppercase font-bold text-slate-500">Labor ($)</label>
                            <input 
                                type="number" 
                                className="input input-bordered bg-base-100" 
                                placeholder="0.00"
                                value={quoteForm.laborEstimate}
                                onChange={e => setQuoteForm({...quoteForm, laborEstimate: e.target.value})}
                                onBlur={calculateTotal}
                                step="0.01"
                            />
                        </div>
                        <div className="form-control">
                            <label className="label text-xs uppercase font-bold text-success">Total ($)</label>
                            <input 
                                type="number" 
                                className="input input-bordered bg-base-100 font-bold text-success" 
                                placeholder="0.00"
                                value={quoteForm.totalEstimate}
                                onChange={e => setQuoteForm({...quoteForm, totalEstimate: e.target.value})}
                                step="0.01"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4 mt-2">
                        <div className="flex-1">
                             <label className="label text-xs uppercase font-bold text-slate-500">Valid Until</label>
                             <input 
                                type="date"
                                className="input input-bordered bg-base-100 w-full"
                                value={quoteForm.validUntil}
                                onChange={e => setQuoteForm({...quoteForm, validUntil: e.target.value})}
                                required
                             />
                        </div>
                        <button type="submit" className="btn btn-primary gap-2 mt-8 flex-1">
                            <CheckCircle className="w-5 h-5" /> Send Quote
                        </button>
                    </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-slate-500 border border-dashed border-white/5 rounded-3xl bg-slate-900/50 p-12">
              <Clock className="w-16 h-16 mb-4 opacity-20" />
              <p>Select a request to view details and submit a quote</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
