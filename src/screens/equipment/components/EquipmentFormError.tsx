import React from 'react';
import {StyleSheet, View} from 'react-native';
import ScreenBackground from '../../../components/ScreenBackground';
import {DetailTopBar, EmptyState} from '../../../components/ui';
import {BoxIcon} from '../../../components/icons';
import {theme} from '../../../theme';

interface Props {
  /** The failing screen's own topbar title — the only thing that differs. */
  title: string;
  onClose: () => void;
  onRetry: () => void;
}

/**
 * The failed-load branch every equipment form screen renders in place of its
 * body. Check-Out, Check-In and Add Upkeep each held a byte-identical copy of
 * it, so a fourth form does not become a fourth copy — the same reason
 * useFormDiscardState and useSectionScrollTabs were pulled out of them.
 *
 * The close affordance is part of the branch on purpose: these routes hide the
 * tab bar, so a failed load with no way out would trap the user, and there is
 * no BackHandler anywhere in this app.
 */
const EquipmentFormError: React.FC<Props> = ({title, onClose, onRetry}) => (
  <ScreenBackground style={styles.root}>
    <DetailTopBar title={title} onBack={onClose} />
    <View style={styles.errorWrap}>
      <EmptyState
        icon={<BoxIcon size={28} color={theme.colors.primary} />}
        title="Couldn't load this equipment"
        body="Something went wrong fetching it. Check your connection and try again."
        actionLabel="Retry"
        onAction={onRetry}
      />
    </View>
  </ScreenBackground>
);

const styles = StyleSheet.create({
  root: {flex: 1},
  errorWrap: {flex: 1, justifyContent: 'center'},
});

export default EquipmentFormError;
