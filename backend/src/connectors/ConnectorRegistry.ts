import type { Connector, ConnectorResult } from "./types";

export type ConnectorRegistryEntry = {
  id: string;
  name: string;
  handler: Connector;
};

export type ConnectorRegistryMap = Record<string, ConnectorRegistryEntry>;

const stubResult = (message: string): ConnectorResult => ({
  ok: false,
  status: "disconnected",
  message,
});

export const ConnectorRegistry: ConnectorRegistryMap = {
  google: {
    id: "google",
    name: "Google",
    handler: {
      connect: async () => stubResult("Google connector not implemented"),
      sync: async () => stubResult("Google connector not implemented"),
      getStatus: () => ({ ok: true, status: "disconnected" }),
    },
  },
  apple: {
    id: "apple",
    name: "Apple",
    handler: {
      connect: async () => stubResult("Apple connector not implemented"),
      sync: async () => stubResult("Apple connector not implemented"),
      getStatus: () => ({ ok: true, status: "disconnected" }),
    },
  },
  samsung: {
    id: "samsung",
    name: "Samsung",
    handler: {
      connect: async () => stubResult("Samsung connector not implemented"),
      sync: async () => stubResult("Samsung connector not implemented"),
      getStatus: () => ({ ok: true, status: "disconnected" }),
    },
  },
};

export const listConnectors = () =>
  Object.values(ConnectorRegistry).map(({ id, name }) => ({ id, name }));

export const getConnector = (id: string) => ConnectorRegistry[id] || null;
