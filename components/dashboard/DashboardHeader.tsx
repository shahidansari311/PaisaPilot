import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Moon, Sun } from 'lucide-react-native';
import { Typography } from '../ui/Typography';
import { SPACING, RADIUS } from '../../constants/theme';

export function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Good Morning';
  if (h >= 12 && h < 17) return 'Good Afternoon';
  if (h >= 17 && h < 22) return 'Good Evening';
  return 'Good Night';
}

interface DashboardHeaderProps {
  userName: string | null;
  isDark: boolean;
  toggleTheme: () => void;
  theme: any;
}

export function DashboardHeader({ userName, isDark, toggleTheme, theme }: DashboardHeaderProps) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingTop: 64, paddingBottom: SPACING.xl }}>
      <View>
        <Typography variant="caption" color="muted" style={{ marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {getGreeting()}
        </Typography>
        <Typography variant="headline">
          {userName ? userName : 'PaisaPilot'}
        </Typography>
      </View>
      <TouchableOpacity
        onPress={toggleTheme}
        activeOpacity={0.7}
        style={{
          width: 44,
          height: 44,
          borderRadius: RADIUS.full,
          backgroundColor: theme.colors.surfaceRaised,
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {isDark ? <Sun size={20} color={theme.colors.textSecondary} /> : <Moon size={20} color={theme.colors.textSecondary} />}
      </TouchableOpacity>
    </View>
  );
}
