export type ConnectorStatus = "connected" | "disconnected" | "error";

export type ConnectorConnectPayload = {
  code?: string;
  accessToken?: string;
  refreshToken?: string;
};

export type ConnectorResult = {
  ok: boolean;
  status?: ConnectorStatus;
  authUrl?: string;
  message?: string;
  results?: Record<string, unknown>;
};

export interface Connector {
  connect(params: {
    userId: string;
    payload?: ConnectorConnectPayload;
  }): Promise<ConnectorResult> | ConnectorResult;
  sync(params: { userId: string }): Promise<ConnectorResult> | ConnectorResult;
  getStatus(params: { userId: string }): ConnectorResult;
}
