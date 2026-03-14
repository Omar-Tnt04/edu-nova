'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, ArrowLeft } from 'lucide-react';

function VerifyForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get('email') || 'your email';
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        
        try {
            const data = await fetchApi('/auth/verify', {
                method: 'POST',
                body: JSON.stringify({ email, code })
            });
            if (data.access_token) {
                localStorage.setItem('access_token', data.access_token);
                router.push('/dashboard');
            }
        } catch (err: any) {
            setError(err.message || "Failed to verify code.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#050505] flex flex-col justify-center relative overflow-hidden font-sans selection:bg-blue-500/30">
            {/* Back Button */}
            <Link href="/login" className="absolute top-8 left-8 flex items-center gap-2 text-neutral-400 hover:text-white transition-colors group z-20">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-medium tracking-widest uppercase">Back to Login</span>
            </Link>

            <div className="max-w-md w-full mx-auto p-6 md:p-8 relative z-10">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col items-center mb-10 text-center"
                >
                    <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mb-6 relative">
                        <div className="absolute inset-0 border border-emerald-500/30 rounded-full animate-ping opacity-20"></div>
                        <Mail className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h1 className="text-3xl font-display font-medium text-white mb-3 tracking-tight">Check your email</h1>
                    <p className="text-neutral-400 font-light leading-relaxed">
                        We've sent a 6-digit confirmation code to <br/>
                        <span className="text-white font-medium">{email}</span>
                    </p>
                </motion.div>

                {error && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg mb-6 text-sm text-center">
                        {error}
                    </motion.div>
                )}

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <form onSubmit={handleVerify} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm text-neutral-400 font-medium uppercase tracking-widest flex justify-center mb-4">Confirmation Code</label>
                            <input 
                                type="text" 
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder="000000"
                                maxLength={6}
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-md px-4 py-4 text-white text-center text-3xl tracking-[1em] placeholder:text-neutral-800 focus:outline-none focus:border-white/30 transition-all font-mono pl-[calc(1em+1rem)]"
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={isLoading || code.length < 6}
                            className={`w-full bg-white text-black font-medium rounded-lg px-4 py-4 transition-all duration-300 flex items-center justify-center gap-2 group ${isLoading || code.length < 6 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-neutral-200'}`}
                        >
                            {isLoading ? 'Verifying...' : 'Verify & Continue'}
                            {!isLoading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-neutral-500 text-sm">
                            Didn't receive the code?{' '}
                            <button type="button" className="text-emerald-400 hover:text-emerald-300 hover:underline transition-all">Resend</button>
                        </p>
                    </div>
                </motion.div>
            </div>
        </main>
    );
}

export default function VerifyPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">Loading...</div>}>
            <VerifyForm />
        </Suspense>
    );
}
