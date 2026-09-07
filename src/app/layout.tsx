import type { Metadata } from 'next';
import { IBM_Plex_Mono, IBM_Plex_Sans, Source_Serif_4 } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import MahaSetuAssistant from '@/components/chat/MahaSetuAssistant';
import { ThemeProvider } from '@/components/theme/ThemeProvider';

const sans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-sans',
  display: 'swap',
});

const display = Source_Serif_4({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'MahaSetu | Government Interoperability Platform',
  description:
    'Secure, standards-based interoperability across government departments: consent-based data sharing, common data model, and unified service delivery.',
};

const themeBoot = `(function(){try{var t=localStorage.getItem('mahasetu-theme');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
      </head>
      <body
        className={`${sans.variable} ${display.variable} ${mono.variable} font-sans min-h-screen flex flex-col bg-canvas text-ink antialiased`}
      >
        <ThemeProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-line bg-surface">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <p className="font-display text-lg text-ink">MahaSetu</p>
                <p className="mt-1 text-xs text-mute max-w-sm leading-relaxed">
                  Government of Maharashtra interoperability platform. Existing departmental systems stay in place; the gateway coordinates consent, mapping, and audit.
                </p>
              </div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-mute">Revenue · Municipal · Employment</p>
            </div>
          </footer>
          <MahaSetuAssistant />
        </ThemeProvider>
      </body>
    </html>
  );
}
