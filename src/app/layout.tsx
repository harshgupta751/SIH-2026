import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'MahaSetu | Government Interoperability & Unified Service Delivery Platform',
  description:
    'SIH26129: Enterprise middleware platform connecting heterogeneous departmental systems through standardized APIs, Common Data Model (CDM), DPDP consent management, and event-driven workflows.',
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
            <p className="font-medium">
              MahaSetu Platform • Smart India Hackathon (SIH26129)
            </p>
            <p className="text-slate-400">
              Department of Revenue (RevNet) ↔ Municipal Corp (MuniSys) ↔ Employment Dept (KaushalPortal)
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
