// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'marso': {
                    DEFAULT: '#4a0e0e',      // основной глубокий бордовый
                    dark:   '#3a0a0a',       // для hover/active
                    light:  '#7f1d1d',       // акцентный красный
                    50:     '#fdf2f2',
                    100:    '#fde8e8',
                    200:    '#facccc',
                    300:    '#f4a0a0',
                    400:    '#e86d6d',
                    500:    '#d94d4d',
                    600:    '#b93d3d',
                    700:    '#9b2c2c',
                    800:    '#7f1d1d',
                    900:    '#4a0e0e',
                },
                'marso-bg': '#ffffff',
                'marso-text': '#111111',
                'marso-text-muted': '#6b7280',
                'marso-border': '#e5e7eb',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                serif: ['Playfair Display', 'Georgia', 'serif'],
            },
            boxShadow: {
                'premium': '0 10px 25px -5px rgba(74, 14, 14, 0.08)',
                'premium-sm': '0 4px 15px -2px rgba(74, 14, 14, 0.06)',
            },
        },
    },
    plugins: [],
}