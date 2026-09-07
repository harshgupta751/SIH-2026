import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'MahaSetu | Government Interoperability Platform',
  description:
    'Secure, standards-based interoperability across government departments: consent-based data sharing, common data model, and unified service delivery.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased selection:bg-blue-600 selection:text-white">
        <Navbar />
        <main className="flex-1 pb-16">{children}</main>
        <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="font-medium">MahaSetu — Government of Maharashtra interoperability platform</p>
            <p className="text-slate-400">Revenue · Municipal · Employment systems connected through a consent-governed gateway</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
