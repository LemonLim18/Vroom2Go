import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { UserRole, Service, Shop } from './types';
import { OwnerHome } from './views/OwnerHome';
import { Forum } from './views/Forum';
import { ShopDashboard } from './views/ShopDashboard';
import { ShopProfile } from './views/ShopProfile';
import { BookingView } from './views/BookingView';
import { UserProfile } from './views/UserProfile';
import { ChatView } from './views/ChatView';
import { MOCK_SERVICES } from './constants';
import { Star, MapPin, CheckCircle, Clock, ShieldCheck, User } from 'lucide-react';

// Placeholder view for Service Details (kept simple inside App for now)
const ServiceDetails: React.FC<{service: Service, onBack: () => void}> = ({ service, onBack }) => (
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
        
        <div className="card-actions justify-end mt-8">
          <button className="btn btn-primary btn-lg">Compare Local Shops</button>
        </div>
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [currentRole, setCurrentRole] = useState<UserRole>(UserRole.OWNER);
  const [currentView, setCurrentView] = useState<string>('home');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  
  // State for booking flow
  const [isBooking, setIsBooking] = useState(false);
  const [bookingServiceId, setBookingServiceId] = useState<string | undefined>(undefined);

  // State for chat
  const [activeChatShop, setActiveChatShop] = useState<Shop | null>(null);

  // Simple Router Logic
  const renderContent = () => {
    // 1. Chat View Overlay
    if (activeChatShop) {
      return (
        <ChatView 
          shop={activeChatShop} 
          onBack={() => setActiveChatShop(null)} 
        />
      );
    }

    // 2. Booking Flow Overlay
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

    // 3. Details Overlays
    if (selectedShop) {
      return (
        <ShopProfile 
          shop={selectedShop} 
          onBack={() => setSelectedShop(null)} 
          onBook={(shop, serviceId) => {
            // Initiate Booking from Shop Profile
            setSelectedShop(shop);
            setBookingServiceId(serviceId);
            setIsBooking(true);
          }}
          onMessage={(shop) => setActiveChatShop(shop)}
        />
      );
    }

    if (selectedService) {
      return <ServiceDetails service={selectedService} onBack={() => setSelectedService(null)} />;
    }

    // 4. Main Views
    switch (currentView) {
      case 'home':
      case 'catalog':
        if (currentRole === UserRole.SHOP) return <ShopDashboard />;
        return <OwnerHome 
                  onServiceSelect={(s) => setSelectedService(s)} 
                  onShopSelect={(s) => setSelectedShop(s)} 
                />;
      case 'forum':
        return <Forum 
                 currentRole={currentRole} 
                 onShopSelect={(shop) => {
                   setSelectedShop(shop);
                   window.scrollTo(0,0);
                 }}
               />;
      case 'dashboard':
        return <ShopDashboard />;
      case 'profile':
         // Assuming Owner Profile for now if role is owner
         if (currentRole === UserRole.OWNER) return <UserProfile />;
         // Fallback for other roles (simplified)
         return (
             <div className="card bg-base-100 shadow p-6">
                <h2 className="text-2xl font-bold">Profile Settings</h2>
                <p>Edit your business details and credentials here.</p>
             </div>
         );
      case 'admin':
        return (
            <div className="hero h-96 bg-base-200 rounded-box">
                <div className="hero-content text-center">
                    <div className="max-w-md">
                    <h1 className="text-5xl font-bold">Admin Panel</h1>
                    <p className="py-6">Manage disputes, verify shops, and view platform analytics here.</p>
                    <button className="btn btn-primary">Go to Console</button>
                    </div>
                </div>
            </div>
        );
      case 'bookings':
          return (
             <div className="card bg-base-100 shadow p-6">
                <h2 className="text-2xl font-bold mb-4">My Bookings</h2>
                <p className="opacity-70">You have no upcoming bookings. Use the search tool to find a mechanic.</p>
                <div className="mt-4 flex gap-2">
                   <button className="btn btn-primary btn-sm" onClick={() => handleNavigate('home')}>Find Shops</button>
                </div>
             </div>
          )
      default:
        return <div className="p-10 text-center">Page Under Construction</div>;
    }
  };

  const handleNavigate = (view: string) => {
    // Clear selection states when navigating via main menu
    setSelectedService(null);
    setSelectedShop(null);
    setIsBooking(false);
    setActiveChatShop(null);
    setCurrentView(view);
  };

  return (
    <Layout 
      currentRole={currentRole} 
      onRoleChange={(role) => {
        setCurrentRole(role);
        // Reset view to logical home for that role
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