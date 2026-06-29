'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await apiClient.post('/auth/login', formData);
      if (data.success) {
        toast.success('Welcome back!');
        login(data.data.tokens.accessToken, data.data.user, data.data.tokens.expiresIn);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold mb-2">Welcome back</h1>
        <p className="text-text-secondary">Enter your details to access your account.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Email address</label>
          <input 
            type="email" 
            className="input" 
            required 
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            placeholder="name@company.com"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium text-text-secondary">Password</label>
            <Link href="/auth/forgot-password" className="text-sm font-medium text-accent hover:text-accent-light transition-colors">
              Forgot password?
            </Link>
          </div>
          <input 
            type="password" 
            className="input" 
            required 
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            placeholder="••••••••"
          />
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full mt-2 h-12">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
        </button>
      </form>

      <p className="text-center mt-8 text-text-secondary text-sm">
        Don't have an account?{' '}
        <Link href="/auth/signup" className="font-semibold text-white hover:text-accent transition-colors">
          Create one now
        </Link>
      </p>
    </>
  );
}
