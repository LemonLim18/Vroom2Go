import React from 'react';

interface SkeletonProps {
  className?: string;
}

// Basic skeleton line
export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div className={`skeleton bg-slate-800 animate-shimmer ${className}`}></div>
);

// Card skeleton for loading states
export const CardSkeleton: React.FC = () => (
  <div className="glass-card rounded-2xl p-5 border border-white/5 space-y-4">
    <div className="flex items-center gap-4">
      <Skeleton className="w-14 h-14 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
    <Skeleton className="h-20 w-full rounded-lg" />
    <div className="flex gap-2">
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-8 w-20" />
    </div>
  </div>
);

// Service card skeleton
export const ServiceCardSkeleton: React.FC = () => (
  <div className="glass-card rounded-2xl p-5 border border-white/5 space-y-4">
    <div className="flex justify-between">
      <Skeleton className="w-12 h-12 rounded-xl" />
      <Skeleton className="w-16 h-5 rounded-full" />
    </div>
    <Skeleton className="h-5 w-3/4" />
    <Skeleton className="h-10 w-full" />
    <div className="flex justify-between items-center">
      <Skeleton className="h-6 w-20" />
      <Skeleton className="h-8 w-16 rounded-lg" />
    </div>
  </div>
);

// Shop card skeleton
export const ShopCardSkeleton: React.FC = () => (
  <div className="glass-card rounded-2xl overflow-hidden border border-white/5">
    <Skeleton className="w-full h-40" />
    <div className="p-5 space-y-3">
      <div className="flex justify-between">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-12" />
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    </div>
  </div>
);

// Table row skeleton
export const TableRowSkeleton: React.FC = () => (
  <tr className="border-b border-white/5">
    <td className="py-4"><Skeleton className="h-4 w-32" /></td>
    <td><Skeleton className="h-4 w-24" /></td>
    <td><Skeleton className="h-4 w-20" /></td>
    <td><Skeleton className="h-8 w-16 rounded-lg" /></td>
  </tr>
);

// Full page loading skeleton
export const PageSkeleton: React.FC = () => (
  <div className="space-y-6 animate-fade-in">
    {/* Header */}
    <div className="flex justify-between items-center">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-10 w-32 rounded-xl" />
    </div>
    
    {/* Content grid */}
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
      <ServiceCardSkeleton />
      <ServiceCardSkeleton />
      <ServiceCardSkeleton />
      <ServiceCardSkeleton />
      <ServiceCardSkeleton />
      <ServiceCardSkeleton />
    </div>
  </div>
);

// Loading spinner
export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; label?: string }> = ({ 
  size = 'md', 
  label 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`${sizeClasses[size]} border-2 border-primary border-t-transparent rounded-full animate-spin`}></div>
      {label && <p className="text-sm text-slate-400">{label}</p>}
    </div>
  );
};

// Empty state component
export const EmptyState: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}> = ({ icon, title, description, action }) => (
  <div className="text-center py-16 px-8">
    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800/50 flex items-center justify-center text-slate-500">
      {icon}
    </div>
    <h3 className="font-bold text-lg mb-2">{title}</h3>
    <p className="text-slate-400 mb-6 max-w-sm mx-auto">{description}</p>
    {action && (
      <button onClick={action.onClick} className="btn btn-primary">
        {action.label}
      </button>
    )}
  </div>
);

// Success animation component
export const SuccessAnimation: React.FC<{ message?: string }> = ({ message = 'Success!' }) => (
  <div className="text-center py-8 animate-scale-bounce">
    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
      <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    </div>
    <h3 className="font-bold text-xl text-green-400">{message}</h3>
  </div>
);

// Error state component
export const ErrorState: React.FC<{
  message: string;
  onRetry?: () => void;
}> = ({ message, onRetry }) => (
  <div className="text-center py-12 px-8">
    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 flex items-center justify-center">
      <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </div>
    <h3 className="font-bold text-lg mb-2 text-red-400">Something went wrong</h3>
    <p className="text-slate-400 mb-6">{message}</p>
    {onRetry && (
      <button onClick={onRetry} className="btn btn-outline btn-error">
        Try Again
      </button>
    )}
  </div>
);
