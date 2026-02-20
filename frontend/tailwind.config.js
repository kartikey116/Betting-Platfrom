/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                gameBg: '#0f172a', // slate-900
                gameCard: '#1e293b', // slate-800
                gameAccent: '#3b82f6', // blue-500
                gameGold: '#eab308', // yellow-500
                gameNeon: '#10b981', // emerald-500
            }
        },
    },
    plugins: [],
}
