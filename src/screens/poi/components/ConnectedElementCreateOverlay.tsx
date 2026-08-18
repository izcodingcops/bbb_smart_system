import React, {useCallback, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import CreateEquipmentScreen from '../../equipment/CreateEquipmentScreen';
import CreateIncidentScreen from '../../incident/CreateIncidentScreen';
import CreateMaintenanceScreen from '../../maintenance/CreateMaintenanceScreen';
import {
  incidentConnectedLabel,
  maintenanceConnectedLabel,
} from '../../../graphql/features/shared/connectedLabels';
import {PoiFormHandle} from './PoiForm';
import {theme} from '../../../theme';

/** Which Connected Elements field the open form is filling. */
export type ConnectedCreateTarget = 'incident' | 'maintenance' | 'equipment';

/**
 * Wires Connected Elements' three create forms to a mounted PoiForm.
 *
 * Create and Edit drive this identically, so the state and the
 * created-record-to-field routing live here rather than being written out
 * twice and left to drift. Mirrors Maintenance's own
 * `useConnectedElementCreate`/`ConnectedElementCreateOverlay` — see that
 * file for the fuller design rationale (why an in-tree overlay rather than a
 * native Modal, why each field opens the module's real create screen rather
 * than a cut-down quick-create sheet).
 */
export function useConnectedElementCreate(
  formRef: React.RefObject<PoiFormHandle | null>,
  refetchOptions: () => void,
) {
  const [target, setTarget] = useState<ConnectedCreateTarget | null>(null);

  const handleCreated = useCallback(
    (created: ConnectedCreateTarget, value: string) => {
      const form = formRef.current;
      if (created === 'incident') {
        form?.addIncident(value);
      } else if (created === 'maintenance') {
        form?.addMaintenance(value);
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
    /** Spread onto PoiForm. */
    formProps: {
      onAddIncident: () => setTarget('incident'),
      onAddMaintenance: () => setTarget('maintenance'),
      onAddEquipment: () => setTarget('equipment'),
    },
    /** Spread onto ConnectedElementCreateOverlay. */
    overlayProps: {
      target,
      onCreated: handleCreated,
      onClose: () => setTarget(null),
    },
  };
}

interface Props {
  /** The field being filled, or null when nothing is open. */
  target: ConnectedCreateTarget | null;
  /**
   * Fires with the exact option string to select for `target` — the same value
   * the refetched option list will contain.
   */
  onCreated: (target: ConnectedCreateTarget, value: string) => void;
  onClose: () => void;
}

/**
 * Lays a module's own full create screen over the POI form. See
 * Maintenance's `ConnectedElementCreateOverlay` for why this is a plain
 * absolutely-positioned sibling rather than a native `<Modal>`.
 */
const ConnectedElementCreateOverlay: React.FC<Props> = ({target, onCreated, onClose}) => {
  if (target === null) {
    return null;
  }

  return (
    <View style={styles.overlay}>
      {target === 'incident' ? (
        <CreateIncidentScreen
          onClose={onClose}
          onCreated={created =>
            onCreated(
              'incident',
              incidentConnectedLabel(created.incidentType, created.occurredAt),
            )
          }
          // Quick-create never nests more than one level deep — this
          // instance's own Connected Elements offers no further Add buttons.
          allowConnectedCreate={false}
        />
      ) : null}

      {target === 'maintenance' ? (
        <CreateMaintenanceScreen
          onClose={onClose}
          onCreated={created =>
            onCreated('maintenance', maintenanceConnectedLabel(created.reference))
          }
          allowConnectedCreate={false}
        />
      ) : null}

      {target === 'equipment' ? (
        <CreateEquipmentScreen
          onClose={onClose}
          onCreated={created => onCreated('equipment', created.name)}
          allowConnectedCreate={false}
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
    // Opaque on purpose: this covers the POI form rather than replacing it,
    // and ScreenBackground paints its gradient with an SVG over a
    // transparent box, so without a colour here the form would show through.
    // Same colour the stack gives its own screens (PoiNavigator's
    // contentStyle).
    backgroundColor: theme.colors.background,
  },
});

export default ConnectedElementCreateOverlay;
