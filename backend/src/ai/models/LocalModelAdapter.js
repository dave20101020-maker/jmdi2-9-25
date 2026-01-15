import { AIModelAdapter } from "./AIModelAdapter.js";

export class LocalModelAdapter extends AIModelAdapter {
  constructor() {
    super();
  }

  async generateMessage() {
    return {
      ok: false,
      error: "Local model adapter is not configured",
    };
  }
}

export default LocalModelAdapter;
