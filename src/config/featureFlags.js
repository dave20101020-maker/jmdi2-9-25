import { featureFlags } from "./featureRuntime";

// Compatibility shim: some parts of the app expect FEATURE_FLAGS.
// Backed by the runtime-resolved flags in featureRuntime.
export const FEATURE_FLAGS = featureFlags;
