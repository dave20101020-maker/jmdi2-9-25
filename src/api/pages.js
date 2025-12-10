import { get } from "./client";

export const getPageManifest = async () => {
  return get("/api/pages/manifest");
};
