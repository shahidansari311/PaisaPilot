import { Tabs } from 'expo-router';
import { View, TouchableOpacity, Animated as RNAnimated, Platform } from 'react-native';
import { Home, List, Repeat, Menu, Users } from 'lucide-react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { Colors, Gradients } from '../../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';

function TabBarButton({ isFocused, onPress, onLongPress, routeName, theme, isDark }: any) {
  const anim = useRef(new RNAnimated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    RNAnimated.spring(anim, {
      toValue: isFocused ? 1 : 0,
      useNativeDriver: true,
      friction: 8,
      tension: 60,
    }).start();
  }, [isFocused]);

  const getIcon = (name: string) => {
    switch (name) {
      case 'index': return Home;
      case 'transactions': return List;
      case 'borrow-lend': return Repeat;
      case 'split-groups': return Users;
      case 'menu': return Menu;
      default: return Home;
    }
  };
  const IconComponent = getIcon(routeName);

  const activeBgColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)';

  // Icon color: solid bright/dark for active, muted for inactive
  const iconColor = isFocused 
    ? (isDark ? '#FFFFFF' : '#111827') 
    : (isDark ? '#6B7280' : '#9CA3AF');

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.85}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', height: 64 }}
    >
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Animated Background Layer */}
        <RNAnimated.View 
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            borderRadius: 18,
            backgroundColor: activeBgColor,
            opacity: anim,
          }}
        />

        <RNAnimated.View style={{ 
          transform: [{
            translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -4] })
          }]
        }}>
          <IconComponent size={22} color={iconColor} strokeWidth={2.5} />
        </RNAnimated.View>
        
        {/* Green Dash Indicator */}
        <RNAnimated.View 
          style={{
            position: 'absolute',
            bottom: 8,
            width: 14,
            height: 4,
            borderRadius: 2,
            backgroundColor: '#8CC63F', // Green dash from the design
            opacity: anim,
            transform: [{
              scaleX: anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] })
            }]
          }}
        />
      </View>
    </TouchableOpacity>
  );
}

function CustomTabBar({ state, descriptors, navigation }: any) {
  const { isDark } = useThemeStore();
  const theme = isDark ? Colors.dark : Colors.light;

  return (
    <View style={{
      paddingBottom: Platform.OS === 'ios' ? 32 : 16,
      paddingTop: 8,
      backgroundColor: isDark ? '#262629' : '#FFFFFF',
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      shadowColor: isDark ? '#000' : '#9CA3AF',
      shadowOffset: { width: 0, height: -8 },
      shadowOpacity: isDark ? 0.4 : 0.15,
      shadowRadius: 20,
      elevation: 24,
    }}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        // Explicitly hide these routes from the custom tab bar
        const hiddenRoutes = ['settings', 'calendar'];
        if (hiddenRoutes.includes(route.name) || options.href === null) {
          return null;
        }

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <TabBarButton
            key={route.key}
            isFocused={isFocused}
            onPress={onPress}
            onLongPress={onLongPress}
            routeName={route.name}
            theme={theme}
            isDark={isDark}
          />
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  const { isDark } = useThemeStore();
  const theme = isDark ? Colors.dark : Colors.light;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}
      >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="transactions" options={{ title: 'History' }} />
      <Tabs.Screen name="borrow-lend" options={{ title: 'Debt' }} />
      <Tabs.Screen name="split-groups" options={{ title: 'Split' }} />
      <Tabs.Screen name="menu" options={{ title: 'Menu' }} />
      
      {/* Hidden Tabs - Accessed via Menu */}
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="calendar" options={{ href: null }} />
    </Tabs>
    </View>
  );
}
