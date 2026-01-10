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
  Zap,
  Lock,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';
import bgImage from '../images/9426199.jpg';

interface OnboardingViewProps {
  onComplete: (role: UserRole) => void;
  onSkip?: () => void;
  initialAuthMode?: 'signup' | 'login' | 'forgot-password';
}

type OnboardingStep = 'welcome' | 'role' | 'details' | 'complete';

export const OnboardingView: React.FC<OnboardingViewProps> = ({ onComplete, onSkip, initialAuthMode = 'signup' }) => {
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [authMode, setAuthMode] = useState<'signup' | 'login' | 'forgot-password'>(initialAuthMode);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  
  // Registration Form Data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    // Shop-specific
    businessName: '',
    businessAddress: '',
    licenseNumber: '',
  });

  // Login Form Data
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  
  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [acceptedTOS, setAcceptedTOS] = useState(false);

  // Helper to map backend role to frontend role (backend uses OWNER, frontend uses DRIVER)
  const mapBackendRole = (backendRole: string): UserRole => {
    if (backendRole === 'OWNER') return UserRole.DRIVER;
    if (backendRole === 'SHOP') return UserRole.SHOP;
    if (backendRole === 'ADMIN') return UserRole.ADMIN;
    return UserRole.DRIVER; // Default fallback
  };

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

  const handleLogin = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const response = await api.post('/auth/login', loginData);
      
      const { token, ...userData } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setTimeout(() => {
        onComplete(mapBackendRole(userData.role));
      }, 800);
    } catch (err: any) {
      console.error('Login failed', err);
      setErrorMsg(err.response?.data?.message || 'Invalid email or password');
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      if (!loginData.email) {
        setErrorMsg('Please enter your email address');
        setIsLoading(false);
        return;
      }
      await api.post('/auth/forgot-password', { email: loginData.email });
      setAuthMode('login');
      alert('If an account exists, a reset link has been sent (CHECK SERVER CONSOLE).');
    } catch (err) {
      console.error('Reset failed', err);
      setErrorMsg('Failed to send reset link');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (selectedRole) {
      setIsLoading(true);
      setErrorMsg('');
      try {
        setStep('complete');
        
        const payload = {
          email: formData.email,
          password: formData.password,
          name: formData.name,
          role: selectedRole,
          phone: formData.phone,
          ...(selectedRole === UserRole.SHOP && {
            shopName: formData.businessName,
            address: formData.businessAddress
          })
        };

        const response = await api.post('/auth/register', payload);
        
        const { token, ...userData } = response.data;
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));

        setTimeout(() => {
          onComplete(selectedRole);
          setIsLoading(false);
        }, 1500);
      } catch (error: any) {
        console.error('Registration failed:', error);
        setErrorMsg(error.response?.data?.message || 'Registration failed');
        setStep('details');
        setIsLoading(false);
      }
    }
  };

  const canSubmit = () => {
    if (!acceptedTOS || !formData.name || !formData.email || !formData.phone || !formData.password) {
      return false;
    }
    if (selectedRole === UserRole.SHOP) {
      return formData.businessName && formData.businessAddress;
    }
    return true;
  };

  const renderContent = () => {
    // Login Screen
    if (authMode === 'login') {
      return (
        <div className="max-w-md w-full glass-card p-8 rounded-3xl border border-white/10 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 bg-black/40 backdrop-blur-md">
          <button 
             onClick={() => setAuthMode('signup')}
             className="btn btn-ghost btn-sm mb-6 gap-1 pl-0 text-slate-400 hover:text-white"
          >
            ← Create an Account
          </button>

          <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-2">Welcome Back</h2>
          <p className="text-slate-300 mb-8">Sign in to your Vroom2 Go account.</p>

          <div className="space-y-4">
             {errorMsg && (
              <div className="alert alert-error text-sm py-2 rounded-xl">
                <AlertCircle className="w-4 h-4" /> <span>{errorMsg}</span>
              </div>
            )}
            
            <div className="form-control">
              <label className="label"><span className="label-text text-slate-300">Email</span></label>
              <input 
                 type="email" 
                 className="input input-bordered bg-slate-900/50 border-white/10 text-white" 
                 value={loginData.email}
                 onChange={(e) => setLoginData({...loginData, email: e.target.value})}
              />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text text-slate-300">Password</span></label>
              <input 
                 type="password" 
                 className="input input-bordered bg-slate-900/50 border-white/10 text-white"
                 value={loginData.password}
                 onChange={(e) => setLoginData({...loginData, password: e.target.value})}
              />
              <label className="label">
                <span 
                  onClick={() => setAuthMode('forgot-password')}
                  className="label-text-alt link link-hover text-primary cursor-pointer"
                >
                  Forgot password?
                </span>
              </label>
            </div>
            
            <button 
               onClick={handleLogin}
               disabled={isLoading || !loginData.email || !loginData.password}
               className="btn btn-primary w-full mt-4 font-bold uppercase italic tracking-wider rounded-xl shadow-lg shadow-primary/20"
            >
              {isLoading ? <span className="loading loading-spinner"></span> : 'Sign In'}
            </button>
          </div>
        </div>
      );
    }

    // Forgot Password Screen
    if (authMode === 'forgot-password') {
      return (
        <div className="max-w-md w-full glass-card p-8 rounded-3xl border border-white/10 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 bg-black/40 backdrop-blur-md">
          <button 
             onClick={() => setAuthMode('login')}
             className="btn btn-ghost btn-sm mb-6 gap-1 pl-0 text-slate-400 hover:text-white"
          >
            ← Back to Login
          </button>

          <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-2">Reset Password</h2>
          <p className="text-slate-300 mb-8">Enter your email and we'll send you a reset link.</p>

          <div className="space-y-4">
             {errorMsg && (
              <div className="alert alert-error text-sm py-2 rounded-xl">
                <AlertCircle className="w-4 h-4" /> <span>{errorMsg}</span>
              </div>
            )}
            
            <div className="form-control">
              <label className="label"><span className="label-text text-slate-300">Email</span></label>
              <input 
                 type="email" 
                 className="input input-bordered bg-slate-900/50 border-white/10 text-white" 
                 value={loginData.email}
                 onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                 placeholder="name@example.com"
              />
            </div>
            
            <button 
               onClick={handleForgotPassword}
               disabled={isLoading || !loginData.email}
               className="btn btn-primary w-full mt-4 font-bold uppercase italic tracking-wider rounded-xl shadow-lg shadow-primary/20"
            >
              {isLoading ? <span className="loading loading-spinner"></span> : 'Send Reset Link'}
            </button>
          </div>
        </div>
      );
    }

    // Welcome Screen
    if (step === 'welcome') {
      return (
        <div className="max-w-lg w-full text-center animate-in fade-in duration-700">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-16 h-16 bg-primary flex items-center justify-center rounded-2xl rotate-3 shadow-lg shadow-primary/30">
              <Wrench className="w-9 h-9 text-black" />
            </div>
          </div>
          
          <h1 className="text-5xl font-black uppercase italic tracking-tighter mb-4 drop-shadow-xl text-white">
            Vroom2<span className="text-primary">.</span>Go
          </h1>
          
          <p className="text-xl text-slate-100 mb-8 font-medium drop-shadow-md">
            Your pit crew is ready. Connect with verified mechanics, 
            compare transparent quotes, and get back on the road.
          </p>

          <div className="grid grid-cols-3 gap-4 mb-10">
            {[
              { icon: ShieldCheck, label: 'Verified Shops' },
              { icon: Zap, label: 'Instant Quotes' },
              { icon: Car, label: 'All Vehicles' },
            ].map((feature) => (
              <div key={feature.label} className="glass-card rounded-2xl p-4 border border-white/10 bg-black/40 backdrop-blur-md">
                <feature.icon className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-200">{feature.label}</p>
              </div>
            ))}
          </div>

          <button 
            onClick={() => setStep('role')}
            className="btn btn-primary btn-lg w-full rounded-2xl uppercase font-black italic gap-2 shadow-xl shadow-primary/20 hover:shadow-primary/40 border-none"
          >
            Get Started <ArrowRight className="w-5 h-5" />
          </button>
          
          <div className="mt-6">
            <p className="text-slate-200 text-sm drop-shadow-md">
                Already have an account? <button onClick={() => setAuthMode('login')} className="text-primary font-bold hover:underline">Sign In</button>
            </p>
          </div>

          {onSkip && (
            <button 
              onClick={onSkip}
              className="btn btn-ghost btn-sm mt-4 text-slate-300 hover:text-white"
            >
              Skip for now
            </button>
          )}
        </div>
      );
    }

    // Role Selection
    if (step === 'role') {
      return (
        <div className="max-w-2xl w-full animate-in fade-in slide-in-from-right duration-500">
          <button 
            onClick={() => setStep('welcome')}
            className="btn btn-ghost btn-sm mb-6 gap-1 text-white hover:bg-white/10"
          >
            ← Back
          </button>

          <h1 className="text-4xl font-black uppercase italic tracking-tighter mb-2 drop-shadow-lg">
            Choose Your <span className="text-primary">Role</span>
          </h1>
          <p className="text-slate-200 mb-8 drop-shadow-md">
            Are you looking for service or providing it?
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div 
              onClick={() => handleRoleSelect(UserRole.DRIVER)}
              className="glass-card rounded-3xl p-8 border border-white/10 cursor-pointer hover:border-primary/50 hover:shadow-[0_0_30px_rgba(250,204,21,0.2)] transition-all group bg-black/50 backdrop-blur-md"
            >
              <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-500/30 transition-colors">
                <Car className="w-8 h-8 text-blue-400" />
              </div>
              <h2 className="text-2xl font-black uppercase italic mb-2">Driver</h2>
              <p className="text-slate-300 mb-6">
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
              </ul>
            </div>

            <div 
              onClick={() => handleRoleSelect(UserRole.SHOP)}
              className="glass-card rounded-3xl p-8 border border-white/10 cursor-pointer hover:border-primary/50 hover:shadow-[0_0_30px_rgba(250,204,21,0.2)] transition-all group bg-black/50 backdrop-blur-md"
            >
              <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary/30 transition-colors">
                <Wrench className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-black uppercase italic mb-2">Mechanic Shop</h2>
              <p className="text-slate-300 mb-6">
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
              </ul>
            </div>
          </div>
        </div>
      );
    }

    // Details Form
    if (step === 'details') {
      const isShop = selectedRole === UserRole.SHOP;

      return (
        <div className="max-w-lg w-full animate-in fade-in slide-in-from-right duration-500 glass-card p-8 rounded-3xl border border-white/10 shadow-2xl bg-black/50 backdrop-blur-md">
          <button 
            onClick={() => setStep('role')}
            className="btn btn-ghost btn-sm mb-6 gap-1 pl-0 text-slate-300 hover:text-white"
          >
            ← Back
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isShop ? 'bg-primary/20' : 'bg-blue-500/20'}`}>
              {isShop ? <Wrench className="w-6 h-6 text-primary" /> : <Car className="w-6 h-6 text-blue-400" />}
            </div>
            <div>
              <p className="text-sm text-slate-400">Signing up as</p>
              <h2 className="font-black uppercase italic text-white">{isShop ? 'Mechanic Shop' : 'Driver'}</h2>
            </div>
          </div>

          <h1 className="text-3xl font-black uppercase italic tracking-tighter mb-6">
            Your <span className="text-primary">Details</span>
          </h1>

          <div className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text text-slate-300 font-medium flex items-center gap-2">
                  <User className="w-4 h-4" /> {isShop ? 'Contact Name' : 'Full Name'}
                </span>
              </label>
              <input 
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="John Doe"
                className="input input-bordered bg-slate-900/50 border-white/10 focus:border-primary text-white"
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text text-slate-300 font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Email
                </span>
              </label>
              <input 
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="john@example.com"
                className="input input-bordered bg-slate-900/50 border-white/10 focus:border-primary text-white"
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text text-slate-300 font-medium flex items-center gap-2">
                  <Phone className="w-4 h-4" /> Phone
                </span>
              </label>
              <input 
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="(555) 123-4567"
                className="input input-bordered bg-slate-900/50 border-white/10 focus:border-primary text-white"
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text text-slate-300 font-medium flex items-center gap-2">
                  <Lock className="w-4 h-4" /> Password
                </span>
              </label>
              <input 
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                className="input input-bordered bg-slate-900/50 border-white/10 focus:border-primary text-white"
              />
            </div>

            {isShop && (
              <>
                <div className="divider text-xs text-slate-500 uppercase">Business Information</div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-slate-300 font-medium flex items-center gap-2">
                      <Building2 className="w-4 h-4" /> Business Name
                    </span>
                  </label>
                  <input 
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleInputChange}
                    placeholder="Auto Shop Name"
                    className="input input-bordered bg-slate-900/50 border-white/10 focus:border-primary text-white"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-slate-300 font-medium flex items-center gap-2">
                      <MapPin className="w-4 h-4" /> Business Address
                    </span>
                  </label>
                  <input 
                    type="text"
                    name="businessAddress"
                    value={formData.businessAddress}
                    onChange={handleInputChange}
                    placeholder="123 Main St, City, State"
                    className="input input-bordered bg-slate-900/50 border-white/10 focus:border-primary text-white"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-slate-300 font-medium flex items-center gap-2">
                      <FileCheck className="w-4 h-4" /> License Number (Optional)
                    </span>
                  </label>
                  <input 
                    type="text"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleInputChange}
                    placeholder="AUTO-XXXX-XXXX"
                    className="input input-bordered bg-slate-900/50 border-white/10 focus:border-primary text-white"
                  />
                </div>
              </>
            )}

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
              className="btn btn-primary btn-lg w-full rounded-2xl uppercase font-black italic gap-2 mt-4 shadow-lg shadow-primary/20"
            >
              Create Account <ArrowRight className="w-5 h-5" />
            </button>
            {errorMsg && (
                <div className="alert alert-error text-sm py-2 rounded-xl mt-4">
                    <AlertCircle className="w-4 h-4" /> <span>{errorMsg}</span>
                </div>
            )}
          </div>
        </div>
      );
    }

    // Complete Screen
    if (step === 'complete') {
      return (
        <div className="max-w-md w-full text-center glass-card p-8 rounded-3xl border border-white/10 shadow-2xl animate-in fade-in zoom-in duration-500 bg-black/50 backdrop-blur-md">
          <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
            <CheckCircle className="w-12 h-12 text-green-400" />
          </div>
          
          <h1 className="text-4xl font-black uppercase italic tracking-tighter mb-4">
            Welcome to the <span className="text-primary">Pit Crew!</span>
          </h1>
          
          <p className="text-slate-300 text-lg mb-8">
            Your account is ready. {selectedRole === UserRole.SHOP 
              ? "Let's set up your shop profile and start receiving bookings."
              : "Start exploring verified mechanics near you."}
          </p>

          <div className="loading loading-spinner loading-lg text-primary"></div>
          <p className="text-sm text-slate-500 mt-4">Preparing your dashboard...</p>
        </div>
      );
    }

    return null;
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat fixed inset-0 z-50 overflow-y-auto"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px] z-0" />
      
      {/* Content Content - Centered & Above Overlay */}
      <div className="relative z-10 w-full flex items-center justify-center py-8">
        {renderContent()}
      </div>
    </div>
  );
};
