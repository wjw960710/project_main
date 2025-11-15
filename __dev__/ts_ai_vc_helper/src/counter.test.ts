import { describe, it, expect } from 'vitest';
import { Counter } from './counter';

describe('Counter', () => {
  it('should initialize with an initial value of 0 if no value is provided', () => {
    const counter = new Counter();
    expect(counter.getCount()).toBe(0);
  });

  it('should initialize with the provided initial value', () => {
    const counter = new Counter(5);
    expect(counter.getCount()).toBe(5);
  });

  it('should increment the count by 1', () => {
    const counter = new Counter(2);
    counter.increment();
    expect(counter.getCount()).toBe(3);
  });

  it('should decrement the count by 1', () => {
    const counter = new Counter(10);
    counter.decrement();
    expect(counter.getCount()).toBe(9);
  });

  it('should handle multiple increments and decrements correctly', () => {
    const counter = new Counter();
    counter.increment();
    counter.increment();
    counter.decrement();
    counter.increment();
    expect(counter.getCount()).toBe(2);
  });

  it('should throw an error if the initial value is not a number', () => {
    // @ts-expect-error
    expect(() => new Counter('a')).toThrow('Initial value must be a number');
  });
});
