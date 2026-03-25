import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/theme';
import type { AssistantAction, AssistantMessage } from '@/types/assistant';

interface AssistantMessageCardProps {
  message: AssistantMessage;
  onActionPress: (action: AssistantAction) => Promise<void> | void;
}

export function AssistantMessageCard(props: AssistantMessageCardProps) {
  const { message, onActionPress } = props;
  const isUser = message.role === 'user';

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.assistantContainer]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        <Text style={[styles.messageText, isUser ? styles.userText : styles.assistantText]}>
          {message.text}
        </Text>

        {!isUser && message.facts?.length ? (
          <View style={styles.factBlock}>
            {message.facts.map((fact) => (
              <Text key={`${message.id}-${fact}`} style={styles.factText}>
                {fact}
              </Text>
            ))}
          </View>
        ) : null}

        {!isUser && message.actions?.length ? (
          <View style={styles.actions}>
            {message.actions.map((action) => (
              <Pressable
                key={action.id}
                onPress={() => onActionPress(action)}
                style={styles.actionChip}
              >
                <Text style={styles.actionLabel}>{action.label}</Text>
                <Text style={styles.actionDescription}>{action.description}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  assistantContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '92%',
    borderRadius: 18,
    padding: 14,
    gap: 10,
  },
  userBubble: {
    backgroundColor: colors.accent.light,
  },
  assistantBubble: {
    backgroundColor: colors.secondary.light,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
  },
  userText: {
    color: '#FFFFFF',
  },
  assistantText: {
    color: colors.textPrimary.light,
  },
  factBlock: {
    gap: 4,
  },
  factText: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary.light,
  },
  actions: {
    gap: 8,
  },
  actionChip: {
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.dominant.light,
    gap: 2,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary.light,
  },
  actionDescription: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary.light,
  },
});
