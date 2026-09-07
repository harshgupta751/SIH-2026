import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--bg)',
        elevated: 'var(--bg-elevated)',
        surface: 'var(--surface)',
        ink: 'var(--text)',
        mute: 'var(--text-muted)',
        line: 'var(--border)',
        accent: {
          DEFAULT: 'var(--accent)',
          fg: 'var(--accent-fg)',
          hover: 'var(--accent-hover)',
          muted: 'var(--accent-muted)',
        },
        copper: 'var(--copper)',
        success: 'var(--success)',
        danger: 'var(--danger)',
        warn: 'var(--warn)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'ui-serif', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        lift: 'var(--shadow-lift)',
        inset: 'var(--shadow-inset)',
      },
      borderRadius: {
        ms: '10px',
      },
    },
  },
  plugins: [],
};
export default config;
