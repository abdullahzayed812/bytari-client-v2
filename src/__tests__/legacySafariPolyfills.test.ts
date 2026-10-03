/**
 * The web-only legacy-Safari shims (`src/polyfills/legacySafari.web.js`):
 * simulate a browser that lacks the APIs, load the file, and check each shim.
 */
const g = globalThis as unknown as Record<string, unknown>;
type Saved = { target: object; key: string; desc: PropertyDescriptor | undefined };

const TARGETS: [object, string][] = [
  [Array.prototype, 'at'],
  [Array.prototype, 'findLast'],
  [Array.prototype, 'findLastIndex'],
  [Object, 'hasOwn'],
  [Promise, 'allSettled'],
  [String.prototype, 'replaceAll'],
  [globalThis, 'structuredClone'],
  [globalThis, 'requestIdleCallback'],
  [globalThis, 'cancelIdleCallback'],
];

describe('legacy Safari web polyfills', () => {
  const saved: Saved[] = [];

  beforeAll(() => {
    for (const [target, key] of TARGETS) {
      saved.push({ target, key, desc: Object.getOwnPropertyDescriptor(target, key) });
      delete (target as Record<string, unknown>)[key];
    }
    jest.isolateModules(() => {
      require('../polyfills/legacySafari.web.js');
    });
  });

  afterAll(() => {
    for (const { target, key, desc } of saved) {
      delete (target as Record<string, unknown>)[key];
      if (desc) Object.defineProperty(target, key, desc);
    }
  });

  it('adds the array / object / string helpers', () => {
    const a = [1, 2, 3, 4] as unknown as {
      at(i: number): number | undefined;
      findLast(f: (n: number) => boolean): number | undefined;
      findLastIndex(f: (n: number) => boolean): number;
    };
    expect(a.at(-1)).toBe(4);
    expect(a.at(9)).toBeUndefined();
    expect(a.findLast((n) => n % 2 === 1)).toBe(3);
    expect(a.findLastIndex((n) => n > 10)).toBe(-1);
    const O = Object as unknown as { hasOwn(o: object, k: string): boolean };
    expect(O.hasOwn({ x: 1 }, 'x')).toBe(true);
    expect(O.hasOwn({}, 'toString')).toBe(false);
    expect(
      ('a-b-c' as unknown as { replaceAll(a: string, b: string): string }).replaceAll('-', '+'),
    ).toBe('a+b+c');
  });

  it('adds structuredClone, Promise.allSettled and requestIdleCallback', async () => {
    const src = { a: [1, { b: new Date(0) }], m: new Map([['k', { v: 1 }]]) };
    const clone = (g.structuredClone as (v: unknown) => typeof src)(src);
    expect(clone).toEqual(src);
    expect(clone.a).not.toBe(src.a);
    expect(clone.m.get('k')).not.toBe(src.m.get('k'));

    const settled = await (
      Promise as unknown as { allSettled(p: unknown[]): Promise<unknown[]> }
    ).allSettled([Promise.resolve(1), Promise.reject(new Error('x'))]);
    expect(settled).toEqual([
      { status: 'fulfilled', value: 1 },
      { status: 'rejected', reason: expect.any(Error) },
    ]);

    await new Promise<void>((resolve) =>
      (g.requestIdleCallback as (cb: (d: { timeRemaining(): number }) => void) => number)((d) => {
        expect(d.timeRemaining()).toBeGreaterThanOrEqual(0);
        resolve();
      }),
    );
  });
});
