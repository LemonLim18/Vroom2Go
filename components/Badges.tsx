import React from 'react';
import { Star, Shield, Clock, MapPin } from 'lucide-react';

interface RatingBadgeProps {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
}

// Rating display badge
export const RatingBadge: React.FC<RatingBadgeProps> = ({ rating, size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5'
  };

  return (
    <div className={`inline-flex items-center gap-1 bg-primary text-black rounded-full font-black ${sizeClasses[size]}`}>
      <Star className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} fill="currentColor" />
      {rating.toFixed(1)}
    </div>
  );
};

// Verified badge
export const VerifiedBadge: React.FC<{ compact?: boolean }> = ({ compact = false }) => (
  <div className={`inline-flex items-center gap-1 bg-green-500/10 text-green-400 rounded-full ${compact ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'}`}>
    <Shield className={compact ? 'w-3 h-3' : 'w-4 h-4'} />
    {!compact && <span className="font-bold">Verified</span>}
  </div>
);

// Status badge
interface StatusBadgeProps {
  status: 'confirmed' | 'pending' | 'in-progress' | 'completed' | 'cancelled';
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const statusConfig = {
    'confirmed': { bg: 'bg-primary/10', text: 'text-primary', label: 'Confirmed' },
    'pending': { bg: 'bg-orange-500/10', text: 'text-orange-400', label: 'Pending' },
    'in-progress': { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'In Progress' },
    'completed': { bg: 'bg-green-500/10', text: 'text-green-400', label: 'Completed' },
    'cancelled': { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Cancelled' }
  };

  const config = statusConfig[status];
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-bold ${config.bg} ${config.text} ${sizeClasses}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.bg.replace('/10', '')} ${config.text.replace('text-', 'bg-')}`}></span>
      {config.label}
    </span>
  );
};

// Category tag
export const CategoryTag: React.FC<{ category: string; onClick?: () => void }> = ({ category, onClick }) => (
  <button 
    onClick={onClick}
    className="badge badge-ghost hover:badge-primary transition-colors"
  >
    {category}
  </button>
);

// Distance badge
export const DistanceBadge: React.FC<{ distance: string }> = ({ distance }) => (
  <span className="inline-flex items-center gap-1 text-xs text-slate-400">
    <MapPin className="w-3 h-3" />
    {distance}
  </span>
);

// Time estimate badge
export const TimeBadge: React.FC<{ time: string }> = ({ time }) => (
  <span className="inline-flex items-center gap-1 text-xs text-slate-400">
    <Clock className="w-3 h-3" />
    {time}
  </span>
);

// Price display
interface PriceDisplayProps {
  amount: number | string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  original?: number;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({ amount, size = 'md', original }) => {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl'
  };

  const formattedAmount = typeof amount === 'number' 
    ? `$${amount.toLocaleString()}` 
    : amount;

  return (
    <div className="inline-flex items-baseline gap-2">
      {original && (
        <span className="text-slate-500 line-through text-sm">${original.toLocaleString()}</span>
      )}
      <span className={`font-black text-primary ${sizeClasses[size]}`}>{formattedAmount}</span>
    </div>
  );
};

// Warranty badge
export const WarrantyBadge: React.FC<{ months: number }> = ({ months }) => (
  <span className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-400 rounded-full px-2 py-0.5 text-xs font-bold">
    <Shield className="w-3 h-3" />
    {months}mo Warranty
  </span>
);

// Confidence indicator
export const ConfidenceIndicator: React.FC<{ score: number; label?: string }> = ({ score, label }) => {
  const percentage = Math.round(score * 100);
  const color = percentage >= 80 ? 'bg-green-500' : percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="space-y-1">
      {label && <p className="text-xs text-slate-400">{label}</p>}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className={`h-full ${color} transition-all duration-500`} 
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <span className="text-xs font-bold text-slate-400">{percentage}%</span>
      </div>
    </div>
  );
};
