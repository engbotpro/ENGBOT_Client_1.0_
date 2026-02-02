// themeContext.tsx
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import { theme, darkTheme } from './theme';

interface ThemeContextProps {
  darkMode: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

const THEME_STORAGE_KEY = 'engbot_theme_mode';

// Função para carregar o tema do localStorage
const loadThemeFromStorage = (): boolean => {
  try {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme !== null) {
      return savedTheme === 'dark';
    }
  } catch (error) {
    console.error('Erro ao carregar tema do localStorage:', error);
  }
  // Padrão: modo claro
  return false;
};

// Função para salvar o tema no localStorage
const saveThemeToStorage = (isDark: boolean): void => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
  } catch (error) {
    console.error('Erro ao salvar tema no localStorage:', error);
  }
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Carregar o tema salvo do localStorage ao inicializar
  const [darkMode, setDarkMode] = useState(loadThemeFromStorage);

  // Salvar o tema no localStorage sempre que mudar
  useEffect(() => {
    saveThemeToStorage(darkMode);
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode(prev => {
      const newMode = !prev;
      saveThemeToStorage(newMode);
      return newMode;
    });
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme }}>
      <MuiThemeProvider theme={darkMode ? darkTheme : theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
