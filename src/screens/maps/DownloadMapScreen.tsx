import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  DownloadedMap,
  MapCoordinate,
  MapRegion,
  MapSuggestion,
  PickedLocation,
} from '../../types/maps';
import {
  autocomplete,
  newSessionToken,
  placeDetails,
  reverseGeocode,
} from '../../services/maps';
import {
  LIMIT_MESSAGE,
  canSave,
  duplicateMessage,
  isDuplicate,
  toDownloadedMap,
} from './saving';
import MapSurface, {regionFor} from './components/MapSurface';
import {DENVER_DEFAULT_COORDINATE} from '../../mocks/maps';
import {connectivity} from '../../graphql/offlineQueue/connectivity';
import {ConfirmDialog, PrimaryButton} from '../../components/ui';
import {
  ChevronLeftIcon,
  DownloadIcon,
  InfoIcon,
  MapPinIcon,
  SearchIcon,
  WifiOffIcon,
  XIcon,
} from '../../components/icons';
import {theme} from '../../theme';

/** Google bills Autocomplete per request; nothing goes out mid-word. */
const SEARCH_DEBOUNCE_MS = 250;
/** A pan settles before the pin's address is looked up. */
const GEOCODE_DEBOUNCE_MS = 400;
/** ≈33 m — same order as the reverse-geocode cache grid. */
const MOVE_THRESHOLD = 0.0003;

const NETWORK_ERROR =
  "Couldn't reach Google Maps. Check your connection and try again.";

interface Props {
  /** Where to open centred. Falls back to Denver when there is no fix. */
  initialCoordinate: MapCoordinate | null;
  /** Feeds the max-5 and duplicate rules. */
  existing: DownloadedMap[];
  onClose: () => void;
  onSaved: (record: DownloadedMap) => void;
}

/**
 * 60/40 save flow. The top surface owns the pin; the bottom panel is either a
 * search (suggestions) or a readout of wherever the pin currently sits.
 *
 * Nothing here downloads tiles — a save is one reverse-geocode plus one redux
 * write, exactly as the shipped app behaves. The copy is the mockup's.
 */
