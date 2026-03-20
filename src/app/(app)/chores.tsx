import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TextInput,
  FlatList,
  Pressable,
} from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/theme';

interface Chore {
  id: string;
  title: string;
  done: boolean;
  createdAt: string;
}

export default function ChoresScreen() {
  const [chores, setChores] = useState<Chore[]>([]);
  const [title, setTitle] = useState('');

  function handleAddChore() {
    if (!title.trim()) {
      return;
    }

    const newChore: Chore = {
      id: Date.now().toString(),
      title: title.trim(),
      done: false,
      createdAt: new Date().toLocaleDateString(),
    };

    setChores((prev) => [...prev, newChore]);
    setTitle('');
  }

  function handleToggleChore(id: string) {
    setChores((prev) =>
      prev.map((chore) =>
        chore.id === id ? { ...chore, done: !chore.done } : chore
      )
    );
  }

  function renderChore({ item }: { item: Chore }) {
    return (
      <Pressable
        style={styles.choreItem}
        onPress={() => handleToggleChore(item.id)}
      >
        {/* Done indicator circle */}
        <View style={[styles.circle, item.done && styles.circleDone]}>
          {item.done ? <View style={styles.circleInner} /> : null}
        </View>

        {/* Chore title */}
        <View style={styles.choreContent}>
          <Text
            style={[
              styles.choreTitle,
              item.done && styles.choreTitleDone,
            ]}
          >
            {item.title}
          </Text>
          <Text style={styles.choreDate}>Added {item.createdAt}</Text>
        </View>
      </Pressable>
    );
  }

  const pendingCount = chores.filter((c) => !c.done).length;
  const doneCount = chores.filter((c) => c.done).length;

  return (
    <SafeAreaView style={[styles.flex, styles.bgDominant]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>My Chores</Text>

        {chores.length > 0 ? (
          <View style={styles.statsRow}>
            <Text style={styles.statText}>
              {pendingCount} pending · {doneCount} done
            </Text>
          </View>
        ) : null}

        {/* Add Chore Section */}
        <Card style={styles.addCard}>
          <Text style={styles.sectionTitle}>Add Chore</Text>
          <TextInput
            style={styles.input}
            placeholder="What needs to be done?"
            placeholderTextColor={colors.textSecondary.light}
            value={title}
            onChangeText={setTitle}
            returnKeyType="done"
            onSubmitEditing={handleAddChore}
          />
          <View style={styles.buttonWrapper}>
            <Button
              label="Add Chore"
              variant="primary"
              onPress={handleAddChore}
            />
          </View>
        </Card>

        {/* Chore List */}
        {chores.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>
              No chores yet. Add your first personal chore above.
            </Text>
          </Card>
        ) : (
          <Card style={styles.listCard}>
            <Text style={styles.sectionTitle}>Chore List</Text>
            <FlatList
              data={chores}
              keyExtractor={(item) => item.id}
              renderItem={renderChore}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </Card>
        )}

        <Text style={styles.phaseNote}>
          Phase 1 — personal task tracking with local state. Shared chore tracking with assignments comes in Phase 3.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  bgDominant: {
    backgroundColor: colors.dominant.light,
  },
  container: {
    padding: 16,
    gap: 12,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary.light,
    lineHeight: 30,
    marginBottom: 4,
  },
  statsRow: {
    marginTop: -4,
    marginBottom: 4,
  },
  statText: {
    fontSize: 14,
    color: colors.textSecondary.light,
    lineHeight: 20,
  },
  addCard: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary.light,
    lineHeight: 24,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.textPrimary.light,
    backgroundColor: colors.dominant.light,
  },
  buttonWrapper: {
    marginTop: 4,
  },
  listCard: {
    gap: 8,
  },
  choreItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  circle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border.light,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleDone: {
    borderColor: colors.success.light,
    backgroundColor: colors.success.light,
  },
  circleInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  choreContent: {
    flex: 1,
  },
  choreTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary.light,
    lineHeight: 22,
  },
  choreTitleDone: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary.light,
  },
  choreDate: {
    fontSize: 13,
    color: colors.textSecondary.light,
    lineHeight: 18,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border.light,
    marginVertical: 4,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textSecondary.light,
    lineHeight: 22,
    textAlign: 'center',
  },
  phaseNote: {
    fontSize: 12,
    color: colors.textSecondary.light,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 8,
  },
});
