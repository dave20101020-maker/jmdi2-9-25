export async function syncCalendar(_params: { userId: string }) {
  return { ok: false, message: "Calendar connector not implemented" };
}

export default {
  syncCalendar,
};
