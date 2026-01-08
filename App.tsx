import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { UserRole, Service, Shop, Vehicle, Quote, Booking } from './types';
import { OwnerHome } from './views/OwnerHome';
import { Forum } from './views/Forum';
import { ShopDashboard } from './views/ShopDashboard';
import { ShopProfile } from './views/ShopProfile';
import { BookingView } from './views/BookingView';
import { UserProfile } from './views/UserProfile';
import { ChatView } from './views/ChatView';
// New Phase 2 Views
import { OnboardingView } from './views/OnboardingView';
import { VehicleProfileView } from './views/VehicleProfileView';
import { CompareShopsView } from './views/CompareShopsView';
import { QuoteRequestView } from './views/QuoteRequestView';
import { QuoteDetailView } from './views/QuoteDetailView';
import { JobProgressView } from './views/JobProgressView';
import { FinalInvoiceView } from './views/FinalInvoiceView';
import { AdminConsole } from './views/AdminConsole';
import { MOCK_SERVICES, MOCK_BOOKINGS, MOCK_QUOTES } from './constants';

// Placeholder view for Service Details
const ServiceDetails: React.FC<{service: Service, onBack: () => void, onCompare: () => void, onRequestQuote: () => void}> = ({ service, onBack, onCompare, onRequestQuote }) => (
  <div className="animate-fade-in">
    <button onClick={onBack} className="btn btn-ghost mb-4">← Back</button>
    <div className="card bg-base-100 shadow-xl border border-base-200">
      <div className="card-body">
        <h2 className="card-title text-3xl">{service.name}</h2>
        <div className="badge badge-lg badge-secondary">{service.category}</div>
        <p className="mt-4 text-lg">{service.description}</p>
        
        <div className="divider">Pricing Breakdown</div>
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>Vehicle Type</th>
                <th>Estimated Range</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(service.priceRange).map(([type, price]) => (
                <tr key={type}>
                  <td className="font-bold">{type}</td>
                  <td>{price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="card-actions justify-end mt-8 gap-2">
          <button className="btn btn-outline" onClick={onCompare}>Compare Shops</button>
          <button className="btn btn-primary btn-lg" onClick={onRequestQuote}>Request Quote</button>
        </div>
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [currentRole, setCurrentRole] = useState<UserRole>(UserRole.OWNER);
  const [currentView, setCurrentView] = useState<string>('home');
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // Selection states
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  
  // Flow states
  const [isBooking, setIsBooking] = useState(false);
  const [bookingServiceId, setBookingServiceId] = useState<string | undefined>(undefined);
  const [activeChatShop, setActiveChatShop] = useState<Shop | null>(null);

  // Clear all selection states
  const clearSelections = () => {
    setSelectedService(null);
    setSelectedShop(null);
    setSelectedVehicle(null);
    setSelectedQuote(null);
    setSelectedBooking(null);
    setIsBooking(false);
    setActiveChatShop(null);
  };

  // Router Logic
  const renderContent = () => {
    // Onboarding overlay
    if (showOnboarding) {
      return (
        <OnboardingView 
          onComplete={(role) => {
            setCurrentRole(role);
            setShowOnboarding(false);
            handleNavigate(role === UserRole.SHOP ? 'dashboard' : 'home');
          }}
          onSkip={() => setShowOnboarding(false)}
        />
      );
    }

    // Chat View Overlay
    if (activeChatShop) {
      return (
        <ChatView 
          shop={activeChatShop} 
          onBack={() => setActiveChatShop(null)} 
        />
      );
    }

    // Booking Flow Overlay
    if (isBooking && selectedShop) {
      return (
        <BookingView 
          shop={selectedShop} 
          initialServiceId={bookingServiceId}
          onConfirm={() => {
             setIsBooking(false);
             handleNavigate('bookings');
          }}
          onCancel={() => setIsBooking(false)}
        />
      );
    }

    // Quote Detail Overlay
    if (selectedQuote) {
      return (
        <QuoteDetailView 
          quote={selectedQuote}
          onBack={() => setSelectedQuote(null)}
          onAccept={(quote) => {
            setSelectedQuote(null);
            handleNavigate('bookings');
          }}
          onReject={() => setSelectedQuote(null)}
          onCompare={() => {
            setSelectedQuote(null);
            handleNavigate('compare');
          }}
        />
      );
    }

    // Booking/Job Progress Overlay
    if (selectedBooking) {
      return (
        <JobProgressView 
          booking={selectedBooking}
          onBack={() => setSelectedBooking(null)}
          onChat={(shop) => setActiveChatShop(shop)}
          onViewInvoice={() => handleNavigate('invoice')}
        />
      );
    }

    // Shop Profile Overlay
    if (selectedShop) {
      return (
        <ShopProfile 
          shop={selectedShop} 
          onBack={() => setSelectedShop(null)} 
          onBook={(shop, serviceId) => {
            setSelectedShop(shop);
            setBookingServiceId(serviceId);
            setIsBooking(true);
          }}
          onMessage={(shop) => setActiveChatShop(shop)}
        />
      );
    }

    // Service Details Overlay
    if (selectedService) {
      return (
        <ServiceDetails 
          service={selectedService} 
          onBack={() => setSelectedService(null)}
          onCompare={() => {
            setSelectedService(null);
            handleNavigate('compare');
          }}
          onRequestQuote={() => {
            setSelectedService(null);
            handleNavigate('quote-request');
          }}
        />
      );
    }

    // Main Views
    switch (currentView) {
      case 'home':
      case 'catalog':
        if (currentRole === UserRole.SHOP) return <ShopDashboard />;
        return (
          <OwnerHome 
            onServiceSelect={(s) => setSelectedService(s)} 
            onShopSelect={(s) => setSelectedShop(s)}
            onNavigate={handleNavigate}
          />
        );
      
      case 'forum':
        return (
          <Forum 
            currentRole={currentRole} 
            onShopSelect={(shop) => {
              setSelectedShop(shop);
              window.scrollTo(0,0);
            }}
          />
        );
      
      case 'dashboard':
        return <ShopDashboard />;
      
      case 'profile':
        if (currentRole === UserRole.OWNER) return <UserProfile />;
        return (
          <div className="card bg-base-100 shadow p-6">
            <h2 className="text-2xl font-bold">Profile Settings</h2>
            <p>Edit your business details and credentials here.</p>
          </div>
        );
      
      case 'admin':
        return <AdminConsole onBack={() => handleNavigate('home')} />;
      
      case 'vehicles':
        return (
          <VehicleProfileView 
            onBack={() => handleNavigate('home')}
            onVehicleSelect={(v) => {
              setSelectedVehicle(v);
              handleNavigate('quote-request');
            }}
          />
        );
      
      case 'compare':
        return (
          <CompareShopsView 
            onBack={() => handleNavigate('home')}
            onSelectShop={(shop) => setSelectedShop(shop)}
            onRequestQuote={(shop) => {
              setSelectedShop(shop);
              handleNavigate('quote-request');
            }}
          />
        );
      
      case 'quote-request':
        return (
          <QuoteRequestView 
            preSelectedVehicle={selectedVehicle || undefined}
            onBack={() => handleNavigate('home')}
            onSubmit={(data) => {
              // After submitting, go to quotes view
              handleNavigate('quotes');
            }}
          />
        );
      
      case 'quotes':
        // Show list of quotes
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-black uppercase italic tracking-tighter">
                  My <span className="text-primary">Quotes</span>
                </h1>
                <p className="text-slate-400">Compare quotes from shops</p>
              </div>
              <button onClick={() => handleNavigate('quote-request')} className="btn btn-primary gap-2">
                + New Quote Request
              </button>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {MOCK_QUOTES.map(quote => (
                <div 
                  key={quote.id}
                  onClick={() => setSelectedQuote(quote)}
                  className="glass-card rounded-2xl p-5 border border-white/5 cursor-pointer hover:border-primary/30 transition-all"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold">{quote.shopName}</h3>
                      <p className="text-sm text-slate-400">{quote.status}</p>
                    </div>
                    <span className={`badge ${quote.guaranteed ? 'badge-success' : 'badge-warning'}`}>
                      {quote.guaranteed ? 'Guaranteed' : 'Estimate'}
                    </span>
                  </div>
                  <p className="text-2xl font-black text-primary">${quote.estimatedTotal.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'bookings':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-black uppercase italic tracking-tighter">
              My <span className="text-primary">Bookings</span>
            </h1>
            {MOCK_BOOKINGS.length === 0 ? (
              <div className="card bg-base-100 shadow p-6">
                <p className="opacity-70">You have no bookings yet.</p>
                <button className="btn btn-primary btn-sm mt-4" onClick={() => handleNavigate('home')}>
                  Find Shops
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {MOCK_BOOKINGS.map(booking => (
                  <div 
                    key={booking.id}
                    onClick={() => setSelectedBooking(booking)}
                    className="glass-card rounded-2xl p-5 border border-white/5 cursor-pointer hover:border-primary/30 transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg">{booking.serviceName}</h3>
                        <p className="text-slate-400">{booking.shopName}</p>
                        <p className="text-sm text-slate-500 mt-1">{booking.date}</p>
                      </div>
                      <div className="text-right">
                        <span className={`badge ${
                          booking.status === 'Completed' ? 'badge-success' :
                          booking.status === 'Confirmed' ? 'badge-primary' :
                          booking.status === 'In Progress' ? 'badge-warning' : 'badge-ghost'
                        }`}>
                          {booking.status}
                        </span>
                        <p className="text-lg font-bold mt-2">{booking.price}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      
      case 'invoice':
        return (
          <FinalInvoiceView 
            onBack={() => handleNavigate('bookings')}
            onApprove={() => handleNavigate('bookings')}
            onDispute={() => handleNavigate('bookings')}
          />
        );
      
      default:
        return <div className="p-10 text-center">Page Under Construction</div>;
    }
  };

  const handleNavigate = (view: string) => {
    clearSelections();
    setCurrentView(view);
  };

  return (
    <Layout 
      currentRole={currentRole} 
      onRoleChange={(role) => {
        setCurrentRole(role);
        if (role === UserRole.SHOP) handleNavigate('dashboard');
        else if (role === UserRole.OWNER) handleNavigate('home');
        else handleNavigate('admin');
      }}
      currentView={currentView}
      onNavigate={handleNavigate}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;