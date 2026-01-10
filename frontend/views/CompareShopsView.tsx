import React, { useState } from 'react';
import { Shop, Service, Quote, CarType } from '../types';
import { MOCK_SHOPS, MOCK_SERVICES, MOCK_QUOTES } from '../constants';
import { formatCurrency, getConfidenceLabel } from '../services/quoteService';
import { 
  Star, 
  MapPin, 
  ShieldCheck, 
  Clock, 
  Award, 
  X, 
  ChevronRight,
  Check,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Minus
} from 'lucide-react';

interface CompareShopsViewProps {
  preSelectedShops?: Shop[];
  serviceId?: string;
  vehicleType?: CarType;
  onBack?: () => void;
  onSelectShop?: (shop: Shop) => void;
  onRequestQuote?: (shop: Shop) => void;
}

export const CompareShopsView: React.FC<CompareShopsViewProps> = ({
  preSelectedShops,
  serviceId,
  vehicleType = CarType.SEDAN,
  onBack,
  onSelectShop,
  onRequestQuote,
}) => {
  const [selectedShops, setSelectedShops] = useState<Shop[]>(
    preSelectedShops || MOCK_SHOPS.slice(0, 3)
  );
  const [showShopPicker, setShowShopPicker] = useState(false);

  const service = serviceId ? MOCK_SERVICES.find(s => s.id === serviceId) : null;

  // Get quotes for comparison if available
  const getShopQuote = (shopId: string | number): Quote | undefined => {
    return MOCK_QUOTES.find(q => q.shopId === String(shopId));
  };

  const addShop = (shop: Shop) => {
    if (selectedShops.length < 3 && !selectedShops.find(s => s.id === shop.id)) {
      setSelectedShops(prev => [...prev, shop]);
    }
    setShowShopPicker(false);
  };

  const removeShop = (shopId: string | number) => {
    setSelectedShops(prev => prev.filter(s => s.id !== shopId));
  };

  const getLowestPrice = (): number => {
    const prices = selectedShops.map(shop => {
      const quote = getShopQuote(shop.id);
      return quote?.estimatedTotal || 0;
    }).filter(p => p > 0);
    return Math.min(...prices);
  };

  const getComparisonValue = (current: number, lowest: number): 'best' | 'mid' | 'high' => {
    if (current === lowest) return 'best';
    if (current <= lowest * 1.15) return 'mid';
    return 'high';
  };

  const availableShops = MOCK_SHOPS.filter(
    shop => !selectedShops.find(s => s.id === shop.id)
  );

  return (
    <div className="animate-in fade-in duration-500">
      {/* Header */}
      <div className="mb-8">
        {onBack && (
          <button onClick={onBack} className="btn btn-ghost btn-sm mb-4">← Back</button>
        )}
        <h1 className="text-3xl font-black uppercase italic tracking-tighter">
          Compare <span className="text-primary">Shops</span>
        </h1>
        <p className="text-slate-400">
          Compare up to 3 shops side-by-side
          {service && <span> for <strong className="text-white">{service.name}</strong></span>}
        </p>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {selectedShops.map((shop, index) => {
          const quote = getShopQuote(shop.id);
          const lowestPrice = getLowestPrice();
          const priceValue = quote ? getComparisonValue(quote.estimatedTotal, lowestPrice) : null;
          const confidence = quote ? getConfidenceLabel(quote.confidence) : null;

          return (
            <div key={shop.id} className="glass-card rounded-3xl border border-white/5 overflow-hidden relative group">
              {/* Remove Button */}
              <button 
                onClick={() => removeShop(shop.id)}
                className="absolute top-3 right-3 z-10 btn btn-circle btn-ghost btn-sm opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Best Value Badge */}
              {priceValue === 'best' && quote && (
                <div className="absolute top-3 left-3 z-10 badge badge-success gap-1 font-bold">
                  <TrendingDown className="w-3 h-3" /> Best Price
                </div>
              )}

              {/* Shop Header */}
              <div className="h-32 relative overflow-hidden bg-slate-800">
                <img 
                  src={shop.image} 
                  alt={shop.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="font-black uppercase italic text-lg truncate">{shop.name}</h3>
                  <div className="flex items-center gap-2 text-sm">
                    {shop.verified && (
                      <span className="badge badge-primary badge-xs gap-1">
                        <ShieldCheck className="w-3 h-3" /> Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Shop Details */}
              <div className="p-5 space-y-4">
                {/* Rating & Distance */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-primary fill-primary" />
                    <div>
                      <span className="font-bold">{shop.rating}</span>
                      <span className="text-xs text-slate-400 ml-1">({shop.reviewCount})</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{shop.distance}</span>
                  </div>
                </div>

                <div className="divider my-2"></div>

                {/* Price Section */}
                <div className="space-y-2">
                  <p className="text-xs uppercase font-bold text-slate-500">Estimated Price</p>
                  {quote ? (
                    <div className="flex items-end gap-2">
                      <span className={`text-3xl font-black ${
                        priceValue === 'best' ? 'text-green-400' :
                        priceValue === 'mid' ? 'text-white' :
                        'text-orange-400'
                      }`}>
                        {formatCurrency(quote.estimatedTotal)}
                      </span>
                      {priceValue === 'high' && (
                        <TrendingUp className="w-5 h-5 text-orange-400 mb-1" />
                      )}
                    </div>
                  ) : (
                    <div className="text-2xl font-bold text-slate-500">
                      {shop.customPrices[serviceId || 's1'] || 'Request Quote'}
                    </div>
                  )}
                  {quote && (
                    <p className="text-xs text-slate-400">
                      Range: {formatCurrency(quote.estimatedRange.min)} - {formatCurrency(quote.estimatedRange.max)}
                    </p>
                  )}
                </div>

                {/* Confidence & Guarantee */}
                {quote && (
                  <div className="flex flex-wrap gap-2">
                    <span className={`badge badge-${confidence?.color} badge-sm`}>
                      {confidence?.label}
                    </span>
                    {quote.guaranteed ? (
                      <span className="badge badge-success badge-sm gap-1">
                        <Check className="w-3 h-3" /> Guaranteed
                      </span>
                    ) : (
                      <span className="badge badge-warning badge-sm gap-1">
                        <AlertCircle className="w-3 h-3" /> Estimate
                      </span>
                    )}
                  </div>
                )}

                <div className="divider my-2"></div>

                {/* Comparison Metrics */}
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Labor Rate</span>
                    <span className="font-bold">{shop.laborRate ? `$${shop.laborRate}/hr` : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Warranty</span>
                    <span className="font-bold">{shop.warrantyDays ? `${shop.warrantyDays} days` : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Deposit</span>
                    <span className="font-bold">{shop.depositPercent ? `${shop.depositPercent}%` : 'N/A'}</span>
                  </div>
                </div>

                {/* Line Items Preview */}
                {quote && quote.lineItems.length > 0 && (
                  <div className="mt-4 p-3 bg-slate-800/50 rounded-xl text-sm">
                    <p className="text-xs uppercase font-bold text-slate-500 mb-2">Quote Breakdown</p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-slate-300">
                        <span>Parts</span>
                        <span>{formatCurrency(quote.partsCostTotal)}</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Labor</span>
                        <span>{formatCurrency(quote.laborCostTotal)}</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Shop Fees</span>
                        <span>{formatCurrency(quote.shopFees)}</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Taxes</span>
                        <span>{formatCurrency(quote.taxes)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  {onSelectShop && (
                    <button 
                      onClick={() => onSelectShop(shop)}
                      className="btn btn-primary flex-1 rounded-xl"
                    >
                      Select
                    </button>
                  )}
                  {onRequestQuote && !quote && (
                    <button 
                      onClick={() => onRequestQuote(shop)}
                      className="btn btn-outline flex-1 rounded-xl"
                    >
                      Request Quote
                    </button>
                  )}
                  {!onSelectShop && !onRequestQuote && (
                    <button className="btn btn-primary flex-1 rounded-xl gap-1">
                      Book Now <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Add Shop Card */}
        {selectedShops.length < 3 && (
          <div 
            onClick={() => setShowShopPicker(true)}
            className="glass-card rounded-3xl border border-dashed border-white/10 min-h-[400px] flex flex-col items-center justify-center cursor-pointer hover:border-primary/30 transition-colors group"
          >
            <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
              <span className="text-3xl text-slate-500 group-hover:text-primary">+</span>
            </div>
            <p className="font-bold text-slate-400 group-hover:text-white">Add Shop to Compare</p>
            <p className="text-sm text-slate-500">{3 - selectedShops.length} slots remaining</p>
          </div>
        )}
      </div>

      {/* Comparison Summary */}
      {selectedShops.length >= 2 && (
        <div className="mt-8 glass-card rounded-2xl p-6 border border-white/5">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Quick Comparison
          </h3>
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Metric</th>
                  {selectedShops.map(shop => (
                    <th key={shop.id} className="text-center">{shop.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-medium">Rating</td>
                  {selectedShops.map(shop => (
                    <td key={shop.id} className="text-center">
                      <span className="flex items-center justify-center gap-1">
                        <Star className="w-4 h-4 text-primary fill-primary" />
                        {shop.rating}
                      </span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="font-medium">Distance</td>
                  {selectedShops.map(shop => (
                    <td key={shop.id} className="text-center">{shop.distance}</td>
                  ))}
                </tr>
                <tr>
                  <td className="font-medium">Verified</td>
                  {selectedShops.map(shop => (
                    <td key={shop.id} className="text-center">
                      {shop.verified ? (
                        <Check className="w-5 h-5 text-green-400 mx-auto" />
                      ) : (
                        <Minus className="w-5 h-5 text-slate-500 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="font-medium">Labor Rate</td>
                  {selectedShops.map(shop => (
                    <td key={shop.id} className="text-center">
                      {shop.laborRate ? `$${shop.laborRate}/hr` : '—'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="font-medium">Warranty</td>
                  {selectedShops.map(shop => (
                    <td key={shop.id} className="text-center">
                      {shop.warrantyDays ? `${shop.warrantyDays} days` : '—'}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Shop Picker Modal */}
      {showShopPicker && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-lg w-full max-h-[70vh] overflow-y-auto border border-white/10">
            <div className="sticky top-0 bg-slate-900 p-6 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-xl font-bold">Select a Shop</h2>
              <button onClick={() => setShowShopPicker(false)} className="btn btn-ghost btn-circle btn-sm">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              {availableShops.length === 0 ? (
                <p className="text-center text-slate-400 py-8">All shops already selected</p>
              ) : (
                availableShops.map(shop => (
                  <div 
                    key={shop.id}
                    onClick={() => addShop(shop)}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-slate-800/50 hover:bg-slate-800 cursor-pointer transition-colors"
                  >
                    <img src={shop.image} alt={shop.name} className="w-14 h-14 rounded-xl object-cover" />
                    <div className="flex-1">
                      <h3 className="font-bold">{shop.name}</h3>
                      <div className="flex items-center gap-3 text-sm text-slate-400">
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-primary fill-primary" /> {shop.rating}
                        </span>
                        <span>{shop.distance}</span>
                        {shop.verified && (
                          <span className="badge badge-primary badge-xs">Verified</span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-500" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
