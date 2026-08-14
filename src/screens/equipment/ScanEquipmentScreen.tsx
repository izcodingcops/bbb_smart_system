import React, {useCallback, useRef, useState} from 'react';
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
} from 'react-native-vision-camera';
import ScreenBackground from '../../components/ScreenBackground';
import {TextField, formChrome} from '../../components/ui';
import {CameraIcon, FlashIcon, XIcon} from '../../components/icons';
import {useEquipmentByCodeLazy} from '../../graphql/features/equipment/hooks';
import {Equipment} from '../../types/equipment';
import {useQueuedEquipmentIds} from './pendingEquipmentItems';
import {theme} from '../../theme';

interface Props {
  onClose: () => void;
  /**
   * A record the user may take custody of — Active, or already checked out to
   * them. The navigator picks check-out vs check-in from `mine`; this screen
   * deliberately knows nothing about routes.
   */
  onResolved: (equipment: Equipment) => void;
  /** Checked out to somebody else — the navigator warns on the hub instead. */
  onAlreadyCheckedOut: (equipment: Equipment) => void;
}

/**
 * Scan a QR code (or type a serial/ID) and hand the matching record back for
 * routing. Ported from equipment-hub.js's `scanInner` (lines 593–657).
 *
 * Four camera states — permission unasked, permission denied, no device, live
 * preview — and the manual entry row renders under all four of them. That is
 * not padding: the iOS Simulator reports no back camera, so manual entry is
 * the only part of this screen exercisable off a physical device.
 */
