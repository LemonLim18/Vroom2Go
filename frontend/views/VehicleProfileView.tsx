import React, { useState } from 'react';
import { Vehicle, CarType } from '../types';
import { MOCK_VEHICLES } from '../constants';
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
  X
} from 'lucide-react';

interface VehicleProfileViewProps {
  onBack?: () => void;
  onVehicleSelect?: (vehicle: Vehicle) => void;
}

export const VehicleProfileView: React.FC<VehicleProfileViewProps> = ({ onBack, onVehicleSelect }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>(MOCK_VEHICLES);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  
  // Add vehicle form state
  const [vinInput, setVinInput] = useState('');
  const [vinDecodeResult, setVinDecodeResult] = useState<ReturnType<typeof decodeVIN> | null>(null);
  const [isDecoding, setIsDecoding] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
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

  const handleVINDecode = () => {
    if (vinInput.length < 17) return;
    
    setIsDecoding(true);
    // Simulate API delay
    setTimeout(() => {
      const result = decodeVIN(vinInput);
      setVinDecodeResult(result);
      
      if (result.valid && result.make) {
        setNewVehicle(prev => ({
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

  const handleAddVehicle = () => {
    const vehicle: Vehicle = {
      id: `v${Date.now()}`,
      userId: 'user1',
      make: newVehicle.make,
      model: newVehicle.model,
      year: newVehicle.year,
      type: newVehicle.type,
      vin: newVehicle.vin || `VIN${Date.now()}`,
      licensePlate: newVehicle.licensePlate,
      color: newVehicle.color,
      mileage: newVehicle.mileage,
      trim: newVehicle.trim,
      image: `https://picsum.photos/300/200?random=${Date.now()}`,
    };
    
    setVehicles(prev => [...prev, vehicle]);
    resetAddForm();
  };

  const resetAddForm = () => {
    setShowAddModal(false);
    setVinInput('');
    setVinDecodeResult(null);
    setManualEntry(false);
    setNewVehicle({
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

  const handleDeleteVehicle = (id: string) => {
    setVehicles(prev => prev.filter(v => v.id !== id));
    if (selectedVehicle?.id === id) {
      setSelectedVehicle(null);
    }
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
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary gap-2 rounded-xl"
        >
          <Plus className="w-5 h-5" /> Add Vehicle
        </button>
      </div>

      {/* Vehicle Grid */}
      {vehicles.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center border border-white/5">
          <Car className="w-16 h-16 text-slate-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">No Vehicles Yet</h3>
          <p className="text-slate-400 mb-6">Add your first vehicle to get started with personalized service quotes.</p>
          <button 
            onClick={() => setShowAddModal(true)}
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
              onClick={() => setSelectedVehicle(vehicle)}
            >
              {/* Vehicle Image */}
              <div className="h-40 relative overflow-hidden bg-slate-800">
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

              {/* Vehicle Info */}
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
                  )}
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
                      // Edit functionality
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

      {/* Selected Vehicle Details */}
      {selectedVehicle && (
        <div className="mt-8 glass-card rounded-3xl p-6 border border-white/5">
          <h3 className="text-xl font-bold mb-4">Service History</h3>
          <div className="text-center py-8 text-slate-400">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No service history for this vehicle yet.</p>
            <button onClick={() => onVehicleSelect?.(selectedVehicle)} className="btn btn-primary btn-sm mt-4">Book First Service</button>
          </div>
        </div>
      )}

      {/* Add Vehicle Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-white/10 animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="sticky top-0 bg-slate-900 p-6 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-2xl font-black uppercase italic">Add Vehicle</h2>
              <button onClick={resetAddForm} className="btn btn-ghost btn-circle btn-sm">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* VIN Decode Section */}
              {!manualEntry && (
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
                  <p className="text-xs text-slate-500 mt-1">{vinInput.length}/17 characters</p>

                  {/* VIN Decode Result */}
                  {vinDecodeResult && (
                    <div className={`alert mt-4 ${vinDecodeResult.valid && vinDecodeResult.make ? 'alert-success' : 'alert-warning'}`}>
                      {vinDecodeResult.valid && vinDecodeResult.make ? (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          <div>
                            <p className="font-bold">{vinDecodeResult.year} {vinDecodeResult.make} {vinDecodeResult.model}</p>
                            <p className="text-sm opacity-80">{vinDecodeResult.trim} • {vinDecodeResult.type} • Made in {vinDecodeResult.country}</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-5 h-5" />
                          <span>{vinDecodeResult.error || 'Could not decode VIN'}</span>
                        </>
                      )}
                    </div>
                  )}

                  <div className="divider text-sm text-slate-500">OR</div>
                  
                  <button 
                    onClick={() => setManualEntry(true)}
                    className="btn btn-outline btn-block"
                  >
                    Enter Details Manually
                  </button>
                </div>
              )}

              {/* Manual Entry Form */}
              {(manualEntry || (vinDecodeResult?.valid && vinDecodeResult.make)) && (
                <div className="space-y-4">
                  {manualEntry && (
                    <button 
                      onClick={() => setManualEntry(false)}
                      className="btn btn-ghost btn-sm"
                    >
                      ← Back to VIN Decode
                    </button>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="form-control">
                      <label className="label"><span className="label-text">Make *</span></label>
                      <input 
                        type="text"
                        value={newVehicle.make}
                        onChange={(e) => setNewVehicle(prev => ({ ...prev, make: e.target.value }))}
                        placeholder="Honda"
                        className="input input-bordered bg-base-100 border-white/10"
                      />
                    </div>
                    <div className="form-control">
                      <label className="label"><span className="label-text">Model *</span></label>
                      <input 
                        type="text"
                        value={newVehicle.model}
                        onChange={(e) => setNewVehicle(prev => ({ ...prev, model: e.target.value }))}
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
                        value={newVehicle.year}
                        onChange={(e) => setNewVehicle(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                        min={1900}
                        max={new Date().getFullYear() + 1}
                        className="input input-bordered bg-base-100 border-white/10"
                      />
                    </div>
                    <div className="form-control">
                      <label className="label"><span className="label-text">Type *</span></label>
                      <select 
                        value={newVehicle.type}
                        onChange={(e) => setNewVehicle(prev => ({ ...prev, type: e.target.value as CarType }))}
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
                      value={newVehicle.trim}
                      onChange={(e) => setNewVehicle(prev => ({ ...prev, trim: e.target.value }))}
                      placeholder="EX, Sport, Limited, etc."
                      className="input input-bordered bg-base-100 border-white/10"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="form-control">
                      <label className="label"><span className="label-text">License Plate</span></label>
                      <input 
                        type="text"
                        value={newVehicle.licensePlate}
                        onChange={(e) => setNewVehicle(prev => ({ ...prev, licensePlate: e.target.value.toUpperCase() }))}
                        placeholder="ABC-1234"
                        className="input input-bordered bg-base-100 border-white/10 uppercase"
                      />
                    </div>
                    <div className="form-control">
                      <label className="label"><span className="label-text">Color</span></label>
                      <input 
                        type="text"
                        value={newVehicle.color}
                        onChange={(e) => setNewVehicle(prev => ({ ...prev, color: e.target.value }))}
                        placeholder="Silver"
                        className="input input-bordered bg-base-100 border-white/10"
                      />
                    </div>
                  </div>

                  <div className="form-control">
                    <label className="label"><span className="label-text">Current Mileage</span></label>
                    <input 
                      type="number"
                      value={newVehicle.mileage || ''}
                      onChange={(e) => setNewVehicle(prev => ({ ...prev, mileage: parseInt(e.target.value) || 0 }))}
                      placeholder="45000"
                      className="input input-bordered bg-base-100 border-white/10"
                    />
                  </div>

                  {/* Type Description */}
                  <div className="alert bg-slate-800 border-none">
                    <Car className="w-5 h-5 text-primary" />
                    <span className="text-sm">{getVehicleCategoryDescription(newVehicle.type)}</span>
                  </div>

                  <button 
                    onClick={handleAddVehicle}
                    disabled={!newVehicle.make || !newVehicle.model || !newVehicle.year}
                    className="btn btn-primary btn-block rounded-xl uppercase font-bold"
                  >
                    Add Vehicle
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
