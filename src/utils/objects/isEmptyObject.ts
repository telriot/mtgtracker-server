/**
 * Test whether an object is empty
 * @param obj the object to test
 * @returns true if empty
 */
const isEmptyObject = (obj: Record<string, unknown> | never[]) : boolean => Object.keys(obj).length === 0
export default isEmptyObject