import React, { useState, useRef, useEffect } from 'react';
import { Vehicle, Shop, CarType, Service } from '../types';
import { analyzeSymptomImage } from '../services/geminiService';
import api from '../services/api';
import { MOCK_SERVICES } from '../constants';
import {
  Camera,
  Upload,
  X,
  CheckCircle,
  AlertTriangle,
  Car,
  Send,
  Plus,
  MapPin,
  Mic,
  Video,
  FileImage,
  Loader2,
  Sparkles
} from 'lucide-react';

interface QuoteRequestViewProps {
  preSelectedVehicle?: Vehicle;
  preSelectedShop?: Shop;
  preSelectedServiceId?: string;
  initialDescription?: string;
  onBack?: () => void;
  onSubmit?: (data: QuoteRequestData) => void;
  onAddVehicle?: () => void;
}

interface QuoteRequestData {
  vehicleId: string;
  description: string;
  symptoms: string[];
  photos: string[];
  targetShopIds: string[];
  broadcast: boolean;
  radius: number;
}

const COMMON_SYMPTOMS = [
  'Strange noise when braking',
  'Engine warning light on',
  'Vibration while driving',
  'Difficulty starting',
  'Unusual smell',
  'Fluid leak',
  'AC not cooling',
  'Battery issues',
  'Steering problems',
  'Transmission issues',
];

