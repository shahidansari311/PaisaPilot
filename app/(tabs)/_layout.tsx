import { Tabs } from 'expo-router';
import { View, TouchableOpacity, Animated as RNAnimated, Platform } from 'react-native';
import { Home, List, Repeat, Menu, Users } from 'lucide-react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { Colors, Gradients } from '../../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';

function TabBarButton({ isFocused, onPress, onLongPress, routeName, label, theme }: any) {
  const scale = useRef(new RNAnimated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    RNAnimated.spring(scale, {
      toValue: isFocused ? 1 : 0,
      useNativeDriver: true,
      friction: 6,
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

  const translateY = scale.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10]
  });

  const iconScale = scale.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.15]
  });

  const textOpacity = scale.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0]
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.85}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', height: 72 }}
    >
      <RNAnimated.View style={{ position: 'absolute', transform: [{ translateY }, { scale: iconScale }] }}>
        {isFocused ? (
          <LinearGradient
            colors={theme.primaryGradient}
            start={Gradients.diagonal.start}
            end={Gradients.diagonal.end}
            style={{ 
              width: 52, height: 52, borderRadius: 26, 
              alignItems: 'center', justifyContent: 'center',
              shadowColor: theme.primary, shadowOpacity: 0.5, 
              shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, 
              elevation: 8
            }}
          >
            <IconComponent size={24} color="#FFFFFF" strokeWidth={2.5} />
          </LinearGradient>
        ) : (
          <View style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
            <IconComponent size={24} color={theme.icon} strokeWidth={2.5} />
          </View>
        )}
      </RNAnimated.View>
      <RNAnimated.Text 
        style={{ 
          position: 'absolute',
          bottom: 12,
          fontSize: 10, 
          fontWeight: '700', 
          color: theme.muted, 
          fontFamily: 'Inter_500Medium',
          opacity: textOpacity,
        }}
      >
        {label}
      </RNAnimated.Text>
    </TouchableOpacity>
  );
}

function CustomTabBar({ state, descriptors, navigation }: any) {
  const { isDark } = useThemeStore();
  const theme = isDark ? Colors.dark : Colors.light;

  return (
    <View style={{
      position: 'absolute',
      bottom: Platform.OS === 'ios' ? 24 : 16,
      left: 20,
      right: 20,
      height: 72,
      backgroundColor: isDark ? 'rgba(25, 25, 30, 0.85)' : 'rgba(255, 255, 255, 0.85)',
      borderRadius: 36,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 10,
    }}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        if (options.href === null) {
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
            label={label as string}
            theme={theme}
          />
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  return (
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
  );
}
