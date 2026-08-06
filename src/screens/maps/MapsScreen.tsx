import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {DownloadedMap, MapCoordinate} from '../../types/maps';
import {GetDownloadedMaps} from '../../redux/maps/selectors';
import {mapDeleted, mapDownloaded} from '../../redux/maps/slice';
import {useAppDispatch} from '../../redux/store';
import {setTabBarHidden} from '../../redux/ui/slice';
import CurrentLocationCard from './components/CurrentLocationCard';
import DownloadedMapRow from './components/DownloadedMapRow';
import MapDetailSheet from './components/MapDetailSheet';
import DownloadMapScreen from './DownloadMapScreen';
import {ConfirmDialog, EmptyState, SectionTitle, Toast} from '../../components/ui';
import {MapIcon, PlusIcon} from '../../components/icons';
import {theme} from '../../theme';

/** The save flow is a full-screen push within the Maps tab. */
type MapsRoute = {name: 'list'} | {name: 'download'};

const MapsScreen: React.FC = () => {
  const items = GetDownloadedMaps();
  const dispatch = useAppDispatch();

  const [route, setRoute] = useState<MapsRoute>({name: 'list'});
  const [detailId, setDetailId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<DownloadedMap | null>(null);
  /** Held while the detail sheet dismisses — see handleSheetClosed. */
  const [queuedDelete, setQueuedDelete] = useState<DownloadedMap | null>(null);
  const [savedName, setSavedName] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [currentCoordinate, setCurrentCoordinate] =
    useState<MapCoordinate | null>(null);

  // The save flow is a full-screen push — the tab bar has no place there.
  useEffect(() => {
    dispatch(setTabBarHidden(route.name !== 'list'));
    return () => {
      dispatch(setTabBarHidden(false));
    };
  }, [dispatch, route.name]);

  const detailItem = useMemo(
    () => items.find(item => item.id === detailId) ?? null,
    [items, detailId],
  );

  const handleOpenDownload = useCallback(() => {
    setRoute({name: 'download'});
  }, []);

  const handleCloseDownload = useCallback(() => {
    setRoute({name: 'list'});
  }, []);

  const handleSaved = useCallback(
    (record: DownloadedMap) => {
      dispatch(mapDownloaded(record));
      setRoute({name: 'list'});
      setSavedName(record.name);
      setToastVisible(true);
    },
    [dispatch],
  );

  const handleOpenDetail = useCallback((item: DownloadedMap) => {
    setDetailId(item.id);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setDetailId(null);
  }, []);

  /** Row trash button — no sheet is up, so the confirm can open immediately. */
  const handleAskDeleteFromRow = useCallback((item: DownloadedMap) => {
    setPendingDelete(item);
  }, []);

  /**
   * Sheet Delete button. iOS drops a modal presented while another is still
   * up, so the target is parked here and the sheet is only asked to close —
   * the same queue MainTabNavigator uses for its End Shift dialog.
   */
  const handleAskDeleteFromSheet = useCallback((item: DownloadedMap) => {
    setQueuedDelete(item);
    setDetailId(null);
  }, []);

  const handleSheetClosed = useCallback(() => {
    if (queuedDelete) {
      setPendingDelete(queuedDelete);
      setQueuedDelete(null);
    }
  }, [queuedDelete]);

  const handleConfirmDelete = useCallback(() => {
    if (pendingDelete) {
      dispatch(mapDeleted({id: pendingDelete.id}));
    }
    setPendingDelete(null);
  }, [dispatch, pendingDelete]);

  const handleCoordinateResolved = useCallback((coordinate: MapCoordinate) => {
    setCurrentCoordinate(coordinate);
  }, []);

  const renderItem = useCallback(
    ({item}: {item: DownloadedMap}) => (
      <DownloadedMapRow
        item={item}
        onPress={handleOpenDetail}
        onDelete={handleAskDeleteFromRow}
      />
    ),
    [handleOpenDetail, handleAskDeleteFromRow],
  );

  const listHeader = useMemo(
    () => (
      <View>
        <SectionTitle
          title="Location"
          style={styles.section}
          action={
            <TouchableOpacity
              style={styles.addAction}
              activeOpacity={0.8}
              onPress={handleOpenDownload}>
              <PlusIcon size={15} color={theme.colors.primary} />
              <Text style={styles.addActionLabel}>Download location</Text>
            </TouchableOpacity>
          }
        />
        <CurrentLocationCard
          onPress={handleOpenDownload}
          onCoordinateResolved={handleCoordinateResolved}
        />

        <SectionTitle
          title="Downloaded locations"
          style={styles.section}
          action={
            <Text style={styles.count}>
              {items.length} saved
            </Text>
          }
        />
      </View>
    ),
    [handleOpenDownload, handleCoordinateResolved, items.length],
  );

  if (route.name === 'download') {
    return (
      <DownloadMapScreen
        initialCoordinate={currentCoordinate}
        existing={items}
        onClose={handleCloseDownload}
        onSaved={handleSaved}
      />
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <Text style={styles.title}>Maps</Text>
      </SafeAreaView>

      <FlatList
        data={items}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          <EmptyState
            icon={<MapIcon size={28} color={theme.colors.primary} />}
            title="No downloaded locations yet."
            body="Tap + Download location to save a map for offline use."
            actionLabel="Download location"
            onAction={handleOpenDownload}
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <MapDetailSheet
        visible={detailItem !== null}
        item={detailItem}
        onClose={handleCloseDetail}
        onClosed={handleSheetClosed}
        onDelete={handleAskDeleteFromSheet}
      />

      <ConfirmDialog
        visible={pendingDelete !== null}
        title="Delete downloaded map?"
        message={
          pendingDelete ? (
            <Text>
              <Text style={styles.strong}>{pendingDelete.name}</Text> will be
              removed from your device. You can download it again anytime while
              online.
            </Text>
          ) : null
        }
        confirmLabel="Delete"
        cancelLabel="Keep"
        icon="warning"
        iconTone="danger"
        confirmTone="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />

      {/* `savedName` deliberately survives dismissal — clearing it would blank
          the message mid-way through the toast's exit animation. */}
      <Toast
        visible={toastVisible}
        title="Map downloaded"
        message={`${savedName ?? ''} is now available offline.`}
        onDismiss={() => setToastVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: theme.colors.background},
  title: {
    fontFamily: theme.fonts.black,
    fontSize: 26,
    letterSpacing: -0.6,
    color: '#181B1F',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  section: {marginTop: theme.spacing.sm, marginBottom: theme.spacing.md},
  addAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  addActionLabel: {
    fontFamily: theme.fonts.black,
    fontSize: 13,
    color: theme.colors.primary,
  },
  count: {
    fontFamily: theme.fonts.bold,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  strong: {fontFamily: theme.fonts.black},
});

export default MapsScreen;
