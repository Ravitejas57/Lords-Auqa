# HatchTrack Mobile App - Setup Instructions

## 📱 What We've Built

We've successfully implemented:

1. **Splash Screen** - Shows Lords Aqua logo on app launch
2. **Authentication Context** - Manages user login state
3. **Login/Signup Screen** - Combined authentication screen
4. **Secure Storage** - Token and user data management
5. **API Integration** - Connected to your backend
6. **Routing** - Auto-navigation based on auth state

---

## 🚀 How to Run the App

### 1. Start the Backend Server

First, make sure your backend is running:

```bash
cd Backend
npm start
```

The backend should be running on `http://localhost:3000`

### 2. Start the Mobile App

Open a new terminal and navigate to the mobile app directory:

```bash
cd mobile-app
npx expo start
```

### 3. Choose Your Platform

You'll see options to run on:

- **Android Emulator**: Press `a`
- **iOS Simulator** (Mac only): Press `i`
- **Physical Device**: Scan the QR code with:
  - **iOS**: Camera app → Opens in Expo Go
  - **Android**: Expo Go app → Scan QR code

---

## 📂 Project Structure

```
mobile-app/
├── app/
│   ├── (auth)/
│   │   ├── _layout.tsx         # Auth stack layout
│   │   └── login.tsx            # Login/Signup screen
│   ├── (tabs)/                  # Main app tabs (existing)
│   ├── index.tsx                # Splash screen
│   └── _layout.tsx              # Root layout with AuthProvider
│
├── src/
│   ├── constants/
│   │   ├── api.ts               # API endpoints
│   │   └── colors.ts            # Color palette
│   │
│   ├── services/
│   │   ├── api/
│   │   │   └── authApi.ts       # Auth API calls
│   │   └── storage/
│   │       └── asyncStorage.ts  # Secure storage
│   │
│   ├── store/
│   │   └── context/
│   │       └── AuthContext.tsx  # Auth state management
│   │
│   └── types/
│       └── auth.ts              # TypeScript types
```

---

## 🔄 How the Authentication Flow Works

1. **App Launch** → Shows Splash Screen (`index.tsx`)
2. **Check Auth Status** → AuthContext checks for saved token
3. **Navigation**:
   - ✅ **If logged in** → Navigate to `(tabs)` (dashboard)
   - ❌ **If not logged in** → Navigate to `(auth)/login`
4. **After Login** → Save token & user data → Navigate to dashboard
5. **After Signup** → Show success message → Stay on login screen

---

## 🧪 Testing the App

### Test Login

1. Launch the app
2. Enter phone number: `1234567890` (10 digits)
3. Enter password: `yourpassword`
4. Tap "Login to Dashboard"

### Test Signup

1. Tap "Sign up now"
2. Fill in:
   - Full Name
   - Mobile Number (10 digits)
   - Email (optional)
   - Select Admin
   - Password (min 6 characters)
   - Confirm Password
3. Tap "Create Account"
4. Wait for admin approval

---

## 🛠️ Development Tips

### Hot Reload

- Press `r` in the Expo terminal to reload
- Shake your device to open the dev menu

### Debugging

- Open the dev menu and enable "Remote JS Debugging"
- Or use React Native Debugger

### Check Logs

```bash
# View all logs
npx expo start

# View only errors
npx expo start --dev-client
```

### Clear Cache

If you encounter issues:

```bash
npx expo start -c
```

---

## 📱 Platform-Specific Notes

### iOS

- Run on iOS Simulator (Mac only):
  ```bash
  npx expo start --ios
  ```
- Requires Xcode installed

### Android

- Run on Android Emulator:
  ```bash
  npx expo start --android
  ```
- Requires Android Studio installed

---

## 🔧 Configuration

### API Base URL

Located in: `src/constants/api.ts`

```typescript
export const API_BASE_URL = 'http://localhost:3000/api';
```

**For Physical Devices:**

Replace `localhost` with your computer's IP address:

```typescript
export const API_BASE_URL = 'http://192.168.1.X:3000/api';
```

To find your IP:

- **Mac/Linux**: `ifconfig | grep "inet "`
- **Windows**: `ipconfig`

---

## 🎨 Customization

### Colors

Edit `src/constants/colors.ts` to match your brand colors.

### Logo

Replace the Ionicons `water` icon in:

- `app/index.tsx` (Splash screen)
- `app/(auth)/login.tsx` (Login screen)

With your actual logo image:

```tsx
<Image source={require('@/assets/images/logo.png')} style={{ width: 80, height: 80 }} />
```

---

## 🐛 Common Issues

### "Network request failed"

- **Fix**: Make sure backend is running
- Check API_BASE_URL in `src/constants/api.ts`
- Use IP address instead of `localhost` for physical devices

### "Cannot find module '@/src/...'"

- **Fix**: TypeScript path aliases are configured in `tsconfig.json`
- Restart Expo: `npx expo start -c`

### "Invariant Violation: requireNativeComponent: SafeAreaView"

- **Fix**: Install missing dependencies:
  ```bash
  npx expo install react-native-safe-area-context
  ```

---

## ✅ What's Next?

Now that authentication is working, you can:

1. **Build User Dashboard** - Display hatcheries, images, etc.
2. **Implement Image Upload** - Camera integration
3. **Add Maps** - Show hatchery locations
4. **Real-time Notifications** - Socket.IO integration
5. **Admin Features** - Admin dashboard screens

---

## 📚 Useful Commands

```bash
# Start development server
npx expo start

# Run on specific platform
npx expo start --ios
npx expo start --android

# Clear cache
npx expo start -c

# Install new package
npx expo install package-name

# Build for production
eas build --platform android
eas build --platform ios
```

---

## 🆘 Need Help?

- **Expo Docs**: https://docs.expo.dev/
- **React Native Docs**: https://reactnative.dev/
- **Expo Discord**: https://discord.gg/expo

---

**Happy Coding! 🚀**
