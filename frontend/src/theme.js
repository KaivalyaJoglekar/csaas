// frontend/src/theme.js

// --- COLOR PALETTE ---
const lightTheme = {
    background: '#F8F9FB',      // Light grey background
    sidebarBg: '#FFFFFF',       // Pure white sidebar
    cardBg: '#FFFFFF',          // Pure white cards
    primary: '#4A55E5',         // Vibrant blue for primary actions
    primaryLight: '#EDEFFE',    // Very light blue for active states
    text: '#1A202C',            // Dark, readable text
    textSecondary: '#718096',   // Grey for subtext
    border: '#E2E8F0',          // Subtle border color
    success: '#38A169',         // Green for success states
    danger: '#E53E3E',          // Red for danger states
    warning: '#D69E2E',         // Yellow for warnings
  };
  
  const darkTheme = {
    background: '#1A202C',      // Very dark background
    sidebarBg: '#2D3748',       // Dark grey sidebar
    cardBg: '#2D3748',          // Dark grey cards
    primary: '#6366F1',         // Brighter blue for dark mode
    primaryLight: '#3D44C0',    // Darker blue for active states
    text: '#F7FAFC',            // Light text for contrast
    textSecondary: '#A0AEC0',   // Lighter grey for subtext
    border: '#4A5568',          // Visible border on dark background
    success: '#48BB78',
    danger: '#F56565',
    warning: '#F6AD55',
  };
  
  // --- TYPOGRAPHY & LAYOUT ---
  const sharedStyles = {
    fontFamily: "'Inter', 'Roboto', sans-serif",
    sidebarWidth: '260px',
    borderRadius: '12px',
    cardShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
    cardShadowHover: '0 8px 16px rgba(0, 0, 0, 0.1)',
  };
  
  export const getTheme = (mode) => ({
    colors: mode === 'light' ? lightTheme : darkTheme,
    ...sharedStyles,
  });