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
import { MyBookingsView } from './views/MyBookingsView';
import { MOCK_SERVICES, MOCK_BOOKINGS, MOCK_QUOTES, getShopById } from './constants';
import { themeConfig } from './utils/alerts';

// Placeholder view for Service Details
const ServiceDetails: React.FC<{service: Service, onBack: () => void, onCompare: () => void, onRequestQuote: () => void}> = ({ service, onBack, onCompare }) => (
  <div className="animate-fade-in">
    <button onClick={onBack} className="btn btn-ghost mb-4">← Back to Services</button>
    <div className="card bg-base-100 shadow-xl border border-base-200">
      <div className="card-body">
        <h2 className="card-title text-3xl">{service.name}</h2>
        <div className="badge badge-lg badge-secondary">{service.category}</div>
        <p className="mt-4 text-lg">{service.description}</p>
        
        <div className="divider">Estimated Price Range by Vehicle Type</div>
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
        
        <div className="alert alert-info mt-6">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <span>Prices vary by shop. Compare shops below to see their specific rates and book directly.</span>
        </div>
        
        <div className="card-actions justify-center mt-8">
          <button className="btn btn-primary btn-lg gap-2" onClick={onCompare}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            Find Shops Offering This Service
          </button>
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
  const [navigationData, setNavigationData] = useState<any>(null);

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
    // Booking Flow Overlay (Fixed Import)

    // Booking Flow Overlay
    if (isBooking && selectedShop) {
      return (
        <BookingView 
          shop={selectedShop} 
          initialServiceId={bookingServiceId}
          quote={selectedQuote || undefined} // Pass the quote context
          onConfirm={() => {
             setIsBooking(false);
             setSelectedQuote(null); // Clear quote context after success
             handleNavigate('bookings');
          }}
          onCancel={() => {
            setIsBooking(false);
            // Don't clear selectedQuote on cancel, allows going back to Quote Detail if desired.
            // But since BookingView is 'above' QuoteDetailView, hiding it reveals QuoteDetailView again?
            // Yes, if selectedQuote is still set.
          }}
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
            // Transition to Booking View with this quote
            // First try to get shop from the quote object itself (backend data)
            const quoteShop = (quote as any).shop;
            // Fallback to local lookup if valid
            const shop = quoteShop || getShopById(quote.shopId);
            
            console.log('[App] Accepteing quote, passing shop:', shop);
            
            if (shop) {
              setSelectedShop(shop);
              setIsBooking(true);
            } else {
              console.error('Shop not found for quote', quote.id);
              Swal.fire({
                  icon: 'error',
                  title: 'Shop Error',
                  text: `Could not load shop details for shop ID: ${quote.shopId}`,
                  background: '#1e293b',
                  color: '#fff'
              });
            }
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
            handleNavigate('booking', { shop, serviceId });
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
            handleNavigate('compare', { serviceId: selectedService.id });
          }}
          onRequestQuote={() => {
            handleNavigate('quote-request', { serviceId: selectedService.id });
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
              handleNavigate('quote-request', { vehicle: v });
            }}
          />
        );
      
      case 'compare':
        return (
          <CompareShopsView 
            serviceId={navigationData?.serviceId || selectedService?.id}
            onBack={() => {
                setSelectedService(null);
                handleNavigate('home');
            }}
            onSelectShop={(shop) => setSelectedShop(shop)}
            onRequestQuote={(shop) => {
              setSelectedShop(shop);
              handleNavigate('quote-request');
            }}
          />
        );
      
      case 'reset-password':
        return <ResetPasswordView onNavigate={handleNavigate} />;
      
      case 'quote-request':
        return (
          <QuoteRequestView 
            preSelectedVehicle={navigationData?.vehicle || selectedVehicle || undefined}
            preSelectedShop={navigationData?.shop || selectedShop || undefined}
            preSelectedServiceId={navigationData?.serviceId || selectedService?.id}
            initialDescription={navigationData?.initialDescription}
            onBack={() => {
                setSelectedService(null);
                setSelectedShop(null);
                handleNavigate('home');
            }}
            onSubmit={(data) => {
              // After submitting, go to quotes view
              setSelectedService(null);
              setSelectedShop(null);
              handleNavigate('quotes');
            }}
            onAddVehicle={() => handleNavigate('vehicles')}
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
        return <MyBookingsView onNavigate={handleNavigate} />;
      
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
            targetUserId={navigationData?.targetUserId}
            onSelectConversation={(shop) => {
              setActiveChatShop(shop); 
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
      
      default:
        return <div className="p-10 text-center">Page Under Construction</div>;
    }
  };

  const handleNavigate = (view: string, data?: any) => {
    // Clear selections when navigating to a new view to avoid "blocking" overlays
    // Unless data suggests we are in a sub-flow (this is a simple heuristic)
    if (!data || (!data.keepContext && view !== 'booking' && view !== 'quote-request' && view !== 'compare')) {
        clearSelections();
    }
    
    // Set specific states for sub-flows that use selections as "overlays" in renderContent
    if (view === 'booking' && data?.shop) {
        setSelectedShop(data.shop);
        if (data.serviceId) setBookingServiceId(data.serviceId);
        setIsBooking(true);
    }
    
    setCurrentView(view);
    if (data) {
        setNavigationData(data);
    } else {
        setNavigationData(null);
    }
    window.scrollTo(0, 0);
  };

  const handleRoleSwitch = (targetRole: UserRole) => {
    // strict session management: specific roles require specific login sessions
    Swal.fire({
      ...themeConfig,
      title: `Switch to ${targetRole}?`,
      text: "This requires logging in with a different account. Your current session will be closed.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Sign Out & Switch',
      cancelButtonText: 'Cancel',
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