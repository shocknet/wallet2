/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: "class",
	content: [
		"./index.html",
		"./src/**/*.{js,ts,jsx,tsx}",
	],
	theme: {
		extend: {
			colors: {
				primary: 'var(--ion-color-primary)',
				'primary-contrast': 'var(--ion-color-primary-contrast)',

				secondary: 'var(--ion-color-secondary)',
				'secondary-contrast': 'var(--ion-color-secondary-contrast)',

				tertiary: 'var(--ion-color-tertiary)',
				'tertiary-contrast': 'var(--ion-color-tertiary-contrast)',

				success: 'var(--ion-color-success)',
				'success-contrast': 'var(--ion-color-success-contrast)',

				warning: 'var(--ion-color-warning)',
				'warning-contrast': 'var(--ion-color-warning-contrast)',

				danger: 'var(--ion-color-danger)',
				'danger-contrast': 'var(--ion-color-danger-contrast)',

				light: 'var(--ion-color-light)',
				'light-contrast': 'var(--ion-color-light-contrast)',

				medium: 'var(--ion-color-medium)',
				'medium-contrast': 'var(--ion-color-medium-contrast)',

				dark: 'var(--ion-color-dark)',
				'dark-contrast': 'var(--ion-color-dark-contrast)',

				appbg: 'var(--ion-background-color)',
				apptext: 'var(--ion-text-color)',
			},
			keyframes: {
				'shell-breathe': {
					'0%, 100%': { transform: 'scale(1)', opacity: '1' },
					'50%': { transform: 'scale(1.04)', opacity: '0.92' },
				},
				'shell-progress': {
					'0%': { transform: 'translateX(-120%)' },
					'100%': { transform: 'translateX(320%)' },
				},
			},
			animation: {
				'shell-breathe': 'shell-breathe 2.4s ease-in-out infinite',
				'shell-progress': 'shell-progress 1.35s ease-in-out infinite',
			},
		},
	},
	plugins: [],
}

