import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base standard design width (e.g. 375px)
const GUIDELINE_BASE_WIDTH = 375;
const GUIDELINE_BASE_HEIGHT = 812;

export const wp = (widthPercent: number): number => {
  return PixelRatio.roundToNearestPixel((SCREEN_WIDTH * widthPercent) / 100);
};

export const hp = (heightPercent: number): number => {
  return PixelRatio.roundToNearestPixel((SCREEN_HEIGHT * heightPercent) / 100);
};

export const scale = (size: number): number => {
  return PixelRatio.roundToNearestPixel((SCREEN_WIDTH / GUIDELINE_BASE_WIDTH) * size);
};

export const verticalScale = (size: number): number => {
  return PixelRatio.roundToNearestPixel((SCREEN_HEIGHT / GUIDELINE_BASE_HEIGHT) * size);
};

export const moderateScale = (size: number, factor = 0.5): number => {
  return PixelRatio.roundToNearestPixel(size + (scale(size) - size) * factor);
};

export const isSmallDevice = SCREEN_HEIGHT < 680;
export const isTablet = SCREEN_WIDTH >= 600;