const DownloadMapScreen: React.FC<Props> = ({
  initialCoordinate,
  existing,
  onClose,
  onSaved,
}) => {
  const insets = useSafeAreaInsets();
  const start = initialCoordinate ?? DENVER_DEFAULT_COORDINATE;

  const [region, setRegion] = useState<MapRegion>(() => regionFor(start));
  const [picked, setPicked] = useState<PickedLocation | null>(null);
  const [resolving, setResolving] = useState(true);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<MapSuggestion[]>([]);
  const [searchBusy, setSearchBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [blockMessage, setBlockMessage] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [hintDismissed, setHintDismissed] = useState(false);
  const [online, setOnline] = useState(() => connectivity.isOnline());

  const sessionToken = useRef(newSessionToken());
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const geocodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** The centre the pin's address was last resolved for. */
  const lastGeocoded = useRef<MapCoordinate | null>(null);
  /** Set before a programmatic move so its settle doesn't re-geocode. */
  const skipGeocode = useRef(false);
  const inputRef = useRef<TextInput>(null);

  // The app-wide connectivity signal — never stand up a second one.
  useEffect(() => connectivity.onChange(setOnline), []);

  useEffect(
    () => () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
      if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
    },
    [],
  );

  const resolvePin = useCallback(async (coordinate: MapCoordinate) => {
    setResolving(true);
    const resolved = await reverseGeocode(coordinate);
    setResolving(false);
    if (resolved) {
      setPicked(resolved);
      setErrorMessage(null);
      setBlockMessage(null);
    } else {
      setPicked(null);
      setErrorMessage(NETWORK_ERROR);
    }
  }, []);

  const scheduleResolve = useCallback(
    (coordinate: MapCoordinate) => {
      if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
      geocodeTimer.current = setTimeout(
        () => resolvePin(coordinate),
        GEOCODE_DEBOUNCE_MS,
      );
    },
    [resolvePin],
  );

  // Seed the readout from wherever the map opened.
  useEffect(() => {
    lastGeocoded.current = start;
    resolvePin(start);
    // Runs once: `start` is derived from a prop the parent doesn't change
    // while this screen is mounted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRegionChange = useCallback(
    (next: MapRegion) => {
      setRegion(next);
      const centre = {latitude: next.latitude, longitude: next.longitude};

      if (skipGeocode.current) {
        skipGeocode.current = false;
        lastGeocoded.current = centre;
        return;
      }

      // Zoom buttons and animation settles report a centre that hasn't really
      // moved — resolving it again would overwrite a picked name for nothing.
      const last = lastGeocoded.current;
      if (
        last &&
        Math.abs(last.latitude - centre.latitude) < MOVE_THRESHOLD &&
        Math.abs(last.longitude - centre.longitude) < MOVE_THRESHOLD
      ) {
        return;
      }

      lastGeocoded.current = centre;
      scheduleResolve(centre);
    },
    [scheduleResolve],
  );

  const runSearch = useCallback(async (text: string) => {
    setSearchBusy(true);
    const results = await autocomplete(text, sessionToken.current);
    setSearchBusy(false);
    if (results === null) {
      setSuggestions([]);
      setErrorMessage(NETWORK_ERROR);
      return;
    }
    setErrorMessage(null);
    setSuggestions(results);
  }, []);

  const handleChangeQuery = useCallback(
    (text: string) => {
      setQuery(text);
      if (searchTimer.current) clearTimeout(searchTimer.current);
      if (!text.trim()) {
        setSuggestions([]);
        setSearchBusy(false);
        return;
      }
      searchTimer.current = setTimeout(
        () => runSearch(text),
        SEARCH_DEBOUNCE_MS,
      );
    },
    [runSearch],
  );

  const handleBeginSearch = useCallback(() => {
    setSearching(true);
    setQuery('');
    setSuggestions([]);
    setErrorMessage(null);
    setBlockMessage(null);
    // A fresh session — the previous one closed when its pick resolved.
    sessionToken.current = newSessionToken();
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const handleEndSearch = useCallback(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    setSearching(false);
    setQuery('');
    setSuggestions([]);
    setSearchBusy(false);
  }, []);

  const handlePickSuggestion = useCallback(
    async (suggestion: MapSuggestion) => {
      handleEndSearch();
      setResolving(true);
      const detail = await placeDetails(
        suggestion.placeId,
        sessionToken.current,
      );
      // Details closes the billing session — the next search opens a new one.
      sessionToken.current = newSessionToken();
      setResolving(false);
      if (!detail) {
        setErrorMessage(NETWORK_ERROR);
        return;
      }
      setErrorMessage(null);
      setBlockMessage(null);
      setPicked(detail);
      skipGeocode.current = true;
      lastGeocoded.current = detail.coordinate;
      setRegion(regionFor(detail.coordinate));
      setHintDismissed(false);
    },
    [handleEndSearch],
  );

  const handleRequestSave = useCallback(() => {
    if (!picked) return;
    if (!canSave(existing)) {
      setBlockMessage(LIMIT_MESSAGE);
      return;
    }
    if (isDuplicate(existing, picked)) {
      setBlockMessage(duplicateMessage(picked.name));
      return;
    }
    setBlockMessage(null);
    setConfirmOpen(true);
  }, [existing, picked]);

  const handleConfirmSave = useCallback(() => {
    setConfirmOpen(false);
    if (!picked) return;
    onSaved(toDownloadedMap(picked));
  }, [onSaved, picked]);

  const recenterTo = useMemo(
    () => picked?.coordinate ?? start,
    [picked, start],
  );

  const hintText = picked
    ? 'Pin set at your chosen location'
    : 'Move the map to adjust the pin';

  return (
    <View style={styles.root}>
      <View style={styles.mapArea}>
        <MapSurface
          region={region}
          onRegionChange={handleRegionChange}
          showCenterPin
          showControls
          recenterTo={recenterTo}
          style={StyleSheet.absoluteFill}
        />

        <TouchableOpacity
          style={[styles.close, {top: insets.top + theme.spacing.md}]}
          activeOpacity={0.85}
          accessibilityLabel="Close"
          onPress={onClose}>
          <XIcon size={18} color="#181B1F" />
        </TouchableOpacity>

        {hintDismissed ? null : (
          <View style={styles.hint}>
            <Text style={styles.hintText}>{hintText}</Text>
            <TouchableOpacity
              accessibilityLabel="Dismiss"
              onPress={() => setHintDismissed(true)}>
              <XIcon size={14} color={theme.colors.white} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={[styles.panel, {paddingBottom: insets.bottom + 12}]}>
        <View style={styles.grab} />

        <View style={styles.searchRow}>
          {searching ? (
            <TouchableOpacity
              style={styles.searchBack}
              activeOpacity={0.8}
              accessibilityLabel="Back"
              onPress={handleEndSearch}>
              <ChevronLeftIcon size={20} color="#181B1F" />
            </TouchableOpacity>
          ) : null}

          <View style={styles.field}>
            <SearchIcon size={17} color={theme.colors.textMuted} />
            {searching ? (
              <TextInput
                ref={inputRef}
                style={styles.input}
                value={query}
                onChangeText={handleChangeQuery}
                placeholder="Search for an address"
                placeholderTextColor={theme.colors.textMuted}
                autoCorrect={false}
                returnKeyType="search"
              />
            ) : (
              <TouchableOpacity
                style={styles.fakeInput}
                activeOpacity={0.7}
                onPress={handleBeginSearch}>
                <Text style={styles.fakeInputText} numberOfLines={1}>
                  {picked?.address ?? 'Search for an address'}
                </Text>
              </TouchableOpacity>
            )}
            {searching && query.length > 0 ? (
              <TouchableOpacity
                accessibilityLabel="Clear"
                onPress={() => handleChangeQuery('')}>
                <XIcon size={15} color={theme.colors.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {searching ? (
          <ScrollView
            style={styles.body}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.bodyContent}>
            {searchBusy ? (
              <ActivityIndicator
                style={styles.busy}
                color={theme.colors.primary}
              />
            ) : null}

            {!searchBusy && errorMessage ? (
              <Text style={styles.notice}>{errorMessage}</Text>
            ) : null}

            {!searchBusy && !errorMessage && query.trim().length > 0 && suggestions.length === 0 ? (
              <Text style={styles.notice}>
                No matches. Check the address and try again.
              </Text>
            ) : null}

            {suggestions.map(suggestion => (
              <TouchableOpacity
                key={suggestion.placeId}
                style={styles.suggestion}
                activeOpacity={0.8}
                onPress={() => handlePickSuggestion(suggestion)}>
                <View style={styles.suggestionIcon}>
                  <MapPinIcon size={16} color={theme.colors.primary} />
                </View>
                <View style={styles.suggestionText}>
                  <Text style={styles.suggestionName} numberOfLines={1}>
                    {suggestion.name}
                  </Text>
                  {suggestion.address ? (
                    <Text style={styles.suggestionSub} numberOfLines={1}>
                      {suggestion.address}
                    </Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <>
            <ScrollView
              style={styles.body}
              contentContainerStyle={styles.bodyContent}>
              <View style={styles.picked}>
                <View style={styles.suggestionIcon}>
                  <MapPinIcon size={16} color={theme.colors.primary} />
                </View>
                <View style={styles.suggestionText}>
                  {resolving ? (
                    <View style={styles.loadingRow}>
                      <ActivityIndicator
                        size="small"
                        color={theme.colors.primary}
                      />
                      <Text style={styles.suggestionSub}>
                        Finding this place…
                      </Text>
                    </View>
                  ) : (
                    <>
                      <Text style={styles.pickedName} numberOfLines={1}>
                        {picked?.name ?? 'Location unavailable'}
                      </Text>
                      <Text style={styles.suggestionSub} numberOfLines={2}>
                        {picked?.address ?? errorMessage ?? NETWORK_ERROR}
                      </Text>
                    </>
                  )}
                </View>
              </View>

              <View style={styles.note}>
                <InfoIcon size={17} color={theme.colors.primary} />
                <Text style={styles.noteText}>
                  The map area around this pin will be saved to your device so
                  it works offline in the field.
                </Text>
              </View>

              {blockMessage ? (
                <Text style={styles.block}>{blockMessage}</Text>
              ) : null}
            </ScrollView>

            <View style={styles.footer}>
              {online ? (
                <PrimaryButton
                  label="Download this location"
                  leadingIcon={
                    <DownloadIcon size={19} color={theme.colors.white} />
                  }
                  disabled={!picked || resolving}
                  onPress={handleRequestSave}
                />
              ) : (
                <View style={styles.offline}>
                  <WifiOffIcon size={17} color="#C26401" />
                  <Text style={styles.offlineText}>
                    You're offline. Reconnect to download a location.
                  </Text>
                </View>
              )}
            </View>
          </>
        )}
      </View>

      <ConfirmDialog
        visible={confirmOpen}
        title="Download this location?"
        message="The map area around this pin will be saved to your device."
        confirmLabel="Download"
        cancelLabel="Cancel"
        icon="check"
        iconTone="primary"
        confirmTone="primary"
        onConfirm={handleConfirmSave}
        onCancel={() => setConfirmOpen(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: theme.colors.background},
  mapArea: {flex: 6},
  close: {
    position: 'absolute',
    left: theme.spacing.lg,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.white,
    shadowColor: '#101828',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 3,
  },
  hint: {
    position: 'absolute',
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    bottom: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: 'rgba(24,27,31,0.86)',
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  hintText: {
    flex: 1,
    fontFamily: theme.fonts.bold,
    fontSize: 12.5,
    color: theme.colors.white,
  },
  panel: {
    flex: 4,
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: theme.spacing.lg,
    shadowColor: '#101828',
    shadowOffset: {width: 0, height: -6},
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 12,
  },
  grab: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.divider,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  searchBack: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  field: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    height: 46,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  input: {
    flex: 1,
    fontFamily: theme.fonts.bold,
    fontSize: 14,
    color: theme.colors.text,
    padding: 0,
  },
  fakeInput: {flex: 1, justifyContent: 'center', height: '100%'},
  fakeInputText: {
    fontFamily: theme.fonts.bold,
    fontSize: 14,
    color: theme.colors.text,
  },
  body: {flex: 1},
  bodyContent: {paddingTop: theme.spacing.lg, paddingBottom: theme.spacing.md},
  busy: {marginTop: theme.spacing.xl},
  notice: {
    fontFamily: theme.fonts.bold,
    fontSize: 13.5,
    lineHeight: 19,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingVertical: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.lg,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  suggestionIcon: {
    width: 34,
    height: 34,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primaryLight,
  },
  suggestionText: {flex: 1},
  suggestionName: {
    fontFamily: theme.fonts.black,
    fontSize: 14.5,
    color: '#181B1F',
  },
  suggestionSub: {
    fontFamily: theme.fonts.bold,
    fontSize: 12.5,
    lineHeight: 17,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  picked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  pickedName: {
    fontFamily: theme.fonts.black,
    fontSize: 16,
    color: '#181B1F',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  note: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  noteText: {
    flex: 1,
    fontFamily: theme.fonts.bold,
    fontSize: 12.5,
    lineHeight: 18,
    color: theme.colors.primaryDark,
  },
  block: {
    fontFamily: theme.fonts.bold,
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.error,
    marginTop: theme.spacing.md,
  },
  footer: {paddingTop: theme.spacing.sm},
  offline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: '#FFF7E6',
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
  },
  offlineText: {
    flex: 1,
    fontFamily: theme.fonts.bold,
    fontSize: 12.5,
    lineHeight: 18,
    color: '#C26401',
  },
});

export default DownloadMapScreen;
