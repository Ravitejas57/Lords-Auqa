# Camera and Image Upload Setup

## Required Packages

Install the following packages for camera and image functionality:

```bash
# Camera and image picker
npx expo install expo-camera
npx expo install expo-image-picker

# Image manipulation (optional, for resizing/optimization)
npx expo install expo-image-manipulator

# File system access
npx expo install expo-file-system
```

## Permissions Configuration

Add the following to your `app.json` or `app.config.js`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-camera",
        {
          "cameraPermission": "Allow HatchTrack to access your camera to capture hatchery progress images."
        }
      ],
      [
        "expo-image-picker",
        {
          "photosPermission": "Allow HatchTrack to access your photos to select hatchery images.",
          "cameraPermission": "Allow HatchTrack to access your camera to capture hatchery progress images."
        }
      ]
    ]
  }
}
```

## Installation Commands

Run these commands in the mobile-app directory:

```bash
cd mobile-app

# Install all required packages
npx expo install expo-camera expo-image-picker expo-image-manipulator expo-file-system

# Install types (if needed)
npm install --save-dev @types/react-native
```

## Usage Notes

### expo-camera
- Provides direct camera access
- Allows real-time camera preview
- Supports front and back camera
- Can capture photos and videos

### expo-image-picker
- Provides access to device photo library
- Can launch camera as well
- Easier to use than expo-camera for simple use cases
- Handles permissions automatically

### expo-image-manipulator
- Resize images before upload
- Compress images to reduce file size
- Crop and rotate images
- Useful for optimizing uploads

### expo-file-system
- Read and write files
- Get file info (size, URI, etc.)
- Move and copy files
- Required for some image operations

## Testing

After installation, test camera access:

```typescript
import * as ImagePicker from 'expo-image-picker';

// Request permission
const { status } = await ImagePicker.requestCameraPermissionsAsync();

// Launch camera
const result = await ImagePicker.launchCameraAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.8,
});
```

## Important Notes

1. **iOS**: Camera permissions are required in Info.plist (handled by expo plugins)
2. **Android**: Camera permissions required in AndroidManifest.xml (handled by expo plugins)
3. **Development**: Use physical device for camera testing (simulators have limited camera support)
4. **Web**: Camera APIs work differently on web, may need fallback