const ScanEquipmentScreen: React.FC<Props> = ({
  onClose,
  onResolved,
  onAlreadyCheckedOut,
}) => {
  const {hasPermission, requestPermission} = useCameraPermission();
  const device = useCameraDevice('back');
  const {lookup} = useEquipmentByCodeLazy();
  const queuedEquipmentIds = useQueuedEquipmentIds();

  // Set once iOS has refused: it only ever prompts a single time per install,
  // so after that the sole way back is Settings.
  const [permissionRefused, setPermissionRefused] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [torchOn, setTorchOn] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * The scan guard. `onCodeScanned` fires once per frame — roughly 30× a
   * second while a code sits in view — so without this one QR is 30 lookups
   * and 30 navigations. It has to be a ref: a `useState` flag is not visible
   * to the frame callback until React commits the update, and a dozen frames
   * land in that gap.
   *
   * The manual FIND button arms the same ref, so a tap and a frame arriving in
   * the same instant still produce exactly one lookup.
   */
  const handledRef = useRef(false);

  /**
   * Codes the scanner must not read a second time. Re-arming `handledRef` on a
   * miss is what lets the user try another item — but with the same unreadable
   * sticker still filling the frame, the very next frame re-fires the identical
   * lookup, and the screen sits in a flicker loop hammering the query. Only the
   * outcomes that cannot change while this screen is mounted go in here; a
   * transport failure is left retryable, since re-pointing the camera is the
   * only retry a user with no serial to type has.
   */
  const scannedOffRef = useRef(new Set<string>());

  const resolve = useCallback(
    async (code: string) => {
      setError(null);
      setIsResolving(true);

      // Re-arm and stay put. Every non-terminal outcome lands here, so the
      // user can retry or scan something else without leaving the screen.
      const stop = (message: string) => {
        setError(message);
        setIsResolving(false);
        handledRef.current = false;
      };

      let record: Equipment | null;
      try {
        record = await lookup(code);
      } catch {
        // A miss resolves to null; a rejection means we could not ask at all.
        // Saying "no equipment found" here would be a lie the user acts on.
        stop(
          "Couldn't check that equipment number. Check your connection and try again.",
        );
        return;
      }

      if (!record) {
        scannedOffRef.current.add(code);
        stop(`No equipment found for "${code}". Check the number and try again.`);
        return;
      }

      // The scanner is a fourth way into the custody forms, so it needs the
      // same outbox gate the list, the card and the detail screen carry: with
      // a queued check-out/check-in/upkeep against this record, its local
      // `status` and `mine` are stale, and a second custody mutation on top of
      // it would dead-letter silently — nothing in the app surfaces
      // `outbox.failed`.
      if (queuedEquipmentIds.has(record.id)) {
        scannedOffRef.current.add(code);
        stop(
          `${record.name} (${record.reference}) has a change waiting to upload. It'll be available once you're back online.`,
        );
        return;
      }

      // Checked out to someone else: no form to open, so the navigator pops
      // back to the hub with the warning toast. Terminal — this screen is
      // being unmounted, so it stays disarmed and `isResolving`.
      if (record.status === 'Checked-Out' && !record.mine) {
        onAlreadyCheckedOut(record);
        return;
      }

      onResolved(record);
    },
    [lookup, onAlreadyCheckedOut, onResolved, queuedEquipmentIds],
  );

  /** The single entry point for both a decoded frame and the FIND button. */
  const startLookup = useCallback(
    (rawCode: string) => {
      const code = rawCode.trim();
      if (!code || handledRef.current) {
        return;
      }
      handledRef.current = true;
      // `resolve` already catches the lookup itself; this is the last-resort
      // net so nothing on this path can ever escape as an unhandled rejection.
      resolve(code).catch(() => {
        setError('Something went wrong. Try again.');
        setIsResolving(false);
        handledRef.current = false;
      });
    },
    [resolve],
  );

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: codes => {
      if (handledRef.current) {
        return;
      }
      // `Code.value` is optional — a code the decoder saw but could not read
      // has none, and passing `undefined` on would look up the empty string.
      const value = codes.find(code => code.value)?.value;
      if (value && !scannedOffRef.current.has(value.trim())) {
        startLookup(value);
      }
    },
  });

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    setPermissionRefused(!granted);
  };

  const showPreview = hasPermission && device !== undefined;

  return (
    <ScreenBackground style={formChrome.root}>
      <SafeAreaView edges={['top']} style={formChrome.topbar}>
        <View style={formChrome.topbarRow}>
          {/* Present in every state — this route hides the tab bar and there
              is no hardware back on iOS. */}
          <TouchableOpacity
            style={formChrome.topbarButton}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={onClose}>
            <XIcon size={19} color="#3A3F46" />
          </TouchableOpacity>
          <View style={formChrome.topbarText}>
            <Text style={formChrome.title}>Scan Equipment</Text>
            <Text style={formChrome.reference}>QR or equipment number</Text>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Text style={styles.lead}>
          Bring your camera close to the QR code on the equipment
        </Text>

        <View style={styles.view}>
          {showPreview ? (
            <>
              <Camera
                style={StyleSheet.absoluteFill}
                device={device}
                // Dropped while a code is in flight so the preview stops
                // feeding the scanner during the round-trip.
                isActive={!isResolving}
                codeScanner={codeScanner}
                torch={torchOn ? 'on' : 'off'}
              />
              <Text style={styles.state}>
                {isResolving
                  ? 'QR detected — checking availability…'
                  : 'Camera preview'}
              </Text>
            </>
          ) : (
            <View style={styles.fallback}>
              <CameraIcon size={30} color="#8B9099" />
              {!hasPermission && !permissionRefused ? (
                <>
                  <Text style={styles.fallbackText}>
                    Allow camera access to scan an equipment QR code.
                  </Text>
                  <TouchableOpacity
                    style={styles.fallbackButton}
                    activeOpacity={0.85}
                    onPress={handleRequestPermission}>
                    <Text style={styles.fallbackButtonText}>
                      Allow camera access
                    </Text>
                  </TouchableOpacity>
                </>
              ) : !hasPermission ? (
                <>
                  <Text style={styles.fallbackText}>
                    Camera access is off. Turn it on in Settings to scan a QR
                    code, or enter the number below.
                  </Text>
                  <TouchableOpacity
                    style={styles.fallbackButton}
                    activeOpacity={0.85}
                    onPress={() => Linking.openSettings()}>
                    <Text style={styles.fallbackButtonText}>Open Settings</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <Text style={styles.fallbackText}>
                  No camera is available on this device. Enter the equipment
                  number below instead.
                </Text>
              )}
            </View>
          )}

          {/* The mockup's four corner brackets, drawn over every state so the
              framing target reads the same whether or not the feed is live. */}
          <View style={styles.frame} pointerEvents="none">
            <View style={[styles.corner, styles.cornerTopLeft]} />
            <View style={[styles.corner, styles.cornerTopRight]} />
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            <View style={[styles.corner, styles.cornerBottomRight]} />
          </View>
        </View>

        {/* Torch only exists with a live feed, and only on a device that has
            one — the Simulator and front-facing-only hardware have neither. */}
        {showPreview && device.hasTorch ? (
          <TouchableOpacity
            style={[styles.flash, torchOn && styles.flashOn]}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Flashlight"
            onPress={() => setTorchOn(current => !current)}>
            <FlashIcon
              size={24}
              color={torchOn ? theme.colors.primary : theme.colors.text}
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.flashSpacer} />
        )}

        <View style={styles.orRow}>
          <View style={styles.orLine} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.orLine} />
        </View>

        <Text style={styles.manualLabel}>Enter equipment number manually</Text>
        <View style={styles.manualRow}>
          <TextField
            containerStyle={styles.manualField}
            placeholder="Serial or ID (e.g. #4341)"
            value={manualCode}
            onChangeText={setManualCode}
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={() => startLookup(manualCode)}
          />
          <TouchableOpacity
            style={[styles.find, isResolving && styles.findDisabled]}
            activeOpacity={0.9}
            disabled={isResolving}
            onPress={() => startLookup(manualCode)}>
            <Text style={styles.findText}>FIND</Text>
          </TouchableOpacity>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
    </ScreenBackground>
  );
};

