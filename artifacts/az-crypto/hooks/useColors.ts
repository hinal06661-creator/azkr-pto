import { useColorScheme } from 'react-native';
import { useApp } from '@/context/AppContext';
import colors from '@/constants/colors';

export function useColors() {
  const { theme } = useApp();
  const system = useColorScheme();
  const scheme = theme === 'system' ? system : theme;
  const palette = scheme === 'dark' ? colors.dark : colors.light;
  return { ...palette, radius: colors.radius };
}
