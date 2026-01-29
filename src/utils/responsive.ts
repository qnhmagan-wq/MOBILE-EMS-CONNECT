import { Dimensions, Platform, PixelRatio } from 'react-native';

// Get screen dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (iPhone 12/13 Pro as reference: 390x844)
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

/**
 * Scales a size value based on screen width
 * @param size - The size to scale
 * @returns Scaled size rounded to nearest pixel
 */
export const scaleWidth = (size: number): number => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

/**
 * Scales a size value based on screen height
 * @param size - The size to scale
 * @returns Scaled size rounded to nearest pixel
 */
export const scaleHeight = (size: number): number => {
  const scale = SCREEN_HEIGHT / BASE_HEIGHT;
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

/**
 * Scales font size based on screen width
 * @param size - The font size to scale
 * @returns Scaled font size with max limits for readability
 */
export const scaleFontSize = (size: number): number => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size * scale;

  // Limit font scaling to prevent overly large text on tablets
  const maxScale = 1.3;
  const minScale = 0.85;
  const clampedScale = Math.min(Math.max(scale, minScale), maxScale);

  return Math.round(PixelRatio.roundToNearestPixel(size * clampedScale));
};

/**
 * Moderately scales a size (uses average of width and height)
 * Best for elements that should scale proportionally
 * @param size - The size to scale
 * @returns Scaled size rounded to nearest pixel
 */
export const scale = (size: number): number => {
  const avgScale = (SCREEN_WIDTH / BASE_WIDTH + SCREEN_HEIGHT / BASE_HEIGHT) / 2;
  const newSize = size * avgScale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

/**
 * Scales spacing/padding values
 * @param size - The spacing to scale
 * @returns Scaled spacing
 */
export const scaleSpacing = (size: number): number => {
  return scaleWidth(size);
};

/**
 * Checks if device is a small screen (width < 375px)
 * @returns true if small screen
 */
export const isSmallScreen = (): boolean => {
  return SCREEN_WIDTH < 375;
};

/**
 * Checks if device is a tablet (width >= 768px)
 * @returns true if tablet
 */
export const isTablet = (): boolean => {
  return SCREEN_WIDTH >= 768;
};

/**
 * Get responsive button size for circular buttons
 * Ensures buttons fit well on all screen sizes
 * @param baseSize - Base button size (e.g., 120 for large button)
 * @returns Scaled button size with min/max constraints
 */
export const getResponsiveButtonSize = (baseSize: number): number => {
  const scaled = scale(baseSize);

  // Set min/max constraints based on button type
  if (baseSize >= 200) {
    // Large buttons (SOS button)
    return Math.max(Math.min(scaled, 300), 200);
  } else if (baseSize >= 100) {
    // Medium buttons (action buttons)
    return Math.max(Math.min(scaled, 140), 80);
  } else {
    // Small buttons
    return Math.max(Math.min(scaled, 80), 50);
  }
};

// Export screen dimensions for reference
export const screenDimensions = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isSmall: isSmallScreen(),
  isTablet: isTablet(),
  isLandscape: SCREEN_WIDTH > SCREEN_HEIGHT,
};
