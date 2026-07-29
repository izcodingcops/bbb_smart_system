import React from 'react';
import {View, Text, TouchableOpacity, Image, StyleSheet} from 'react-native';
import {EditIcon, TrashIcon} from '../../../components/icons';
import {MaintenanceComment} from '../../../types/maintenance';
import {theme} from '../../../theme';

interface Props {
  comments: MaintenanceComment[];
  onEdit: (comment: MaintenanceComment) => void;
  onDelete: (comment: MaintenanceComment) => void;
}

/** 'Apr 20, 2026, 12:15 PM' — the format the design's comment cards use. */
function formatCommentDate(iso: string): string {
  const date = new Date(iso);
  const day = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const time = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${day}, ${time}`;
}

const CommentList: React.FC<Props> = ({comments, onEdit, onDelete}) => {
  if (comments.length === 0) {
    return <Text style={styles.empty}>No comments yet.</Text>;
  }

  return (
    <View style={styles.list}>
      {comments.map(comment => (
        <View key={comment.id} style={styles.card}>
          <View style={styles.head}>
            <Text style={styles.date}>
              {formatCommentDate(comment.createdAt)}
              {comment.edited ? ' · edited' : ''}
            </Text>
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.action}
                activeOpacity={0.8}
                onPress={() => onDelete(comment)}>
                <TrashIcon size={14} color="#CF1322" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.action}
                activeOpacity={0.8}
                onPress={() => onEdit(comment)}>
                <EditIcon size={14} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.body}>{comment.text}</Text>

          {comment.images.length > 0 ? (
            <View style={styles.thumbs}>
              {comment.images.map(uri => (
                <Image key={uri} source={{uri}} style={styles.thumb} />
              ))}
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  list: {gap: theme.spacing.md},
  empty: {
    fontFamily: theme.fonts.bold,
    fontSize: 13.5,
    color: theme.colors.textMuted,
  },
  card: {
    padding: theme.spacing.md,
    paddingHorizontal: 14,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: '#EEF0F2',
    backgroundColor: '#F4F5F7',
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 7,
  },
  date: {
    flex: 1,
    fontFamily: theme.fonts.bold,
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  actions: {flexDirection: 'row', alignItems: 'center', gap: 7},
  action: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.white,
    ...theme.shadow.card,
  },
  body: {
    fontFamily: theme.fonts.bold,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.text,
  },
  thumbs: {flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 10},
  thumb: {
    width: 52,
    height: 52,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
  },
});

export default CommentList;
