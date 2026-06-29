'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    country: 'NG',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await apiClient.post('/auth/register', formData);
      if (data.success) {
        toast.success('Account created successfully!');
        login(data.data.tokens.accessToken, data.data.user, data.data.tokens.expiresIn);
        router.push('/auth/verify');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold mb-2">Create an account</h1>
        <p className="text-text-secondary">Join VOPayX to start moving money globally.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">First Name</label>
            <input 
              type="text" 
              className="input" 
              required 
              value={formData.firstName}
              onChange={(e) => setFormData({...formData, firstName: e.target.value})}
              placeholder="John"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Last Name</label>
            <input 
              type="text" 
              className="input" 
              required 
              value={formData.lastName}
              onChange={(e) => setFormData({...formData, lastName: e.target.value})}
              placeholder="Doe"
            />
          </div>
        </div>

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
          <label className="block text-sm font-medium text-text-secondary mb-1">Phone Number (Optional)</label>
          <input 
            type="tel" 
            className="input" 
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            placeholder="+1 234 567 8900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Password</label>
          <input 
            type="password" 
            className="input" 
            required 
            minLength={8}
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            placeholder="Min. 8 characters"
          />
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full mt-2 h-12">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
        </button>
      </form>

      <p className="text-center mt-8 text-text-secondary text-sm">
        Already have an account?{' '}
        <Link href="/auth/login" className="font-semibold text-white hover:text-accent transition-colors">
          Sign In
        </Link>
      </p>
    </>
  );
}
