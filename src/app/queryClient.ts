import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        const status =
          // @ts-expect-error axios/fetch error normalisation
          error?.status || error?.statusCode || error?.response?.status || null;
        if (status === 401 || status === 403) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});

export default queryClient;
