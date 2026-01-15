export async function connectSamsung() {
  return {
    ok: false,
    status: "disconnected",
    message: "Samsung connector not implemented",
  };
}

export async function syncSamsung() {
  return {
    ok: false,
    status: "disconnected",
    message: "Samsung connector not implemented",
  };
}

export function getSamsungStatus() {
  return { ok: true, status: "disconnected", message: "Coming soon" };
}

export default {
  connectSamsung,
  syncSamsung,
  getSamsungStatus,
};
