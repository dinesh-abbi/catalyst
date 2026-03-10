// Centralized theme configuration for UPONETraining

const themeSpacing = {
    '4xs': 2, '3xs': 4, '2xs': 8, 'xs': 12, 'sm': 16, 'md': 24, 'lg': 32, 'xl': 48, '2xl': 64,
};

const theme = {
    colors: {
        backgroundMain: '#000000', // Pure OLED black
        backgroundCard: '#0A0A0A', // Very dark gray for subtle block definition
        backgroundElevated: '#111111',
        accent: '#CCFF00', // Acid Green for extreme contrast
        accentSecondary: '#FF3300', // Cyber Red 
        accentTertiary: '#00E5FF', // Cyan
        textPrimary: '#FFFFFF',
        textSecondary: '#A3A3A3',
        textTertiary: '#737373',
        border: '#333333', // Stark, solid border
        // Neo-Technical specific tokens
        blockFill: '#1A1A1A',
        blockBorder: '#333333',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
    },
    typography: {
        fontFamily: {
            heading: 'SpaceGrotesk_700Bold',
            mono: 'SpaceMono_400Regular',
            monoBold: 'SpaceMono_700Bold',
        },
        h1: { fontFamily: 'SpaceGrotesk_700Bold', fontSize: 32, textTransform: 'uppercase', letterSpacing: -1 },
        h2: { fontFamily: 'SpaceGrotesk_700Bold', fontSize: 24, textTransform: 'uppercase', letterSpacing: -0.5 },
        h3: { fontFamily: 'SpaceGrotesk_700Bold', fontSize: 18, textTransform: 'uppercase' },
        body: { fontFamily: 'SpaceMono_400Regular', fontSize: 14, lineHeight: 20 },
        caption: { fontFamily: 'SpaceMono_700Bold', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase' },
    },
    borderRadius: {
        sm: 0,   // Brutalist sharp corners
        md: 2,   // Very tight corners
        lg: 4,   // Minimal rounding
        xl: 8,
        full: 9999,
    },
    spacing: themeSpacing,
};

module.exports = theme;
