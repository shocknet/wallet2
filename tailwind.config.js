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
		},
	},
	plugins: [],
}

