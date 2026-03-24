import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { colors } from '@/constants/theme';

interface BarcodeScannerSheetProps {
  visible: boolean;
  onClose: () => void;
  onDetected: (payload: { value: string; type: string }) => void;
}

export function BarcodeScannerSheet({ visible, onClose, onDetected }: BarcodeScannerSheetProps) {
  const [permission, requestPermission] = useCameraPermissions();

  if (!visible) {
    return null;
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Scan barcode</Text>
            <Pressable onPress={onClose}>
              <Text style={styles.close}>Close</Text>
            </Pressable>
          </View>

          {!permission || !permission.granted ? (
            <View style={styles.permissionState}>
              <Text style={styles.permissionText}>Camera access is required to scan pantry barcodes.</Text>
              <Pressable style={styles.permissionButton} onPress={requestPermission}>
                <Text style={styles.permissionButtonLabel}>Allow camera</Text>
              </Pressable>
            </View>
          ) : (
            <CameraView
              style={styles.camera}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'] }}
              onBarcodeScanned={({ data, type }) => onDetected({ value: data, type })}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: colors.dominant.light,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 14,
    minHeight: 420,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary.light,
  },
  close: {
    color: colors.accent.light,
    fontWeight: '600',
  },
  permissionState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  permissionText: {
    textAlign: 'center',
    color: colors.textSecondary.light,
    lineHeight: 22,
  },
  permissionButton: {
    backgroundColor: colors.accent.light,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  permissionButtonLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  camera: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
  },
});
