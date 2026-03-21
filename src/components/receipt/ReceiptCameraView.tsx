import React, { useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { Image } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { ReceiptPageStack } from './ReceiptPageStack';

interface ReceiptCameraViewProps {
  pageCount: number;
  currentPage: number;
  onCapture: (uri: string) => void;
  onPickGallery: () => void;
  onAddPage: () => void;
  onDiscard: () => void;
}

export function ReceiptCameraView({
  pageCount,
  currentPage,
  onCapture,
  onPickGallery,
  onAddPage,
  onDiscard,
}: ReceiptCameraViewProps) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  // Permission not yet determined
  if (!permission) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>Camera Access Needed</Text>
          <Text style={styles.permissionBody}>
            HomeOS needs camera access to scan your receipts.
          </Text>
        </View>
      </View>
    );
  }

  // Permission denied — show request prompt
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>Camera Access Needed</Text>
          <Text style={styles.permissionBody}>
            HomeOS needs camera access to scan your receipts.
          </Text>
          <Pressable
            style={styles.permissionButton}
            onPress={requestPermission}
            accessibilityLabel="Allow Camera Access"
            accessibilityRole="button"
          >
            <Text style={styles.permissionButtonText}>Allow Camera Access</Text>
          </Pressable>
          <Pressable
            style={styles.discardTextButton}
            onPress={onDiscard}
            accessibilityLabel="Discard Scan"
            accessibilityRole="button"
          >
            <Text style={styles.discardTextButtonText}>Discard Scan</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const handleShutter = async () => {
    if (!cameraRef.current) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (photo?.uri) {
        onCapture(photo.uri);
      }
    } catch {
      // If camera capture fails, silently ignore — user can retry
    }
  };

  return (
    <View style={styles.container}>
      {/* Full-screen camera */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
      />

      {/* Multi-page indicator at top */}
      {pageCount > 0 && (
        <View style={styles.pageStackContainer}>
          <ReceiptPageStack
            pageCount={pageCount}
            currentPage={currentPage}
            onAddPage={onAddPage}
          />
        </View>
      )}

      {/* Framing guide — 4 corner brackets, accent colored */}
      <View style={styles.framingGuide} pointerEvents="none">
        {/* Top-left corner */}
        <View style={[styles.corner, styles.cornerTopLeft]} />
        {/* Top-right corner */}
        <View style={[styles.corner, styles.cornerTopRight]} />
        {/* Bottom-left corner */}
        <View style={[styles.corner, styles.cornerBottomLeft]} />
        {/* Bottom-right corner */}
        <View style={[styles.corner, styles.cornerBottomRight]} />
      </View>

      {/* Bottom controls */}
      <View style={styles.controls}>
        {/* Gallery button — bottom-left */}
        <Pressable
          style={styles.galleryButton}
          onPress={onPickGallery}
          accessibilityLabel="Choose from Library"
          accessibilityRole="button"
        >
          <Image size={24} color="#FFFFFF" />
        </Pressable>

        {/* Shutter button — bottom-center */}
        <Pressable
          style={styles.shutterButton}
          onPress={handleShutter}
          accessibilityLabel="Take Photo"
          accessibilityRole="button"
        >
          <View style={styles.shutterInner} />
        </Pressable>

        {/* Discard button — bottom-right */}
        <Pressable
          style={styles.discardButton}
          onPress={onDiscard}
          accessibilityLabel="Discard Scan"
          accessibilityRole="button"
        >
          <Text style={styles.discardButtonText}>Discard Scan</Text>
        </Pressable>
      </View>
    </View>
  );
}

const CORNER_SIZE = 28;
const CORNER_THICKNESS = 3;
const FRAME_INSET = 48;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
    backgroundColor: colors.dominant.light,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary.light,
    lineHeight: 26,
    textAlign: 'center',
  },
  permissionBody: {
    fontSize: 16,
    color: colors.textSecondary.light,
    lineHeight: 24,
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: colors.accent.light,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    minHeight: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 22,
  },
  discardTextButton: {
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  discardTextButtonText: {
    fontSize: 16,
    color: colors.textSecondary.light,
    lineHeight: 22,
  },
  pageStackContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingVertical: 8,
  },
  framingGuide: {
    position: 'absolute',
    top: FRAME_INSET,
    left: FRAME_INSET,
    right: FRAME_INSET,
    bottom: 140,
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: colors.accent.light,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
  },
  controls: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 48 : 32,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
  },
  galleryButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: colors.accent.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
  },
  discardButton: {
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: 100,
  },
  discardButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#FFFFFF',
    lineHeight: 18,
    textAlign: 'center',
  },
});
