/**
 * Medical (records + vaccinations) query keys (§21). Everything is animal-scoped
 * so one prefix invalidates an animal's whole medical state.
 *
 *   medicalKeys.forAnimal(animalId)              → ['medical', animalId]
 *   medicalKeys.records(animalId)                → ['medical', animalId, 'records']
 *   medicalKeys.recordList(animalId, scope)      → ['medical', animalId, 'records', 'list', { scope }]
 *   medicalKeys.record(animalId, recordId)       → ['medical', animalId, 'records', 'detail', recordId]
 *   medicalKeys.vaccinations(animalId)           → ['medical', animalId, 'vaccinations']
 *   medicalKeys.vaccinationList(animalId, scope) → ['medical', animalId, 'vaccinations', 'list', { scope }]
 *   medicalKeys.vaccination(animalId, id)        → ['medical', animalId, 'vaccinations', 'detail', id]
 *
 * `scope` is `clinic:<organizationId>` or `owner` — the clinic and owner lists
 * hit different endpoints but return the same DTO.
 */
export const medicalKeys = {
  all: ['medical'] as const,
  forAnimal: (animalId: string) => [...medicalKeys.all, animalId] as const,

  records: (animalId: string) => [...medicalKeys.forAnimal(animalId), 'records'] as const,
  recordList: (animalId: string, scope: string) =>
    [...medicalKeys.records(animalId), 'list', { scope }] as const,
  record: (animalId: string, recordId: string) =>
    [...medicalKeys.records(animalId), 'detail', recordId] as const,

  vaccinations: (animalId: string) => [...medicalKeys.forAnimal(animalId), 'vaccinations'] as const,
  vaccinationList: (animalId: string, scope: string) =>
    [...medicalKeys.vaccinations(animalId), 'list', { scope }] as const,
  vaccination: (animalId: string, vaccinationId: string) =>
    [...medicalKeys.vaccinations(animalId), 'detail', vaccinationId] as const,

  /** Reminders (legacy pet_reminders) — `scope` as for records. */
  reminders: (animalId: string) => [...medicalKeys.forAnimal(animalId), 'reminders'] as const,
  reminderList: (animalId: string, scope: string) =>
    [...medicalKeys.reminders(animalId), 'list', { scope }] as const,
  reminder: (animalId: string, reminderId: string) =>
    [...medicalKeys.reminders(animalId), 'detail', reminderId] as const,

  /** Clinic-wide lists / settings — keyed by the clinic, not an animal. */
  clinic: (organizationId: string) => [...medicalKeys.all, 'clinic', organizationId] as const,
  clinicVaccinations: (organizationId: string, status: string) =>
    [...medicalKeys.clinic(organizationId), 'vaccinations', { status }] as const,
  clinicReminders: (organizationId: string, status: string) =>
    [...medicalKeys.clinic(organizationId), 'reminders', { status }] as const,
  templates: (organizationId: string) =>
    [...medicalKeys.clinic(organizationId), 'templates'] as const,

  /** Composed medical-history timeline (Phase 12). */
  timeline: (animalId: string) => [...medicalKeys.forAnimal(animalId), 'timeline'] as const,
  timelineList: (animalId: string, scope: string, type: string) =>
    [...medicalKeys.timeline(animalId), 'list', { scope, type }] as const,
};

/** `clinic:<orgId>` / `owner` — used both as a query-key discriminator and label. */
export function medicalScopeTag(organizationId?: string): string {
  return organizationId ? `clinic:${organizationId}` : 'owner';
}
