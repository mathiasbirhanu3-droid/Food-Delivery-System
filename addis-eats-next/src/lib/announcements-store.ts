import dbData from '@/data/db.json';
import type { Announcement } from '@/lib/types';
import { persistDbDev } from '@/lib/persist-dev';

const announcements = ((dbData as unknown as { announcements?: Announcement[] }).announcements ?? []).map(
  (a) => structuredClone(a),
);

/** Public read — only active announcements inside their window (if any). */
export const getActiveAnnouncements = (): Announcement[] => {
  const now = Date.now();
  return announcements.filter((a) => {
    if (!a.active) return false;
    if (a.startsAt && new Date(a.startsAt).getTime() > now) return false;
    if (a.endsAt && new Date(a.endsAt).getTime() < now) return false;
    return true;
  });
};

export const listAllAnnouncements = (): Announcement[] => announcements;

export function insertAnnouncement(a: Announcement): void {
  announcements.unshift(a);
  persistDbDev({ announcements });
}

export function setAnnouncementActive(id: string, active: boolean): void {
  const item = announcements.find((x) => x.id === id);
  if (item) {
    item.active = active;
    persistDbDev({ announcements });
  }
}

export function removeAnnouncement(id: string): void {
  const index = announcements.findIndex((x) => x.id === id);
  if (index >= 0) announcements.splice(index, 1);
  persistDbDev({ announcements });
}

export const nextAnnouncementId = (): string =>
  `ann_${Date.now().toString(36)}`;