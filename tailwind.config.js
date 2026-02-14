/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        './index.html',
        './src/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {
            colors: {
                // Zkandar AI Brand Colors
                lime: {
                    DEFAULT: '#D0FF71',
                    50: '#F5FFE6',
                    100: '#ECFFCC',
                    200: '#E0FF99',
                    300: '#D0FF71',
                    400: '#B8F23E',
                    500: '#9AD41A',
                    600: '#7AB014',
                    700: '#5A8C0E',
                    800: '#3A6808',
                    900: '#1A4402',
                },
                green: {
                    DEFAULT: '#5A9F2E',
                    50: '#E8F5E0',
                    100: '#D1EBC1',
                    200: '#A3D783',
                    300: '#75C345',
                    400: '#5A9F2E',
                    500: '#4A8326',
                    600: '#3A671E',
                    700: '#2A4B16',
                    800: '#1A2F0E',
                    900: '#0A1306',
                },
                dashboard: {
                    bg: '#0F1219',
                    card: '#151925',
                    'card-hover': '#1A1F2E',
                    accent: '#D0FF71',
                    'accent-bright': '#E0FF99',
                    'accent-hover': '#B8F23E',
                },
                bg: {
                    primary: '#000000',
                    elevated: '#0A0A0A',
                    card: '#111111',
                },
                border: {
                    DEFAULT: 'hsl(0, 0%, 15%)',
                },
            },
            fontFamily: {
                heading: ['"Base Neue Trial"', 'sans-serif'],
                body: ['"FK Grotesk Neue Trial"', 'system-ui', 'sans-serif'],
            },
            borderRadius: {
                'xl': '1.5rem',
                '2xl': '2rem',
            },
            boxShadow: {
                'glow': '0 0 20px rgba(208, 255, 113, 0.15)',
                'glow-lg': '0 0 40px rgba(208, 255, 113, 0.2)',
            },
        },
    },
    plugins: [],
}
