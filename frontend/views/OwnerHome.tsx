
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { MOCK_SERVICES, MOCK_DIAGNOSTIC_PACKAGES, MOCK_VEHICLES } from '../constants';
import { Search, MapPin, Star, Zap, Gauge, ArrowRight, Wrench, Car, ChevronLeft, ChevronRight, Sparkles, Clock, ShieldCheck, Gift, TrendingUp, Calendar, Stethoscope } from 'lucide-react';
import { Service, Shop, DiagnosticPackage } from '../types';

interface OwnerHomeProps {
  onServiceSelect: (service: Service) => void;
  onShopSelect: (shop: Shop) => void;
  onNavigate?: (view: string) => void;
}

// Promotions data
const PROMOTIONS = [
  {
    id: 'promo1',
    title: 'Winter Ready Package',
    description: 'Full inspection + battery check + fluid top-off',
    discount: '20% OFF',
    code: 'WINTER24',
    bgColor: 'from-blue-600 to-cyan-500',
    validUntil: '2024-02-29',
  },
  {
    id: 'promo2',
    title: 'First Time Customer',
    description: 'Get $25 off your first booking',
    discount: '$25 OFF',
    code: 'NEWDRIVER',
    bgColor: 'from-primary to-yellow-600',
    validUntil: '2024-12-31',
  },
  {
    id: 'promo3',
    title: 'Refer & Earn',
    description: 'Refer a friend, both get $15 credit',
    discount: '$15 EACH',
    code: 'REFER15',
    bgColor: 'from-purple-600 to-pink-500',
    validUntil: '2024-12-31',
  },
];

