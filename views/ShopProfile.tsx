import React from 'react';
import { Shop, Service } from '../types';
import { MOCK_SERVICES } from '../constants';
import { ShieldCheck, Star, MapPin, Clock, CheckCircle, MessageCircle, ChevronRight, Share2, Heart } from 'lucide-react';

interface ShopProfileProps {
  shop: Shop;
  onBack: () => void;
  onBook: (shop: Shop, serviceId?: string) => void;
  onMessage: (shop: Shop) => void;
}

export const ShopProfile: React.FC<ShopProfileProps> = ({ shop, onBack, onBook, onMessage }) => {
  const getServiceDetails = (id: string) => MOCK_SERVICES.find(s => s.id === id);

  return (
    <div className="animate-in fade-in duration-500 slide-in-from-bottom-4 space-y-6">
      <div className="flex justify-between items-center">
        <button onClick={onBack} className="btn btn-sm btn-ghost gap-2 text-slate-400 hover:text-white uppercase font-black italic tracking-tighter">
          ← Back to Circuit
        </button>
        <div className="flex gap-2">
          <button className="btn btn-sm btn-circle bg-slate-800 border-none hover:bg-slate-700 text-white"><Share2 className="w-4 h-4" /></button>
          <button className="btn btn-sm btn-circle bg-slate-800 border-none hover:bg-slate-700 text-white"><Heart className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Hero Card */}
      <div className="relative overflow-hidden glass-card rounded-[2.5rem] border border-white/5 shadow-2xl">
        <div className="flex flex-col lg:flex-row">
          <div className="lg:w-1/2 h-64 lg:h-[400px] relative">
            <img src={shop.image} alt={shop.name} className="w-full h-full object-cover grayscale-[0.2] hover:grayscale-0 transition-all duration-700" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/40 to-transparent"></div>
            {shop.verified && (
              <div className="absolute top-6 left-6 badge badge-primary font-black italic tracking-widest p-4 shadow-xl shadow-primary/20">
                <ShieldCheck className="w-4 h-4 mr-1" /> VERIFIED PIT CREW
              </div>
            )}
          </div>
          
          <div className="lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center">
            <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter leading-none mb-4">{shop.name}</h1>
            
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="flex items-center gap-1 bg-primary text-black px-3 py-1 rounded-full font-black text-sm italic">
                <Star className="w-4 h-4 fill-current" />
                {shop.rating}
              </div>
              <span className="text-slate-400 font-bold text-sm tracking-tight uppercase italic">{shop.reviewCount} Reviews • {shop.distance} Away</span>
            </div>

            <p className="flex items-start gap-2 text-slate-400 font-medium mb-8">
              <MapPin className="w-5 h-5 text-primary shrink-0" /> {shop.address}
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button className="btn btn-primary btn-lg rounded-2xl flex-1 font-black italic uppercase tracking-tighter" onClick={() => onBook(shop)}>
                Book Pit Stop
              </button>
              <button className="btn btn-outline btn-lg border-slate-700 text-white hover:bg-primary hover:text-black hover:border-primary rounded-2xl flex-1 gap-2 font-black italic uppercase tracking-tighter" onClick={() => onMessage(shop)}>
                <MessageCircle className="w-5 h-5" /> Direct Message
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* About Section */}
          <section>
            <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-4 flex items-center gap-2">
              <ChevronRight className="w-6 h-6 text-primary" /> The Crew Bio
            </h2>
            <div className="glass-card rounded-3xl p-8 border border-white/5 leading-relaxed text-slate-300 font-medium">
              {shop.description}
              <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="bg-slate-800/50 p-4 rounded-2xl border border-white/5">
                   <div className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Status</div>
                   <div className="flex items-center gap-2 font-bold italic"><Clock className="w-4 h-4" /> 08:00 - 18:00</div>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-2xl border border-white/5">
                   <div className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Certification</div>
                   <div className="flex items-center gap-2 font-bold italic"><CheckCircle className="w-4 h-4" /> ASE MASTER TECH</div>
                </div>
              </div>
            </div>
          </section>

          {/* Service Menu */}
          <section>
            <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-4 flex items-center gap-2">
              <ChevronRight className="w-6 h-6 text-primary" /> Service Menu
            </h2>
            <div className="glass-card rounded-3xl overflow-hidden border border-white/5">
              <div className="overflow-x-auto">
                <table className="table">
                  <thead className="bg-slate-800/50 border-b border-white/5">
                    <tr className="text-slate-500 uppercase italic font-black text-xs tracking-widest">
                      <th className="py-4">Tune Up</th>
                      <th>Flat Rate</th>
                      <th className="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {shop.services.map(serviceId => {
                      const service = getServiceDetails(serviceId);
                      const price = shop.customPrices[serviceId];
                      if (!service) return null;
                      return (
                        <tr key={serviceId} className="hover:bg-primary/5 transition-colors group">
                          <td className="py-6">
                            <div className="font-black italic uppercase tracking-tighter text-lg">{service.name}</div>
                            <div className="text-xs text-slate-500 font-bold uppercase mt-1">{service.category}</div>
                          </td>
                          <td>
                            <div className="text-xl font-black italic text-primary">{price}</div>
                          </td>
                          <td className="text-right">
                             <button 
                                className="btn btn-sm btn-ghost group-hover:bg-primary group-hover:text-black font-black italic uppercase rounded-xl"
                                onClick={() => onBook(shop, serviceId)}
                             >
                                Reserve
                             </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Reviews */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-2">
                <ChevronRight className="w-6 h-6 text-primary" /> Rider Feedback
              </h2>
              <button className="btn btn-ghost btn-sm text-primary font-bold uppercase italic">View All</button>
            </div>
            <div className="space-y-4">
              {shop.reviews.map((review) => (
                <div key={review.id} className="glass-card rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="avatar placeholder">
                        <div className="bg-slate-800 text-primary border border-white/10 rounded-xl w-10 font-black">
                          <span>{review.author.charAt(0)}</span>
                        </div>
                      </div>
                      <div>
                        <div className="font-black italic uppercase tracking-tighter text-sm">{review.author}</div>
                        <div className="text-[10px] text-slate-500 font-bold">{review.date}</div>
                      </div>
                    </div>
                    <div className="flex text-primary">
                       {[...Array(5)].map((_, i) => (
                         <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-current' : 'text-slate-700'}`} />
                       ))}
                    </div>
                  </div>
                  <p className="text-slate-300 font-medium italic">"{review.comment}"</p>
                  {review.serviceName && (
                    <div className="mt-4 inline-flex items-center gap-1 bg-slate-800 px-2 py-1 rounded text-[10px] font-bold text-slate-500 uppercase tracking-widest border border-white/5">
                      Verified {review.serviceName}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Location Sidebar */}
        <div className="space-y-6">
           <div className="glass-card rounded-3xl p-6 border border-white/5 sticky top-24">
              <h3 className="text-lg font-black italic uppercase tracking-tighter mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" /> Map Coordinate
              </h3>
              <div className="w-full h-48 bg-slate-800 rounded-2xl flex items-center justify-center relative overflow-hidden group mb-4">
                 <div className="absolute inset-0 opacity-20 bg-[url('https://www.google.com/maps/vt/pb=!1m4!1m3!1i12!2i1024!3i2048!2m3!1e0!2sm!3i345013117!3m8!2sen!3sus!5e1105!12m4!1e68!2m2!1sset!2sRoadmap!4e0')] bg-center bg-cover"></div>
                 <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center animate-bounce shadow-[0_0_20px_#FACC15] relative z-10">
                    <MapPin className="w-6 h-6 text-black" />
                 </div>
              </div>
              <div className="text-sm space-y-2 mb-6">
                <p className="font-black italic text-white uppercase tracking-tighter">{shop.address}</p>
                <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">HQ: SPRINGFIELD, IL 62704</p>
              </div>
              <button className="btn btn-outline border-slate-700 text-white hover:bg-white hover:text-black w-full rounded-xl uppercase font-black italic tracking-tighter">
                Get Directions
              </button>
              
              <div className="mt-8 p-6 bg-primary rounded-2xl text-black shadow-lg shadow-primary/20">
                <h3 className="font-black italic uppercase tracking-tighter mb-2">Vroom Guarantee</h3>
                <ul className="space-y-2 text-xs font-bold uppercase italic">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Locked Pricing</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> 12mo Performance Warranty</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Direct Rider Chat</li>
                </ul>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};