import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  TextInput,
  Image,
  ScrollView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { Lock } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import { DisputeBadge } from '@/components/expenses/DisputeBadge';
import { ChangeHistoryRow } from '@/components/expenses/ChangeHistoryRow';
import type { Expense, ExpenseSplit, ExpenseVersion, ExpenseDispute, DisputeComment } from '@/types/expenses';

interface ExpenseDetailSheetProps {
  visible: boolean;
  onClose: () => void;
  expense: (Expense & { expense_splits: ExpenseSplit[] }) | null;
  onUpdate: () => void;
}

type ActiveTab = 'Details' | 'History';

function formatAmount(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function ExpenseDetailSheet({ visible, onClose, expense, onUpdate }: ExpenseDetailSheetProps) {
  const { user } = useAuthStore();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['80%', '95%'], []);

  const [activeTab, setActiveTab] = useState<ActiveTab>('Details');

  // History tab state
  const [versions, setVersions] = useState<ExpenseVersion[]>([]);
  const [disputes, setDisputes] = useState<(ExpenseDispute & { comments: DisputeComment[] })[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [editDescription, setEditDescription] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // Dispute mode state
  const [disputeMode, setDisputeMode] = useState(false);
  const [disputeNote, setDisputeNote] = useState('');
  const [disputeSaving, setDisputeSaving] = useState(false);

  // Comment state for existing disputes
  const [commentText, setCommentText] = useState('');

  // Delete state
  const [deleting, setDeleting] = useState(false);

  // Receipt full-size
  const [receiptFullView, setReceiptFullView] = useState(false);

  // Control bottom sheet open/close
  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.expand();
      // Reset state when opening a new expense
      setActiveTab('Details');
      setEditMode(false);
      setDisputeMode(false);
      setDisputeNote('');
      setCommentText('');
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible]);

  // Initialize edit fields when expense changes
  useEffect(() => {
    if (expense) {
      setEditDescription(expense.description);
      setEditAmount((expense.amount_cents / 100).toFixed(2));
      setEditCategory(expense.category ?? '');
    }
  }, [expense]);

  // Load history data when History tab is selected
  const loadHistory = useCallback(async () => {
    if (!expense) return;

    setHistoryLoading(true);
    try {
      const [versionsRes, disputesRes] = await Promise.all([
        supabase
          .from('expense_versions')
          .select('*')
          .eq('expense_id', expense.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('expense_disputes')
          .select('*')
          .eq('expense_id', expense.id),
      ]);

      const fetchedVersions = (versionsRes.data ?? []) as ExpenseVersion[];
      setVersions(fetchedVersions);

      const fetchedDisputes = disputesRes.data ?? [];
      const disputesWithComments = await Promise.all(
        fetchedDisputes.map(async (d) => {
          const { data: comments } = await supabase
            .from('dispute_comments')
            .select('*')
            .eq('dispute_id', d.id)
            .order('created_at', { ascending: true });
          return { ...d, comments: (comments ?? []) as DisputeComment[] };
        })
      );
      setDisputes(disputesWithComments as (ExpenseDispute & { comments: DisputeComment[] })[]);
    } catch {
      // Silently fail — history is non-critical
    } finally {
      setHistoryLoading(false);
    }
  }, [expense]);

  useEffect(() => {
    if (activeTab === 'History' && visible) {
      loadHistory();
    }
  }, [activeTab, visible, loadHistory]);

  // Check for open dispute
  const openDispute = useMemo(() => {
    return disputes.find((d) => d.status === 'open') ?? null;
  }, [disputes]);

  const isCreator = expense?.created_by === user?.id;

  // ------ Edit action ------
  const handleSave = useCallback(async () => {
    if (!expense || !user) return;

    setEditSaving(true);
    try {
      const amountCents = Math.round(parseFloat(editAmount) * 100);
      if (isNaN(amountCents) || amountCents <= 0) {
        Alert.alert('Error', 'Please enter a valid amount');
        return;
      }

      const { error } = await supabase.rpc('update_expense', {
        p_expense_id: expense.id,
        p_description: editDescription.trim(),
        p_amount_cents: amountCents,
        p_category: editCategory.trim() || null,
        p_split_type: expense.split_type,
        p_splits: JSON.stringify(expense.expense_splits.map((s) => ({
          user_id: s.user_id,
          amount_cents: s.amount_cents,
        }))),
        p_tax_cents: expense.tax_cents,
        p_tip_cents: expense.tip_cents,
        p_is_private: expense.is_private,
      });

      if (error) throw error;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setEditMode(false);
      onUpdate();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update expense';
      Alert.alert('Error', message);
    } finally {
      setEditSaving(false);
    }
  }, [expense, user, editDescription, editAmount, editCategory, onUpdate]);

  // ------ Delete action ------
  const handleDelete = useCallback(() => {
    if (!expense) return;

    Alert.alert(
      'Delete Expense',
      'Delete this expense? This will update balances for everyone involved.',
      [
        { text: 'Keep It', style: 'cancel' },
        {
          text: 'Delete Expense',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              const { error } = await supabase.rpc('soft_delete_expense', {
                p_expense_id: expense.id,
              });
              if (error) throw error;

              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              onUpdate();
              onClose();
            } catch (err) {
              const message = err instanceof Error ? err.message : 'Failed to delete expense';
              Alert.alert('Error', message);
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  }, [expense, onUpdate, onClose]);

  // ------ Dispute action ------
  const handleSubmitDispute = useCallback(async () => {
    if (!expense || !user || !disputeNote.trim()) return;

    setDisputeSaving(true);
    try {
      const { data: disputeData, error: disputeError } = await supabase
        .from('expense_disputes')
        .insert({ expense_id: expense.id, opened_by: user.id, status: 'open' })
        .select()
        .single();

      if (disputeError) throw disputeError;

      const { error: commentError } = await supabase
        .from('dispute_comments')
        .insert({ dispute_id: disputeData.id, user_id: user.id, body: disputeNote.trim() });

      if (commentError) throw commentError;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDisputeMode(false);
      setDisputeNote('');
      // Refresh history if on History tab
      if (activeTab === 'History') {
        loadHistory();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to open dispute';
      Alert.alert('Error', message);
    } finally {
      setDisputeSaving(false);
    }
  }, [expense, user, disputeNote, activeTab, loadHistory]);

  // ------ Add comment to dispute ------
  const handleAddComment = useCallback(async (disputeId: string) => {
    if (!user || !commentText.trim()) return;

    try {
      const { error } = await supabase
        .from('dispute_comments')
        .insert({ dispute_id: disputeId, user_id: user.id, body: commentText.trim() });

      if (error) throw error;

      setCommentText('');
      loadHistory();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add comment';
      Alert.alert('Error', message);
    }
  }, [user, commentText, loadHistory]);

  if (!expense) return null;

  // ---------- Details Tab ----------
  const renderDetailsTab = () => (
    <View style={styles.tabContent}>
      {/* Amount */}
      {editMode ? (
        <TextInput
          style={styles.editAmountInput}
          value={editAmount}
          onChangeText={setEditAmount}
          keyboardType="decimal-pad"
          placeholder="0.00"
          placeholderTextColor={colors.textSecondary.light}
        />
      ) : (
        <Text style={styles.amount}>{formatAmount(expense.amount_cents)}</Text>
      )}

      {/* Open dispute badge */}
      {openDispute && <DisputeBadge status="open" />}

      {/* Description */}
      {editMode ? (
        <TextInput
          style={styles.editInput}
          value={editDescription}
          onChangeText={setEditDescription}
          placeholder="Description"
          placeholderTextColor={colors.textSecondary.light}
        />
      ) : (
        <Text style={styles.description}>{expense.description}</Text>
      )}

      {/* Category */}
      {editMode ? (
        <TextInput
          style={styles.editInput}
          value={editCategory}
          onChangeText={setEditCategory}
          placeholder="Category (optional)"
          placeholderTextColor={colors.textSecondary.light}
        />
      ) : expense.category ? (
        <View style={styles.categoryChip}>
          <Text style={styles.categoryChipText}>{expense.category}</Text>
        </View>
      ) : null}

      {/* Date */}
      <Text style={styles.metaText}>{formatDate(expense.expense_date)}</Text>

      {/* Paid by */}
      <View style={styles.metaRow}>
        <View style={styles.smallAvatar}>
          <Text style={styles.smallAvatarText}>{getInitials(expense.paid_by.slice(0, 6))}</Text>
        </View>
        <Text style={styles.metaText}>Paid by you</Text>
      </View>

      {/* Privacy indicator */}
      {expense.is_private && (
        <View style={styles.privacyRow}>
          <Lock size={14} color={colors.textSecondary.light} />
          <Text style={styles.privacyText}>Private</Text>
        </View>
      )}

      {/* Split breakdown */}
      {expense.expense_splits.length > 0 && (
        <View style={styles.splitSection}>
          <Text style={styles.sectionLabel}>Split</Text>
          {expense.expense_splits.map((split) => (
            <View key={split.id} style={styles.splitRow}>
              <View style={styles.smallAvatar}>
                <Text style={styles.smallAvatarText}>{getInitials(split.user_id.slice(0, 6))}</Text>
              </View>
              <Text style={styles.splitUserId}>{split.user_id.slice(0, 8)}…</Text>
              <Text style={styles.splitAmount}>{formatAmount(split.amount_cents)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Receipt thumbnail */}
      {expense.receipt_url && !editMode && (
        <Pressable onPress={() => setReceiptFullView(true)} style={styles.receiptThumb}>
          <Image
            source={{ uri: expense.receipt_url }}
            style={styles.receiptImage}
            resizeMode="cover"
          />
          <Text style={styles.receiptLabel}>View Receipt</Text>
        </Pressable>
      )}

      {/* Edit mode save/cancel */}
      {editMode && (
        <View style={styles.editActions}>
          <Pressable
            style={[styles.actionButton, styles.saveButton]}
            onPress={handleSave}
            disabled={editSaving}
          >
            {editSaving ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </Pressable>
          <Pressable
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() => setEditMode(false)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
        </View>
      )}

      {/* Dispute input */}
      {disputeMode && (
        <View style={styles.disputeSection}>
          <Text style={styles.sectionLabel}>What's wrong with this expense?</Text>
          <TextInput
            style={styles.disputeInput}
            value={disputeNote}
            onChangeText={setDisputeNote}
            placeholder="Add a note for your housemates..."
            placeholderTextColor={colors.textSecondary.light}
            multiline
            numberOfLines={3}
          />
          <View style={styles.editActions}>
            <Pressable
              style={[styles.actionButton, styles.saveButton]}
              onPress={handleSubmitDispute}
              disabled={disputeSaving || !disputeNote.trim()}
            >
              {disputeSaving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>Flag Dispute</Text>
              )}
            </Pressable>
            <Pressable
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => { setDisputeMode(false); setDisputeNote(''); }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );

  // ---------- History Tab ----------
  const renderHistoryTab = () => (
    <View style={styles.tabContent}>
      {historyLoading ? (
        <ActivityIndicator color={colors.accent.light} style={styles.loader} />
      ) : (
        <>
          {/* Version rows */}
          {versions.length === 0 ? (
            <Text style={styles.emptyText}>No history available.</Text>
          ) : (
            versions.map((v) => (
              <ChangeHistoryRow
                key={v.id}
                version={v}
                memberName={v.changed_by.slice(0, 8)}
              />
            ))
          )}

          {/* Disputes section */}
          {disputes.length > 0 && (
            <View style={styles.disputesSection}>
              <Text style={styles.sectionLabel}>Disputes</Text>
              {disputes.map((dispute) => (
                <View key={dispute.id} style={styles.disputeCard}>
                  <View style={styles.disputeHeader}>
                    <DisputeBadge status={dispute.status} />
                    <Text style={styles.metaText}>
                      Opened by {dispute.opened_by.slice(0, 8)}…
                    </Text>
                  </View>

                  {/* Comments */}
                  {dispute.comments.map((comment) => (
                    <View key={comment.id} style={styles.commentRow}>
                      <View style={styles.smallAvatar}>
                        <Text style={styles.smallAvatarText}>
                          {getInitials(comment.user_id.slice(0, 6))}
                        </Text>
                      </View>
                      <View style={styles.commentContent}>
                        <Text style={styles.commentBody}>{comment.body}</Text>
                        <Text style={styles.metaText}>
                          {new Date(comment.created_at).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                  ))}

                  {/* Add comment */}
                  {dispute.status === 'open' && (
                    <View style={styles.addCommentRow}>
                      <TextInput
                        style={styles.commentInput}
                        value={commentText}
                        onChangeText={setCommentText}
                        placeholder="Add a comment..."
                        placeholderTextColor={colors.textSecondary.light}
                      />
                      <Pressable
                        style={styles.commentSendBtn}
                        onPress={() => handleAddComment(dispute.id)}
                        disabled={!commentText.trim()}
                      >
                        <Text style={styles.commentSendText}>Send</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </View>
  );

  return (
    <>
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        onClose={onClose}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.sheetHandle}
      >
        {/* Tab bar */}
        <View style={styles.tabBar}>
          {(['Details', 'History'] as ActiveTab[]).map((tab) => (
            <Pressable
              key={tab}
              style={[styles.tabItem, activeTab === tab && styles.activeTabItem]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabLabel, activeTab === tab && styles.activeTabLabel]}>
                {tab}
              </Text>
            </Pressable>
          ))}
        </View>

        <BottomSheetScrollView contentContainerStyle={styles.scrollContent}>
          {activeTab === 'Details' ? renderDetailsTab() : renderHistoryTab()}
        </BottomSheetScrollView>

        {/* Bottom action buttons */}
        {!editMode && !disputeMode && (
          <View style={styles.bottomActions}>
            {isCreator && (
              <>
                <Pressable
                  style={[styles.actionButton, styles.editButtonStyle]}
                  onPress={() => setEditMode(true)}
                >
                  <Text style={styles.editButtonText}>Edit</Text>
                </Pressable>
                <Pressable
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  )}
                </Pressable>
              </>
            )}
            <Pressable
              style={[styles.actionButton, styles.disputeButton]}
              onPress={() => { setDisputeMode(true); setActiveTab('Details'); }}
            >
              <Text style={styles.disputeButtonText}>Dispute</Text>
            </Pressable>
          </View>
        )}
      </BottomSheet>

      {/* Full-size receipt viewer */}
      <Modal visible={receiptFullView} transparent animationType="fade">
        <Pressable style={styles.receiptModal} onPress={() => setReceiptFullView(false)}>
          {expense.receipt_url && (
            <Image
              source={{ uri: expense.receipt_url }}
              style={styles.receiptFull}
              resizeMode="contain"
            />
          )}
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: colors.dominant.light,
  },
  sheetHandle: {
    backgroundColor: colors.border.light,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    paddingHorizontal: 16,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabItem: {
    borderBottomColor: colors.accent.light,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary.light,
    lineHeight: 20,
  },
  activeTabLabel: {
    color: colors.accent.light,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  tabContent: {
    padding: 16,
    gap: 12,
  },
  amount: {
    fontSize: 28,
    fontWeight: '600',
    color: colors.accent.light,
    lineHeight: 34,
  },
  editAmountInput: {
    fontSize: 28,
    fontWeight: '600',
    color: colors.textPrimary.light,
    lineHeight: 34,
    borderWidth: 2,
    borderColor: colors.accent.light,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  description: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary.light,
    lineHeight: 26,
  },
  editInput: {
    fontSize: 16,
    color: colors.textPrimary.light,
    lineHeight: 24,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.secondary.light,
    minHeight: 44,
  },
  categoryChip: {
    backgroundColor: colors.secondary.light,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary.light,
  },
  metaText: {
    fontSize: 14,
    color: colors.textSecondary.light,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  privacyText: {
    fontSize: 14,
    color: colors.textSecondary.light,
    lineHeight: 20,
  },
  splitSection: {
    gap: 8,
    paddingTop: 4,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary.light,
    lineHeight: 20,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  splitUserId: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary.light,
    lineHeight: 20,
  },
  splitAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary.light,
    lineHeight: 20,
  },
  smallAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accent.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallAvatarText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  receiptThumb: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.light,
    alignItems: 'center',
    gap: 8,
    padding: 8,
    backgroundColor: colors.secondary.light,
  },
  receiptImage: {
    width: '100%',
    height: 120,
    borderRadius: 6,
  },
  receiptLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent.light,
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  saveButton: {
    backgroundColor: colors.accent.light,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 20,
  },
  cancelButton: {
    backgroundColor: colors.secondary.light,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary.light,
    lineHeight: 20,
  },
  disputeSection: {
    gap: 8,
    padding: 12,
    backgroundColor: colors.secondary.light,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  disputeInput: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.textPrimary.light,
    lineHeight: 24,
    minHeight: 80,
    backgroundColor: colors.dominant.light,
    textAlignVertical: 'top',
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 8,
    padding: 16,
    backgroundColor: colors.dominant.light,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  editButtonStyle: {
    backgroundColor: colors.secondary.light,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary.light,
    lineHeight: 20,
  },
  deleteButton: {
    backgroundColor: colors.destructive.light,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 20,
  },
  disputeButton: {
    backgroundColor: colors.secondary.light,
    borderWidth: 1,
    borderColor: colors.sandbox.light,
  },
  disputeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.sandbox.light,
    lineHeight: 20,
  },
  loader: {
    marginTop: 32,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary.light,
    textAlign: 'center',
    marginTop: 24,
  },
  disputesSection: {
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  disputeCard: {
    backgroundColor: colors.secondary.light,
    borderRadius: 8,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  disputeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  commentContent: {
    flex: 1,
    gap: 2,
  },
  commentBody: {
    fontSize: 14,
    color: colors.textPrimary.light,
    lineHeight: 20,
  },
  addCommentRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.textPrimary.light,
    backgroundColor: colors.dominant.light,
    minHeight: 44,
  },
  commentSendBtn: {
    backgroundColor: colors.accent.light,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentSendText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  receiptModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  receiptFull: {
    width: '90%',
    height: '80%',
  },
});
