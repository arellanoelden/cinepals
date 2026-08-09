import { MD3DarkTheme, MD3LightTheme, type MD3Theme } from 'react-native-paper';

import { Colors } from '@/constants/theme';

const linkPrimary = '#3c87f7';

export const PaperLightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: linkPrimary,
    background: Colors.light.background,
    surface: Colors.light.background,
    surfaceVariant: Colors.light.backgroundElement,
    secondaryContainer: Colors.light.backgroundSelected,
    onBackground: Colors.light.text,
    onSurface: Colors.light.text,
    onSurfaceVariant: Colors.light.textSecondary,
  },
};

export const PaperDarkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: linkPrimary,
    background: Colors.dark.background,
    surface: Colors.dark.background,
    surfaceVariant: Colors.dark.backgroundElement,
    secondaryContainer: Colors.dark.backgroundSelected,
    onBackground: Colors.dark.text,
    onSurface: Colors.dark.text,
    onSurfaceVariant: Colors.dark.textSecondary,
  },
};
