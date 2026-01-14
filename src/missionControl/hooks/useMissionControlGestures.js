import { useSwipeable } from "react-swipeable";

export function useMissionControlGestures({ onUp, onDown, onLeft, onRight }) {
  return useSwipeable({
    onSwipedUp: onUp,
    onSwipedDown: onDown,
    onSwipedLeft: onLeft,
    onSwipedRight: onRight,
    trackMouse: false,
    preventScrollOnSwipe: true,
  });
}
