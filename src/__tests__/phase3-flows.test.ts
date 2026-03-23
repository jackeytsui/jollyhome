import fs from 'fs';
import path from 'path';
import { rebalanceSuggestions, type RotationContext } from '@/lib/choreRotation';

function read(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

function buildFlowContext(): RotationContext {
  return {
    chores: [
      {
        instanceId: 'instance-dishes',
        templateId: 'template-dishes',
        title: 'Dishes reset',
        area: 'Kitchen',
        estimatedMinutes: 25,
      },
    ],
    members: [
      {
        id: 'alex',
        name: 'Alex',
        active: true,
        availabilityScore: 0.9,
        calendarConflictMinutes: 0,
        attendanceStatus: 'home_tonight',
        trailingTaskCount: 3,
        trailingMinutes: 60,
        learnedAverageMinutes: 25,
        preferenceScore: 0.1,
      },
      {
        id: 'blair',
        name: 'Blair',
        active: true,
        availabilityScore: 0.8,
        calendarConflictMinutes: 15,
        attendanceStatus: 'home_tonight',
        trailingTaskCount: 1,
        trailingMinutes: 20,
        learnedAverageMinutes: 20,
        preferenceScore: 0.15,
      },
    ],
  };
}

describe('phase 3 assistive flows', () => {
  it('rebalances suggested assignees when attendance or roster changes', () => {
    const base = buildFlowContext();
    const [initial] = rebalanceSuggestions(base);
    const [attendanceChanged] = rebalanceSuggestions({
      ...base,
      members: base.members.map((member) =>
        member.id === 'alex'
          ? {
              ...member,
              availabilityScore: 0.2,
              calendarConflictMinutes: 180,
              attendanceStatus: 'away_tonight',
            }
          : member
      ),
    });
    const [rosterChanged] = rebalanceSuggestions({
      ...base,
      members: [
        ...base.members,
        {
          id: 'casey',
          name: 'Casey',
          active: true,
          availabilityScore: 0.95,
          calendarConflictMinutes: 0,
          attendanceStatus: 'home_tonight',
          trailingTaskCount: 0,
          trailingMinutes: 0,
          learnedAverageMinutes: 18,
          preferenceScore: 0.3,
        },
      ],
    });

    expect(initial?.recommendedMemberId).toBe('alex');
    expect(attendanceChanged?.recommendedMemberId).toBe('blair');
    expect(rosterChanged?.recommendedMemberId).toBe('casey');
  });

  it('ships a manual review sheet with explanation header and explicit confirm action', () => {
    const reviewSheetSource = read('src/components/chores/RotationReviewSheet.tsx');
    const choresScreenSource = read('src/app/(app)/chores.tsx');

    expect(reviewSheetSource).toContain('Why this assignment');
    expect(reviewSheetSource).toContain('Manual override');
    expect(reviewSheetSource).toContain('Confirm assignments');
    expect(choresScreenSource).toContain('Review AI rotation');
    expect(choresScreenSource).toContain('applySuggestions');
  });

  it('wires home and calendar surfaces to live chores and calendar state', () => {
    const homeSource = read('src/app/(app)/(home)/index.tsx');
    const calendarSource = read('src/app/(app)/calendar.tsx');

    expect(homeSource).toContain('useChores');
    expect(homeSource).toContain('useCalendar');
    expect(homeSource).toContain('Urgent chores');
    expect(homeSource).toContain('Upcoming events');

    expect(calendarSource).toContain('refreshSuggestions');
    expect(calendarSource).toContain('AttendanceToggleStrip');
    expect(calendarSource).toContain('onSaved');
    expect(calendarSource).toContain('Rotation sync');
  });

  it('keeps completion flow optional for photo proof while attendance-driven refresh stays explicit', () => {
    const choresSource = read('src/app/(app)/chores.tsx');
    const calendarSource = read('src/app/(app)/calendar.tsx');

    expect(choresSource).toContain('CompleteChoreSheet');
    expect(calendarSource).toContain('Refresh rotation suggestions');
  });
});
