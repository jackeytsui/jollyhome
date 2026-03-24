export type MaintenancePriority = 'low' | 'medium' | 'high' | 'urgent';
export type MaintenanceStatus = 'open' | 'claimed' | 'in_progress' | 'resolved';
export type MaintenanceUpdateType = 'note' | 'status' | 'photo' | 'cost' | 'appointment' | 'general';

export interface MaintenanceRequest {
  id: string;
  householdId: string;
  createdBy: string;
  title: string;
  description: string | null;
  area: string | null;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  claimedBy: string | null;
  claimedAt: string | null;
  resolvedAt: string | null;
  costCents: number | null;
  latestNote: string | null;
  latestPhotoPath: string | null;
  appointmentEventId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceUpdate {
  id: string;
  householdId: string;
  requestId: string;
  createdBy: string | null;
  updateType: MaintenanceUpdateType;
  note: string | null;
  photoPath: string | null;
  fromStatus: MaintenanceStatus | null;
  toStatus: MaintenanceStatus | null;
  costCents: number | null;
  appointmentEventId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface MaintenanceRequestInput {
  title: string;
  description?: string | null;
  area?: string | null;
  priority?: MaintenancePriority;
  note?: string | null;
  photoPath?: string | null;
  costCents?: number | null;
}

export interface MaintenanceStatusUpdateInput {
  status: MaintenanceStatus;
  note?: string | null;
  photoPath?: string | null;
  costCents?: number | null;
}

export interface MaintenanceAppointmentInput {
  title?: string;
  description?: string | null;
  location?: string | null;
  startsAt: string;
  endsAt: string;
  ownerMemberUserIds?: string[];
}

export interface MaintenanceHistoryFilters {
  query: string;
  priority: MaintenancePriority | 'all';
  status: MaintenanceStatus | 'all';
  area: string | 'all';
}

export interface MaintenanceExpensePrefillInput {
  request: MaintenanceRequest;
  memberUserIds: string[];
  paidBy: string;
  householdId: string;
}