export const OwnerHome: React.FC<OwnerHomeProps> = ({ onServiceSelect, onShopSelect, onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);

  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch shops
  useEffect(() => {
    const fetchShops = async () => {
      try {
        const { data } = await api.get('/shops');
        // Map backend snake_case to frontend camelCase
        const mappedShops = data.map((s: any) => ({
          id: s.id,
          name: s.name,
          address: s.address,
          // Map fields
          image: s.image_url || 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&q=80&w=1000',
          rating: Number(s.rating) || 0,
          reviewCount: s.review_count || 0,
          verified: s.verified,
          laborRate: Number(s.labor_rate),
          warrantyDays: s.warranty_days,
          depositPercent: s.deposit_percent,
          // Mocks or calculated
          distance: '2.5 miles', 
          services: ['General Maintenance', 'Diagnostics'],
          availability: {}, 
          customPrices: {},
          reviews: [] 
        }));
        setShops(mappedShops);
      } catch (error) {
        console.error('Failed to fetch shops:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchShops();
  }, []);

  // Auto-rotate promotions
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentPromoIndex((prev) => (prev + 1) % PROMOTIONS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const filteredServices = MOCK_SERVICES.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const nextPromo = () => setCurrentPromoIndex((prev) => (prev + 1) % PROMOTIONS.length);
  const prevPromo = () => setCurrentPromoIndex((prev) => (prev - 1 + PROMOTIONS.length) % PROMOTIONS.length);

  return (
    <div className="space-y-10 animate-in fade-in duration-700 slide-in-from-bottom-4">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-slate-900 rounded-[2rem] border border-white/5 shadow-2xl">
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
              <button onClick={() => onNavigate?.('catalog')} className="btn btn-primary rounded-xl px-8 uppercase font-black italic">Go</button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button 
          onClick={() => onNavigate?.('vehicles')}
          className="glass-card rounded-2xl p-5 border border-white/5 hover:border-primary/30 transition-all group text-left"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-3 group-hover:bg-blue-500/20 transition-colors">
            <Car className="w-6 h-6 text-blue-400" />
          </div>
          <h3 className="font-bold">My Garage</h3>
          <p className="text-xs text-slate-400 mt-1">{MOCK_VEHICLES.length} vehicles</p>
        </button>
        
        <button 
          onClick={() => onNavigate?.('quote-request')}
          className="glass-card rounded-2xl p-5 border border-white/5 hover:border-primary/30 transition-all group text-left"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-bold">Get Quote</h3>
          <p className="text-xs text-slate-400 mt-1">Photo-based estimate</p>
        </button>
        
        <button 
          onClick={() => onNavigate?.('compare')}
          className="glass-card rounded-2xl p-5 border border-white/5 hover:border-primary/30 transition-all group text-left"
        >
          <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-3 group-hover:bg-green-500/20 transition-colors">
            <TrendingUp className="w-6 h-6 text-green-400" />
          </div>
          <h3 className="font-bold">Compare</h3>
          <p className="text-xs text-slate-400 mt-1">Side-by-side shops</p>
        </button>
        
        <button 
          onClick={() => onNavigate?.('bookings')}
          className="glass-card rounded-2xl p-5 border border-white/5 hover:border-primary/30 transition-all group text-left"
        >
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-3 group-hover:bg-purple-500/20 transition-colors">
            <Calendar className="w-6 h-6 text-purple-400" />
          </div>
          <h3 className="font-bold">Bookings</h3>
          <p className="text-xs text-slate-400 mt-1">Track appointments</p>
        </button>
      </div>

      {/* Promotions Carousel */}
      <div className="relative">
        <div className="overflow-hidden rounded-2xl">
          <div 
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${currentPromoIndex * 100}%)` }}
          >
            {PROMOTIONS.map((promo) => (
              <div 
                key={promo.id}
                className={`w-full flex-shrink-0 bg-gradient-to-r ${promo.bgColor} rounded-2xl p-6 md:p-8`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Gift className="w-5 h-5" />
                      <span className="text-sm font-bold opacity-90">LIMITED OFFER</span>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-black uppercase italic mb-2">{promo.title}</h3>
                    <p className="text-white/80 mb-4">{promo.description}</p>
                    <div className="flex items-center gap-4">
                      <span className="bg-black/20 backdrop-blur-sm px-4 py-2 rounded-lg font-mono font-bold">{promo.code}</span>
                      <span className="text-sm opacity-80">Valid until {promo.validUntil}</span>
                    </div>
                  </div>
                  <div className="text-right hidden md:block">
                    <span className="text-5xl font-black">{promo.discount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Carousel Controls */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <button onClick={prevPromo} className="btn btn-circle btn-ghost btn-sm">
            <ChevronLeft className="w-5 h-5" />
          </button>
          {PROMOTIONS.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPromoIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentPromoIndex ? 'bg-primary w-6' : 'bg-slate-600'
              }`}
            />
          ))}
          <button onClick={nextPromo} className="btn btn-circle btn-ghost btn-sm">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Diagnostic Packages */}
      <div>
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-2">
              <Stethoscope className="w-6 h-6 text-primary" />
              Diagnostic Packages
            </h2>
            <p className="text-slate-500 font-medium">Professional inspections at fixed prices</p>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {MOCK_DIAGNOSTIC_PACKAGES.map((pkg) => (
            <div 
              key={pkg.id}
              className="glass-card rounded-2xl p-5 border border-white/5 hover:border-primary/30 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="badge badge-outline badge-sm">{pkg.duration}</span>
                <span className="text-xl font-black text-primary">${pkg.price}</span>
              </div>
              <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{pkg.name}</h3>
              <p className="text-sm text-slate-400 mb-4">{pkg.description}</p>
              <ul className="space-y-1 text-xs text-slate-300">
                {pkg.includes.slice(0, 3).map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <ShieldCheck className="w-3 h-3 text-green-400" />
                    {item}
                  </li>
                ))}
                {pkg.includes.length > 3 && (
                  <li className="text-slate-500">+{pkg.includes.length - 3} more</li>
                )}
              </ul>
            </div>
          ))}
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
           <button onClick={() => onNavigate?.('catalog')} className="btn btn-link btn-sm text-primary no-underline hover:underline font-bold">See All</button>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {filteredServices.slice(0, 6).map((service) => (
            <div key={service.id} className="glass-card rounded-3xl p-6 hover:shadow-[0_0_30px_rgba(250,204,21,0.05)] transition-all border border-white/5 group">
              <div className="flex items-center gap-2 mb-4">
                <div className="badge bg-slate-800 text-slate-400 border-none font-bold text-[10px] uppercase">{service.category}</div>
                {service.warranty && (
                  <div className="badge badge-success badge-xs gap-1">
                    <ShieldCheck className="w-2 h-2" /> {service.warranty}
                  </div>
                )}
              </div>
              <h2 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{service.name}</h2>
              <p className="text-sm text-slate-400 mb-4">{service.description}</p>
              
              {service.includes && (
                <ul className="text-xs text-slate-400 mb-4 space-y-1">
                  {service.includes.slice(0, 2).map((item, i) => (
                    <li key={i} className="flex items-center gap-1">
                      <span className="text-green-400">✓</span> {item}
                    </li>
                  ))}
                </ul>
              )}
              
              <div className="pt-4 border-t border-white/5 flex justify-between items-center">
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
        <div className="flex justify-between items-end mb-8">
          <h2 className="text-3xl font-black uppercase italic tracking-tighter">Top Verified Shops</h2>
          <button 
            onClick={() => onNavigate?.('compare')}
            className="btn btn-link btn-sm text-primary no-underline hover:underline font-bold"
          >
            Compare All
          </button>
        </div>
        <div className="flex overflow-x-auto gap-6 pb-6 scrollbar-hide">
          {loading ? (
             <div className="flex gap-6 w-full">
               {[1, 2, 3].map(i => (
                 <div key={i} className="skeleton w-80 h-96 rounded-3xl opacity-10"></div>
               ))}
             </div>
          ) : (
            shops.map((shop) => (
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
                <h3 className="font-black text-xl mb-1 uppercase italic truncate">{shop.name}</h3>
                <div className="flex items-center text-xs text-slate-400 gap-2 mb-3">
                  <MapPin className="w-3 h-3 text-primary" />
                  {shop.distance} • <span className="truncate max-w-[120px]">{shop.address}</span>
                </div>
                <div className="flex items-center gap-2 mb-4 text-xs">
                  {shop.laborRate && (
                    <span className="badge badge-ghost badge-sm border-white/10">${shop.laborRate}/hr</span>
                  )}
                  {shop.warrantyDays && (
                    <span className="badge badge-ghost badge-sm border-white/10">{shop.warrantyDays}d warranty</span>
                  )}
                </div>
                <button onClick={(e) => { e.stopPropagation(); onShopSelect(shop); }} className="btn btn-sm btn-outline border-slate-700 text-slate-300 hover:bg-primary hover:text-black hover:border-primary w-full rounded-xl uppercase font-bold italic">Details</button>
              </div>
            </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
