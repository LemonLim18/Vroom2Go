import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { QuoteRequest } from '../types';
import { Clock, FileText, Archive, CheckCircle, XCircle } from 'lucide-react';

interface UserQuotesViewProps {
  onNavigate: (view: string) => void;
  onQuoteSelect: (quote: any) => void;
}

export const UserQuotesView: React.FC<UserQuotesViewProps> = ({ onNavigate, onQuoteSelect }) => {
  const [requests, setRequests] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'requests' | 'quotes' | 'archive'>('quotes');

  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        const { data } = await api.get('/quotes/requests/driver');
        setRequests(data);
        // Default to requests tab if no quotes yet
        const hasQuotes = data.some((r: any) => r.quotes && r.quotes.length > 0);
        if (!hasQuotes && data.length > 0) {
            setActiveTab('requests');
        }
      } catch (error) {
        console.error('Failed to fetch quotes', error);
      } finally {
        setLoading(false);
      }
    };
    fetchQuotes();
  }, []);

  // Filter Data
  console.log('UserQuotesView Requests:', requests); // Debug frontend data
  const activeRequests = requests.filter(r => r.status === 'OPEN' || r.status.toUpperCase() === 'OPEN');
  
  const activeQuotes = requests.flatMap(r => r.quotes || [])
    .filter((q: any) => q.status === 'QUOTED' || q.status === 'PENDING')
    .map((q: any) => {
        const req = requests.find(r => r.id === q.quoteRequestId);
        return {
            ...q,
            // Map backend fields to frontend interface
            partsCostTotal: Number(q.partsEstimate || 0),
            laborCostTotal: Number(q.laborEstimate || 0),
            estimatedTotal: Number(q.totalEstimate || 0),
            shopFees: 0,
            taxes: 0,
            lineItems: q.lineItems || [],
            estimatedRange: q.estimatedRange || null,
            // @ts-ignore
            requestVehicle: req?.vehicle ? `${req.vehicle.year} ${req.vehicle.make} ${req.vehicle.model}` : 'Unknown Vehicle',
            // @ts-ignore
            requestDate: req?.createdAt
        };
    });

  const archivedItems = [
      ...requests.filter(r => r.status === 'CLOSED' || r.status === 'EXPIRED')
          .map(r => ({ ...r, type: 'REQUEST' })),
      ...requests.flatMap(r => r.quotes || [])
          .filter((q: any) => q.status === 'REJECTED' || q.status === 'EXPIRED' || q.status === 'ACCEPTED')
          .map((q: any) => {
            const req = requests.find(r => r.id === q.quoteRequestId);
            return {
                ...q,
                type: 'QUOTE',
                // @ts-ignore
                requestVehicle: req?.vehicle ? `${req.vehicle.year} ${req.vehicle.make} ${req.vehicle.model}` : 'Unknown Vehicle'
            };
          })
  ].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const TabButton = ({ id, label, icon: Icon, count }: any) => (
      <button 
        onClick={() => setActiveTab(id)}
        className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all font-bold ${
            activeTab === id 
            ? 'bg-primary text-black shadow-[0_0_20px_rgba(250,204,21,0.3)]' 
            : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white'
        }`}
      >
          <Icon className="w-4 h-4" />
          {label}
          {count > 0 && <span className={`badge badge-sm border-none ${activeTab === id ? 'bg-black/20 text-black' : 'bg-slate-700 text-slate-300'}`}>{count}</span>}
      </button>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase italic tracking-tighter">
            My <span className="text-primary">Quotes</span>
          </h1>
          <p className="text-slate-400">Manage your repair requests and offers</p>
        </div>
        <button onClick={() => onNavigate('quote-request')} className="btn btn-primary gap-2 rounded-xl">
          + New Request
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
          <TabButton id="quotes" label="Received Quotes" icon={FileText} count={activeQuotes.length} />
          <TabButton id="requests" label="Open Requests" icon={Clock} count={activeRequests.length} />
          <TabButton id="archive" label="History" icon={Archive} count={0} />
      </div>

      {loading ? (
        <div className="flex justify-center p-20"><span className="loading loading-spinner loading-lg text-primary"></span></div>
      ) : (
        <div className="min-h-[400px]">
            {/* QUOTES TAB */}
            {activeTab === 'quotes' && (
                activeQuotes.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-white/5 rounded-3xl bg-slate-900/50">
                        <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4 opacity-50" />
                        <h3 className="text-xl font-bold text-slate-300">No active quotes</h3>
                        <p className="text-slate-500">Quotes sent by shops will appear here.</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {activeQuotes.map((quote: any) => (
                            <div 
                            key={quote.id}
                            className="glass-card rounded-3xl p-6 border border-white/5 hover:border-primary/50 transition-all cursor-pointer group relative overflow-hidden"
                            onClick={() => onQuoteSelect(quote)}
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <FileText className="w-24 h-24 text-primary" />
                                </div>
                                
                                <div className="flex items-start justify-between mb-6 relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center overflow-hidden border border-white/10">
                                            {quote.shop?.image ? (
                                                <img src={quote.shop.image} className="w-full h-full object-cover" alt="Shop" />
                                            ) : (
                                                <FileText className="w-6 h-6 text-slate-500" />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg leading-tight">{quote.shop?.name || 'Unknown Shop'}</h3>
                                            <p className="text-xs text-primary font-bold">Verified Partner</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 relative z-10">
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Vehicle</p>
                                        <p className="font-medium">{quote.requestVehicle}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Estimated Total</p>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-black text-primary">${parseFloat(quote.totalEstimate).toFixed(0)}</span>
                                            <span className="text-lg text-slate-400">.{(parseFloat(quote.totalEstimate) % 1).toFixed(2).substring(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between relative z-10">
                                    <div className="text-xs text-slate-400">
                                        Valid until {new Date(quote.validUntil).toLocaleDateString()}
                                    </div>
                                    <button className="btn btn-sm btn-primary" onClick={(e) => {
                                        e.stopPropagation();
                                        onQuoteSelect(quote);
                                    }}>View Offer</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}

            {/* REQUESTS TAB */}
            {activeTab === 'requests' && (
                activeRequests.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-white/5 rounded-3xl bg-slate-900/50">
                        <Clock className="w-16 h-16 text-slate-600 mx-auto mb-4 opacity-50" />
                        <h3 className="text-xl font-bold text-slate-300">No open requests</h3>
                        <p className="text-slate-500 mb-6">Create a request to get quotes from local shops.</p>
                        <button onClick={() => onNavigate('quote-request')} className="btn btn-outline">Start Request</button>
                    </div>
                ) : (
                   <div className="space-y-4">
                       {activeRequests.map(req => (
                           <div key={req.id} className="bg-slate-800/40 p-6 rounded-2xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-800/60 transition-colors">
                               <div className="flex-1">
                                   <div className="flex items-center gap-3 mb-2">
                                       <span className="badge badge-primary badge-outline text-xs font-bold">Scanning for Quotes</span>
                                       <span className="text-xs text-slate-500">{new Date(req.createdAt).toLocaleDateString()}</span>
                                   </div>
                                    {/* @ts-ignore */}
                                   <h3 className="text-xl font-bold mb-1">{req.vehicle?.year} {req.vehicle?.make} {req.vehicle?.model}</h3> 
                                   <p className="text-slate-400 text-sm max-w-2xl">{req.description}</p>
                               </div>
                               <button className="btn btn-ghost text-error btn-sm">Cancel Request</button>
                           </div>
                       ))}
                   </div>
                )
            )}

            {/* ARCHIVE TAB */}
            {activeTab === 'archive' && (
                archivedItems.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-white/5 rounded-3xl bg-slate-900/50">
                        <Archive className="w-16 h-16 text-slate-600 mx-auto mb-4 opacity-50" />
                        <h3 className="text-xl font-bold text-slate-300">Archive is empty</h3>
                    </div>
                ) : (
                    <div className="opacity-60 space-y-4">
                         {archivedItems.map((item: any) => (
                             <div key={`${item.type}-${item.id}`} className="bg-slate-900 p-4 rounded-xl border border-white/5 flex justify-between items-center grayscale">
                                 <div>
                                     <div className="flex items-center gap-2 mb-1">
                                         <span className="badge badge-ghost badge-sm">{item.status}</span>
                                         <span className="text-xs text-slate-500">{item.type}</span>
                                     </div>
                                     <p className="font-bold text-slate-400">
                                         {item.type === 'QUOTE' ? item.requestVehicle : `${item.vehicle?.make} ${item.vehicle?.model}`}
                                     </p>
                                 </div>
                                 <span className="text-xs text-slate-600">{new Date(item.createdAt).toLocaleDateString()}</span>
                             </div>
                         ))}
                    </div>
                )
            )}
        </div>
      )}
    </div>
  );
};