const styles = StyleSheet.create({
  body: {flex: 1},
  bodyContent: {paddingHorizontal: 22, paddingBottom: 40},
  lead: {
    fontFamily: theme.fonts.black,
    fontSize: 18,
    lineHeight: 24,
    textAlign: 'center',
    color: theme.colors.text,
    marginTop: 14,
    marginBottom: 22,
  },
  view: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 22,
    backgroundColor: '#0C0E12',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  state: {
    fontFamily: theme.fonts.bold,
    fontSize: 13.5,
    color: '#8B9099',
    textAlign: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  fallback: {
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: 34,
  },
  fallbackText: {
    fontFamily: theme.fonts.bold,
    fontSize: 13.5,
    lineHeight: 19,
    color: '#B4B9C2',
    textAlign: 'center',
  },
  fallbackButton: {
    height: 42,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.white,
  },
  fallbackButtonText: {
    fontFamily: theme.fonts.black,
    fontSize: 14,
    color: theme.colors.text,
  },
  frame: {position: 'absolute', top: '16%', left: '16%', right: '16%', bottom: '16%'},
  corner: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderColor: '#0092FF',
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 12,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 12,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 12,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 12,
  },
  flash: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
    marginTop: theme.spacing.xxl,
    marginBottom: theme.spacing.lg,
    ...theme.shadow.glassPill,
  },
  flashOn: {
    backgroundColor: theme.colors.accentTint,
    borderColor: theme.colors.accentBorder,
  },
  // Keeps the OR divider at the same height whether or not a torch toggle is
  // shown, so the layout doesn't jump when the preview comes up.
  flashSpacer: {height: theme.spacing.xxl + theme.spacing.lg},
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  orLine: {flex: 1, height: 1, backgroundColor: theme.colors.divider},
  orText: {
    fontFamily: theme.fonts.black,
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  manualLabel: {
    fontFamily: theme.fonts.black,
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  manualRow: {flexDirection: 'row', alignItems: 'center', gap: 10},
  manualField: {flex: 1},
  find: {
    height: 48,
    paddingHorizontal: 22,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  findDisabled: {opacity: 0.45},
  findText: {
    fontFamily: theme.fonts.black,
    fontSize: 14,
    letterSpacing: 0.3,
    color: theme.colors.white,
  },
  error: {
    fontFamily: theme.fonts.bold,
    fontSize: 12.5,
    lineHeight: 18,
    color: theme.colors.error,
    marginTop: 10,
  },
});

export default ScanEquipmentScreen;
