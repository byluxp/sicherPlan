export default {
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#176944',
          deep: '#123d2a',
          'on-primary': '#eaf6ed',
        },
        surface: {
          page: '#eaf3ed',
          muted: '#dfeee3',
          card: '#f5faf6',
          input: '#f0f7f2',
          success: '#cde9d6',
        },
        text: {
          primary: '#123d2a',
          secondary: '#547361',
        },
        border: {
          DEFAULT: '#bed5c5',
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
