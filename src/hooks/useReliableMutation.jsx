import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

/**
 * Reliable mutation hook with automatic retry, error handling, and user feedback
 */
export function useReliableMutation({
  mutationFn,
  onSuccess,
  onError,
  successMessage = "✓ Saved successfully",
  errorMessage = "Failed to save. Retrying...",
  maxRetries = 3,
  ...options
}) {
  return useMutation({
    mutationFn,
    retry: maxRetries,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    onSuccess: (data, variables, context) => {
      toast.success(successMessage, {
        duration: 2000,
        position: "top-center"
      });
      onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      console.error("Mutation failed:", error);
      toast.error("Unable to save. Please check your connection and try again.", {
        duration: 4000,
        position: "top-center",
        action: {
          label: "Retry",
          onClick: () => mutation.mutate(variables)
        }
      });
      onError?.(error, variables, context);
    },
    ...options
  });
}