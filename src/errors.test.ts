import { isApiError, ApiError } from "./errors";

describe("isApiError", () => {
  it.each([
    [new ApiError("msg", 0), true],
    [new Error("msg"), false],
  ])("isApiError()", (error, expected) => {
    try {
      throw error;
    } catch (err: unknown) {
      expect(isApiError(err)).toBe(expected);
    }
  });
});
