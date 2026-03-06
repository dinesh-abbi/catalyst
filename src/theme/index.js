// Centralized theme configuration for UPONETraining

const theme = {
    colors: {
        backgroundMain: '#0f172a', // Deep Ocean Slate
        backgroundCard: '#1e293b',
        accent: '#06B6D4', // Vibrant Cyan/Aqua
        textPrimary: '#ffffff',
        textSecondary: '#cbd5e1', // Brightened slate for better contrast
    },
    spacing: {
        // Tailwind's default spacing is already consistent (4px increments), 
        // but demonstrating extension here if needed:
        '4xs': '2px',
        '3xs': '4px',
        '2xs': '8px',
        'xs': '12px',
        'sm': '16px',
        'md': '24px',
        'lg': '32px',
        'xl': '48px',
        '2xl': '64px',
    },
};

module.exports = theme;
