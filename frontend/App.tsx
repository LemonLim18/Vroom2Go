import React, { useState, useEffect } from 'react';
import api from './services/api';
import Swal from 'sweetalert2';
import { Layout } from './components/Layout';
import { UserRole, Service, Shop, Vehicle, Quote, Booking } from './types';
import { OwnerHome } from './views/OwnerHome';
import { Forum } from './views/Forum';
import { ShopDashboard } from './views/ShopDashboard';
import { ShopProfile } from './views/ShopProfile';
import { BookingView } from './views/BookingView';
import { UserProfile } from './views/UserProfile';
import { ChatView } from './views/ChatView';
import { ServicesPage } from './views/ServicesPage';
// New Phase 2 Views
import { OnboardingView } from './views/OnboardingView';
import { VehicleProfileView } from './views/VehicleProfileView';
import { CompareShopsView } from './views/CompareShopsView';
import { QuoteRequestView } from './views/QuoteRequestView';
import { QuoteDetailView } from './views/QuoteDetailView';
import { MessagesView } from './views/MessagesView';
import { JobProgressView } from './views/JobProgressView';
import { FinalInvoiceView } from './views/FinalInvoiceView';
import { AdminConsole } from './views/AdminConsole';
import { ShopProfileSettings } from './views/ShopProfileSettings';
import ResetPasswordView from './views/ResetPasswordView';
import { UserQuotesView } from './views/UserQuotesView';
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
  // Helper to get view from URL path
  const getViewFromPath = () => {
    const path = window.location.pathname.replace('/', '');
    return path || 'home';
  };

  const [currentRole, setCurrentRole] = useState<UserRole>(UserRole.DRIVER);
  const [currentView, setCurrentView] = useState<string>(getViewFromPath());
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingMode, setOnboardingMode] = useState<'signup' | 'login'>('signup');
  const [isLoading, setIsLoading] = useState(true);

  // Sync URL path when view changes
  useEffect(() => {
    const newPath = `/${currentView}`;
    if (window.location.pathname !== newPath) {
      window.history.pushState(null, '', newPath);
    }
    localStorage.setItem('lastView', currentView);
  }, [currentView]);

  // Listen for browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const newView = getViewFromPath();
      if (newView !== currentView) {
        setCurrentView(newView);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentView]);

  // Check for reset token from query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('token')) {
        setCurrentView('reset-password');
        setIsLoading(false);
    }
  }, []);

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

  // Helper to map backend role to frontend role (backend uses OWNER, frontend uses DRIVER)
  const mapBackendRole = (backendRole: string): UserRole => {
    if (backendRole === 'OWNER') return UserRole.DRIVER;
    if (backendRole === 'SHOP') return UserRole.SHOP;
    if (backendRole === 'ADMIN') return UserRole.ADMIN;
    return UserRole.DRIVER; // Default fallback
  };

  // Check for active session
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      // 1. Quick restore from local storage if available
      if (token && storedUser) {
        try {
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser.role) {
                const mappedRole = mapBackendRole(parsedUser.role);
                setCurrentRole(mappedRole);
                
                // If shop, redirect to dashboard if not deeper in nav
                if (mappedRole === UserRole.SHOP && (currentView === 'home' || currentView === '')) {
                    setCurrentView('dashboard');
                }
            }
        } catch (e) {
            console.error('Failed to parse stored user', e);
        }
      }
            
      if (!token) {
        setShowOnboarding(true);
        setIsLoading(false);
        return;
      }

      try {
        const { data } = await api.get('/auth/me');
        // Update storage with fresh data
        localStorage.setItem('user', JSON.stringify(data));
        
        const mappedRole = mapBackendRole(data.role);
        setCurrentRole(mappedRole);
        
        // If shop, redirect to dashboard if not deeper in nav
        if (mappedRole === UserRole.SHOP && (currentView === 'home' || currentView === '')) {
          setCurrentView('dashboard');
        }
      } catch (error) {
        console.error('Session expired:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setShowOnboarding(true);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }
  

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
          initialAuthMode={onboardingMode}
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
        if (currentRole === UserRole.SHOP) return <ShopDashboard />;
        return (
          <OwnerHome 
            onServiceSelect={(s) => setSelectedService(s)} 
            onShopSelect={(s) => setSelectedShop(s)}
            onNavigate={handleNavigate}
          />
        );
      
      case 'catalog':
        return (
          <ServicesPage 
            onServiceSelect={(s) => setSelectedService(s)} 
            onShopSelect={(s) => setSelectedShop(s)}
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
        if (currentRole === UserRole.DRIVER) return (
          <UserProfile 
            onLogin={() => {
              setOnboardingMode('login');
              setShowOnboarding(true);
            }}
            onLogout={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              window.location.reload();
            }}
          />
        );
        if (currentRole === UserRole.SHOP) return <ShopProfileSettings />;
        // Admin profile - show basic settings
        return (
          <div className="card bg-base-100 shadow p-6">
            <h2 className="text-2xl font-bold">Admin Settings</h2>
            <p>Manage your admin account settings here.</p>
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
        return (
          <UserQuotesView 
            onNavigate={handleNavigate} 
            onQuoteSelect={(quote) => setSelectedQuote(quote)}
          />
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

      case 'messages':
        return (
          <MessagesView 
            onSelectConversation={(shop) => {
              setActiveChatShop(shop); // Reuse this state or create selectedChatShop
              handleNavigate('chat');
            }} 
          />
        );

      case 'chat':
        if (!activeChatShop) return <div onClick={() => handleNavigate('messages')}>No chat selected. Go back</div>;
        return (
          <ChatView 
            shop={activeChatShop} 
            onBack={() => handleNavigate('messages')} 
          />
        );
      
      case 'reset-password':
        return <ResetPasswordView />;
      
      default:
        return <div className="p-10 text-center">Page Under Construction</div>;
    }
  };

  const handleNavigate = (view: string) => {
    clearSelections();
    setCurrentView(view);
  };

  const handleRoleSwitch = (targetRole: UserRole) => {
    // strict session management: specific roles require specific login sessions
    Swal.fire({
      title: `Switch to ${targetRole}?`,
      text: "This requires logging in with a different account. Your current session will be closed.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#FACC15', // Primary Yellow
      cancelButtonColor: '#1e293b', // Slate 800
      confirmButtonText: 'Yes, Sign Out & Switch',
      cancelButtonText: 'Cancel',
      background: '#0f172a', // Slate 900
      color: '#fff'
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setCurrentRole(targetRole); 
        clearSelections();
        setOnboardingMode('login');
        setShowOnboarding(true);
      }
    });
  };

  return (
    <Layout 
      currentRole={currentRole} 
      onRoleChange={handleRoleSwitch}
      currentView={currentView}
      onNavigate={handleNavigate}
      onOpenChat={(shop) => setActiveChatShop(shop)}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;