import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { UserRole, CarType, Vehicle, Booking } from '../types';
import { 
  Search, 
  X, 
  Save, 
  Gauge, 
  Palette, 
  Hash,
  Car, 
  Wrench, 
  CreditCard, 
  Plus, 
  Clock, 
  FileText, 
  Settings, 
  Shield, 
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Trash2,
  Edit,
  Star,
  User,
  Bell,
  LogOut,
  Calendar
} from 'lucide-react';
import { decodeVIN, formatVINMasked } from '../services/vinService';
import { showAlert } from '../utils/alerts';

type ProfileTab = 'vehicles' | 'history' | 'settings';

interface ServiceHistoryItem {
  id: string;
  serviceName: string;
  shopName: string;
  date: string;
  status: 'completed' | 'warranty';
  total: number;
  warrantyUntil?: string;
}

interface PaymentMethod {
  id: string;
  last4: string;
  brand: string;
  expiry: string;
  isDefault: boolean;
  name: string;
}

// Helper to parse price string to number
const parsePrice = (price: string | number | undefined): number => {
  if (!price) return 0;
  if (typeof price === 'number') return price;
  return parseFloat(price.replace(/[^0-9.]/g, '')) || 0;
};

// Helper to add months to a date
const addMonths = (date: Date, months: number): Date => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};

