import { vi, afterEach } from 'vitest';

// Mock fetch globally
global.fetch = vi.fn();

// Mock TextDecoder for SSE stream parsing
if (!global.TextDecoder) {
  global.TextDecoder = class MockTextDecoder {
    decode(value?: BufferSource, options?: { stream?: boolean }): string {
      if (!value) return '';
      return new TextDecoder().decode(value, options);
    }
  } as any;
}

// Mock TextEncoder for tests
if (!global.TextEncoder) {
  global.TextEncoder = class MockTextEncoder {
    encode(input?: string): Uint8Array {
      return new TextEncoder().encode(input);
    }
  } as any;
}

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
});
