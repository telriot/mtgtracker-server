import isOlderThan from "./isOlderThan";

test("Returns the right result when comparing dates", () => {
    const date1984 = new Date("Mar 12 1984");
    const date2080 = new Date("Mar 12 2080");

    const periods = ["day", "week", "month", "year"] as const;
    periods.forEach((period) => {
        const isOlder1984 = isOlderThan(date1984, period);
        const isOlder2080 = isOlderThan(date2080, period);
        expect(isOlder1984).toBe(true);
        expect(isOlder2080).toBe(false);
    });
});
