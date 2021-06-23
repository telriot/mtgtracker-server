import parseScrPrice from "./parseScrPrice";

test("Returns 0 if there is no price data", () => {
    expect(parseScrPrice(null)).toBe(0);
});
test("Returns price parsed to 2 decimals", () => {
    expect(parseScrPrice("3.256")).toBe(3.26);
    expect(parseScrPrice("50.1")).toBe(50.1);
});
