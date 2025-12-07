import { useQuery } from "@tanstack/react-query";
import { api } from "@/utils/apiClient";

const QUERY_KEY = ["subscription-status"];

const extractSubscription = (payload) => {
  if (!payload) return null;
  if (payload.subscription) return payload.subscription;
  if (payload.data?.subscription) return payload.data.subscription;
  return payload.data || payload;
};

export function useSubscriptionStatus(options = {}) {
  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const response = await api.getSubscription();
      return extractSubscription(response);
    },
    staleTime: 60 * 1000,
    ...options,
  });

  const subscription = query.data || null;
  const isTrial = subscription?.status === "trial";
  const isReferral =
    subscription?.tier === "referral" && subscription?.status === "active";
  const isPremiumActive =
    subscription?.status === "active" &&
    subscription?.tier &&
    subscription.tier !== "free";
  const hasPremiumAccess = Boolean(isTrial || isPremiumActive || isReferral);
  const isExpired = subscription?.status === "expired";
  const daysRemaining =
    typeof subscription?.daysRemaining === "number"
      ? subscription.daysRemaining
      : null;

  return {
    ...query,
    subscription,
    hasPremiumAccess,
    isTrial,
    isReferral,
    isExpired,
    daysRemaining,
  };
}

export default useSubscriptionStatus;
