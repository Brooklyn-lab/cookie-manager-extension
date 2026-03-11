import { createChromeMock, resetChromeMock } from "./chrome-mock.js";

beforeEach(() => {
  global.chrome = createChromeMock();
  resetChromeMock();
});

afterEach(() => {
  vi.restoreAllMocks();
});
