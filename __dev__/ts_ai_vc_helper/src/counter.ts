export class Counter {
  private count: number;

  constructor(initialValue: number = 0) {
    if (typeof initialValue !== 'number') {
      throw new Error('Initial value must be a number');
    }
    this.count = initialValue;
  }

  increment(): void {
    this.count++;
  }

  decrement(): void {
    this.count--;
  }

  getCount(): number {
    return this.count;
  }
}