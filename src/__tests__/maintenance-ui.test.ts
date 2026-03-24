jest.mock('@/components/ui/Card', () => ({
  Card: ({ children }: { children: any }) => children,
}));
jest.mock('@/components/ui/Button', () => ({
  Button: ({ children }: { children: any }) => children ?? null,
}));

import {
  buildMaintenanceAppointmentPayload,
  filterMaintenanceHistory,
  getMaintenanceStatusActionLabel,
  getNextMaintenanceStatus,
  sortMaintenanceRequests,
} from '@/hooks/useMaintenance';
import { buildMaintenanceSummary } from '@/app/(app)/maintenance';
import type { MaintenanceRequest } from '@/types/maintenance';

describe('maintenance UI', () => {
  const requests: MaintenanceRequest[] = [
    {
      id: 'request-1',
      householdId: 'house-1',
      createdBy: 'alex',
      title: 'Replace hallway bulb',
      description: 'Bulb flickers after a few minutes',
      area: 'Hallway',
      priority: 'low',
      status: 'resolved',
      claimedBy: 'sam',
      claimedAt: '2026-03-21T10:00:00.000Z',
      resolvedAt: '2026-03-22T10:00:00.000Z',
      costCents: 899,
      latestNote: 'Finished and tested',
      latestPhotoPath: null,
      appointmentEventId: null,
      createdAt: '2026-03-20T10:00:00.000Z',
      updatedAt: '2026-03-22T10:00:00.000Z',
    },
    {
      id: 'request-2',
      householdId: 'house-1',
      createdBy: 'alex',
      title: 'Kitchen sink leak',
      description: 'Water under the cabinet',
      area: 'Kitchen',
      priority: 'urgent',
      status: 'open',
      claimedBy: null,
      claimedAt: null,
      resolvedAt: null,
      costCents: null,
      latestNote: 'Needs plumber',
      latestPhotoPath: 'maintenance/house-1/sink.jpg',
      appointmentEventId: null,
      createdAt: '2026-03-24T09:00:00.000Z',
      updatedAt: '2026-03-24T09:00:00.000Z',
    },
    {
      id: 'request-3',
      householdId: 'house-1',
      createdBy: 'alex',
      title: 'Washer inspection',
      description: 'Check drainage hose',
      area: 'Laundry',
      priority: 'high',
      status: 'claimed',
      claimedBy: 'sam',
      claimedAt: '2026-03-24T08:00:00.000Z',
      resolvedAt: null,
      costCents: null,
      latestNote: 'Vendor booked for Thursday',
      latestPhotoPath: null,
      appointmentEventId: 'event-1',
      createdAt: '2026-03-23T12:00:00.000Z',
      updatedAt: '2026-03-24T08:00:00.000Z',
    },
  ];

  it('keeps active maintenance ahead of history and prioritizes urgent work', () => {
    expect(sortMaintenanceRequests(requests).map((request) => request.id)).toEqual([
      'request-2',
      'request-3',
      'request-1',
    ]);

    expect(buildMaintenanceSummary(2, 1)).toEqual({
      activeCount: 2,
      historyCount: 1,
      headline: '2 active requests',
      supporting: '1 resolved items still searchable',
    });
  });

  it('filters maintenance history by query, area, status, and priority', () => {
    expect(
      filterMaintenanceHistory(requests, {
        query: 'vendor',
        priority: 'all',
        status: 'all',
        area: 'all',
      }).map((request) => request.id)
    ).toEqual(['request-3']);

    expect(
      filterMaintenanceHistory(requests, {
        query: '',
        priority: 'urgent',
        status: 'open',
        area: 'Kitchen',
      }).map((request) => request.id)
    ).toEqual(['request-2']);
  });

  it('builds maintenance appointments as calendar-visible maintenance activities', () => {
    expect(
      buildMaintenanceAppointmentPayload(requests[1], {
        startsAt: '2026-03-25T14:00:00.000Z',
        endsAt: '2026-03-25T15:00:00.000Z',
        location: 'Kitchen',
        ownerMemberUserIds: ['sam'],
      })
    ).toEqual(
      expect.objectContaining({
        activity_type: 'maintenance',
        title: 'Kitchen sink leak',
        location: 'Kitchen',
        starts_at: '2026-03-25T14:00:00.000Z',
        ends_at: '2026-03-25T15:00:00.000Z',
        owner_member_user_ids: ['sam'],
      })
    );
  });

  it('moves maintenance through the expected lifecycle labels', () => {
    expect(getMaintenanceStatusActionLabel('open')).toBe('Claim');
    expect(getNextMaintenanceStatus('open')).toBe('claimed');
    expect(getNextMaintenanceStatus('claimed')).toBe('in_progress');
    expect(getNextMaintenanceStatus('in_progress')).toBe('resolved');
    expect(getNextMaintenanceStatus('resolved')).toBeNull();
  });
});
