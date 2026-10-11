let open = false;
const listeners = new Set<() => void>();

export function setReminderDialogOpen(next: boolean) {
  if (open === next) return;
  open = next;
  for (const listener of listeners) listener();
}

export function subscribeReminderDialog(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getReminderDialogOpen() {
  return open;
}
