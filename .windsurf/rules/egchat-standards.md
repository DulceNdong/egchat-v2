# EGCHAT Code Standards

## Project Overview
EGCHAT is an enterprise platform v2.5.3 with web, mobile (Expo/React Native), and desktop (Electron) variants.

## Current Focus: Mobile Development (Expo)
- **Active Project**: egchat-mobile (React Native + Expo)
- **Development Server**: Expo running on port 8081
- **Testing**: Expo Go app on physical device
- **Preview**: Browser preview at http://localhost:8081

## Tech Stack
- **Mobile**: React Native 0.81.5 + Expo 54.0.0
- **Navigation**: Expo Router 6.0.23
- **State**: React Context + AsyncStorage
- **Styling**: React Native components (no TailwindCSS in mobile)
- **Backend**: Express + Supabase
- **Web Alternative**: React 19 + TypeScript + Vite (in root directory)
- **Desktop**: Electron 41.x

## Code Standards

### File Structure (Mobile Focus)
- **Mobile App**: `egchat-mobile/` - React Native + Expo
- **Screens**: `egchat-mobile/app/` - Expo Router file-based routing
- **Components**: `egchat-mobile/src/` - Reusable components
- **Services**: API layer in `egchat-mobile/src/` or shared from root
- **Web Alternative**: Root directory components (e.g., `App.tsx`, `ChatView.tsx`) for reference
- **Server**: Backend in `server/` directory (shared across platforms)

### TypeScript Configuration
- Strict typing enabled
- Use `@types/` packages for all dependencies
- No auto-closing tags (per VS Code setting)

### Component Guidelines (Mobile)
- Use functional components with hooks
- Use React Native components (View, Text, ScrollView, etc.)
- Use Expo Router for navigation (file-based routing in `app/` directory)
- Use react-native-svg for icons and graphics
- Use expo-linear-gradient for gradients
- Test on physical device with Expo Go app
- Reference web components in root directory for logic patterns

### Styling (Mobile)
- React Native StyleSheet (no TailwindCSS in mobile)
- Use expo-linear-gradient for gradients
- Use react-native-safe-area-context for safe areas
- Platform-specific styling when needed (Platform.OS)
- Light mode colors configured

### State Management (Mobile)
- Context API for auth (create in `egchat-mobile/src/context/`)
- AsyncStorage for persistence (expo-secure-store for sensitive data)
- Custom hooks for device features (expo-camera, expo-location, expo-haptics, etc.)
- Session management with AsyncStorage

### API Integration (Mobile)
- Use @supabase/supabase-js for database and auth
- JWT tokens for authentication
- API calls through Supabase client or custom API layer
- Network info with @react-native-community/netinfo

### Mobile-Specific Features
- **Camera**: expo-camera for photos/videos
- **Location**: expo-location for GPS
- **Haptics**: expo-haptics for vibration feedback
- **Notifications**: expo-notifications for push notifications
- **Secure Storage**: expo-secure-store for sensitive data
- **Authentication**: expo-local-authentication for biometrics
- **Maps**: react-native-maps for location features
- **QR**: react-native-qrcode-svg for QR generation
- **WebRTC**: react-native-webrtc for video calls

### Development Workflow (Mobile)
- Dev server runs on port 8081 (Expo)
- Use `npm start` in `egchat-mobile/` for development
- Press 's' in Expo terminal to switch to Expo Go mode
- Scan QR code with Expo Go app on physical device
- Use browser preview at http://localhost:8081 for web testing
- Use `npm run android` for Android build
- Use `npm run ios` for iOS build (macOS only)

### Code Quality (Mobile)
- Follow existing patterns in mobile components
- Maintain consistency with established UI patterns
- Prioritize functionality over UI polish in first iterations
- Test changes in browser preview at http://localhost:8081
- Test on physical device with Expo Go for native features

### Security
- Environment variables in `.env` files
- Never commit sensitive data
- Use bcryptjs for password hashing
- Implement transaction limits in wallet system

### Performance (Mobile)
- Optimize images and assets for mobile
- Use lazy loading for heavy components
- Minimize re-renders with React.memo and useMemo
- Use FlatList instead of ScrollView for long lists
- Optimize bundle size with code splitting

## Priority Implementation Order
Based on ROADMAP_MOBILE.md:
1. **Priority 1**: Transaction limits, detailed activity history, flights module, gas stations
2. **Priority 2**: Wallpapers, font customization, IA file analysis, advanced bills, detailed news
3. **Priority 3**: Custom audio tones, layout customization, improved QR profile

## When Making Changes (Mobile)
1. Analyze existing web implementation in root directory for logic patterns
2. Adapt to React Native components (div → View, etc.)
3. Test in browser preview at http://localhost:8081
4. Test on physical device with Expo Go for native features
5. Maintain consistency with existing mobile patterns
6. Update ROADMAP_MOBILE.md checklist when complete
