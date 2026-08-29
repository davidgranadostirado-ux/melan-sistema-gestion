import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',

        // ---------------------------------------------------------------
        // Identidad corporativa Melan — colores tomados del logo oficial
        // (melanservices.com/web/images/logo.svg)
        //   azul #12315E · azul medio #245891 · azul grisáceo #485E88
        //   naranja #F6862B · naranja oscuro #EF6222
        //   grises #D1D3D4 / #BBBDC0
        // Se sobrescriben las escalas `blue` e `indigo` de Tailwind para que
        // todas las clases ya existentes en la app adopten la marca sin
        // tener que reescribir cada componente.
        // ---------------------------------------------------------------
        navy: {
          DEFAULT: '#12315E',
          deep: '#0B2145',
          mid: '#245891',
          soft: '#485E88',
        },
        brand: {
          DEFAULT: '#F6862B',
          dark: '#EF6222',
          soft: '#F9A860',
          50: '#FEF4EA',
          100: '#FCE3CB',
          600: '#F6862B',
          700: '#EF6222',
          900: '#8A4410',
        },
        gris: { DEFAULT: '#D1D3D4', dark: '#BBBDC0' },

        blue: {
          50: '#EEF3F9',
          100: '#D8E3F0',
          200: '#B3C6E0',
          300: '#7E9CC4',
          400: '#4A72A6',
          500: '#245891',
          600: '#1D4A7C',
          700: '#12315E',
          800: '#0E2A52',
          900: '#0B2145',
          950: '#071730',
        },
        indigo: {
          50: '#FEF4EA',
          100: '#FCE3CB',
          200: '#F9CDA3',
          300: '#F9A860',
          400: '#F79544',
          500: '#F6862B',
          600: '#EF6222',
          700: '#C64E19',
          800: '#9E3E14',
          900: '#7A3410',
          950: '#4A1F09',
        },

        // Escalas semánticas reescritas en clave Melan. Las tarjetas y las
        // insignias del CRM usaban verde/amarillo/morado/rosa/turquesa de
        // Tailwind (un arcoíris ajeno a la marca); aquí se sustituyen por
        // familias derivadas de la paleta corporativa, conservando el
        // significado: verde = ganado, naranja = en curso, rojo = perdido,
        // azules = estados neutros o informativos.
        green: {
          50: '#EAF5EF', 100: '#CFE8DC', 200: '#A6D4BF', 300: '#6FBB98', 400: '#3F9E74',
          500: '#1E7A4B', 600: '#1A6A41', 700: '#155636', 800: '#11452B', 900: '#0D3722',
        },
        emerald: {
          50: '#EAF5EF', 100: '#CFE8DC', 200: '#A6D4BF', 300: '#6FBB98', 400: '#3F9E74',
          500: '#1E7A4B', 600: '#1A6A41', 700: '#155636', 800: '#11452B', 900: '#0D3722',
        },
        red: {
          50: '#FBEDEC', 100: '#F6D6D4', 200: '#EDB0AD', 300: '#E28380', 400: '#DA625E',
          500: '#D2453F', 600: '#B93A34', 700: '#97302B', 800: '#7A2724', 900: '#641F1D',
        },
        rose: {
          50: '#FBEDEC', 100: '#F6D6D4', 200: '#EDB0AD', 300: '#E28380', 400: '#DA625E',
          500: '#D2453F', 600: '#B93A34', 700: '#97302B', 800: '#7A2724', 900: '#641F1D',
        },
        yellow: {
          50: '#FEF4EA', 100: '#FCE3CB', 200: '#F9CDA3', 300: '#F9A860', 400: '#F79544',
          500: '#F6862B', 600: '#EF6222', 700: '#C64E19', 800: '#9E3E14', 900: '#7A3410',
        },
        amber: {
          50: '#FEF4EA', 100: '#FCE3CB', 200: '#F9CDA3', 300: '#F9A860', 400: '#F79544',
          500: '#F6862B', 600: '#EF6222', 700: '#C64E19', 800: '#9E3E14', 900: '#7A3410',
        },
        orange: {
          50: '#FEF4EA', 100: '#FCE3CB', 200: '#F9CDA3', 300: '#F9A860', 400: '#F79544',
          500: '#F6862B', 600: '#EF6222', 700: '#C64E19', 800: '#9E3E14', 900: '#7A3410',
        },
        purple: {
          50: '#F0F2F7', 100: '#DCE1EC', 200: '#BEC7DB', 300: '#94A2C1', 400: '#6B7DA5',
          500: '#485E88', 600: '#3D5075', 700: '#33425F', 800: '#2A364E', 900: '#222C40',
        },
        violet: {
          50: '#F0F2F7', 100: '#DCE1EC', 200: '#BEC7DB', 300: '#94A2C1', 400: '#6B7DA5',
          500: '#485E88', 600: '#3D5075', 700: '#33425F', 800: '#2A364E', 900: '#222C40',
        },
        cyan: {
          50: '#EDF3F9', 100: '#D5E2F0', 200: '#AEC7E0', 300: '#7FA4CB', 400: '#4C7FB0',
          500: '#245891', 600: '#1F4C7E', 700: '#1A3F68', 800: '#163454', 900: '#122B45',
        },
        teal: {
          50: '#EDF3F9', 100: '#D5E2F0', 200: '#AEC7E0', 300: '#7FA4CB', 400: '#4C7FB0',
          500: '#245891', 600: '#1F4C7E', 700: '#1A3F68', 800: '#163454', 900: '#122B45',
        },

        primary: {
          DEFAULT: '#12315E',
          foreground: '#ffffff',
          50: '#EEF3F9',
          100: '#D8E3F0',
          500: '#245891',
          600: '#1D4A7C',
          700: '#12315E',
          800: '#0E2A52',
          900: '#0B2145',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: '#D2453F',
          foreground: '#ffffff',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        success: { DEFAULT: '#1E7A4B', foreground: '#ffffff' },
        warning: { DEFAULT: '#F6862B', foreground: '#ffffff' },
        danger: { DEFAULT: '#D2453F', foreground: '#ffffff' },
        sidebar: { DEFAULT: '#0B2145' },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
