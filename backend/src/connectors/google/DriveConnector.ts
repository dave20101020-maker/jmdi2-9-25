export async function syncDrive(_params: { userId: string }) {
  return { ok: false, message: "Drive connector not implemented" };
}

export default {
  syncDrive,
};
