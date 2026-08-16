import React, {useCallback, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import CreateEquipmentScreen from '../../equipment/CreateEquipmentScreen';
import CreateFixtureScreen from '../../fixture/CreateFixtureScreen';
import CreateIncidentScreen from '../../incident/CreateIncidentScreen';
import CreatePoiScreen from '../../poi/CreatePoiScreen';
import {incidentConnectedLabel} from '../../../graphql/features/maintenance/connectedLabels';
import {MaintenanceFormHandle} from './MaintenanceForm';
import {theme} from '../../../theme';

/** Which Connected Elements field the open form is filling. */
export type ConnectedCreateTarget =
  | 'fixture'
  | 'incident'
  | 'poi'
  | 'equipment';

/**
 * Wires Connected Elements' four create forms to a mounted MaintenanceForm.
 *
 * Create and Edit drive this identically, so the state and the
 * created-record-to-field routing live here rather than being written out twice
 * and left to drift.
 */
export function useConnectedElementCreate(
  formRef: React.RefObject<MaintenanceFormHandle | null>,
  refetchOptions: () => void,
) {
  const [target, setTarget] = useState<ConnectedCreateTarget | null>(null);
  // Captured when the incident form opens — the maintenance form owns its own
  // values, so the address has to be read out at that moment.
  const [incidentAddress, setIncidentAddress] = useState('');

  const handleCreated = useCallback(
    (created: ConnectedCreateTarget, value: string) => {
      const form = formRef.current;
      if (created === 'fixture') {
        form?.selectFixture(value);
      } else if (created === 'incident') {
        form?.addIncident(value);
      } else if (created === 'poi') {
        form?.addPoi(value);
      } else {
        form?.addEquipment(value);
      }
      // The create screens report the record and leave dismissal to their host.
      setTarget(null);
      // Selected first, then refetched, so the new entry is both chosen on the
      // form and listed in its dropdown.
      refetchOptions();
    },
    [formRef, refetchOptions],
  );

  return {
    /** Spread onto MaintenanceForm. */
    formProps: {
      onAddFixture: () => setTarget('fixture'),
      onAddIncident: (address: string) => {
        setIncidentAddress(address);
        setTarget('incident');
      },
      onAddPoi: () => setTarget('poi'),
      onAddEquipment: () => setTarget('equipment'),
    },
    /** Spread onto ConnectedElementCreateOverlay. */
    overlayProps: {
      target,
      defaultAddress: incidentAddress,
      onCreated: handleCreated,
      onClose: () => setTarget(null),
    },
  };
}

interface Props {
  /** The field being filled, or null when nothing is open. */
  target: ConnectedCreateTarget | null;
  /** The address currently on the maintenance form, to seed an incident with. */
  defaultAddress: string;
  /**
   * Fires with the exact option string to select for `target` — the same value
   * the refetched option list will contain.
   */
  onCreated: (target: ConnectedCreateTarget, value: string) => void;
  onClose: () => void;
}

/**
 * Lays a module's own full create screen over the maintenance form.
 *
 * Connected Elements used to offer four cut-down "quick create" sheets, which
 * drifted from the real forms as those grew — a person could only be given a
 * name and a type here, while the POI tab asked for demographics, contacts and
 * connections too. Rather than keep four partial copies in sync, each field now
 * opens the module's actual create screen. They are all plain components taking
 * `onClose`/`onCreated`, so they compose here unchanged, and parity is
 * structural rather than something to maintain.
 *
 * An in-tree overlay rather than a React Native <Modal>, for two reasons that
 * both come down to a modal being a separate *native* root:
 *
 *  - Every one of these forms confirms discard and submit through ConfirmDialog,
 *    itself a Modal, and closes with `setConfirmDialog(false); onClose()` in one
 *    commit. Hiding a host Modal while it is presenting another one makes UIKit
 *    resolve the dismissal against the child instead of the host, leaving a
 *    full-screen modal presented with nothing in it and no way out.
 *  - `SafeAreaView` is a native view that finds its insets by walking the native
 *    tree for the nearest RNCSafeAreaProvider. Inside a modal the app-root
 *    provider is not an ancestor, so every safe-area inset collapsed to zero and
 *    these forms' top bars sat under the status bar and camera notch.
 *
 * As a plain sibling of the form it covers, the screens sit in exactly the tree
 * they sit in when opened from their own tab, and both problems are gone rather
 * than worked around. The maintenance form underneath stays mounted and keeps
 * everything the user has typed; the created record is selected on it through
 * MaintenanceFormHandle on the way back. Nothing is mounted until a target is
 * set, so no module's form options are fetched until its form is opened.
 *
 * No enter/exit animation, matching this stack's own `animation: 'none'`.
 */
const ConnectedElementCreateOverlay: React.FC<Props> = ({
  target,
  defaultAddress,
  onCreated,
  onClose,
}) => {
  if (target === null) {
    return null;
  }

  return (
    <View style={styles.overlay}>
      {target === 'fixture' ? (
        <CreateFixtureScreen
          onClose={onClose}
          onCreated={created => onCreated('fixture', created.title)}
        />
      ) : null}

      {target === 'incident' ? (
        <CreateIncidentScreen
          defaultAddress={defaultAddress}
          onClose={onClose}
          onCreated={created =>
            onCreated(
              'incident',
              // Built with the resolver's own helper, so the value selected is
              // byte-identical to the option the refetched list will contain.
              incidentConnectedLabel(created.incidentType, created.occurredAt),
            )
          }
        />
      ) : null}

      {target === 'poi' ? (
        <CreatePoiScreen
          onClose={onClose}
          onCreated={created => onCreated('poi', created.name)}
        />
      ) : null}

      {target === 'equipment' ? (
        <CreateEquipmentScreen
          onClose={onClose}
          onCreated={created => onCreated('equipment', created.name)}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    // Opaque on purpose: this covers the maintenance form rather than replacing
    // it, and ScreenBackground paints its gradient with an SVG over a
    // transparent box, so without a colour here the form would show through.
    // Same colour the stack gives its own screens (MaintenanceNavigator's
    // contentStyle).
    backgroundColor: theme.colors.background,
  },
});

export default ConnectedElementCreateOverlay;
