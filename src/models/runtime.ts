import { z, ZodTypeAny } from "zod";
import { ReactSafe } from "./index";

type MaybeWithData<T> = T | { data?: T } | null | undefined;

function unwrapData<T>(payload: MaybeWithData<T>): T | null {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data?: T }).data ?? null;
  }
  return (payload ?? null) as T | null;
}

export function arrayFromPayload<T>(payload: MaybeWithData<T[]>): T[] {
  const direct = Array.isArray(payload) ? payload : null;
  if (direct) {
    return direct;
  }
  const fromData = unwrapData<T[]>(payload);
  if (Array.isArray(fromData)) {
    return fromData;
  }
  return [];
}

export function objectFromPayload<T extends Record<string, unknown>>(
  payload: MaybeWithData<T>
): T | null {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    return payload as T;
  }
  const fromData = unwrapData<T>(payload);
  if (fromData && typeof fromData === "object" && !Array.isArray(fromData)) {
    return fromData as T;
  }
  return null;
}

export function parseAs<T extends ZodTypeAny>(
  schema: T,
  payload: unknown
): ReactSafe<T> {
  return schema.parse(payload) as ReactSafe<T>;
}

export function parseArrayAs<T extends ZodTypeAny>(
  schema: T,
  payload: unknown
): ReadonlyArray<ReactSafe<T>> {
  return z.array(schema).parse(payload ?? []) as ReadonlyArray<ReactSafe<T>>;
}
