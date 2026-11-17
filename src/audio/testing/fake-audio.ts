/**
 * A minimal stand-in for the Web Audio API so the engine, the voices and the
 * recipes can be exercised under Node. It makes no sound; it records what was
 * built and enforces the API rules that are easy to break by accident (bad
 * times, exponential ramps to zero, starting a source twice).
 */

function assertTime(time: number, what: string): void {
  if (!Number.isFinite(time) || time < 0) throw new RangeError(`${what}: bad time ${time}`);
}

export class FakeParam {
  value = 0;

  setValueAtTime(value: number, time: number): this {
    assertTime(time, 'setValueAtTime');
    if (!Number.isFinite(value)) throw new TypeError(`setValueAtTime: bad value ${value}`);
    return this;
  }

  linearRampToValueAtTime(value: number, time: number): this {
    assertTime(time, 'linearRampToValueAtTime');
    if (!Number.isFinite(value)) throw new TypeError(`linearRamp: bad value ${value}`);
    return this;
  }

  exponentialRampToValueAtTime(value: number, time: number): this {
    assertTime(time, 'exponentialRampToValueAtTime');
    if (!Number.isFinite(value) || value === 0) {
      throw new RangeError(`exponentialRamp: bad value ${value}`);
    }
    return this;
  }

  setTargetAtTime(target: number, time: number, timeConstant: number): this {
    assertTime(time, 'setTargetAtTime');
    if (!Number.isFinite(target) || timeConstant < 0) throw new RangeError('setTargetAtTime');
    this.value = target;
    return this;
  }
}

export class FakeNode {
  readonly gain = new FakeParam();
  readonly frequency = new FakeParam();
  readonly detune = new FakeParam();
  readonly Q = new FakeParam();
  readonly playbackRate = new FakeParam();
  readonly threshold = new FakeParam();
  readonly knee = new FakeParam();
  readonly ratio = new FakeParam();
  readonly attack = new FakeParam();
  readonly release = new FakeParam();
  type = '';
  loop = false;
  buffer: unknown = null;
  started = false;
  connections = 0;

  constructor(readonly kind: string) {}

  connect<T>(destination: T): T {
    this.connections += 1;
    return destination;
  }

  disconnect(): void {
    this.connections = 0;
  }

  start(when = 0): void {
    assertTime(when, 'start');
    if (this.started) throw new Error('InvalidStateError: source started twice');
    this.started = true;
  }

  stop(when = 0): void {
    assertTime(when, 'stop');
    if (!this.started) throw new Error('InvalidStateError: stop before start');
  }
}

export class FakeBuffer {
  private readonly data: Float32Array;

  constructor(
    length: number,
    readonly sampleRate: number,
  ) {
    this.data = new Float32Array(length);
  }

  get duration(): number {
    return this.data.length / this.sampleRate;
  }

  getChannelData(): Float32Array {
    return this.data;
  }
}

type FakeState = 'suspended' | 'running' | 'closed';

export class FakeAudioContext {
  static instances: FakeAudioContext[] = [];
  /** State a new context starts in ('suspended' mimics a browser before a gesture). */
  static initialState: FakeState = 'running';
  /** When false, resume() resolves but the context stays stopped. */
  static resumeWorks = true;

  /** Restore the defaults between tests. */
  static reset(): void {
    FakeAudioContext.instances = [];
    FakeAudioContext.initialState = 'running';
    FakeAudioContext.resumeWorks = true;
  }

  currentTime = 0;
  state: FakeState = FakeAudioContext.initialState;
  readonly sampleRate = 44100;
  readonly destination = new FakeNode('destination');
  readonly nodes: FakeNode[] = [];
  suspendCalls = 0;
  resumeCalls = 0;

  constructor() {
    FakeAudioContext.instances.push(this);
  }

  private node(kind: string): FakeNode {
    const created = new FakeNode(kind);
    this.nodes.push(created);
    return created;
  }

  count(kind: string): number {
    return this.nodes.filter((node) => node.kind === kind).length;
  }

  createGain(): FakeNode {
    return this.node('gain');
  }

  createOscillator(): FakeNode {
    return this.node('oscillator');
  }

  createBiquadFilter(): FakeNode {
    return this.node('filter');
  }

  createBufferSource(): FakeNode {
    return this.node('source');
  }

  createDynamicsCompressor(): FakeNode {
    return this.node('compressor');
  }

  createBuffer(_channels: number, length: number, sampleRate: number): FakeBuffer {
    return new FakeBuffer(length, sampleRate);
  }

  suspend(): Promise<void> {
    this.suspendCalls += 1;
    this.state = 'suspended';
    return Promise.resolve();
  }

  resume(): Promise<void> {
    this.resumeCalls += 1;
    if (FakeAudioContext.resumeWorks) this.state = 'running';
    return Promise.resolve();
  }
}

/** The fake, typed as the real thing for code under test. */
export function asContext(fake: FakeAudioContext): AudioContext {
  return fake as unknown as AudioContext;
}

export function asNode(fake: FakeNode): AudioNode {
  return fake as unknown as AudioNode;
}
