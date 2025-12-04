import { useEffect } from "react";
import "./StarfieldBackground.css";

export default function StarfieldBackground() {
  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }

    const body = document.body;
    body.classList.add("ns-starfield-enabled");
    return () => {
      body.classList.remove("ns-starfield-enabled");
    };
  }, []);

  return null;
}
