import React, {useEffect, useState} from 'react';
import {Alert, View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {BottomSheet, FieldLabel, TextField} from '../../../components/ui';
import {useCreateMaintenanceEquipmentMutation} from '../../../graphql/features/maintenance/hooks';
import {theme} from '../../../theme';

interface Props {
  visible: boolean;
  /** Fires once the option list has a new entry, so the form can refetch it. */
  onCreated: () => void;
  onClose: () => void;
}

/**
 * Adds a piece of equipment to Connected Elements without leaving the form.
 * Only a name: this feeds Maintenance's own equipment option list, which is
 * deliberately separate from the Equipment module's record store, so fields
 * beyond the name would have nowhere to go. Per the no-nesting rule, an
 * inline create never offers its own Connected Elements.
 */
const AddEquipmentSheet: React.FC<Props> = ({visible, onCreated, onClose}) => {
  const [name, setName] = useState('');
  const {mutate: createEquipment, isLoading} =
    useCreateMaintenanceEquipmentMutation();

  useEffect(() => {
    if (visible) {
      setName('');
    }
  }, [visible]);

  const canSave = name.trim().length > 0 && !isLoading;

  const save = async () => {
    if (!canSave) {
      return;
    }
    try {
      await createEquipment(name.trim());
      onCreated();
      onClose();
    } catch {
      Alert.alert(
        "Couldn't add equipment",
        'Something went wrong. Check your connection and try again.',
      );
    }
  };

  return (
    <BottomSheet visible={visible} title="Add Equipment" onClose={onClose}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Basic Details</Text>
        <View style={styles.lastField}>
          <FieldLabel label="Equipment Name" required />
          <TextField
            placeholder="e.g. Pressure Washer"
            value={name}
            onChangeText={setName}
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.save, !canSave && styles.saveDisabled]}
        activeOpacity={0.9}
        disabled={!canSave}
        onPress={save}>
        <Text style={styles.saveText}>Save &amp; Select</Text>
      </TouchableOpacity>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 14,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xs,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
  },
  cardTitle: {
    fontFamily: theme.fonts.black,
    fontSize: 18,
    letterSpacing: -0.2,
    color: theme.colors.text,
    marginBottom: 14,
  },
  lastField: {marginBottom: 6},
  save: {
    height: 50,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    marginTop: theme.spacing.lg,
  },
  saveDisabled: {opacity: 0.45},
  saveText: {
    fontFamily: theme.fonts.black,
    fontSize: 15.5,
    color: theme.colors.white,
  },
});

export default AddEquipmentSheet;
