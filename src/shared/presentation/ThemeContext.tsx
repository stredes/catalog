import { createContext, PropsWithChildren, useContext, useEffect, useState, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { setColorScheme } from './components/ui';
import { lightColors, darkColors, type ThemeColors } from './theme/colors';

type Theme = 'light' | 'dark';

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
  colors: ThemeColors;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const [theme, setTheme] = useState<Theme>(systemScheme === 'dark' ? 'dark' : 'light');
  const colors = useMemo(() => theme === 'dark' ? darkColors : lightColors, [theme]) as ThemeColors;

  useEffect(() => {
    setColorScheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark', colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }
  return context;
}

export function useThemeColors(): ThemeColors {
  const { colors } = useTheme();
  return colors;
}
