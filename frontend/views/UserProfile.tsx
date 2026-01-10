import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { MOCK_VEHICLES, MOCK_BOOKINGS, MOCK_USERS } from '../constants';
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

// Mock service history with warranty info
// Mock service history with warranty info (Legacy type for UI only)
const SERVICE_HISTORY: ServiceHistoryItem[] = [];

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

  // Add/Edit Utility State
  const [vinInput, setVinInput] = useState('');
  const [vinDecodeResult, setVinDecodeResult] = useState<ReturnType<typeof decodeVIN> | null>(null);
  const [isDecoding, setIsDecoding] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);
  const [formError, setFormError] = useState('');

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
          image: v.image_url || 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=1000',
          mileage: v.mileage,
          licensePlate: v.license_plate
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

  const handleAddVehicle = async () => {
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

      const { data } = await api.post('/vehicles', formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const addedVehicle = {
        id: data.id,
        ...data,
        // Backend typically returns the full vehicle object, just ensure image is handled
        image: data.imageUrl || data.image || `https://source.unsplash.com/random/800x600/?car,${data.make}`
      };
      
      setVehicles([...vehicles, addedVehicle]);
      resetForm();
      setShowAddVehicleModal(false);
      showToast('Vehicle added successfully!');
    } catch (error: any) {
       console.error('Failed to add vehicle', error);
       const msg = error.response?.data?.message ? 
          `${error.response.data.message} ${error.response.data.details ? JSON.stringify(error.response.data.details) : ''}` 
          : 'Failed to add vehicle.';
       setFormError(msg);
       showToast(msg);
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) return;
    try {
      await api.delete(`/vehicles/${id}`);
      setVehicles(vehicles.filter(v => v.id !== id));
      showToast('Vehicle removed');
    } catch (error) {
       console.error('Failed to delete', error);
       showToast('Could not delete vehicle');
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

  const activeWarranties = SERVICE_HISTORY.filter(s => s.status === 'warranty');

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
                      <button onClick={() => setShowEditVehicleModal(true)} className="btn btn-xs btn-ghost gap-1"><Edit className="w-3 h-3" /> Edit</button>
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
                <button className="btn btn-ghost btn-xs"><Plus className="w-4 h-4" /></button>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-6 bg-gradient-to-r from-blue-600 to-blue-800 rounded"></div>
                    <span>•••• 4242</span>
                  </div>
                  <span className="badge badge-xs badge-primary">Default</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-6 bg-gradient-to-r from-orange-500 to-red-500 rounded"></div>
                    <span>•••• 1234</span>
                  </div>
                </div>
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
              <p className="text-2xl font-black">12</p>
              <p className="text-sm text-slate-400">Total Services</p>
            </div>
            <div className="glass-card rounded-2xl p-5 border border-white/5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <Wrench className="w-5 h-5 text-green-400" />
                </div>
              </div>
              <p className="text-2xl font-black">$2,450</p>
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
              <p className="text-2xl font-black">$400</p>
              <p className="text-sm text-slate-400">Est. Savings</p>
            </div>
          </div>

          {/* Service History Timeline */}
          <div className="glass-card rounded-2xl p-6 border border-white/5">
            <h3 className="font-bold text-lg mb-6">Service History</h3>
            <div className="space-y-4">
              {SERVICE_HISTORY.map((item, i) => (
                <div key={item.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      item.status === 'warranty' ? 'bg-green-500/20' : 'bg-slate-700'
                    }`}>
                      <CheckCircle className={`w-5 h-5 ${
                        item.status === 'warranty' ? 'text-green-400' : 'text-slate-400'
                      }`} />
                    </div>
                    {i < SERVICE_HISTORY.length - 1 && (
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
                        <p className="font-bold">${item.total}</p>
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
              ))}
            </div>
          </div>

          {/* Recent Bookings Table */}
          <div className="glass-card rounded-2xl p-6 border border-white/5">
            <h3 className="font-bold text-lg mb-4">Recent Bookings</h3>
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Shop</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_BOOKINGS.map(booking => (
                    <tr key={booking.id} className="hover:bg-slate-800/50">
                      <td className="font-medium">{booking.serviceName}</td>
                      <td className="text-slate-400">{booking.shopName}</td>
                      <td className="text-slate-400">{booking.date}</td>
                      <td>
                        <span className={`badge badge-sm ${
                          booking.status === 'Completed' ? 'badge-success' :
                          booking.status === 'Confirmed' ? 'badge-primary' :
                          booking.status === 'In Progress' ? 'badge-warning' : 'badge-ghost'
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="font-medium">{booking.price}</td>
                      <td>
                        <button className="btn btn-ghost btn-xs">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                <button onClick={() => showToast('Profile updated successfully!')} className="btn btn-primary">Save Changes</button>
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
                onClick={() => {
                  showToast('Signed out successfully');
                  if (onLogout) onLogout();
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

      {/* Add Vehicle Modal */}
      {showAddVehicleModal && (
        <div className="fixed top-16 right-0 left-0 bottom-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center">
          <div className="bg-slate-900 rounded-3xl max-w-lg w-full max-h-[calc(100vh-11rem)] overflow-y-auto border border-white/10 animate-in zoom-in-95 duration-300">
            <div className="sticky top-0 bg-slate-900 p-6 border-b border-white/5 flex items-center justify-between z-10 relative">
              <h2 className="text-2xl font-black uppercase italic">Add Vehicle</h2>
              <button onClick={() => setShowAddVehicleModal(false)} className="btn btn-ghost btn-circle btn-sm">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {formError && <div className="alert alert-error text-sm">{formError}</div>}
              
              {!manualEntry ? (
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

              {(manualEntry || (vinDecodeResult?.valid && vinDecodeResult.make)) && (
                  <div className="space-y-4">
                      {manualEntry && <button onClick={() => setManualEntry(false)} className="btn btn-ghost btn-sm">← Back to VIN Decode</button>}
                      
                      {renderFormFields()}

                      <button 
                        onClick={handleAddVehicle}
                        disabled={!formData.make || !formData.model}
                        className="btn btn-primary btn-block rounded-xl uppercase font-bold"
                      >
                        Save Vehicle
                      </button>
                  </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Vehicle Modal */}
      {showEditVehicleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-white/10">
            <h2 className="text-2xl font-bold mb-4">Edit Vehicle</h2>
            <div className="space-y-4">
              <div className="form-control">
                <label className="label"><span className="label-text">Nickname</span></label>
                <input type="text" placeholder="My Daily Driver" className="input input-bordered bg-slate-800 border-white/10" />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Current Mileage</span></label>
                <input type="number" placeholder="45000" className="input input-bordered bg-slate-800 border-white/10" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowEditVehicleModal(false)} className="btn btn-ghost flex-1">Cancel</button>
              <button onClick={() => { showToast('Vehicle updated successfully!'); setShowEditVehicleModal(false); }} className="btn btn-primary flex-1">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};