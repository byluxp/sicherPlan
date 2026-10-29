// cores em variáveis CSS (valores em src/index.css), para que um tema possa trocá-las por escopo
export default {
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: 'var(--color-brand)',
          deep: 'var(--color-brand-deep)',
          'on-primary': 'var(--color-brand-on-primary)',
        },
        surface: {
          page: 'var(--color-surface-page)',
          muted: 'var(--color-surface-muted)',
          card: 'var(--color-surface-card)',
          input: 'var(--color-surface-input)',
          success: 'var(--color-surface-success)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
        },
        status: {
          warning: {
            DEFAULT: '#fff0bc',
            text: '#805c0d',
          },
          danger: {
            DEFAULT: '#fce0dd',
            text: '#a3332c',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        compact: '6px',
        DEFAULT: '8px',
        control: '8px',
        card: '16px',
        pill: '9999px',
      },
    },
  },
};
