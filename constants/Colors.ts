export const Colors = {
  light: {
    background: '#FAFAFA',
    card: '#FFFFFF',
    border: '#E5E7EB',
    ink: '#111827',
    muted: '#6B7280',
    primary: '#6366F1', // Electric Indigo
    primaryGradient: ['#6366F1', '#4F46E5'] as const,
    success: '#10B981', // Clean Emerald
    successGradient: ['#10B981', '#059669'] as const,
    danger: '#EF4444', // Clean Red
    dangerGradient: ['#EF4444', '#DC2626'] as const,
    warning: '#F59E0B',
    warningGradient: ['#F59E0B', '#D97706'] as const,
    surface: '#F3F4F6',
  },
  dark: {
    background: '#09090B',
    card: '#18181B',
    border: '#27272A',
    ink: '#FAFAFA',
    muted: '#A1A1AA',
    primary: '#6366F1', // Electric Indigo
    primaryGradient: ['#818CF8', '#6366F1'] as const,
    success: '#10B981', // Clean Emerald
    successGradient: ['#34D399', '#10B981'] as const,
    danger: '#EF4444', // Clean Red
    dangerGradient: ['#F87171', '#EF4444'] as const,
    warning: '#F59E0B',
    warningGradient: ['#FBBF24', '#F59E0B'] as const,
    surface: '#27272A',
  },
};

// Define standard gradient directions
export const Gradients = {
  diagonal: { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
  horizontal: { start: { x: 0, y: 0 }, end: { x: 1, y: 0 } },
};
