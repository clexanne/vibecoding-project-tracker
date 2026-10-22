/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // DESIGN.md §2 — brand
        'brand-primary': '#4338CA',
        'brand-accent': '#EEF2FF',
        'surface-page': '#F8FAFC',
        'surface-card': '#FFFFFF',
        'text-primary': '#0F172A',
        'text-muted': '#475569',

        // DESIGN.md §2 — task type (M6 tag-style)
        'type-feature': '#0F766E',
        'type-feature-bg': '#F0FDFA',
        'type-bug': '#A21CAF',
        'type-bug-bg': '#FDF4FF',

        // DESIGN.md §2 — due-date states (M8 due-tint)
        'due-safe': '#475569',
        'due-safe-bg': '#FFFFFF',
        'due-warning': '#B45309',
        'due-warning-bg': '#FFFBEB',
        'due-overdue': '#B91C1C',
        'due-overdue-bg': '#FEF2F2',
        'due-neutral': '#475569',
        'due-neutral-bg': '#F1F5F9',
      },
      fontFamily: {
        // DESIGN.md §3
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [],
};
