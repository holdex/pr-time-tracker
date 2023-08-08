// eslint-disable-next-line
const defaultTheme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,svelte,sass,scss,pug}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    ...defaultTheme,
    screens: {
      xs: '375px',
      sm: '480px',
      md: '768px',
      lg: '992px',
      xl: '1200px',
      '2xl': '1440px',
      'xs-max': { max: '375px' },
      'sm-max': { max: '480px' },
      'md-max': { max: '768px' },
      'lg-max': { max: '992px' },
      'xl-max': { max: '1200px' },
      '2xl-max': { max: '1440px' }
    },
    colors: {
      white: 'white',
      inherit: 'inherit',
      current: 'currentColor',
      transparent: 'transparent',
      l1: 'rgb(var(--l1) / <alpha-value>)',
      l2: 'rgb(var(--l2) / <alpha-value>)',
      l3: 'rgb(var(--l3) / <alpha-value>)',
      l4: 'rgb(var(--l4) / <alpha-value>)',
      l5: 'rgb(var(--l5) / <alpha-value>)',
      l6: 'rgb(var(--l6) / <alpha-value>)',
      t1: 'rgb(var(--t1) / <alpha-value>)',
      t2: 'rgb(var(--t2) / <alpha-value>)',
      t3: 'rgb(var(--t3) / <alpha-value>)',
      t4: 'rgb(var(--t4) / <alpha-value>)',

      'accent1-default': 'rgb(var(--accent1-default) / <alpha-value>)',
      'accent1-active': 'rgb(var(--accent1-active) / <alpha-value>)',
      'accent2-default': 'rgb(var(--accent2-default) / <alpha-value>)',
      'accent2-active': 'rgb(var(--accent2-active) / <alpha-value>)',
      'accent3-default': 'rgb(var(--accent3-default) / <alpha-value>)',
      'accent3-active': 'rgb(var(--accent3-active) / <alpha-value>)'
    },
    fontSize: {
      ...defaultTheme.fontSize,
      'title-l': [
        '3.5rem',
        {
          lineHeight: '4rem',
          fontWeight: '900'
        }
      ],
      'title-s': [
        '3rem',
        {
          lineHeight: '3rem',
          fontWeight: '900'
        }
      ],
      'subtitle-l': [
        '1.25rem',
        {
          lineHeight: '2rem',
          fontWeight: '500'
        }
      ],
      'subtitle-s': [
        '1.125rem',
        {
          lineHeight: '2rem',
          fontWeight: '500'
        }
      ],
      'h1-l': [
        '3rem',
        {
          lineHeight: '4rem',
          fontWeight: '900'
        }
      ],
      'h1-s': [
        '2.625rem',
        {
          lineHeight: '3rem',
          fontWeight: '900'
        }
      ],
      'h2-l': [
        '2rem',
        {
          lineHeight: '2rem',
          fontWeight: '900'
        }
      ],
      'h2-s': [
        '1.75rem',
        {
          lineHeight: '2rem',
          fontWeight: '900'
        }
      ],
      'h3-l': [
        '1.75rem',
        {
          lineHeight: '2rem',
          fontWeight: '900'
        }
      ],
      'h3-s': [
        '1.5rem',
        {
          lineHeight: '2rem',
          fontWeight: '900'
        }
      ],
      'h4-l': [
        '1.5rem',
        {
          lineHeight: '2rem',
          fontWeight: '900'
        }
      ],
      'h4-s': [
        '1.25rem',
        {
          lineHeight: '2rem',
          fontWeight: '900'
        }
      ],
      'h5-l': [
        '1.25rem',
        {
          lineHeight: '2rem',
          fontWeight: '900'
        }
      ],
      'h5-s': [
        '1.125rem',
        {
          lineHeight: '2rem',
          fontWeight: '900'
        }
      ],
      'h6-l': [
        '1.125rem',
        {
          lineHeight: '2rem',
          fontWeight: '900'
        }
      ],
      'h6-s': [
        '1rem',
        {
          lineHeight: '1rem',
          fontWeight: '900'
        }
      ],
      'paragraph-l': [
        '1.125rem',
        {
          lineHeight: '2rem',
          fontWeight: '400'
        }
      ],
      'paragraph-s': [
        '1rem',
        {
          lineHeight: '2rem',
          fontWeight: '400'
        }
      ],
      cta: [
        '0.875rem',
        {
          lineHeight: '2rem',
          fontWeight: '700'
        }
      ],
      footnote: [
        '0.875rem',
        {
          lineHeight: '1.25rem',
          fontWeight: '500'
        }
      ],
      caption: [
        '0.75rem',
        {
          lineHeight: '1rem',
          fontWeight: '500'
        }
      ],
      code: [
        '0.875rem',
        {
          lineHeight: '2rem',
          fontWeight: '600'
        }
      ]
    },
    fontFamily: {
      inter: ['"Inter"'],
      satoshi: ['"Satoshi"'],
      mono: ['"JetBrains Mono"']
    },
    extend: {
      spacing: {
        0.75: '0.1875rem',
        1.25: '0.3125rem',
        1.75: '0.4375rem',
        2.25: '0.5625rem',
        2.75: '0.6875rem',
        3.75: '0.9375rem',
        5.5: '1.375rem',
        5.75: '1.4375rem',
        6.5: '1.625rem',
        8.5: '2.125rem',
        '11/25': '44%',
        '1/2': '50%',
        19: '4.75rem',
        21: '5.438rem',
        23: '5.75rem',
        25: '6.25rem',
        30: '7.5rem',
        31: '7.75rem',
        37: '8.563rem',
        41: '10.563rem',
        54: '13.5rem',
        61: '15.25rem',
        578: '36.125rem',
        636: '39.75rem'
      },
      opacity: {
        15: '0.15'
      },
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans]
      },
      boxShadow: {
        toggle: '0 0.25rem 0.5rem 0 rgba(0, 0, 0, 0.16), 0 0 0 0.125rem rgba(0, 0, 0, 0.20)',
        input:
          '0 0 0 0.125rem rgba(0, 0, 0, var(--shadow-button-ring-alpha)), 0 0.25rem 0.5rem rgba(0, 0, 0, var(--shadow-input-alpha))',
        tag: '0 0.25rem 0.5rem rgba(0, 0, 0, 0.16)',
        'tag-active':
          ' 0 0 0 0.125rem rgba(0, 204, 255, var(--shadow-button-ring-alpha)), 0 0.25rem 0.5rem rgba(0, 0, 0, 0.16)',
        button:
          '0 0 0 0.125rem rgba(0, 0, 0, var(--shadow-button-ring-alpha)), 0 0.25rem 0.5rem rgba(0, 0, 0, var(--shadow-input-alpha)), inset 0 0.125rem 0 rgba(255, 255, 255, 0.24)',
        'button-hover':
          '0 0 0 0.125rem rgba(0, 0, 0, var(--shadow-button-ring-alpha)), 0 0.25rem 0.75rem rgba(0, 0, 0, 0.24), inset 0 0.125rem 0 rgba(255, 255, 255, 0.24)',
        'button-active':
          '0 0 0 0.125rem rgba(0, 204, 255, var(--shadow-button-ring-alpha)), 0 0.25rem 0.75rem rgba(0, 0, 0, 0.24), inset 0 0.125rem 0 rgba(255, 255, 255, 0.24)',
        'secondary-button':
          '0 0 0 0.125rem rgba(0, 0, 0, var(--shadow-button-ring-alpha)), 0 0 0.5rem rgba(0, 0, 0, var(--shadow-button-ring-alpha)), inset 0 0.125rem 0 rgba(255, 255, 255, 0.04)',
        'secondary-button-hover':
          '0 0 0 0.125rem rgba(0, 0, 0, var(--shadow-button-ring-alpha)), 0 0.25rem 0.75rem rgba(0, 0, 0, 0.24), inset 0 0.125rem 0 rgba(255, 255, 255, 0.04)',
        'secondary-button-active':
          '0 0 0 0.125rem rgba(0, 204, 255, var(--shadow-button-ring-alpha)), 0 0.25rem 0.75rem rgba(0, 0, 0, 0.24), inset 0 0.125rem 0 rgba(255, 255, 255, 0.04)'
      }
    }
  },
  plugins: []
};
