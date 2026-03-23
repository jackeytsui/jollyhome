import fs from 'fs';
import path from 'path';
import { CALENDAR_SOURCE_ICON_MAP } from '@/hooks/useCalendar';

function read(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('calendar UI contracts', () => {
  it('defines the exact activity type options for the event editor', () => {
    const source = read('src/components/calendar/EventEditorSheet.tsx');

    expect(source).toContain("{ label: 'Event', value: 'event' }");
    expect(source).toContain("{ label: 'Meal', value: 'meal' }");
    expect(source).toContain("{ label: 'Maintenance', value: 'maintenance' }");
    expect(source).toContain("{ label: 'Guest', value: 'guest' }");
    expect(source).toContain("{ label: 'Quiet hours', value: 'quiet_hours' }");
    expect(source).toContain("{ label: 'Booking', value: 'booking' }");
  });

  it('defines RSVP chips with not going mapped to not_going', () => {
    const source = read('src/components/calendar/RSVPChips.tsx');

    expect(source).toContain("{ label: 'Going', value: 'going' }");
    expect(source).toContain("{ label: 'Maybe', value: 'maybe' }");
    expect(source).toContain("{ label: 'Not going', value: 'not_going' }");
  });

  it('defines direct attendance actions for Home tonight and Away tonight', () => {
    const source = read('src/components/calendar/AttendanceToggleStrip.tsx');

    expect(source).toContain("{ label: 'Home tonight', status: 'home_tonight' }");
    expect(source).toContain("{ label: 'Away tonight', status: 'away_tonight' }");
    expect(source).toContain('await upsertAttendance(date, status, note);');
  });

  it('keeps explicit icon mapping for every projected calendar type and legend order', () => {
    const legendSource = read('src/components/calendar/CalendarLegend.tsx');

    expect(CALENDAR_SOURCE_ICON_MAP).toMatchObject({
      event: 'calendar',
      chore: 'sparkles',
      attendance: 'home',
      meal: 'utensils',
      maintenance: 'wrench',
      guest: 'users',
      'quiet-hours': 'moon',
      booking: 'key',
    });

    expect(legendSource).toContain("'event',");
    expect(legendSource).toContain("'chore',");
    expect(legendSource).toContain("'attendance',");
    expect(legendSource).toContain("'meal',");
    expect(legendSource).toContain("'maintenance',");
    expect(legendSource).toContain("'guest',");
    expect(legendSource).toContain("'quiet-hours',");
    expect(legendSource).toContain("'booking',");
  });
});
