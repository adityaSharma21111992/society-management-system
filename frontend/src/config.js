// Frontend configuration helper
// Reads values from Vite env vars with sensible defaults

export const societyName = import.meta.env.VITE_SOCIETY_NAME || 'Orion Pride Society';
export const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
export const currencySymbol = import.meta.env.VITE_CURRENCY_SYMBOL || '\u20b9';
export const appName = import.meta.env.VITE_APP_NAME || 'Society Management';
