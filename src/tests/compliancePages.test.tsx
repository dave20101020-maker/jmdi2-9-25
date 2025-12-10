import { render, screen } from "@testing-library/react";
import Privacy from "@/pages/compliance/Privacy";
import Terms from "@/pages/compliance/Terms";
import TrustCenter from "@/pages/compliance/TrustCenter";

describe("Compliance pages", () => {
  const cases = [
    {
      name: "Privacy",
      Component: Privacy,
      heading: /Privacy Policy/i,
      keyCopy: /wellbeing data private/i,
    },
    {
      name: "Terms",
      Component: Terms,
      heading: /Terms of Service/i,
      keyCopy: /non-diagnostic/i,
    },
    {
      name: "Trust Center",
      Component: TrustCenter,
      heading: /Trust Center/i,
      keyCopy: /Security, privacy, and safety controls/i,
    },
  ];

  it.each(cases)(
    "renders the %s page with compliance messaging",
    ({ Component, heading, keyCopy }) => {
      render(<Component />);

      expect(screen.getAllByText(/Compliance/i).length).toBeGreaterThan(0);
      expect(
        screen.getByRole("heading", { name: heading })
      ).toBeInTheDocument();
      expect(screen.getByText(keyCopy)).toBeInTheDocument();
    }
  );
});
