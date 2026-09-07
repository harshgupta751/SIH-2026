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
    <div className="ms-grid-bg">
      <div className="max-w-2xl mx-auto px-4 py-12 sm:py-16">
        <div className="ms-card p-7 sm:p-8 space-y-7">
          <div>
            <p className="ms-label mb-2">Enrolment</p>
            <h1 className="font-display text-3xl text-ink">Citizen registration</h1>
            <p className="text-sm text-mute mt-2 leading-relaxed">
              Your address is enrolled in the revenue master so other departments can request it only after you grant consent.
            </p>
          </div>
          <form onSubmit={onSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <label className="block text-sm font-medium text-ink mb-1.5">{label}</label>
                <input
                  type={type}
                  required={key !== 'aadhaar' && key !== 'district'}
                  value={(form as Record<string, string>)[key]}
                  onChange={(e) => set(key, e.target.value)}
                  className="ms-input"
                />
              </div>
            ))}
            {error && <p className="sm:col-span-2 text-sm text-danger">{error}</p>}
            <div className="sm:col-span-2">
              <button type="submit" disabled={loading} className="ms-btn ms-btn-primary w-full h-11">
                {loading ? 'Creating account…' : 'Create account'}
              </button>
            </div>
          </form>
          <p className="text-sm text-mute">
            Already registered?{' '}
            <Link href="/login" className="text-accent hover:underline underline-offset-4">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
