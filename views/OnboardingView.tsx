import React, { useState } from 'react';
import { UserRole } from '../types';
import { 
  Wrench, 
  Car, 
  ShieldCheck, 
  ArrowRight, 
  Mail, 
  Phone, 
  User, 
  Building2, 
  MapPin,
  FileCheck,
  CheckCircle,
  Zap
} from 'lucide-react';

interface OnboardingViewProps {
  onComplete: (role: UserRole) => void;
  onSkip?: () => void;
}

type OnboardingStep = 'welcome' | 'role' | 'details' | 'complete';

export const OnboardingView: React.FC<OnboardingViewProps> = ({ onComplete, onSkip }) => {
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    // Shop-specific
    businessName: '',
    businessAddress: '',
    licenseNumber: '',
  });
  const [acceptedTOS, setAcceptedTOS] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setStep('details');
  };

  const handleSubmit = () => {
    if (selectedRole) {
      setStep('complete');
      // Simulate delay then complete
      setTimeout(() => {
        onComplete(selectedRole);
      }, 2000);
    }
  };

  const canSubmit = () => {
    if (!acceptedTOS || !formData.name || !formData.email || !formData.phone) {
      return false;
    }
    if (selectedRole === UserRole.SHOP) {
      return formData.businessName && formData.businessAddress;
    }
    return true;
  };

  // Welcome Screen
  if (step === 'welcome') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 animate-in fade-in duration-700">
        <div className="max-w-lg w-full text-center">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-16 h-16 bg-primary flex items-center justify-center rounded-2xl rotate-3 shadow-lg shadow-primary/30">
              <Wrench className="w-9 h-9 text-black" />
            </div>
          </div>
          
          <h1 className="text-5xl font-black uppercase italic tracking-tighter mb-4">
            Vroom2<span className="text-primary">.</span>Go
          </h1>
          
          <p className="text-xl text-slate-400 mb-8 font-medium">
            Your pit crew is ready. Connect with verified mechanics, 
            compare transparent quotes, and get back on the road.
          </p>

          {/* Features */}
          <div className="grid grid-cols-3 gap-4 mb-10">
            {[
              { icon: ShieldCheck, label: 'Verified Shops' },
              { icon: Zap, label: 'Instant Quotes' },
              { icon: Car, label: 'All Vehicles' },
            ].map((feature) => (
              <div key={feature.label} className="glass-card rounded-2xl p-4 border border-white/5">
                <feature.icon className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-300">{feature.label}</p>
              </div>
            ))}
          </div>

          <button 
            onClick={() => setStep('role')}
            className="btn btn-primary btn-lg w-full rounded-2xl uppercase font-black italic gap-2"
          >
            Get Started <ArrowRight className="w-5 h-5" />
          </button>
          
          {onSkip && (
            <button 
              onClick={onSkip}
              className="btn btn-ghost btn-sm mt-4 text-slate-500"
            >
              Skip for now
            </button>
          )}
        </div>
      </div>
    );
  }

  // Role Selection
  if (step === 'role') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 animate-in fade-in slide-in-from-right duration-500">
        <div className="max-w-2xl w-full">
          <button 
            onClick={() => setStep('welcome')}
            className="btn btn-ghost btn-sm mb-6 gap-1"
          >
            ← Back
          </button>

          <h1 className="text-4xl font-black uppercase italic tracking-tighter mb-2">
            Choose Your <span className="text-primary">Role</span>
          </h1>
          <p className="text-slate-400 mb-8">
            Are you looking for service or providing it?
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Vehicle Owner Card */}
            <div 
              onClick={() => handleRoleSelect(UserRole.OWNER)}
              className="glass-card rounded-3xl p-8 border border-white/5 cursor-pointer hover:border-primary/30 hover:shadow-[0_0_30px_rgba(250,204,21,0.1)] transition-all group"
            >
              <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-500/20 transition-colors">
                <Car className="w-8 h-8 text-blue-400" />
              </div>
              <h2 className="text-2xl font-black uppercase italic mb-2">Vehicle Owner</h2>
              <p className="text-slate-400 mb-6">
                Find trusted mechanics, get transparent quotes, book services, and track repairs.
              </p>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Compare shop prices
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Photo-guided quote requests
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Secure deposit escrow
                </li>
              </ul>
            </div>

            {/* Mechanic Shop Card */}
            <div 
              onClick={() => handleRoleSelect(UserRole.SHOP)}
              className="glass-card rounded-3xl p-8 border border-white/5 cursor-pointer hover:border-primary/30 hover:shadow-[0_0_30px_rgba(250,204,21,0.1)] transition-all group"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <Wrench className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-black uppercase italic mb-2">Mechanic Shop</h2>
              <p className="text-slate-400 mb-6">
                List your services, set tiered pricing, receive quote requests, and grow your business.
              </p>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Verified shop badge
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Manage bookings easily
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Secure payouts
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Details Form
  if (step === 'details') {
    const isShop = selectedRole === UserRole.SHOP;

    return (
      <div className="min-h-screen flex items-center justify-center p-4 animate-in fade-in slide-in-from-right duration-500">
        <div className="max-w-lg w-full">
          <button 
            onClick={() => setStep('role')}
            className="btn btn-ghost btn-sm mb-6 gap-1"
          >
            ← Back
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isShop ? 'bg-primary/10' : 'bg-blue-500/10'}`}>
              {isShop ? <Wrench className="w-6 h-6 text-primary" /> : <Car className="w-6 h-6 text-blue-400" />}
            </div>
            <div>
              <p className="text-sm text-slate-400">Signing up as</p>
              <h2 className="font-black uppercase italic">{isShop ? 'Mechanic Shop' : 'Vehicle Owner'}</h2>
            </div>
          </div>

          <h1 className="text-3xl font-black uppercase italic tracking-tighter mb-6">
            Your <span className="text-primary">Details</span>
          </h1>

          <div className="space-y-4">
            {/* Common Fields */}
            <div className="form-control">
              <label className="label">
                <span className="label-text text-slate-400 font-medium flex items-center gap-2">
                  <User className="w-4 h-4" /> {isShop ? 'Contact Name' : 'Full Name'}
                </span>
              </label>
              <input 
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="John Doe"
                className="input input-bordered bg-base-100 border-white/10 focus:border-primary"
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text text-slate-400 font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Email
                </span>
              </label>
              <input 
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="john@example.com"
                className="input input-bordered bg-base-100 border-white/10 focus:border-primary"
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text text-slate-400 font-medium flex items-center gap-2">
                  <Phone className="w-4 h-4" /> Phone
                </span>
              </label>
              <input 
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="(555) 123-4567"
                className="input input-bordered bg-base-100 border-white/10 focus:border-primary"
              />
            </div>

            {/* Shop-specific Fields */}
            {isShop && (
              <>
                <div className="divider text-xs text-slate-500 uppercase">Business Information</div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-slate-400 font-medium flex items-center gap-2">
                      <Building2 className="w-4 h-4" /> Business Name
                    </span>
                  </label>
                  <input 
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleInputChange}
                    placeholder="Auto Shop Name"
                    className="input input-bordered bg-base-100 border-white/10 focus:border-primary"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-slate-400 font-medium flex items-center gap-2">
                      <MapPin className="w-4 h-4" /> Business Address
                    </span>
                  </label>
                  <input 
                    type="text"
                    name="businessAddress"
                    value={formData.businessAddress}
                    onChange={handleInputChange}
                    placeholder="123 Main St, City, State"
                    className="input input-bordered bg-base-100 border-white/10 focus:border-primary"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-slate-400 font-medium flex items-center gap-2">
                      <FileCheck className="w-4 h-4" /> License Number (Optional)
                    </span>
                  </label>
                  <input 
                    type="text"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleInputChange}
                    placeholder="AUTO-XXXX-XXXX"
                    className="input input-bordered bg-base-100 border-white/10 focus:border-primary"
                  />
                </div>

                <div className="alert bg-primary/10 border border-primary/20 mt-4">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  <span className="text-sm">Shop verification typically takes 1-2 business days. You can still set up your profile while pending.</span>
                </div>
              </>
            )}

            {/* TOS Checkbox */}
            <div className="form-control mt-6">
              <label className="cursor-pointer label justify-start gap-3">
                <input 
                  type="checkbox" 
                  checked={acceptedTOS}
                  onChange={(e) => setAcceptedTOS(e.target.checked)}
                  className="checkbox checkbox-primary checkbox-sm" 
                />
                <span className="label-text text-slate-400">
                  I agree to the <a href="#" className="text-primary hover:underline">Terms of Service</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>
                </span>
              </label>
            </div>

            <button 
              onClick={handleSubmit}
              disabled={!canSubmit()}
              className="btn btn-primary btn-lg w-full rounded-2xl uppercase font-black italic gap-2 mt-4"
            >
              Create Account <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Complete Screen
  if (step === 'complete') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 animate-in fade-in zoom-in duration-500">
        <div className="max-w-md w-full text-center">
          <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
            <CheckCircle className="w-12 h-12 text-green-400" />
          </div>
          
          <h1 className="text-4xl font-black uppercase italic tracking-tighter mb-4">
            Welcome to the <span className="text-primary">Pit Crew!</span>
          </h1>
          
          <p className="text-slate-400 text-lg mb-8">
            Your account is ready. {selectedRole === UserRole.SHOP 
              ? "Let's set up your shop profile and start receiving bookings."
              : "Start exploring verified mechanics near you."}
          </p>

          <div className="loading loading-spinner loading-lg text-primary"></div>
          <p className="text-sm text-slate-500 mt-4">Preparing your dashboard...</p>
        </div>
      </div>
    );
  }

  return null;
};
