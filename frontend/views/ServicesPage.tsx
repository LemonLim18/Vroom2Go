import React, { useState, useMemo, useEffect } from 'react';
import { Service, ServiceCategory, Shop, CarType } from '../types';
// Using database data only - no mock fallbacks
import { 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Star, 
  Clock, 
  Wrench, 
  Sparkles,
  Car,
  Zap,
  Gauge,
  Settings,
  ChevronRight,
  SlidersHorizontal,
  Stethoscope,
  ShieldCheck,
  Info,
  MapPin,
  Phone
} from 'lucide-react';
import api from '../services/api';

interface ServicesPageProps {
  onServiceSelect: (service: Service) => void;
  onShopSelect: (shop: Shop) => void;
  onNavigate?: (view: string) => void;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  [ServiceCategory.MAINTENANCE]: Wrench,
  [ServiceCategory.REPAIR]: Settings,
  [ServiceCategory.DIAGNOSTIC]: Stethoscope,
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  [ServiceCategory.MAINTENANCE]: "Routine care to keep your vehicle running smoothly.",
  [ServiceCategory.REPAIR]: "Fixes for mechanical and electrical issues.",
  [ServiceCategory.DIAGNOSTIC]: "Identify problems with professional scanning tools.",
};

export const ServicesPage: React.FC<ServicesPageProps> = ({ onServiceSelect, onShopSelect, onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [servicesRes, shopsRes] = await Promise.all([
          api.get('/services'),
          api.get('/shops')
        ]);

        // Map Backend Services to Frontend Type
        const mappedServices: Service[] = servicesRes.data.map((s: any) => {
          const priceRange: any = {};
          if (Array.isArray(s.pricing)) {
            s.pricing.forEach((p: any) => {
              // Map backend enum (UPPERCASE) to frontend enum (Titlecase)
              const typeMap: any = { 'COMPACT': 'Compact', 'SEDAN': 'Sedan', 'SUV': 'SUV', 'LUXURY': 'Luxury', 'EV': 'Electric' };
              const key = typeMap[p.vehicleType] || p.vehicleType;
              priceRange[key] = `$${p.minPrice} - $${p.maxPrice}`;
            });
          }

          // Map backend category (MAINTENANCE) to frontend format (Maintenance)
          const categoryMap: any = { 'MAINTENANCE': 'Maintenance', 'REPAIR': 'Repair', 'DIAGNOSTIC': 'Diagnostic' };
          const mappedCategory = categoryMap[s.category] || s.category;

          return {
            id: String(s.id),
            name: s.name,
            category: mappedCategory,
            description: s.description,
            duration: s.durationEst ? `${s.durationEst} mins` : '60 mins',
            warranty: s.warranty,
            includes: s.includes || [],
            priceRange: Object.keys(priceRange).length > 0 ? priceRange : { 'Sedan': 'Call for price' }
          };
        });

        setServices(mappedServices);

        // Map Shops
        const mappedShops = shopsRes.data.map((s: any) => ({
          id: s.id,
          userId: s.userId,
          name: s.name,
          address: s.address,
          image: s.imageUrl || 'https://images.unsplash.com/photo-1486006920555-c77dcf18193c?auto=format&fit=crop&q=80&w=1000',
          imageUrl: s.imageUrl,
          rating: Number(s.rating) || 0,
          reviewCount: s.reviewCount || 0,
          verified: s.verified,
          distance: s.distance || '2.4 km',
          services: s.services || [], // Preserve full objects for ShopProfile
        }));
        setShops(mappedShops);

      } catch (error) {
        console.error('Failed to fetch data', error);
        // No fallback - show empty if database fails
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Group services by category
  const groupedServices = useMemo(() => {
    // First filter by search
    const filtered = services.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Then group
    const groups: Record<string, Service[]> = {};
    
    // Ensure fixed order of categories
    const categories = [ServiceCategory.MAINTENANCE, ServiceCategory.DIAGNOSTIC, ServiceCategory.REPAIR];
    
    categories.forEach(cat => {
      groups[cat] = filtered.filter(s => s.category === cat);
    });

    return groups;
  }, [services, searchTerm]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <span className="loading loading-bars loading-lg text-primary"></span>
        <p className="mt-4 text-slate-500 font-medium animate-pulse">Loading Services...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-fade-in pb-12">
      {/* Hero Header */}
      <div className="text-center space-y-4 py-8">
        <h1 className="text-5xl font-black uppercase italic tracking-tighter">
          Vehicle <span className="text-primary">Services</span>
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-lg">
          Professional maintenance, diagnostics, and repairs for your vehicle.
          Choose a service to compare quotes from top-rated local shops.
        </p>
        
        {/* Centered Search */}
        <div className="max-w-md mx-auto relative mt-6">
          <input
            type="text"
            placeholder="Search for a service..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input w-full pl-12 bg-slate-800/50 border-white/5 focus:border-primary focus:bg-slate-800 rounded-full h-12 shadow-lg"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        </div>
      </div>

      {/* Featured Shops Section - Premium Redesign */}
      <div className="relative">
        {/* Background Glows */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-primary/20 blur-[120px] rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 blur-[150px] rounded-full translate-x-1/3 translate-y-1/3 pointer-events-none" />

        <div className="glass-card rounded-[2.5rem] p-10 border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-800/40 to-slate-900/80 backdrop-blur-3xl relative overflow-hidden shadow-2xl">
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-2">
                  <Star className="w-3 h-3 fill-primary" /> Top Rated
                </div>
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase pr-2">
                  Trusted <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-yellow-200 to-primary">Service Centers</span>
                </h2>
                <p className="text-slate-400 text-lg max-w-xl">
                  Connect with the highest rated certified mechanics. Verified expertise and guaranteed quality.
                </p>
              </div>
              <button onClick={() => onNavigate?.('home')} className="btn btn-ghost btn-sm group text-slate-400 hover:text-primary gap-2">
                View all shops <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {shops.slice(0, 4).map((shop, idx) => (
                <div 
                  key={shop.id}
                  className="group flip-card h-[380px]"
                >
                  <div className="flip-card-inner">
                    {/* Front Face */}
                    <div className="flip-card-front relative bg-slate-900/40 backdrop-blur-md p-6 border border-white/5 overflow-hidden">
                      {/* Card Glow */}
                      <div className="absolute -inset-1 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
                      
                      <div className="relative z-10">
                        <div className="relative w-16 h-16 mb-6">
                          <img 
                            src={shop.image} 
                            alt={shop.name}
                            className="w-full h-full rounded-2xl object-cover ring-4 ring-white/5 group-hover:ring-primary/30 transition-all duration-500 scale-100 group-hover:scale-110"
                          />
                          <div className="absolute -bottom-2 -right-2 bg-primary rounded-lg p-1.5 shadow-lg shadow-primary/20 transform group-hover:rotate-12 transition-transform">
                            <ShieldCheck className="w-4 h-4 text-black" />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-yellow-400/10 text-yellow-400 text-xs font-bold">
                              <Star className="w-3 h-3 fill-yellow-400" />
                              {shop.rating}
                            </div>
                            <span className="text-xs text-slate-500 font-medium">{shop.reviewCount} reviews</span>
                          </div>

                          <h4 className="text-xl font-black uppercase italic tracking-tight group-hover:text-primary transition-colors truncate">
                            {shop.name}
                          </h4>

                          <div className="flex flex-wrap gap-1.5">
                            {shop.services && shop.services.length > 0 ? (
                              shop.services.slice(0, 2).map((s: any, i: number) => (
                                <span key={i} className="px-2 py-1 rounded-md bg-white/5 text-[10px] text-slate-300 font-semibold uppercase tracking-wider">
                                  {s.service?.name || 'Service'}
                                </span>
                              ))
                            ) : (
                              <span className="px-2 py-1 rounded-md bg-white/5 text-[10px] text-slate-300 font-semibold uppercase tracking-wider">
                                General
                              </span>
                            )}
                          </div>

                          <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {shop.distance || '2.4 km'}
                            </span>
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-black transition-all">
                              <ChevronRight className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Back Face */}
                    <div 
                      className="flip-card-back flex flex-col items-center justify-center p-6 border border-primary/20 bg-gradient-to-br from-slate-900 to-black text-center"
                      onClick={() => onShopSelect(shop)}
                    >
                      <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <Phone className="w-6 h-6 text-primary" />
                      </div>
                      
                      <h4 className="text-xl font-black uppercase italic text-white mb-2 line-clamp-1">{shop.name}</h4>
                      <p className="text-slate-400 text-xs mb-6 flex items-start justify-center gap-2 max-w-[200px]">
                        <MapPin className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                        {shop.address || "123 Racing Way, Motor City"}
                      </p>
                      
                      <div className="w-full space-y-2">
                        <button className="btn btn-primary w-full btn-sm rounded-xl uppercase font-bold italic shadow-lg shadow-primary/20">
                          Book Now
                        </button>
                        <button className="btn btn-ghost btn-xs w-full text-slate-500">
                           View Full Profile
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Service Categories */}
      <div className="space-y-16">
        <div className="divider">BROWSE SERVICES</div>
        
        {Object.entries(groupedServices).map(([category, categoryServices]) => {
          if (categoryServices.length === 0) return null;
          
          const Icon = CATEGORY_ICONS[category] || Wrench;
          
          return (
            <div key={category} className="space-y-6">
              {/* Category Header */}
              <div className="flex items-end gap-4 border-b border-white/5 pb-4 px-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    {category}
                    <span className="badge badge-neutral text-xs">{categoryServices.length}</span>
                  </h2>
                  <p className="text-sm text-slate-400">{CATEGORY_DESCRIPTIONS[category] || "Professional services"}</p>
                </div>
              </div>

              {/* Service Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryServices.map((service) => (
                  <div 
                    key={service.id}
                    onClick={() => onServiceSelect(service)}
                    className="group glass-card rounded-2xl p-6 border border-white/5 cursor-pointer hover:border-primary/50 transition-all hover:bg-slate-800/80 relative overflow-hidden"
                  >
                    {/* Hover Glow Effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="relative">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                          {service.name}
                        </h3>
                        <Clock className="w-4 h-4 text-slate-500 shrink-0 mt-1" />
                      </div>
                      
                      <p className="text-slate-400 text-sm mb-6 line-clamp-2 min-h-[2.5rem]">
                        {service.description}
                      </p>

                      <div className="flex items-center justify-between mt-auto">
                        <div className="text-sm">
                          <span className="text-slate-500">Est. </span>
                          <span className="font-mono font-bold text-white">
                            {service.priceRange[CarType.SEDAN]}
                          </span>
                        </div>
                        
                        <button className="btn btn-circle btn-sm btn-ghost bg-white/5 group-hover:bg-primary group-hover:text-black transition-colors">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-white/5 flex gap-3 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {service.duration}
                        </div>
                        {service.warranty && (
                          <div className="flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            Warranty
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        
        {/* Empty State */}
        {Object.values(groupedServices).every(arr => arr.length === 0) && (
          <div className="text-center py-20">
            <Search className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold">No services found</h3>
            <p className="text-slate-400">We couldn't find any services matching "{searchTerm}"</p>
            <button 
              onClick={() => setSearchTerm('')}
              className="btn btn-primary btn-sm mt-4"
            >
              Clear Search
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
