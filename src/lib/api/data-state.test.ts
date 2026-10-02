import { describe, it, expect } from "vitest";
import { dataState, type DataQuery } from "./data-state";

const query: DataQuery = {
  data: { count: 2 },
  error: null,
  isPending: false,
  isFetching: false,
  refetch: () => undefined,
};
describe("data state precedence", () => {
  it("separates empty responses, failures, mock provenance and background loading", () => {
    expect(dataState(query, false)).toBe("success");
    expect(dataState(query, true)).toBe("mock");
    expect(dataState({ ...query, data: null }, true)).toBe("empty");
    expect(
      dataState({ ...query, data: { data: [], meta: { total: 0 } } }, true),
    ).toBe("empty");
    expect(
      dataState({ ...query, data: { summary: { submissionCount: 0 } } }, true),
    ).toBe("empty");
    expect(dataState(query, true, true)).toBe("empty");
    expect(dataState({ ...query, error: new Error() }, true, true)).toBe(
      "error",
    );
    expect(
      dataState({ ...query, error: new Error(), isFetching: true }, true),
    ).toBe("loading");
  });
});
