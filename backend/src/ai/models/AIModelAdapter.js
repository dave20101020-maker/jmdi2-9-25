export class AIModelAdapter {
  constructor() {
    this.supportsFunctions = false;
  }

  async generateMessage() {
    throw new Error("generateMessage not implemented");
  }
}

export default AIModelAdapter;
