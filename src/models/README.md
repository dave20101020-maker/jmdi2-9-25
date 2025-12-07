# Models Reference

The `src/models` folder centralizes every data contract shared across the React app and backend responses. Each schema exports both a Zod parser and React-safe TypeScript aliases so you can validate network data and type component props with the same source of truth.

## Usage

```ts
import { PlanSchema, type PlanProps } from "@/models";
import { useMemo } from "react";

function PlanCard(props: PlanProps) {
  return <div>{props.planTitle}</div>;
}

async function loadPlan(planId: string) {
  const response = await fetch(`/api/plans/${planId}`);
  const json = await response.json();
  return PlanSchema.parse(json);
}
```

Each schema field is documented inline so teams can quickly understand optionality and semantics. When introducing a new entity:

1. Extend the relevant schema or add a new one in this folder.
2. Export both the Zod schema and the `ReactSafe` inferred type.
3. Update the consuming components to import the shared type instead of declaring ad-hoc shapes.
