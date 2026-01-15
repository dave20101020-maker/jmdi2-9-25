export async function connectApple() {
  return {
    ok: false,
    status: "disconnected",
    message: "Apple connector not implemented",
  };
}

export async function syncApple() {
  return {
    ok: false,
    status: "disconnected",
    message: "Apple connector not implemented",
  };
}

export function getAppleStatus() {
  return { ok: true, status: "disconnected", message: "Coming soon" };
}

export default {
  connectApple,
  syncApple,
  getAppleStatus,
};
