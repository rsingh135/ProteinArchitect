/**
 * Theme utility functions for dark mode support
 */

/**
 * Get theme-aware class names
 * @param {string} theme - Current theme ('light' | 'dark')
 * @param {Object} classes - Object with light and dark class names
 * @returns {string} Combined class names
 */
export const themeClass = (theme, classes) => {
  return theme === 'dark' ? classes.dark : classes.light;
};

/**
 * Get conditional class names based on theme
 * @param {string} theme - Current theme
 * @param {string} lightClass - Light mode class
 * @param {string} darkClass - Dark mode class
 * @returns {string} Appropriate class name
 */
export const conditionalClass = (theme, lightClass, darkClass) => {
  return theme === 'dark' ? darkClass : lightClass;
};

