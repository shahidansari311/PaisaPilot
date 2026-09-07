import { Tabs } from 'expo-router';
import { View, TouchableOpacity, Animated as RNAnimated, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, List, Repeat, Menu, Users } from 'lucide-react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { Colors } from '../../constants/Colors';
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
        
        <RNAnimated.View 
          style={{
            position: 'absolute',
            bottom: 8,
            width: 14,
            height: 4,
            borderRadius: 2,
            backgroundColor: '#8CC63F',
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
  const insets = useSafeAreaInsets();

  return (
    <View style={{
      flexDirection: 'row',
      backgroundColor: isDark ? '#18181B' : '#FFFFFF',
      borderRadius: 24,
      marginHorizontal: 16,
      marginBottom: insets.bottom > 0 ? insets.bottom : 20,
      paddingHorizontal: 8,
      paddingVertical: 8,
      alignItems: 'center',
      justifyContent: 'space-around',
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: isDark ? 0.4 : 0.15,
      shadowRadius: 20,
      elevation: 24,
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
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
        backBehavior="history"
        screenOptions={{
          headerShown: false,
        }}
      >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="transactions" options={{ title: 'History' }} />
      <Tabs.Screen name="borrow-lend" options={{ title: 'Debt' }} />
      <Tabs.Screen name="split-groups" options={{ title: 'Split' }} />
      <Tabs.Screen name="menu" options={{ title: 'Menu' }} />
    </Tabs>
    </View>
  );
}
