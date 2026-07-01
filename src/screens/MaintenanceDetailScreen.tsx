import React, {useState} from 'react';
import {View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {theme} from '../theme';
import {
  useGetMaintenanceDetailQuery,
  useAddMaintenanceCommentMutation,
  useRemoveMaintenanceMutation,
} from '../redux/maintenance/api';
import ConfirmDialog from '../components/ConfirmDialog';
import BottomSheet from '../components/BottomSheet';
import {MaintenanceStackParamList} from '../navigation/MaintenanceNavigator';

type Nav = NativeStackNavigationProp<MaintenanceStackParamList, 'MaintenanceDetail'>;
type DetailRoute = RouteProp<MaintenanceStackParamList, 'MaintenanceDetail'>;

const MaintenanceDetailScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<DetailRoute>();
  const {data: record} = useGetMaintenanceDetailQuery(route.params.id);
  const [addComment] = useAddMaintenanceCommentMutation();
  const [removeMaintenance] = useRemoveMaintenanceMutation();

  const [commentVisible, setCommentVisible] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);

  if (!record) {
    return <View style={styles.root} />;
  }

  const handleAddComment = () => {
    addComment({id: record.id, text: commentText});
    setCommentText('');
    setCommentVisible(false);
  };

  const handleDelete = () => {
    removeMaintenance(record.id);
    setDeleteConfirmVisible(false);
    navigation.goBack();
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity testID="maintenance-detail-back" onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Maintenance</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity testID="maintenance-detail-delete" onPress={() => setDeleteConfirmVisible(true)}>
            <Text style={styles.deleteIcon}>🗑</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="maintenance-detail-edit"
            onPress={() => navigation.navigate('MaintenanceForm', {id: record.id})}>
            <Text style={styles.editIcon}>✎</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.ticket}>{record.ticket_number}</Text>

        <Text style={styles.sectionTitle}>Basic Details</Text>
        <Text style={styles.row}>Type: {String(record.maintenance_type_id)}</Text>
        <Text style={styles.row}>Priority: {record.priority}</Text>
        <Text style={styles.row}>Status: {record.status}</Text>
        <Text style={styles.row}>Payment Status: {record.payment_status ?? 'Un-Paid'}</Text>

        <Text style={styles.sectionTitle}>Location Details</Text>
        <Text style={styles.row}>Address: {record.address}</Text>
        <Text style={styles.row}>Describe Location: {record.location_description ?? 'N/A'}</Text>
      </ScrollView>

      <TouchableOpacity
        testID="maintenance-detail-add-comment"
        style={styles.commentBtn}
        onPress={() => setCommentVisible(true)}>
        <Text style={styles.commentBtnText}>Add Comment</Text>
      </TouchableOpacity>

      <BottomSheet
        visible={commentVisible}
        onClose={() => setCommentVisible(false)}
        sheetStyle={{maxHeight: '50%'}}>
        <View style={styles.commentSheet}>
          <TextInput
            testID="maintenance-comment-input"
            style={styles.commentInput}
            placeholder="Write Comment"
            value={commentText}
            onChangeText={setCommentText}
            multiline
          />
          <View style={styles.commentActions}>
            <TouchableOpacity testID="maintenance-comment-cancel" onPress={() => setCommentVisible(false)}>
              <Text style={styles.commentCancel}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="maintenance-comment-add"
              style={styles.commentAddBtn}
              onPress={handleAddComment}>
              <Text style={styles.commentAddText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BottomSheet>

      <ConfirmDialog
        visible={deleteConfirmVisible}
        title={`Delete Maintenance${record.ticket_number}`}
        message="Are you sure you want to delete this? This action cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirmVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: theme.colors.background},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
  },
  backText: {fontSize: 24, color: theme.colors.text},
  headerTitle: {fontFamily: theme.fonts.bold, fontSize: theme.fontSize.md, color: theme.colors.text},
  headerActions: {flexDirection: 'row', gap: theme.spacing.md},
  deleteIcon: {fontSize: 18, color: theme.colors.error},
  editIcon: {fontSize: 18, color: theme.colors.primary},
  content: {padding: theme.spacing.lg, gap: theme.spacing.sm},
  ticket: {fontFamily: theme.fonts.bold, fontSize: theme.fontSize.lg, color: theme.colors.text},
  sectionTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSize.base,
    color: theme.colors.text,
    marginTop: theme.spacing.md,
  },
  row: {fontFamily: theme.fonts.regular, fontSize: theme.fontSize.xs + 2, color: theme.colors.textSecondary},
  commentBtn: {margin: theme.spacing.lg, alignItems: 'center'},
  commentBtnText: {fontFamily: theme.fonts.bold, color: theme.colors.primary},
  commentSheet: {padding: theme.spacing.xl, gap: theme.spacing.md},
  commentInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  commentActions: {flexDirection: 'row', justifyContent: 'flex-end', gap: theme.spacing.md},
  commentCancel: {fontFamily: theme.fonts.bold, color: theme.colors.textSecondary, padding: theme.spacing.sm},
  commentAddBtn: {
    backgroundColor: theme.colors.primaryDark,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  commentAddText: {fontFamily: theme.fonts.bold, color: theme.colors.white},
});

export default MaintenanceDetailScreen;
