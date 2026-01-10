import React, { useState, useMemo, useEffect } from 'react';
import { Service, ServiceCategory, Shop, CarType } from '../types';
import { MOCK_SERVICES, MOCK_SHOPS } from '../constants';
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
  Stethoscope
} from 'lucide-react';
import api from '../services/api';

interface ServicesPageProps {
  onServiceSelect: (service: Service) => void;
  onShopSelect: (shop: Shop) => void;
}

type ViewMode = 'grid' | 'list';
type SortOption = 'popular' | 'price-low' | 'price-high' | 'name';

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  [ServiceCategory.MAINTENANCE]: Wrench,
  [ServiceCategory.REPAIR]: Settings,
  [ServiceCategory.DIAGNOSTIC]: Stethoscope,
};

export const ServicesPage: React.FC<ServicesPageProps> = ({ onServiceSelect, onShopSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [showFilters, setShowFilters] = useState(false);

  const [services, setServices] = useState<Service[]>(MOCK_SERVICES); // Fallback or API
  const [shops, setShops] = useState<Shop[]>([]);

  useEffect(() => {
    // Fetch Shops
    const fetchShops = async () => {
        try {
            const { data } = await api.get('/shops');
            // Map API data to ensure consistent field naming and userId is present
            const mappedShops = data.map((s: any) => ({
              id: s.id,
              userId: s.userId, // CRITICAL for messaging
              name: s.name,
              address: s.address,
              image: s.imageUrl || s.image_url || 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&q=80&w=1000',
              imageUrl: s.imageUrl || s.image_url,
              rating: Number(s.rating) || 0,
              reviewCount: s._count?.reviews || s.review_count || 0,
              verified: s.verified,
              distance: '2.5 miles',
              services: ['General Maintenance', 'Diagnostics'],
              customPrices: {},
              reviews: []
            }));
            setShops(mappedShops);
        } catch (error) {
            console.error('Failed to fetch shops', error);
        }
    };
    fetchShops();
  }, []);

  // All categories
  const categories = useMemo(() => {
    const cats = [...new Set(services.map(s => s.category))];
    return cats.map(cat => ({
      name: cat,
      count: services.filter(s => s.category === cat).length,
      icon: CATEGORY_ICONS[cat] || Wrench
    }));
  }, [services]);

  // Filtered and sorted services
  const filteredServices = useMemo(() => {
    let result = services.filter(service => {
      const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           service.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategory || service.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    // Sort
    switch (sortBy) {
      case 'name':
        result = result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'price-low':
        result = result.sort((a, b) => {
          const aMin = parseInt(a.priceRange[CarType.SEDAN]?.replace(/[^0-9]/g, '') || '0');
          const bMin = parseInt(b.priceRange[CarType.SEDAN]?.replace(/[^0-9]/g, '') || '0');
          return aMin - bMin;
        });
        break;
      case 'price-high':
        result = result.sort((a, b) => {
          const aMin = parseInt(a.priceRange[CarType.SEDAN]?.replace(/[^0-9]/g, '') || '0');
          const bMin = parseInt(b.priceRange[CarType.SEDAN]?.replace(/[^0-9]/g, '') || '0');
          return bMin - aMin;
        });
        break;
      default:
        // Popular - keep original order (assume it's by popularity)
        break;
    }

    return result;
  }, [searchTerm, selectedCategory, sortBy, services]);

  // Featured services
  const featuredServices = services.slice(0, 3);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter">
            All <span className="text-primary">Services</span>
          </h1>
          <p className="text-slate-400 mt-1">
            Browse {MOCK_SERVICES.length} professional automotive services
          </p>
        </div>

        {/* View Toggle & Sort */}
        <div className="flex items-center gap-3">
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="select select-sm bg-slate-800 border-white/10"
          >
            <option value="popular">Most Popular</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="name">Name A-Z</option>
          </select>
          
          <div className="btn-group">
            <button 
              onClick={() => setViewMode('grid')}
              className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-ghost'}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-ghost'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-card rounded-2xl p-4 border border-white/5">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search services (oil change, brakes, tune-up...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input w-full pl-12 bg-slate-800/50 border-white/5 focus:border-primary"
            />
          </div>

          {/* Filter Toggle */}
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`btn gap-2 ${showFilters ? 'btn-primary' : 'btn-ghost'}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {selectedCategory && <span className="badge badge-xs">1</span>}
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-white/5 animate-fade-in">
            <p className="text-sm text-slate-400 mb-3">Filter by Category</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`btn btn-sm ${!selectedCategory ? 'btn-primary' : 'btn-ghost'}`}
              >
                All Services
              </button>
              {categories.map(cat => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.name}
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`btn btn-sm gap-2 ${selectedCategory === cat.name ? 'btn-primary' : 'btn-ghost'}`}
                  >
                    <Icon className="w-4 h-4" />
                    {cat.name}
                    <span className="badge badge-xs">{cat.count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Featured Services Banner */}
      <div className="glass-card rounded-2xl p-6 border border-primary/20 bg-primary/5">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-primary">Featured Services</h3>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {featuredServices.map(service => (
            <div 
              key={service.id}
              onClick={() => onServiceSelect(service)}
              className="bg-slate-800/50 rounded-xl p-4 cursor-pointer hover:bg-slate-800 transition-all border border-transparent hover:border-primary/30"
            >
              <h4 className="font-bold">{service.name}</h4>
              <p className="text-sm text-slate-400 mt-1">{service.priceRange[CarType.SEDAN]}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-slate-400">
          Showing <span className="text-white font-bold">{filteredServices.length}</span> services
          {selectedCategory && <span> in <span className="text-primary">{selectedCategory}</span></span>}
        </p>
        {selectedCategory && (
          <button onClick={() => setSelectedCategory(null)} className="btn btn-ghost btn-xs">
            Clear Filter
          </button>
        )}
      </div>

      {/* Services Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredServices.map(service => {
            const CategoryIcon = CATEGORY_ICONS[service.category] || Wrench;
            return (
              <div 
                key={service.id}
                onClick={() => onServiceSelect(service)}
                className="glass-card rounded-2xl p-5 border border-white/5 cursor-pointer hover:border-primary/30 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <CategoryIcon className="w-6 h-6 text-primary" />
                  </div>
                  <span className="badge badge-ghost badge-sm">{service.category}</span>
                </div>
                
                <h3 className="font-bold text-lg mb-2">{service.name}</h3>
                <p className="text-sm text-slate-400 line-clamp-2 mb-4">{service.description}</p>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500">Starting from</p>
                    <p className="text-xl font-black text-primary">{service.priceRange[CarType.SEDAN]}</p>
                  </div>
                  <button className="btn btn-ghost btn-sm gap-1 group-hover:btn-primary">
                    View <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // List View
        <div className="space-y-3">
          {filteredServices.map(service => {
            const CategoryIcon = CATEGORY_ICONS[service.category] || Wrench;
            return (
              <div 
                key={service.id}
                onClick={() => onServiceSelect(service)}
                className="glass-card rounded-xl p-4 border border-white/5 cursor-pointer hover:border-primary/30 transition-all flex items-center gap-4"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <CategoryIcon className="w-7 h-7 text-primary" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold">{service.name}</h3>
                    <span className="badge badge-ghost badge-xs">{service.category}</span>
                  </div>
                  <p className="text-sm text-slate-400 truncate">{service.description}</p>
                </div>
                
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-slate-500">From</p>
                  <p className="text-xl font-black text-primary">{service.priceRange[CarType.SEDAN]}</p>
                </div>
                
                <ChevronRight className="w-5 h-5 text-slate-500 flex-shrink-0" />
              </div>
            );
          })}
        </div>
      )}

      {/* No Results */}
      {filteredServices.length === 0 && (
        <div className="text-center py-12">
          <Wrench className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="font-bold text-lg">No services found</h3>
          <p className="text-slate-400">Try adjusting your search or filters</p>
          <button onClick={() => { setSearchTerm(''); setSelectedCategory(null); }} className="btn btn-primary btn-sm mt-4">
            Clear All
          </button>
        </div>
      )}

      {/* Popular Shops Section */}
      <div className="pt-8 border-t border-white/5">
        <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-6">
          Top Rated <span className="text-primary">Shops</span>
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(shops.length > 0 ? shops : MOCK_SHOPS.slice(0, 4)).map(shop => (
            <div 
              key={shop.id}
              onClick={() => onShopSelect(shop)}
              className="glass-card rounded-xl p-4 border border-white/5 cursor-pointer hover:border-primary/30 transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <img 
                  src={shop.image} 
                  alt={shop.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div>
                  <h4 className="font-bold text-sm">{shop.name}</h4>
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Star className="w-3 h-3 text-primary fill-primary" />
                    {shop.rating} ({shop.reviewCount})
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-400 line-clamp-1">{shop.services?.slice(0, 3).join(', ') || 'Full Service'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
