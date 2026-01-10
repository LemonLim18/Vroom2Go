import React, { useState, useEffect } from 'react';
import { Vehicle, CarType } from '../types';
import api from '../services/api';
import { decodeVIN, formatVINMasked, getVehicleCategoryDescription } from '../services/vinService';
import { 
  Car, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  CheckCircle, 
  AlertCircle,
  ChevronRight,
  Gauge,
  Calendar,
  Hash,
  Palette,
  FileText,
  X,
  Save
} from 'lucide-react';

interface VehicleProfileViewProps {
  onBack?: () => void;
  onVehicleSelect?: (vehicle: Vehicle) => void;
}

export const VehicleProfileView: React.FC<VehicleProfileViewProps> = ({ onBack, onVehicleSelect }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Selection
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  
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

  // Fetch Vehicles
  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/vehicles');
      // Normalize data (ensure IDs are strings if needed)
      const mapped = data.map((v: any) => ({
        ...v,
        id: String(v.id),
        mileage: Number(v.mileage || 0),
        image: v.imageUrl || v.image || `https://source.unsplash.com/random/800x600/?car,${v.make}` 
      }));
      setVehicles(mapped);
    } catch (err) {
      console.error('Failed to fetch vehicles', err);
    } finally {
      setLoading(false);
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

      await api.post('/vehicles', formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Refresh list to get new vehicle with server-generated image URL
      fetchVehicles();
      
      resetForm();
      setShowAddModal(false);
    } catch (err: any) {
      console.error('Add vehicle failed', err);
      // Show backend error message if available
      // Show backend error message if available
      const msg = err.response?.data?.message ? 
          `${err.response.data.message} ${err.response.data.details ? JSON.stringify(err.response.data.details) : ''}` 
          : 'Failed to add vehicle. Please try again.';
      setFormError(msg);
    }
  };

  const handleUpdateVehicle = async () => {
    if (!editingVehicle) return;
    try {
        const formDataObj = new FormData();
        formDataObj.append('make', formData.make);
        formDataObj.append('model', formData.model);
        formDataObj.append('year', String(formData.year));
        formDataObj.append('type', formData.type);
        formDataObj.append('licensePlate', formData.licensePlate);
        formDataObj.append('color', formData.color);
        formDataObj.append('trim', formData.trim);
        if (formData.mileage) formDataObj.append('mileage', String(formData.mileage));
        if (selectedFile) {
            formDataObj.append('image', selectedFile);
        }

        await api.put(`/vehicles/${editingVehicle.id}`, formDataObj, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        fetchVehicles(); // Refresh to ensure image update is reflected
        
        setShowEditModal(false);
        setEditingVehicle(null);
    } catch (err: any) {
        console.error('Update failed', err);
        const msg = err.response?.data?.message || 'Failed to update vehicle.';
        setFormError(msg);
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this vehicle?')) return;
    try {
      await api.delete(`/vehicles/${id}`);
      setVehicles(prev => prev.filter(v => v.id !== id));
      if (selectedVehicle?.id === id) setSelectedVehicle(null);
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  const openEditModal = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        type: vehicle.type,
        vin: vehicle.vin,
        licensePlate: vehicle.licensePlate || '',
        color: vehicle.color || '',
        mileage: vehicle.mileage || 0,
        trim: vehicle.trim || ''
    });
    setShowEditModal(true);
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

  const getTypeColor = (type: CarType) => {
    switch (type) {
      case CarType.COMPACT: return 'badge-info';
      case CarType.SEDAN: return 'badge-primary';
      case CarType.SUV: return 'badge-warning';
      case CarType.LUXURY: return 'badge-secondary';
      case CarType.EV: return 'badge-success';
      default: return 'badge-ghost';
    }
  };

  // Render Form Fields helper
  const renderFormFields = () => (
    <>
         {/* Image Upload */}
         <div className="form-control w-full">
            <label className="label"><span className="label-text">Vehicle Image</span></label>
            <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-xl bg-slate-800 border border-white/10 overflow-hidden flex items-center justify-center relative">
                    {previewUrl || (editingVehicle?.image && !selectedFile) ? (
                        <img src={previewUrl || editingVehicle?.image} alt="Preview" className="w-full h-full object-cover" />
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

  return (
    <div className="animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          {onBack && (
            <button onClick={onBack} className="btn btn-ghost btn-sm mb-2">← Back</button>
          )}
          <h1 className="text-3xl font-black uppercase italic tracking-tighter">
            My <span className="text-primary">Garage</span>
          </h1>
          <p className="text-slate-400">Manage your vehicles and service history</p>
        </div>
        
        <button 
          onClick={() => { resetForm(); setShowAddModal(true); }}
          className="btn btn-primary gap-2 rounded-xl"
        >
          <Plus className="w-5 h-5" /> Add Vehicle
        </button>
      </div>

      {loading ? (
          <div className="flex justify-center p-12"><span className="loading loading-spinner loading-lg"></span></div>
      ) : vehicles.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center border border-white/5">
          <Car className="w-16 h-16 text-slate-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">No Vehicles Yet</h3>
          <p className="text-slate-400 mb-6">Add your first vehicle to get started with personalized service quotes.</p>
          <button 
            onClick={() => { resetForm(); setShowAddModal(true); }}
            className="btn btn-primary gap-2"
          >
            <Plus className="w-5 h-5" /> Add Your First Vehicle
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((vehicle) => (
            <div 
              key={vehicle.id}
              className={`glass-card rounded-3xl overflow-hidden border transition-all cursor-pointer group ${
                selectedVehicle?.id === vehicle.id 
                  ? 'border-primary shadow-[0_0_20px_rgba(250,204,21,0.2)]' 
                  : 'border-white/5 hover:border-white/10'
              }`}
            >
              <div 
                className="h-40 relative overflow-hidden bg-slate-800"
                onClick={() => setSelectedVehicle(vehicle)}
              >
                <img 
                  src={vehicle.image} 
                  alt={`${vehicle.make} ${vehicle.model}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
                <div className={`absolute top-3 right-3 badge ${getTypeColor(vehicle.type)} font-bold`}>
                  {vehicle.type}
                </div>
              </div>

              <div className="p-5">
                <h3 className="text-xl font-black uppercase italic mb-1">
                  {vehicle.year} {vehicle.make}
                </h3>
                <p className="text-primary font-bold text-lg">{vehicle.model} {vehicle.trim}</p>
                
                <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Hash className="w-4 h-4" />
                    <span>{formatVINMasked(vehicle.vin)}</span>
                  </div>
                  {vehicle.licensePlate && (
                    <div className="flex items-center gap-2 text-slate-400">
                      <FileText className="w-4 h-4" />
                      <span>{vehicle.licensePlate}</span>
                    </div>
                  )}
                  {vehicle.mileage && (
                      <div className="flex items-center gap-2 text-slate-400">
                      <Gauge className="w-4 h-4" />
                      <span>{vehicle.mileage.toLocaleString()} mi</span>
                      </div>
                  ) as any}
                  {vehicle.color && (
                    <div className="flex items-center gap-2 text-slate-400">
                      <Palette className="w-4 h-4" />
                      <span>{vehicle.color}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-5">
                  <button 
                    className="btn btn-sm btn-ghost flex-1 gap-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(vehicle);
                    }}
                  >
                    <Edit3 className="w-4 h-4" /> Edit
                  </button>
                  <button 
                    className="btn btn-sm btn-ghost text-error gap-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteVehicle(vehicle.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {onVehicleSelect && (
                    <button 
                      className="btn btn-sm btn-primary gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Call the prop function
                        onVehicleSelect(vehicle);
                      }}
                    >
                      Select <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Vehicle Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-white/10 animate-in zoom-in-95 duration-300">
            <div className="sticky top-0 bg-slate-900 p-6 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-2xl font-black uppercase italic">Add Vehicle</h2>
              <button onClick={() => setShowAddModal(false)} className="btn btn-ghost btn-circle btn-sm">
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

      {/* Edit Modal */}
      {showEditModal && editingVehicle && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-white/10">
                <div className="sticky top-0 bg-slate-900 p-6 border-b border-white/5 flex items-center justify-between">
                    <h2 className="text-2xl font-black uppercase italic">Edit Vehicle</h2>
                    <button onClick={() => setShowEditModal(false)} className="btn btn-ghost btn-circle btn-sm"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-6 space-y-6">
                    {formError && <div className="alert alert-error text-sm">{formError}</div>}
                    {renderFormFields()}
                    <div className="flex gap-2">
                        <button onClick={() => setShowEditModal(false)} className="btn btn-ghost flex-1">Cancel</button>
                        <button onClick={handleUpdateVehicle} className="btn btn-primary flex-1">Save Changes</button>
                    </div>
                </div>
            </div>
          </div>
      )}
    </div>
  );
};
