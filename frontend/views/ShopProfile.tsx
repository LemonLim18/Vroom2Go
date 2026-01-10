import React, { useState, useMemo } from 'react';
import { Shop, Service, ServiceCategory } from '../types';
import { MOCK_SERVICES } from '../constants';
import { 
  ShieldCheck, 
  Star, 
  MapPin, 
  Clock, 
  CheckCircle, 
  MessageCircle, 
  ChevronRight, 
  Share2, 
  Heart,
  Wrench,
  Settings,
  Stethoscope,
  Navigation,
  ExternalLink,
  Award,
  Phone
} from 'lucide-react';

interface ShopProfileProps {
  shop: Shop;
  onBack: () => void;
  onBook: (shop: Shop, serviceId?: string) => void;
  onMessage: (shop: Shop) => void;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  [ServiceCategory.MAINTENANCE]: Wrench,
  [ServiceCategory.REPAIR]: Settings,
  [ServiceCategory.DIAGNOSTIC]: Stethoscope,
};

export const ShopProfile: React.FC<ShopProfileProps> = ({ shop, onBack, onBook, onMessage }) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const getServiceDetails = (id: string) => MOCK_SERVICES.find(s => s.id === id);

  // Group services by category
  const servicesByCategory = useMemo(() => {
    const grouped: Record<string, { service: Service; price: string }[]> = {};
    
    if (Array.isArray(shop.services)) {
        shop.services.forEach((shopService: any) => {
            // Handle both structure types:
            // 1. Backend: { service: { ... }, customPrice: "..." }
            // 2. Frontend Mock: "service_id_string" (legacy)
            
            let service: Service | undefined;
            let price = 'Quote';

            if (typeof shopService === 'string') {
                service = getServiceDetails(shopService);
                price = shop.customPrices?.[shopService] || 'Quote';
            } else if (shopService.service) {
                service = shopService.service;
                price = shopService.customPrice || 'Quote';
            }

            if (service) {
                if (!grouped[service.category]) {
                grouped[service.category] = [];
                }
                grouped[service.category].push({
                service,
                price
                });
            }
        });
    }
    return grouped;
  }, [shop.services, shop.customPrices]);

  const categories = Object.keys(servicesByCategory);

  // Set default active category
  React.useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

  // Scroll to top on mount
  React.useEffect(() => {
    // Since Layout uses a scrollable <main>, window.scrollTo(0,0) doesn't work.
    // We need to scroll the main container.
    const mainContainer = document.querySelector('main');
    if (mainContainer) {
      mainContainer.scrollTo({ top: 0, behavior: 'auto' });
    } else {
        window.scrollTo(0, 0);
    }
  }, []);

  // Create Google Maps embed URL from address
  const getMapEmbedUrl = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    return `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodedAddress}&zoom=15`;
  };

  // Google Maps directions URL
  const getDirectionsUrl = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    return `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
  };

  return (
    <div className="animate-in fade-in duration-500 slide-in-from-bottom-4 space-y-8">
      {/* Back Button */}
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
            <img src={shop.image || shop.imageUrl || "https://images.unsplash.com/photo-1486006920555-c77dcf18193c?auto=format&fit=crop&q=80&w=1000"} alt={shop.name} className="w-full h-full object-cover grayscale-[0.2] hover:grayscale-0 transition-all duration-700" />
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
        {/* Main Content - About, Services, Reviews */}
        <div className="lg:col-span-2 space-y-10">
          
          {/* ============ ABOUT SECTION ============ */}
          <section>
            <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-6 flex items-center gap-2">
              <ChevronRight className="w-6 h-6 text-primary" /> About This Shop
            </h2>
            
            <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-6">
              <p className="text-slate-300 leading-relaxed">{shop.description}</p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
                  <div className="flex items-center gap-3 mb-3">
                    <Clock className="w-5 h-5 text-primary" />
                    <span className="font-bold">Business Hours</span>
                  </div>
                  <div className="space-y-1 text-sm text-slate-400">
                    <div className="flex justify-between"><span>Mon - Fri</span><span className="text-white">8:00 AM - 6:00 PM</span></div>
                    <div className="flex justify-between"><span>Saturday</span><span className="text-white">9:00 AM - 4:00 PM</span></div>
                    <div className="flex justify-between"><span>Sunday</span><span className="text-slate-500">Closed</span></div>
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
                  <div className="flex items-center gap-3 mb-3">
                    <Award className="w-5 h-5 text-primary" />
                    <span className="font-bold">Certifications</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> ASE Master Technician</div>
                    <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> EPA Certified</div>
                    <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> BBB Accredited</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ============ SERVICES SECTION ============ */}
          <section>
            <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-6 flex items-center gap-2">
              <ChevronRight className="w-6 h-6 text-primary" /> Service Menu
              <span className="badge badge-primary badge-sm ml-2">{shop.services.length}</span>
            </h2>

            {/* Category Tabs */}
            <div className="tabs tabs-boxed bg-slate-800/50 p-1 mb-6 w-fit">
              {categories.map(cat => {
                const Icon = CATEGORY_ICONS[cat] || Wrench;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`tab gap-2 ${activeCategory === cat ? 'tab-active bg-primary text-black' : ''}`}
                  >
                    <Icon className="w-4 h-4" />
                    {cat}
                    <span className={`badge badge-xs ${activeCategory === cat ? 'bg-black/20' : 'badge-ghost'}`}>
                      {servicesByCategory[cat].length}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Services for Active Category */}
            {activeCategory && servicesByCategory[activeCategory] && (
              <div className="glass-card rounded-2xl border border-white/5 overflow-hidden animate-fade-in">
                <div className="divide-y divide-white/5">
                  {servicesByCategory[activeCategory].map(({ service, price }) => (
                    <div 
                      key={service.id} 
                      className="px-6 py-5 flex items-center justify-between hover:bg-primary/5 transition-colors group"
                    >
                      <div className="flex-1">
                        <h4 className="font-bold text-lg">{service.name}</h4>
                        <p className="text-sm text-slate-400 line-clamp-1">{service.description}</p>
                        {service.duration && (
                          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Est. {service.duration}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-2xl font-black text-primary">{price}</span>
                        <button 
                          onClick={() => onBook(shop, service.id)}
                          className="btn btn-sm btn-ghost group-hover:btn-primary font-bold"
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* ============ REVIEWS SECTION ============ */}
          <section>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-2">
                <ChevronRight className="w-6 h-6 text-primary" /> Customer Reviews
                <span className="badge badge-primary badge-sm ml-2">{shop.reviews.length}</span>
              </h2>
              <select className="select select-sm bg-slate-800 border-white/10">
                <option>Most Recent</option>
                <option>Highest Rated</option>
                <option>Lowest Rated</option>
              </select>
            </div>

            <div className="space-y-4">
              {shop.reviews && shop.reviews.length > 0 ? (
                shop.reviews.map((review: any) => {
                  // Handle backend vs frontend structure
                  const authorName = review.user?.name || review.author || 'Anonymous';
                  const dateDisplay = review.createdAt 
                    ? new Date(review.createdAt).toLocaleDateString() 
                    : review.date || 'Recently';

                  return (
                    <div key={review.id} className="glass-card rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-all">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="avatar placeholder">
                            <div className="bg-slate-800 text-primary border border-white/10 rounded-xl w-12 font-black">
                              <span>{authorName.charAt(0)}</span>
                            </div>
                          </div>
                          <div>
                            <div className="font-bold">{authorName}</div>
                            <div className="text-xs text-slate-500">{dateDisplay}</div>
                          </div>
                        </div>
                        <div className="flex text-primary">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-slate-700'}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-slate-300">"{review.comment}"</p>
                      {review.serviceName && (
                        <div className="mt-4 inline-flex items-center gap-1 bg-slate-800 px-3 py-1 rounded-full text-xs font-bold text-slate-400 border border-white/5">
                          <CheckCircle className="w-3 h-3 text-green-400" /> Verified: {review.serviceName}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-10 opacity-50">
                    <MessageCircle className="w-10 h-10 mx-auto mb-2" />
                    <p>No reviews yet. Be the first to review!</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* ============ SIDEBAR ============ */}
        <div className="space-y-6">
           <div className="glass-card rounded-3xl p-6 border border-white/5 sticky top-24">
              <h3 className="text-lg font-black italic uppercase tracking-tighter mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" /> Location
              </h3>
              
              {/* Embedded Google Map */}
              <div className="w-full h-48 rounded-2xl overflow-hidden mb-4 border border-white/10">
                <iframe
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={getMapEmbedUrl(shop.address)}
                  title={`Map showing ${shop.name} location`}
                ></iframe>
              </div>

              <div className="text-sm space-y-2 mb-4">
                <p className="font-bold text-white">{shop.address}</p>
                <p className="text-slate-400 flex items-center gap-1">
                  <Navigation className="w-3 h-3" /> {shop.distance} from your location
                </p>
              </div>
              
              <a 
                href={getDirectionsUrl(shop.address)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline border-slate-700 text-white hover:bg-primary hover:text-black w-full rounded-xl gap-2 mb-3"
              >
                <Navigation className="w-4 h-4" />
                Get Directions
                <ExternalLink className="w-3 h-3" />
              </a>

              <button className="btn btn-ghost w-full rounded-xl gap-2 text-slate-400 hover:text-white">
                <Phone className="w-4 h-4" />
                Call Shop
              </button>
              
              <div className="mt-6 p-5 bg-primary rounded-2xl text-black">
                <h3 className="font-black italic uppercase tracking-tighter mb-2">Vroom Guarantee</h3>
                <ul className="space-y-2 text-xs font-bold">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Locked Pricing</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> 12mo Warranty</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Secure Payments</li>
                </ul>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};