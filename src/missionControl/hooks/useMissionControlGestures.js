import { useMemo } from "react";
import { useSwipeable } from "react-swipeable";

export function useMissionControlGestures({ onUp, onDown, onLeft, onRight }) {
  const handlers = useMemo(
    () => ({
      onSwipedUp: onUp,
      onSwipedDown: onDown,
      onSwipedLeft: onLeft,
      onSwipedRight: onRight,
      trackMouse: false,
      preventScrollOnSwipe: true,
    }),
    [onUp, onDown, onLeft, onRight]
  );

  return useSwipeable(handlers);
}
