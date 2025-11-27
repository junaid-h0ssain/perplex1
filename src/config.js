// config.js
export const CLOUDINARY_CONFIG = {
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
    uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
};

export const HF_CONFIG = {
    apiUrl: import.meta.env.VITE_HF_API_URL,
    apiKey: import.meta.env.VITE_HF_API_KEY
};

export const WEATHER_CONFIG = {
    baseUrl: import.meta.env.VITE_WEATHER_BASE_URL,
    apiKey: import.meta.env.VITE_WEATHER_API_KEY
};