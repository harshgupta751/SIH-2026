'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    mobile: '',
    addressLine: '',
    locality: '',
    city: '',
    district: '',
    state: 'Maharashtra',
    postalCode: '',
    aadhaar: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, district: form.district || form.city }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Registration failed');
        return;
      }
      router.push('/citizen');
      router.refresh();
    } catch {
      setError('Unable to register. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="glass-panel p-8 rounded-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Citizen registration</h1>
          <p className="text-sm text-slate-500 mt-1">
            Your address is enrolled in the revenue master so other departments can request it only after you grant consent.
          </p>
        </div>
        <form onSubmit={onSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          {[
            ['fullName', 'Full name', 'text'],
            ['email', 'Email', 'email'],
            ['password', 'Password (min 8 characters)', 'password'],
            ['mobile', 'Mobile (10 digits)', 'tel'],
            ['addressLine', 'House / street', 'text'],
            ['locality', 'Locality', 'text'],
            ['city', 'City', 'text'],
            ['district', 'District', 'text'],
            ['state', 'State', 'text'],
            ['postalCode', 'PIN code', 'text'],
            ['aadhaar', 'Aadhaar (optional, stored as hash only)', 'text'],
          ].map(([key, label, type]) => (
            <div key={key} className={key === 'addressLine' || key === 'aadhaar' ? 'sm:col-span-2' : ''}>
              <label className="block font-medium text-slate-700 mb-1">{label}</label>
              <input
                type={type}
                required={key !== 'aadhaar' && key !== 'district'}
                value={(form as Record<string, string>)[key]}
                onChange={(e) => set(key, e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
          {error && <p className="sm:col-span-2 text-sm text-rose-600">{error}</p>}
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </div>
        </form>
        <p className="text-xs text-slate-500">
          Already registered?{' '}
          <Link href="/login" className="text-blue-700 font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
