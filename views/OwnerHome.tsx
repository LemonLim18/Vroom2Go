
import React, { useState } from 'react';
import { MOCK_SERVICES, MOCK_SHOPS } from '../constants';
// Added missing Wrench import
import { Search, MapPin, Star, Zap, Gauge, ArrowRight, Wrench } from 'lucide-react';
import { Service, Shop } from '../types';

interface OwnerHomeProps {
  onServiceSelect: (service: Service) => void;
  onShopSelect: (shop: Shop) => void;
}

export const OwnerHome: React.FC<OwnerHomeProps> = ({ onServiceSelect, onShopSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredServices = MOCK_SERVICES.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-700 slide-in-from-bottom-4">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-slate-900 rounded-[2rem] border border-white/5 shadow-2xl">
        {/* Background Accents */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-[100px]"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-primary/5 rounded-full blur-[80px]"></div>
        
        <div className="p-8 md:p-12 lg:p-16 relative z-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-6 border border-primary/20">
               <Zap className="w-3 h-3" /> Pit Stop Ready
            </div>
            <h1 className="text-5xl md:text-6xl font-black mb-6 italic uppercase tracking-tighter leading-none">
              Elite Service for your <span className="text-primary">Machine.</span>
            </h1>
            <p className="text-lg text-slate-400 mb-8 font-medium">
              Join the marketplace of verified performance mechanics. Clear pricing, high speed, zero hassle.
            </p>
            
            <div className="join w-full max-w-lg shadow-2xl shadow-black/40 border border-white/10 p-1 bg-slate-800 rounded-2xl">
              <div className="flex items-center px-4 w-full">
                <Search className="w-5 h-5 text-slate-500" />
                <input 
                  className="input input-ghost w-full bg-transparent focus:outline-none focus:text-white" 
                  placeholder="Need a diagnostic, oil change, or repair?"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button className="btn btn-primary rounded-xl px-8 uppercase font-black italic">Go</button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Categories */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { name: 'Maintenance', icon: Gauge },
          { name: 'Repair', icon: Wrench },
          { name: 'Diagnostics', icon: Zap },
          { name: 'Pit Crew', icon: MapPin }
        ].map((cat) => (
          <div 
            key={cat.name} 
            className="group glass-card hover:bg-slate-800/80 transition-all cursor-pointer rounded-2xl p-6 border border-white/5 hover:border-primary/30 text-center"
            onClick={() => setSearchTerm(cat.name)}
          >
            <cat.icon className="w-8 h-8 mx-auto mb-3 text-slate-500 group-hover:text-primary transition-colors" />
            <h3 className="font-black uppercase italic tracking-tighter">{cat.name}</h3>
          </div>
        ))}
      </div>

      {/* Popular Services */}
      <div>
        <div className="flex justify-between items-end mb-8">
           <div>
             <h2 className="text-3xl font-black uppercase italic tracking-tighter">Essential Maintenance</h2>
             <p className="text-slate-500 font-medium">Top booked services this week</p>
           </div>
           <button className="btn btn-link btn-sm text-primary no-underline hover:underline font-bold">See Pit List</button>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <div key={service.id} className="glass-card rounded-3xl p-6 hover:shadow-[0_0_30px_rgba(250,204,21,0.05)] transition-all border border-white/5 group">
              <div className="badge bg-slate-800 text-slate-400 border-none font-bold text-[10px] uppercase mb-4">{service.category}</div>
              <h2 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{service.name}</h2>
              <p className="text-sm text-slate-400 mb-6">{service.description}</p>
              
              <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                 <div>
                   <span className="text-[10px] uppercase font-black text-slate-600 block mb-1">Starts at</span>
                   <div className="text-2xl font-black italic tracking-tighter text-white">{service.priceRange['Sedan'].split('-')[0]}</div>
                 </div>
                 <button className="btn btn-circle btn-primary" onClick={() => onServiceSelect(service)}>
                    <ArrowRight className="w-5 h-5" />
                 </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Shops */}
      <div className="pb-12">
        <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-8">Top Verified Shops</h2>
        <div className="flex overflow-x-auto gap-6 pb-6 scrollbar-hide">
          {MOCK_SHOPS.map((shop) => (
            <div key={shop.id} className="glass-card w-80 flex-shrink-0 rounded-3xl overflow-hidden border border-white/5 group cursor-pointer hover:border-primary/20" onClick={() => onShopSelect(shop)}>
              <div className="h-44 relative overflow-hidden">
                <img src={shop.image} alt={shop.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
                {shop.verified && (
                    <div className="absolute top-4 right-4 badge badge-primary font-black italic shadow-xl">VERIFIED</div>
                )}
                <div className="absolute bottom-4 left-4 flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-xs font-bold text-white">
                  <Star className="w-3 h-3 text-primary fill-primary" />
                  {shop.rating}
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-black text-xl mb-1 uppercase italic">{shop.name}</h3>
                <div className="flex items-center text-xs text-slate-400 gap-2 mb-4">
                  <MapPin className="w-3 h-3 text-primary" />
                  {shop.distance} • {shop.address}
                </div>
                <button className="btn btn-sm btn-outline border-slate-700 text-slate-300 hover:bg-primary hover:text-black hover:border-primary w-full rounded-xl uppercase font-bold italic">Details</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
