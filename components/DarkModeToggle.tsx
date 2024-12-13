import React, { useEffect, useState } from 'react';
import { Toggle } from '@/components/ui/toggle';
import Cookies from 'js-cookie';

const DarkModeToggle = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const savedPreference = Cookies.get('darkMode');
    if (savedPreference) {
      setIsDarkMode(savedPreference === 'true');
      document.documentElement.classList.toggle('dark', savedPreference === 'true');
    }
  }, []);

  const handleToggle = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark', !isDarkMode);
    Cookies.set('darkMode', (!isDarkMode).toString());
  };

  return (
    <Toggle
      checked={isDarkMode}
      onCheckedChange={handleToggle}
      aria-label="Toggle dark mode"
      title="Toggle between light and dark modes"
      className="transition-colors duration-300 ease-in-out"
    >
      {isDarkMode ? '🌙' : '☀️'}
    </Toggle>
  );
};

export default DarkModeToggle;
