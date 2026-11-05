import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getWallpaper } from '../../data/chatWallpapers';

export function ChatWallpaperBackground({ wallpaperId }: { wallpaperId: string }) {
  const wp = getWallpaper(wallpaperId);
  const isDark = wp.category === 'static' || wp.id === 'dyn-rain-malabo';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={wp.colors as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {isDark && <View style={s.darkOverlay} />}
      {wp.live && <View style={s.liveTint} />}
    </View>
  );
}

const s = StyleSheet.create({
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  liveTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,180,230,0.06)',
  },
});
