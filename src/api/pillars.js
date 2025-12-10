import { get } from "./client";

export const getPillarDefinitions = async () => {
  return get("/api/pillars/definitions");
};
