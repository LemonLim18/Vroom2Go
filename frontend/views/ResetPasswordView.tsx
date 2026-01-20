import React, { useState, useEffect } from 'react';
import { Lock, CheckCircle, AlertCircle, Eye, EyeOff, Wrench } from 'lucide-react';
import api from '../services/api';
import { showAlert } from '../utils/alerts';

interface ResetPasswordViewProps {
    onNavigate: (view: string) => void;
}

const ResetPasswordView: React.FC<ResetPasswordViewProps> = ({ onNavigate }) => {
    // Parse token from URL manually since we aren't using react-router
    const queryParams = new URLSearchParams(window.location.search);
    const token = queryParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (!token) {
            setErrorMsg('Invalid or missing reset token.');
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');

        if (password !== confirmPassword) {
            const msg = 'Passwords do not match';
            setErrorMsg(msg);
            showAlert.error(msg);
            return;
        }

        if (password.length < 6) {
            const msg = 'Password must be at least 6 characters';
            setErrorMsg(msg);
            showAlert.error(msg);
            return;
        }

        setIsLoading(true);

        try {
            await api.post(`/auth/reset-password/${token}`, { password });
            showAlert.success('Your password has been reset successfully.', 'Success');
            setTimeout(() => {
                onNavigate('home');
            }, 2000);
        } catch (err: any) {
            console.error('Reset failed', err);
            const msg = err.response?.data?.message || 'Failed to reset password. Link may be expired.';
            setErrorMsg(msg);
            showAlert.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="max-w-md w-full glass-card p-8 rounded-3xl border border-white/10 shadow-2xl bg-slate-900/50 backdrop-blur-xl">
                 <div className="flex items-center justify-center gap-2 mb-8">
                    <div className="w-10 h-10 bg-primary/20 flex items-center justify-center rounded-xl rotate-3">
                      <Wrench className="w-6 h-6 text-primary" />
                    </div>
                    <span className="text-2xl font-black uppercase italic tracking-tighter">Vroom2.Go</span>
                  </div>

                <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-2">New Password</h2>
                <p className="text-slate-400 mb-8">Create a new secure password for your account.</p>

                {errorMsg && (
                    <div className="alert alert-error text-sm py-2 rounded-xl mb-6">
                        <AlertCircle className="w-4 h-4" /> <span>{errorMsg}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="form-control">
                        <label className="label"><span className="label-text text-slate-300">New Password</span></label>
                        <div className="relative">
                            <input 
                                type={showPassword ? "text" : "password"} 
                                className="input input-bordered w-full bg-slate-900/50 border-white/10 pr-10"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                disabled={!token}
                            />
                            <button 
                                type="button"
                                className="absolute right-3 top-3 text-slate-500 hover:text-white"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="form-control">
                        <label className="label"><span className="label-text text-slate-300">Confirm Password</span></label>
                        <input 
                            type="password" 
                            className="input input-bordered w-full bg-slate-900/50 border-white/10"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            disabled={!token}
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={isLoading || !password || !confirmPassword || !token}
                        className="btn btn-primary w-full mt-6 font-bold uppercase italic tracking-wider rounded-xl shadow-lg shadow-primary/20"
                    >
                        {isLoading ? <span className="loading loading-spinner"></span> : 'Reset Password'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPasswordView;