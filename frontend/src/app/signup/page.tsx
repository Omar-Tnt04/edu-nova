"use client";
import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { BrainCircuit, ArrowLeft } from "lucide-react";

function SignupForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({ full_name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      setTimeout(() => {
        const role = formData.email.toLowerCase().includes('admin') ? 'admin' : 'student';
        localStorage.setItem("access_token", "mock_token_123");
        localStorage.setItem("user", JSON.stringify({ email: formData.email, full_name: formData.full_name, role }));
        
        if (role === 'admin') {
          router.push("/dashboard");
        } else {
          router.push("/chat");
        }
      }, 500);
    } catch (err: any) {
      setError(err.message || "Failed to sign up.");
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError('');
    setTimeout(() => {
      localStorage.setItem("access_token", "mock_token_google");
      localStorage.setItem("user", JSON.stringify({ email: "google_user@example.com", full_name: "Google User", role: "student" }));
      router.push("/chat");
    }, 500);
  };

  return (
    <main className="min-h-screen bg-[#050505] flex flex-col justify-center relative overflow-hidden font-sans selection:bg-blue-500/30">
      {/* Back Button */}
      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-neutral-400 hover:text-white transition-colors group z-20">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium tracking-widest uppercase">Back</span>
      </Link>

      <div className="max-w-md w-full mx-auto p-6 md:p-8 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center mb-10"
        >
          <h1 className="text-3xl font-display font-medium text-white mb-2 tracking-tight mt-4">Join EduNova</h1>
          <p className="text-neutral-400 text-center font-light">Start your AI accelerating learning journey</p>
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
          className="space-y-4"
        >
          {/* Social Logins */}
          <button 
            type="button"
            onClick={handleGoogleAuth}
            disabled={loading}
            className={`w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-md px-4 py-3 transition-all duration-300 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0112 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115z" />
              <path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 01-6.723-4.823l-4.04 3.067A11.966 11.966 0 0012 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987z" />
              <path fill="#4A90E2" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21z" />
              <path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 014.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 000 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067z" />
            </svg>
            <span className="font-medium text-sm">Continue with Google</span>
          </button>
          
          <div className="relative py-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/10"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase cursor-default">
              <span className="bg-[#050505] px-4 text-neutral-500 tracking-widest">Or sign up with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-neutral-300 font-medium">Full Name</label>
              <input
                type="text"
                required
                className="w-full bg-white/5 border border-white/10 rounded-md px-4 py-3 text-white placeholder:text-neutral-600 focus:outline-none focus:border-white/30 transition-all font-mono text-sm"
                placeholder="John Doe"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-neutral-300 font-medium">Email / Username</label>
              <input
                type="text"
                required
                className="w-full bg-white/5 border border-white/10 rounded-md px-4 py-3 text-white placeholder:text-neutral-600 focus:outline-none focus:border-white/30 transition-all font-mono text-sm"
                placeholder="you@university.edu"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-neutral-300 font-medium">Password</label>
              <input
                type="password"
                required
                className="w-full bg-white/5 border border-white/10 rounded-md px-4 py-3 text-white placeholder:text-neutral-600 focus:outline-none focus:border-white/30 transition-all font-mono"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-white text-black font-medium rounded-md px-4 py-3 transition-all duration-300 mt-2 ${loading ? 'opacity-70' : 'hover:bg-neutral-200'}`}
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <div className="mt-8 text-center pt-4">
            <p className="text-neutral-500 text-sm">
              Already have an account?{" "}
              <Link href="/login" className="text-white hover:underline transition-all">Log in</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">Loading...</div>}>
      <SignupForm />
    </Suspense>
  );
}
