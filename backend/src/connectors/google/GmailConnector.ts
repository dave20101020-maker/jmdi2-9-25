export async function syncGmail(_params: { userId: string }) {
  return { ok: false, message: "Gmail connector not implemented" };
}

export default {
  syncGmail,
};
