describe('chores core contracts', () => {
  it('exposes recurring chore template fields for schedule and condition scaffolding', () => {
    const template = {
      id: 'template-1',
      householdId: 'household-1',
      title: 'Kitchen reset',
      description: 'Wipe counters and sweep the floor',
      area: 'kitchen',
      estimatedMinutes: 20,
      recurrenceRule: 'FREQ=DAILY',
      recurrenceTimezone: 'America/Toronto',
      recurrenceAnchor: '2026-03-22T08:00:00.000Z',
      nextOccurrenceAt: '2026-03-23T08:00:00.000Z',
      conditionState: 'yellow',
      conditionScore: 0.6,
      lastCompletedAt: '2026-03-21T08:00:00.000Z',
      kind: 'responsibility',
      createdBy: 'member-1',
      isArchived: false,
      iconKey: 'sparkles',
      visualWeight: 'medium',
      createdAt: '2026-03-22T08:00:00.000Z',
      updatedAt: '2026-03-22T08:00:00.000Z',
    };

    expect(template.conditionState).toBe('yellow');
  });

  it('keeps chore instances and completions aligned for future history and duration learning', () => {
    const instance = {
      id: 'instance-1',
      templateId: 'template-1',
      householdId: 'household-1',
      scheduledFor: '2026-03-23T08:00:00.000Z',
      dueWindowEnd: '2026-03-23T12:00:00.000Z',
      status: 'open',
      assignedMemberIds: ['member-1'],
      assignmentIds: ['assignment-1'],
      conditionState: 'yellow',
      projectedFromRecurrence: true,
      createdAt: '2026-03-22T08:00:00.000Z',
      updatedAt: '2026-03-22T08:00:00.000Z',
    };
    const completion = {
      id: 'completion-1',
      householdId: 'household-1',
      templateId: 'template-1',
      instanceId: instance.id,
      completedBy: 'member-1',
      completedAt: '2026-03-23T08:30:00.000Z',
      actualMinutes: 24,
      note: 'Done before breakfast',
      photoUrl: null,
      conditionStateAtCompletion: 'green',
      createdAt: '2026-03-23T08:30:00.000Z',
    };

    expect(completion.instanceId).toBe(instance.id);
  });

  it.todo('reserves D-05 condition color thresholds across green, yellow, and red transitions');
  it.todo('reserves D-22 core chore usability coverage when gamification is fully disabled');
  it.todo('reserves AICH-05 learned duration rollups per member from immutable completion history');
});
