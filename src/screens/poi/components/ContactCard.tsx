import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {FieldLabel, formChrome, TextField} from '../../../components/ui';
import {TrashIcon} from '../../../components/icons';
import {PoiContact} from '../../../types/poi';
import {theme} from '../../../theme';

export const EMPTY_CONTACT: PoiContact = {
  name: '',
  email: '',
  phone: '',
  relationship: '',
  notes: '',
};

interface Props {
  /** Zero-based; the header renders it one-based. */
  index: number;
  contact: PoiContact;
  /** Omitted on the only remaining card, so the list can't be emptied. */
  onRemove?: () => void;
  onChange: (next: PoiContact) => void;
}

/** One repeating card in the person form's Contacts section. */
const ContactCard: React.FC<Props> = ({index, contact, onRemove, onChange}) => {
  const set = <K extends keyof PoiContact>(key: K, value: PoiContact[K]) =>
    onChange({...contact, [key]: value});

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.name}>Contact {index + 1}</Text>
        {onRemove ? (
          <TouchableOpacity
            style={styles.remove}
            activeOpacity={0.8}
            accessibilityLabel={`Remove contact ${index + 1}`}
            onPress={onRemove}>
            <TrashIcon size={17} color={theme.colors.error} />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={formChrome.field}>
        <FieldLabel label="Name" />
        <TextField
          placeholder="Contact name"
          value={contact.name}
          onChangeText={next => set('name', next)}
        />
      </View>

      <View style={formChrome.field}>
        <FieldLabel label="Email" />
        <TextField
          placeholder="name@email.com"
          value={contact.email}
          onChangeText={next => set('email', next)}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={formChrome.field}>
        <FieldLabel label="Phone Number" />
        <TextField
          placeholder="(303) 555-0142"
          value={contact.phone}
          onChangeText={next => set('phone', next)}
          keyboardType="phone-pad"
        />
      </View>

      <View style={formChrome.field}>
        <FieldLabel label="Relationship" />
        <TextField
          placeholder="e.g. Case worker, sister"
          value={contact.relationship}
          onChangeText={next => set('relationship', next)}
        />
      </View>

      <View style={formChrome.lastField}>
        <FieldLabel label="Notes" />
        <TextField
          placeholder="Add any additional notes"
          value={contact.notes}
          onChangeText={next => set('notes', next)}
          multiline
          numberOfLines={3}
          style={formChrome.textarea}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xs,
    marginBottom: theme.spacing.md,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: '#F8F9FB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  name: {
    fontFamily: theme.fonts.black,
    fontSize: 14,
    color: theme.colors.text,
  },
  remove: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.white,
  },
});

export default ContactCard;
