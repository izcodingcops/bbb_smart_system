import React from 'react';
import {View, StyleSheet} from 'react-native';
import {DropdownField, FieldLabel, SegmentedButtons} from '../../../components/ui';
import {theme} from '../../../theme';

const YES_NO_OPTIONS = [
  {value: 'yes', label: 'Yes'},
  {value: 'no', label: 'No'},
];

interface Props {
  value: boolean | null;
  abnormality: string | null;
  options: string[];
  onChangeValue: (v: boolean) => void;
  onChangeAbnormality: (v: string) => void;
}

/**
 * The damage question the Check-Out and Check-In forms both ask.
 *
 * Presentational only: choosing "No" calls `onChangeValue(false)` and
 * nothing else — it does NOT clear `abnormality`. The parent owns its own
 * form state and is responsible for clearing `abnormality` back to null
 * when it reacts to `onChangeValue(false)`.
 */
const AbnormalityBlock: React.FC<Props> = ({
  value,
  abnormality,
  options,
  onChangeValue,
  onChangeAbnormality,
}) => {
  const segmentValue = value === null ? '' : value ? 'yes' : 'no';

  return (
    <View style={styles.field}>
      <FieldLabel
        label="Are there any abnormalities with the equipment?"
        required
      />
      <SegmentedButtons
        options={YES_NO_OPTIONS}
        value={segmentValue}
        onChange={v => onChangeValue(v === 'yes')}
      />
      {value === true ? (
        <View style={styles.dropdown}>
          <DropdownField
            label="Abnormality / Damage Info"
            required
            placeholder="Select abnormality / damage"
            options={options}
            value={abnormality}
            onChange={onChangeAbnormality}
            searchable={false}
          />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  field: {marginBottom: theme.spacing.lg},
  dropdown: {marginTop: theme.spacing.lg},
});

export default AbnormalityBlock;
