export const Colors = {
  light: {
    background: '#F4F6F9',
    card: '#FFFFFF',
    border: '#E2E8F0',
    ink: '#0F172A',
    muted: '#64748B',
    primary: '#3B82F6', // Royal Blue
    primaryGradient: ['#3B82F6', '#6366F1'] as const,
    success: '#10B981', // Emerald
    successGradient: ['#10B981', '#0D9488'] as const,
    danger: '#F43F5E', // Rose
    dangerGradient: ['#F43F5E', '#F97316'] as const,
    warning: '#F59E0B', // Amber
    warningGradient: ['#F59E0B', '#D97706'] as const,
    accent: '#8B5CF6',
    surface: '#F8FAFC',
    icon: '#334155',
  },
  dark: {
    background: '#09090E',
    card: '#161622',
    border: '#2A2A35',
    ink: '#F8FAFC',
    muted: '#94A3B8',
    primary: '#6366F1', // Indigo
    primaryGradient: ['#6366F1', '#8B5CF6'] as const,
    success: '#10B981', // Emerald
    successGradient: ['#10B981', '#0D9488'] as const,
    danger: '#F43F5E', // Rose
    dangerGradient: ['#F43F5E', '#F97316'] as const,
    warning: '#F59E0B',
    warningGradient: ['#F59E0B', '#FCD34D'] as const,
    accent: '#8B5CF6',
    surface: '#1E1E2D',
    icon: '#94A3B8',
  },
};

// Define standard gradient directions
export const Gradients = {
  diagonal: { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
  horizontal: { start: { x: 0, y: 0 }, end: { x: 1, y: 0 } },
  vertical: { start: { x: 0, y: 0 }, end: { x: 0, y: 1 } },
};