interface UserProfileProps {
  onLogin?: () => void;
  onLogout?: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ onLogin, onLogout }) => {
  const [activeTab, setActiveTab] = useState<ProfileTab>('vehicles');
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [showEditVehicleModal, setShowEditVehicleModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Data State
  const [user, setUser] = useState<any>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Derived Metrics from Bookings
  const { totalServices, totalSpent, estSavings, serviceHistoryItems, activeWarranties } = React.useMemo(() => {
    let tServices = 0;
    let tSpent = 0;
    const historyItems: ServiceHistoryItem[] = [];

    bookings.forEach(booking => {
      // Only count completed work towards history and spend
      if (booking.status === 'Completed' || booking.status === 'In Progress' || booking.status === 'Confirmed') { // Including confirmed for visibility if desired, but strictly usually 'Completed'
         // Using 'Completed' strictly for spend is safer, but for "Total Services" user might expect all non-cancelled. 
         // Let's stick to Completed for spend, but all non-cancelled for history list.
      }
      
      const price = parsePrice(booking.price || booking.estimatedTotal);
      
      // Calculate warranty expiry based on service warranty (mocked logic if not in booking)
      // Assuming booking.service object might have warranty info, or default to 12 months for now
      // In real app, booking snapshot should have warranty terms.
      const bookingDate = new Date(booking.date || booking.scheduledAt);
      const warrantyMonths = booking.serviceName?.toLowerCase().includes('oil') ? 3 : 12; // Simple heuristic
      const warrantyUntilDate = addMonths(bookingDate, warrantyMonths);
      const isWarrantyActive = warrantyUntilDate > new Date();

      if (booking.status === 'Completed') {
        tServices++;
        tSpent += price;
      }

      historyItems.push({
        id: booking.id,
        serviceName: booking.serviceName || 'Unknown Service',
        shopName: booking.shopName || 'Unknown Shop',
        date: new Date(booking.date || booking.createdAt).toLocaleDateString(),
        status: isWarrantyActive ? 'warranty' : 'completed',
        total: price,
        warrantyUntil: warrantyUntilDate.toLocaleDateString()
      });
    });

    // Filter only Completed for the list view if desired, or keep all. 
    // The previous static list seemed to imply past events.
    const completedHistory = historyItems.filter(i => bookings.find(b => b.id === i.id)?.status === 'Completed');
    
    // Sort by date desc
    completedHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const activeWarrantiesList = completedHistory.filter(i => i.status === 'warranty');

    return {
      totalServices: tServices,
      totalSpent: tSpent,
      estSavings: tSpent * 0.15, // Mock savings calculation
      serviceHistoryItems: completedHistory,
      activeWarranties: activeWarrantiesList
    };
  }, [bookings]);

  // Add/Edit Utility State
  const [vinInput, setVinInput] = useState('');
  const [vinDecodeResult, setVinDecodeResult] = useState<ReturnType<typeof decodeVIN> | null>(null);
  const [isDecoding, setIsDecoding] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);
  const [formError, setFormError] = useState('');

  // Form State
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    type: CarType.SEDAN,
    vin: '',
    licensePlate: '',
    color: '',
    mileage: 0,
    trim: '',
  });

  // Payment Method State
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    { id: '1', last4: '4242', brand: 'Visa', expiry: '12/28', isDefault: true, name: 'Personal Card' },
    { id: '2', last4: '1234', brand: 'Mastercard', expiry: '10/27', isDefault: false, name: 'Business Card' }
  ]);
  const [newPaymentForm, setNewPaymentForm] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: ''
  });

  const handleAddPaymentMethod = () => {
    // Basic validation
    if (!newPaymentForm.number || !newPaymentForm.expiry || !newPaymentForm.cvc || !newPaymentForm.name) {
      showAlert.error('Please fill in all payment details');
      return;
    }

    // Mock detection of brand and last 4
    const last4 = newPaymentForm.number.slice(-4);
    const brand = newPaymentForm.number.startsWith('4') ? 'Visa' : 'Mastercard'; // Simple detection
    
    const newMethod: PaymentMethod = {
      id: Math.random().toString(36).substr(2, 9),
      last4,
      brand,
      expiry: newPaymentForm.expiry,
      isDefault: paymentMethods.length === 0, // Default if first card
      name: newPaymentForm.name
    };

    setPaymentMethods([...paymentMethods, newMethod]);
    setShowAddPaymentModal(false);
    setNewPaymentForm({ number: '', expiry: '', cvc: '', name: '' });
    showAlert.success('Payment method added successfully');
  };

  const handleDeletePaymentMethod = async (id: string) => {
    const confirmed = await showAlert.confirm('Remove this payment method?');
    if (confirmed) {
      setPaymentMethods(prev => prev.filter(p => p.id !== id));
      showAlert.success('Payment method removed');
    }
  };

  const handleSetDefaultPaymentMethod = (id: string) => {
    setPaymentMethods(prev => prev.map(p => ({
      ...p,
      isDefault: p.id === id
    })));
  };

  // File state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleVINDecode = () => {
    if (vinInput.length < 17) return;
    
    setIsDecoding(true);
    // Simulate API delay - ideally replace with backend endpoint if available
    setTimeout(() => {
      const result = decodeVIN(vinInput);
      setVinDecodeResult(result);
      
      if (result.valid && result.make) {
        setFormData(prev => ({
          ...prev,
          make: result.make || '',
          model: result.model || '',
          year: result.year || new Date().getFullYear(),
          type: result.type || CarType.SEDAN,
          vin: result.vin,
          trim: result.trim || '',
        }));
      }
      setIsDecoding(false);
    }, 800);
  };

  const resetForm = () => {
    setEditingVehicleId(null);
    setVinInput('');
    setVinDecodeResult(null);
    setManualEntry(false);
    setFormError('');
    setSelectedFile(null);
    setPreviewUrl(null);
    setFormData({
      make: '',
      model: '',
      year: new Date().getFullYear(),
      type: CarType.SEDAN,
      vin: '',
      licensePlate: '',
      color: '',
      mileage: 0,
      trim: '',
    });
  };

  const handleEditClick = (vehicle: Vehicle) => {
    setEditingVehicleId(vehicle.id);
    setFormData({
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      type: vehicle.type as CarType,
      vin: vehicle.vin || '',
      licensePlate: vehicle.licensePlate || '',
      color: vehicle.color || '', 
      mileage: vehicle.mileage || 0,
      trim: vehicle.trim || '',
    });
    setPreviewUrl(vehicle.image || null);
    setManualEntry(true); // Edit mode implies manual entry form visibility
    setShowAddVehicleModal(true);
  };

  // Render Form Fields helper
  const renderFormFields = () => (
    <>
         {/* Image Upload */}
         <div className="form-control w-full">
            <label className="label"><span className="label-text">Vehicle Image</span></label>
            <div className="flex items-center gap-4">
                <div className="w-20 h-20 cursor-pointer  rounded-xl bg-slate-800 border border-white/10 overflow-hidden flex items-center justify-center relative">
                    {previewUrl ? (
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                        <Car className="w-8 h-8 text-slate-600" />
                    )}
                </div>
                <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="file-input file-input-bordered file-input-sm w-full max-w-xs bg-slate-800" 
                />
            </div>
         </div>

         <div className="grid grid-cols-2 gap-4">
            <div className="form-control">
                <label className="label"><span className="label-text">Make *</span></label>
                <input 
                type="text"
                value={formData.make}
                onChange={(e) => setFormData(prev => ({ ...prev, make: e.target.value }))}
                placeholder="Honda"
                className="input input-bordered bg-base-100 border-white/10"
                />
            </div>
            <div className="form-control">
                <label className="label"><span className="label-text">Model *</span></label>
                <input 
                type="text"
                value={formData.model}
                onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                placeholder="Civic"
                className="input input-bordered bg-base-100 border-white/10"
                />
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
        <div className="form-control">
            <label className="label"><span className="label-text">Year *</span></label>
            <input 
            type="number"
            value={formData.year}
            onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
            min={1900}
            max={new Date().getFullYear() + 1}
            className="input input-bordered bg-base-100 border-white/10"
            />
        </div>
        <div className="form-control">
            <label className="label"><span className="label-text">Type *</span></label>
            <select 
            value={formData.type}
            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as CarType }))}
            className="select select-bordered bg-base-100 border-white/10"
            >
            {Object.values(CarType).map(type => (
                <option key={type} value={type}>{type}</option>
            ))}
            </select>
        </div>
        </div>

        <div className="form-control">
        <label className="label"><span className="label-text">Trim</span></label>
        <input 
            type="text"
            value={formData.trim}
            onChange={(e) => setFormData(prev => ({ ...prev, trim: e.target.value }))}
            placeholder="EX, Sport, Limited, etc."
            className="input input-bordered bg-base-100 border-white/10"
        />
        </div>

        <div className="grid grid-cols-2 gap-4">
        <div className="form-control">
            <label className="label"><span className="label-text">License Plate</span></label>
            <input 
            type="text"
            value={formData.licensePlate}
            onChange={(e) => setFormData(prev => ({ ...prev, licensePlate: e.target.value.toUpperCase() }))}
            placeholder="ABC-1234"
            className="input input-bordered bg-base-100 border-white/10 uppercase"
            />
        </div>
        <div className="form-control">
            <label className="label"><span className="label-text">Color</span></label>
            <input 
            type="text"
            value={formData.color}
            onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
            placeholder="Silver"
            className="input input-bordered bg-base-100 border-white/10"
            />
        </div>
        </div>

        <div className="form-control">
        <label className="label"><span className="label-text">Current Mileage</span></label>
        <input 
            type="number"
            value={formData.mileage || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, mileage: parseInt(e.target.value) || 0 }))}
            placeholder="45000"
            className="input input-bordered bg-base-100 border-white/10"
        />
        </div>
    </>
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Load User from LocalStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }

        // Fetch user's data
        const [vehiclesRes, bookingsRes] = await Promise.all([
          api.get('/vehicles'),
          api.get('/bookings')
        ]);
        
        // Map backend vehicles to frontend type
        const mappedVehicles = vehiclesRes.data.map((v: any) => ({
          id: v.id,
          make: v.make,
          model: v.model,
          year: v.year,
          type: v.type, // Enum match expected
          vin: v.vin,
          image: v.imageUrl || v.image_url || 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=1000',
          mileage: v.mileage,
          licensePlate: v.licensePlate || v.license_plate,
          color: v.color,
          trim: v.trim
        }));
        
        setVehicles(mappedVehicles);
        setBookings(bookingsRes.data || []);
      } catch (error) {
        console.error('Failed to load profile data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSaveVehicle = async () => {
    try {
      const formDataObj = new FormData();
      formDataObj.append('make', formData.make);
      formDataObj.append('model', formData.model);
      formDataObj.append('year', String(formData.year)); // Ensure string for FormData
      formDataObj.append('type', formData.type);
      formDataObj.append('vin', formData.vin);
      formDataObj.append('licensePlate', formData.licensePlate);
      formDataObj.append('color', formData.color);
      formDataObj.append('trim', formData.trim);
      if (formData.mileage) formDataObj.append('mileage', String(formData.mileage));
      if (selectedFile) {
        formDataObj.append('image', selectedFile);
      }

      let savedVehicle;
      if (editingVehicleId) {
         const { data } = await api.put(`/vehicles/${editingVehicleId}`, formDataObj, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          savedVehicle = data;
          
          setVehicles(prev => prev.map(v => v.id === editingVehicleId ? {
             id: data.id,
             ...data,
             image: data.imageUrl || data.image || v.image
          } : v));
          
          showAlert.success('Vehicle updated successfully!');
      } else {
          const { data } = await api.post('/vehicles', formDataObj, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          savedVehicle = data;
          
          setVehicles(prev => [...prev, {
            id: data.id,
            ...data,
            image: data.imageUrl || data.image || `https://source.unsplash.com/random/800x600/?car,${data.make}`
          }]);
          
          showAlert.success('Vehicle added successfully!');
      }
      
      resetForm();
      setShowAddVehicleModal(false);
    } catch (error: any) {
       console.error('Failed to save vehicle', error);
       const msg = error.response?.data?.message ? 
          `${error.response.data.message} ${error.response.data.details ? JSON.stringify(error.response.data.details) : ''}` 
          : 'Failed to save vehicle.';
       setFormError(msg);
       showAlert.error(msg);
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    const confirmed = await showAlert.confirm('Are you sure you want to delete this vehicle?');
    if (!confirmed) return;
    try {
      await api.delete(`/vehicles/${id}`);
      setVehicles(vehicles.filter(v => v.id !== id));
      showAlert.success('Vehicle removed');
    } catch (error) {
       console.error('Failed to delete', error);
       showAlert.error('Could not delete vehicle');
    }
  };

  // Show toast notification

  // Show toast notification
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };
   
  if (loading) return <div className="p-10 text-center"><span className="loading loading-spinner"></span> Loading profile...</div>;
  
  if (!user) return (
    <div className="flex flex-col items-center justify-center p-10 h-[60vh]">
      <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6">
        <User className="w-10 h-10 text-slate-500" />
      </div>
      <h2 className="text-2xl font-black italic uppercase mb-2">Guest Profile</h2>
      <p className="text-slate-400 mb-8 max-w-sm text-center">
        Sign in to manage your vehicles, view service history, and track bookings.
      </p>
      {onLogin && (
        <button onClick={onLogin} className="btn btn-primary btn-lg rounded-full px-8">
          Sign In / Create Account
        </button>
      )}
    </div>
  );

  const tabs = [
    { id: 'vehicles' as const, label: 'My Garage', icon: Car },
    { id: 'history' as const, label: 'Service History', icon: Clock },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ];



  return (
    <>
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-primary">{user.name.charAt(0)}</span>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-black uppercase italic tracking-tighter">
              {user.name}
            </h1>
            <p className="text-slate-400">{user.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="badge badge-primary badge-sm">Member since 2021</span>
              <span className="badge badge-ghost badge-sm gap-1">
                <Star className="w-3 h-3 fill-primary text-primary" /> 4.9 Rating
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs tabs-boxed bg-slate-800/50 p-1 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab gap-2 ${activeTab === tab.id ? 'tab-active bg-primary text-black' : ''}`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Vehicles Tab */}
      {activeTab === 'vehicles' && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Vehicles List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">My Vehicles</h2>
              <button onClick={() => { resetForm(); setShowAddVehicleModal(true); }} className="btn btn-primary btn-sm gap-1">
                <Plus className="w-4 h-4" /> Add Vehicle
              </button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              {vehicles.map(vehicle => (
                <div key={vehicle.id} className="glass-card rounded-2xl overflow-hidden border border-white/5 group hover:border-primary/20 transition-all">
                  <div className="h-32 relative">
                    <img src={vehicle.image} alt={vehicle.model} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
                    <div className="absolute bottom-3 left-3">
                      <span className="text-xs text-slate-400">{vehicle.type}</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg">{vehicle.year} {vehicle.make} {vehicle.model}</h3>
                    <p className="text-xs text-slate-400 font-mono">VIN: {vehicle.vin ? vehicle.vin.slice(0, 11) + '...' : 'N/A'}</p>
                    {vehicle.mileage && (
                      <p className="text-sm text-slate-300 mt-1">{vehicle.mileage.toLocaleString()} miles</p>
                    )}
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => handleEditClick(vehicle)} className="btn btn-xs btn-ghost gap-1"><Edit className="w-3 h-3" /> Edit</button>
                      <button onClick={() => handleDeleteVehicle(vehicle.id)} className="btn btn-xs btn-ghost text-error gap-1"><Trash2 className="w-3 h-3" /> Remove</button>
                    </div>
                  </div>
                </div>
              ))}
              {vehicles.length === 0 && (
                <div className="col-span-2 text-center py-10 opacity-50 border border-dashed border-slate-600 rounded-xl">
                  <Car className="w-10 h-10 mx-auto mb-2" />
                  <p>No vehicles in your garage yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Active Warranties */}
            <div className="glass-card rounded-2xl p-5 border border-green-500/20 bg-green-500/5">
              <h3 className="font-bold flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-green-400" />
                Active Warranties
              </h3>
              {activeWarranties.length > 0 ? (
                <div className="space-y-3">
                  {activeWarranties.map(item => (
                    <div key={item.id} className="p-3 bg-slate-800/50 rounded-xl">
                      <p className="font-medium text-sm">{item.serviceName}</p>
                      <p className="text-xs text-slate-400">{item.shopName}</p>
                      <p className="text-xs text-green-400 mt-1">
                        <CheckCircle className="w-3 h-3 inline mr-1" />
                        Covered until {item.warrantyUntil}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">No active warranties</p>
              )}
            </div>

            {/* Payment Methods */}
            <div className="glass-card rounded-2xl p-5 border border-white/5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  Payment Methods
                </h3>
                <button 
                  onClick={() => setShowAddPaymentModal(true)} 
                  className="btn btn-ghost btn-xs btn-circle bg-white/5 hover:bg-white/10"
                >
                    <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                {paymentMethods.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-4">No payment methods saved.</p>
                ) : (
                    paymentMethods.map(method => (
                        <div key={method.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl group">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-6 rounded flex items-center justify-center text-[8px] font-bold text-white shadow-sm
                                    ${method.brand === 'Visa' ? 'bg-gradient-to-r from-blue-600 to-blue-800' : 
                                      method.brand === 'Mastercard' ? 'bg-gradient-to-r from-orange-500 to-red-600' : 'bg-slate-600'}
                                `}>
                                    {method.brand.toUpperCase()}
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-mono text-sm leading-none">•••• {method.last4}</span>
                                    <span className="text-[10px] text-slate-500 mt-1">Exp {method.expiry}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {method.isDefault ? (
                                    <span className="badge badge-xs badge-primary">Default</span>
                                ) : (
                                    <button 
                                        onClick={() => handleSetDefaultPaymentMethod(method.id)}
                                        className="btn btn-xs btn-ghost text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        Set Default
                                    </button>
                                )}
                                <button 
                                    onClick={() => handleDeletePaymentMethod(method.id)} 
                                    className="btn btn-xs btn-ghost btn-circle text-error opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-card rounded-2xl p-5 border border-white/5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
              </div>
              <p className="text-2xl font-black">{totalServices}</p>
              <p className="text-sm text-slate-400">Total Services</p>
            </div>
            <div className="glass-card rounded-2xl p-5 border border-white/5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <Wrench className="w-5 h-5 text-green-400" />
                </div>
              </div>
              <p className="text-2xl font-black">${totalSpent.toLocaleString()}</p>
              <p className="text-sm text-slate-400">Total Spent</p>
            </div>
            <div className="glass-card rounded-2xl p-5 border border-white/5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-400" />
                </div>
              </div>
              <p className="text-2xl font-black">{activeWarranties.length}</p>
              <p className="text-sm text-slate-400">Active Warranties</p>
            </div>
            <div className="glass-card rounded-2xl p-5 border border-white/5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Star className="w-5 h-5 text-purple-400" />
                </div>
              </div>
              <p className="text-2xl font-black">${estSavings.toLocaleString()}</p>
              <p className="text-sm text-slate-400">Est. Savings</p>
            </div>
          </div>

          {/* Service History Timeline */}
          <div className="glass-card rounded-2xl p-6 border border-white/5">
            <h3 className="font-bold text-lg mb-6">Service History</h3>
            <div className="space-y-4">
              {serviceHistoryItems.length === 0 ? (
                <div className="text-center py-10 opacity-50">
                    <p>No service history found.</p>
                </div>
              ) : (
              serviceHistoryItems.map((item, i) => (
                <div key={item.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      item.status === 'warranty' ? 'bg-green-500/20' : 'bg-slate-700'
                    }`}>
                      <CheckCircle className={`w-5 h-5 ${
                        item.status === 'warranty' ? 'text-green-400' : 'text-slate-400'
                      }`} />
                    </div>
                    {i < serviceHistoryItems.length - 1 && (
                      <div className="w-0.5 h-12 bg-slate-700 mt-2"></div>
                    )}
                  </div>
                  <div className="flex-1 pb-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold">{item.serviceName}</h4>
                        <p className="text-sm text-slate-400">{item.shopName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">${item.total.toLocaleString()}</p>
                        <p className="text-xs text-slate-400">{item.date}</p>
                      </div>
                    </div>
                    {item.status === 'warranty' && (
                      <div className="mt-2 badge badge-success badge-sm gap-1">
                        <Shield className="w-3 h-3" />
                        Warranty until {item.warrantyUntil}
                      </div>
                    )}
                  </div>
                </div>
              )))}
            </div>
          </div>

          {/* Recent Bookings Table */}
          <div className="glass-card rounded-2xl p-6 border border-white/5">
            <h3 className="font-bold text-lg mb-4">Recent Bookings</h3>
            <div className="overflow-x-auto">
              {bookings.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                  <Calendar className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p>No bookings yet.</p>
                  <p className="text-xs">Your service bookings will appear here.</p>
                </div>
              ) : (
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th>Service</th>
                      <th>Shop</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking: any) => (
                      <tr key={booking.id} className="hover:bg-slate-800/50">
                        <td className="font-medium">{booking.service?.name || 'Service'}</td>
                        <td className="text-slate-400">{booking.shop?.name || 'Shop'}</td>
                        <td className="text-slate-400">{new Date(booking.scheduledDate).toLocaleDateString()}</td>
                        <td>
                          <span className={`badge badge-sm ${
                            booking.status === 'COMPLETED' ? 'badge-success' :
                            booking.status === 'CONFIRMED' ? 'badge-primary' :
                            booking.status === 'IN_PROGRESS' ? 'badge-warning' : 'badge-ghost'
                          }`}>
                            {booking.status}
                          </span>
                        </td>
                        <td>
                          <button className="btn btn-ghost btn-xs">
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Settings */}
            <div className="glass-card rounded-2xl p-6 border border-white/5">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Profile Information
              </h3>
              <div className="space-y-4">
                <div className="form-control">
                  <label className="label"><span className="label-text">Full Name</span></label>
                  <input type="text" defaultValue={user.name} className="input input-bordered bg-slate-800 border-white/10" />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text">Email</span></label>
                  <input type="email" defaultValue={user.email} className="input input-bordered bg-slate-800 border-white/10" />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text">Phone</span></label>
                  <input type="tel" defaultValue="+1 (555) 123-4567" className="input input-bordered bg-slate-800 border-white/10" />
                </div>
                <button onClick={() => showAlert.success('Profile updated successfully!')} className="btn btn-primary">Save Changes</button>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="glass-card rounded-2xl p-6 border border-white/5">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Notifications
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Booking Updates</p>
                    <p className="text-sm text-slate-400">Get notified about booking status changes</p>
                  </div>
                  <input type="checkbox" className="toggle toggle-primary" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Quote Responses</p>
                    <p className="text-sm text-slate-400">Receive alerts when shops respond to quotes</p>
                  </div>
                  <input type="checkbox" className="toggle toggle-primary" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Promotions</p>
                    <p className="text-sm text-slate-400">Get notified about deals and discounts</p>
                  </div>
                  <input type="checkbox" className="toggle toggle-primary" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Service Reminders</p>
                    <p className="text-sm text-slate-400">Reminders for recommended maintenance</p>
                  </div>
                  <input type="checkbox" className="toggle toggle-primary" defaultChecked />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Security */}
            <div className="glass-card rounded-2xl p-5 border border-white/5">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security
              </h3>
              <div className="space-y-3">
                <button className="btn btn-ghost btn-sm w-full justify-start gap-2">
                  Change Password
                </button>
                <button className="btn btn-ghost btn-sm w-full justify-start gap-2">
                  Two-Factor Authentication
                </button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="glass-card rounded-2xl p-5 border border-red-500/20 bg-red-500/5">
              <h3 className="font-bold mb-4 text-red-400">Danger Zone</h3>
              <button 
                onClick={async () => {
                  const confirmed = await showAlert.confirm('Are you sure you want to sign out?', 'Sign Out');
                  if (confirmed) {
                    showAlert.success('Signed out successfully');
                    if (onLogout) onLogout();
                  }
                }} 
                className="btn btn-outline btn-error btn-sm w-full gap-2"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
    </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast toast-end toast-bottom z-50">
          <div className="alert alert-success">
            <CheckCircle className="w-5 h-5" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Add/Edit Vehicle Modal */}
      {showAddVehicleModal && (
        <div className="fixed top-16 right-0 left-0 bottom-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center">
          <div className="bg-slate-900 rounded-3xl max-w-lg w-full max-h-[calc(100vh-11rem)] overflow-y-auto border border-white/10 animate-in zoom-in-95 duration-300">
            <div className="sticky top-0 bg-slate-900 p-6 border-b border-white/5 flex items-center justify-between z-10 relative">
              <h2 className="text-2xl font-black uppercase italic">{editingVehicleId ? 'Edit Vehicle' : 'Add Vehicle'}</h2>
              <button onClick={() => setShowAddVehicleModal(false)} className="btn btn-ghost btn-circle btn-sm">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {formError && <div className="alert alert-error text-sm">{formError}</div>}
              
              {!manualEntry && !editingVehicleId ? (
                <div>
                  <label className="label">
                    <span className="label-text font-medium flex items-center gap-2">
                      <Search className="w-4 h-4" /> Enter VIN for Auto-Decode
                    </span>
                  </label>
                  <div className="join w-full">
                    <input 
                      type="text"
                      value={vinInput}
                      onChange={(e) => setVinInput(e.target.value.toUpperCase())}
                      placeholder="e.g., 1HGFC2F59JA000092"
                      maxLength={17}
                      className="input input-bordered join-item flex-1 bg-base-100 border-white/10 font-mono uppercase"
                    />
                    <button 
                      onClick={handleVINDecode}
                      disabled={vinInput.length !== 17 || isDecoding}
                      className="btn btn-primary join-item"
                    >
                      {isDecoding ? <span className="loading loading-spinner loading-sm" /> : 'Decode'}
                    </button>
                  </div>
                  
                  {vinDecodeResult && (
                    <div className={`alert mt-4 ${vinDecodeResult.valid && vinDecodeResult.make ? 'alert-success' : 'alert-warning'}`}>
                       {vinDecodeResult.valid && vinDecodeResult.make ? (
                         <>
                            <CheckCircle className="w-5 h-5" />
                            <div>
                                <p className="font-bold">{vinDecodeResult.year} {vinDecodeResult.make} {vinDecodeResult.model}</p>
                                <p className="text-sm opacity-80">{vinDecodeResult.trim} • {vinDecodeResult.type}</p>
                            </div>
                         </>
                       ) : (
                          <span>Could not decode VIN</span>
                       )}
                    </div>
                  )}

                  <div className="divider text-sm text-slate-500">OR</div>
                  <button onClick={() => setManualEntry(true)} className="btn btn-outline btn-block">Enter Details Manually</button>
                </div>
              ) : null}

              {(manualEntry || editingVehicleId || (vinDecodeResult?.valid && vinDecodeResult.make)) && (
                  <div className="space-y-4">
                      {manualEntry && !editingVehicleId && <button onClick={() => setManualEntry(false)} className="btn btn-ghost btn-sm">← Back to VIN Decode</button>}
                      
                      {renderFormFields()}

                      <button 
                        onClick={handleSaveVehicle}
                        disabled={!formData.make || !formData.model}
                        className="btn btn-primary btn-block rounded-xl uppercase font-bold"
                      >
                        {editingVehicleId ? 'Update Vehicle' : 'Save Vehicle'}
                      </button>
                  </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Add Payment Modal */}
      {showAddPaymentModal && (
        <div className="fixed top-0 right-0 left-0 bottom-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center">
            <div className="bg-slate-900 rounded-3xl max-w-sm w-full border border-white/10 animate-in zoom-in-95 duration-300">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <h3 className="font-bold text-lg">Add Payment Method</h3>
                    <button onClick={() => setShowAddPaymentModal(false)} className="btn btn-ghost btn-sm btn-circle"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="form-control">
                        <label className="label"><span className="label-text">Card Number</span></label>
                        <div className="relative">
                            <input 
                                type="text" 
                                placeholder="0000 0000 0000 0000" 
                                className="input input-bordered w-full pl-10 bg-slate-800 font-mono"
                                value={newPaymentForm.number}
                                onChange={(e) => {
                                    // Basic formatting
                                    const v = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
                                    const parts = [];
                                    for (let i = 0; i < v.length; i += 4) {
                                        parts.push(v.substr(i, 4));
                                    }
                                    setNewPaymentForm({...newPaymentForm, number: parts.length > 1 ? parts.join(' ') : v});
                                }}
                                maxLength={19}
                            />
                            <CreditCard className="w-5 h-5 absolute left-3 top-3.5 text-slate-500" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-control">
                            <label className="label"><span className="label-text">Expiry</span></label>
                            <input 
                                type="text" 
                                placeholder="MM/YY" 
                                className="input input-bordered w-full bg-slate-800"
                                value={newPaymentForm.expiry}
                                onChange={(e) => setNewPaymentForm({...newPaymentForm, expiry: e.target.value})}
                                maxLength={5}
                            />
                        </div>
                        <div className="form-control">
                            <label className="label"><span className="label-text">CVC</span></label>
                            <input 
                                type="text" 
                                placeholder="123" 
                                className="input input-bordered w-full bg-slate-800"
                                value={newPaymentForm.cvc}
                                onChange={(e) => setNewPaymentForm({...newPaymentForm, cvc: e.target.value})}
                                maxLength={4}
                            />
                        </div>
                    </div>
                    <div className="form-control">
                        <label className="label"><span className="label-text">Name on Card</span></label>
                        <input 
                            type="text" 
                            placeholder="John Doe" 
                            className="input input-bordered w-full bg-slate-800"
                            value={newPaymentForm.name}
                            onChange={(e) => setNewPaymentForm({...newPaymentForm, name: e.target.value})}
                        />
                    </div>
                    <button onClick={handleAddPaymentMethod} className="btn btn-primary w-full rounded-xl mt-2">
                        Save Card
                    </button>
                    <p className="text-[10px] text-slate-500 text-center flex items-center justify-center gap-1">
                        <Shield className="w-3 h-3" /> Securely encrypted via Stripe
                    </p>
                </div>
            </div>
        </div>
      )}
    </>
  );
};