export const QuoteRequestView: React.FC<QuoteRequestViewProps> = ({
  preSelectedVehicle,
  preSelectedShop,
  preSelectedServiceId,
  initialDescription,
  onBack,
  onSubmit,
  onAddVehicle,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(preSelectedVehicle || null);
  const [description, setDescription] = useState(() => {
    if (initialDescription) return initialDescription;
    if (preSelectedServiceId) {
        const svc = MOCK_SERVICES.find(s => s.id === preSelectedServiceId);
        return svc ? `I need a ${svc.name}. ${svc.description}` : '';
    }
    return '';
  });
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [availableShops, setAvailableShops] = useState<Shop[]>([]);
  const [selectedShops, setSelectedShops] = useState<Shop[]>(preSelectedShop ? [preSelectedShop] : []);
  const [broadcast, setBroadcast] = useState(!preSelectedShop);
  const [radius, setRadius] = useState(10);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchVehicles();
    fetchShops();
  }, []);

  const fetchVehicles = async () => {
    try {
      const { data } = await api.get('/vehicles');
      setVehicles(data);
    } catch (error) {
        console.error('Fetch vehicles error', error);
        // Fallback to mock not ideal but handles error
    }
  };

  const fetchShops = async () => {
      try {
          const { data } = await api.get('/shops');
          setAvailableShops(data);
      } catch (error) {
          console.error('Fetch shops error', error);
      }
  };

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptom) 
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          setPhotos(prev => [...prev, result]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleAnalyzePhotos = async () => {
    if (photos.length === 0) return;
    
    setIsAnalyzing(true);
    try {
      // Use the first photo for analysis
      const base64 = photos[0].split(',')[1]; // Remove data:image/... prefix
      const analysis = await analyzeSymptomImage(base64, description || 'Vehicle issue analysis');
      setAiAnalysis(analysis);
    } catch (error) {
      console.error('Analysis failed:', error);
      setAiAnalysis('Unable to analyze image. Please describe the issue manually.');
    }
    setIsAnalyzing(false);
  };

  const toggleShop = (shop: Shop) => {
    setSelectedShops(prev => 
      prev.find(s => s.id === shop.id)
        ? prev.filter(s => s.id !== shop.id)
        : [...prev, shop]
    );
  };

  const handleSubmit = async () => {
    if (!selectedVehicle) return;
    
    setIsLoading(true);
    try {
        const requestData = {
          vehicleId: selectedVehicle.id,
          description: aiAnalysis ? description + '\n\nAI Analysis: ' + aiAnalysis : description,
          symptoms: selectedSymptoms,
          photos,
          targetShopIds: selectedShops.map(s => s.id),
          broadcast,
          radius,
        };
        
        await api.post('/quotes/requests', requestData); // Use newly created endpoint
        
        if (onSubmit) {
            // Convert to legacy shape if needed or simply void
            onSubmit(requestData as any);
        }
    } catch (error) {
        console.error('Failed to submit quote request', error);
        // Show error?
    } finally {
        setIsLoading(false);
    }
  };

  const canProceedStep1 = selectedVehicle !== null;
  const canProceedStep2 = description.length > 10 || selectedSymptoms.length > 0;
  const canSubmit = canProceedStep1 && canProceedStep2;

  return (
    <div className="animate-in fade-in duration-500">
      {/* Header */}
      <div className="mb-8">
        {onBack && (
          <button onClick={onBack} className="btn btn-ghost btn-sm mb-4">← Back</button>
        )}
        <h1 className="text-3xl font-black uppercase italic tracking-tighter">
          Request <span className="text-primary">Quote</span>
        </h1>
        <p className="text-slate-400">Describe your issue and get quotes from verified shops</p>
      </div>

      {/* Progress Steps */}
      <ul className="steps steps-horizontal w-full mb-8">
        <li className={`step ${step >= 1 ? 'step-primary' : ''}`}>Select Vehicle</li>
        <li className={`step ${step >= 2 ? 'step-primary' : ''}`}>Describe Issue</li>
        <li className={`step ${step >= 3 ? 'step-primary' : ''}`}>Choose Shops</li>
      </ul>

      {/* Step 1: Vehicle Selection */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Which vehicle needs service?</h2>
            {onAddVehicle && (
              <button onClick={onAddVehicle} className="btn btn-sm btn-ghost gap-2">
                <Plus className="w-4 h-4" /> Add New
              </button>
            )}
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicles.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-10 opacity-75 gap-4">
                  <Car className="w-12 h-12 text-slate-600" />
                  <p className="text-slate-400">No vehicles found in your garage.</p>
                  {onAddVehicle && (
                    <button onClick={onAddVehicle} className="btn btn-primary btn-sm">
                      <Plus className="w-4 h-4" /> Add a Vehicle
                    </button>
                  )}
                </div>
            ) : vehicles.map(vehicle => (
              <div 
                key={vehicle.id}
                onClick={() => setSelectedVehicle(vehicle)}
                className={`glass-card rounded-2xl p-4 cursor-pointer transition-all border ${
                  selectedVehicle?.id === vehicle.id 
                    ? 'border-primary shadow-[0_0_15px_rgba(250,204,21,0.2)]' 
                    : 'border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex items-center gap-4">
                  <img 
                    src={vehicle.imageUrl || 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80'} 
                    alt={`${vehicle.make} ${vehicle.model}`}
                    className="w-20 h-14 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-bold">{vehicle.year} {vehicle.make}</h3>
                    <p className="text-primary font-medium">{vehicle.model}</p>
                    <p className="text-xs text-slate-400">{vehicle.type}</p>
                  </div>
                  {selectedVehicle?.id === vehicle.id && (
                    <CheckCircle className="w-6 h-6 text-primary" />
                  )}
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={() => setStep(2)}
            disabled={!canProceedStep1}
            className="btn btn-primary btn-lg rounded-xl w-full md:w-auto"
          >
            Continue
          </button>
        </div>
      )}

      {/* Step 2: Describe Issue */}
      {step === 2 && (
        <div className="space-y-6">
          {/* Selected Vehicle Card */}
          {selectedVehicle && (
            <div className="glass-card rounded-2xl p-4 flex items-center gap-4 border border-white/5">
              <Car className="w-8 h-8 text-primary" />
              <div>
                <p className="font-bold">{selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}</p>
                <p className="text-sm text-slate-400">{selectedVehicle.type} • {selectedVehicle.licensePlate}</p>
              </div>
              <button onClick={() => setStep(1)} className="btn btn-ghost btn-sm ml-auto">Change</button>
            </div>
          )}

          {/* Description */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Describe the issue</span>
            </label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="E.g., I hear a squealing noise when I press the brakes, especially at low speeds..."
              className="textarea textarea-bordered h-32 bg-base-100 border-white/10 focus:border-primary"
            />
          </div>

          {/* Common Symptoms */}
          <div>
            <label className="label">
              <span className="label-text font-medium">Select common symptoms (optional)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {COMMON_SYMPTOMS.map(symptom => (
                <button
                  key={symptom}
                  onClick={() => toggleSymptom(symptom)}
                  className={`btn btn-sm rounded-full ${
                    selectedSymptoms.includes(symptom) 
                      ? 'btn-primary' 
                      : 'btn-ghost bg-slate-800'
                  }`}
                >
                  {selectedSymptoms.includes(symptom) && <CheckCircle className="w-4 h-4 mr-1" />}
                  {symptom}
                </button>
              ))}
            </div>
          </div>

          {/* Photo Upload */}
          <div>
            <label className="label">
              <span className="label-text font-medium flex items-center gap-2">
                <Camera className="w-4 h-4" /> Upload photos (recommended)
              </span>
            </label>
            
            <div className="flex flex-wrap gap-4">
              {photos.map((photo, index) => (
                <div key={index} className="relative group">
                  <img 
                    src={photo} 
                    alt={`Upload ${index + 1}`}
                    className="w-24 h-24 rounded-xl object-cover"
                  />
                  <button 
                    onClick={() => removePhoto(index)}
                    className="absolute -top-2 -right-2 btn btn-circle btn-error btn-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              
              {photos.length < 5 && (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-24 h-24 rounded-xl border-2 border-dashed border-white/10 hover:border-primary/30 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-white transition-colors"
                >
                  <Plus className="w-6 h-6" />
                  <span className="text-xs">Add Photo</span>
                </button>
              )}
            </div>
            
            <input 
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoUpload}
              className="hidden"
            />

            {photos.length > 0 && (
              <button 
                onClick={handleAnalyzePhotos}
                disabled={isAnalyzing}
                className="btn btn-outline btn-sm mt-4 gap-2"
              >
                {isAnalyzing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> AI Photo Analysis</>
                )}
              </button>
            )}

            {aiAnalysis && (
              <div className="alert bg-primary/10 border border-primary/20 mt-4">
                <Sparkles className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-bold text-sm">AI Analysis</p>
                  <p className="text-sm">{aiAnalysis}</p>
                </div>
              </div>
            )}
          </div>

          {/* Disclaimer */}
          <div className="alert bg-slate-800 border-none">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            <span className="text-sm">
              Estimates are non-binding. Final price may vary based on inspection.
            </span>
          </div>

          <div className="flex gap-4">
            <button onClick={() => setStep(1)} className="btn btn-ghost">Back</button>
            <button 
              onClick={() => setStep(3)}
              disabled={!canProceedStep2}
              className="btn btn-primary flex-1 rounded-xl"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Choose Shops */}
      {step === 3 && (
        <div className="space-y-6">
          {/* Broadcast Option */}
          <div className="glass-card rounded-2xl p-5 border border-white/5">
            <label className="cursor-pointer flex items-start gap-4">
              <input 
                type="checkbox"
                checked={broadcast}
                onChange={(e) => setBroadcast(e.target.checked)}
                className="checkbox checkbox-primary mt-1"
              />
              <div>
                <p className="font-bold">Broadcast to all nearby shops</p>
                <p className="text-sm text-slate-400">Get quotes from all verified shops within your radius</p>
              </div>
            </label>
            
            {broadcast && (
              <div className="mt-4 pl-8">
                <label className="label">
                  <span className="label-text">Search radius: {radius} miles</span>
                </label>
                <input 
                  type="range"
                  min={5}
                  max={25}
                  value={radius}
                  onChange={(e) => setRadius(parseInt(e.target.value))}
                  className="range range-primary range-sm"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>5 mi</span>
                  <span>15 mi</span>
                  <span>25 mi</span>
                </div>
              </div>
            )}
          </div>

          {/* Or Select Specific Shops */}
          <div>
            <p className="font-medium mb-4">Or select specific shops:</p>
            <div className="space-y-3">
              {availableShops.map(shop => (
                <div 
                  key={shop.id}
                  onClick={() => toggleShop(shop)}
                  className={`glass-card rounded-2xl p-4 cursor-pointer transition-all border ${
                    selectedShops.find(s => s.id === shop.id)
                      ? 'border-primary bg-primary/5'
                      : 'border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <img src={shop.image || 'https://images.unsplash.com/photo-1486006920555-c77dcf18193c?auto=format&fit=crop&q=80&w=1000'} alt={shop.name} className="w-16 h-12 rounded-lg object-cover" />
                    <div className="flex-1">
                      <h3 className="font-bold">{shop.name}</h3>tas
                      <div className="flex items-center gap-3 text-sm text-slate-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {shop.distance || '0.5'} mi
                        </span>
                        <span>★ {shop.rating}</span>
                        {shop.verified && (
                          <span className="badge badge-primary badge-xs">Verified</span>
                        )}
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedShops.find(s => s.id === shop.id)
                        ? 'border-primary bg-primary'
                        : 'border-slate-500'
                    }`}>
                      {selectedShops.find(s => s.id === shop.id) && (
                        <CheckCircle className="w-4 h-4 text-black" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="glass-card rounded-2xl p-5 border border-primary/20 bg-primary/5">
            <h3 className="font-bold mb-3">Quote Request Summary</h3>
            <div className="space-y-2 text-sm">
              <p><strong>Vehicle:</strong> {selectedVehicle?.year} {selectedVehicle?.make} {selectedVehicle?.model}</p>
              <p><strong>Issue:</strong> {description || 'Not specified'}</p>
              <p><strong>Symptoms:</strong> {selectedSymptoms.length > 0 ? selectedSymptoms.join(', ') : 'None selected'}</p>
              <p><strong>Photos:</strong> {photos.length} uploaded</p>
              <p><strong>Shops:</strong> {broadcast ? `All within ${radius} miles` : `${selectedShops.length} selected`}</p>
            </div>
          </div>

          <div className="flex gap-4">
            <button onClick={() => setStep(2)} className="btn btn-ghost">Back</button>
            <button 
              onClick={handleSubmit}
              disabled={!canSubmit || (!broadcast && selectedShops.length === 0) || isLoading}
              className="btn btn-primary flex-1 rounded-xl gap-2"
            >
              {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <Send className="w-5 h-5" />}
              {isLoading ? 'Submitting...' : 'Submit Quote Request'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
