/**
 * Timeout for async testing
 * @param ms timeout in milliseconds
 * @returns a promise that resolves after ms milliseconds
 */
 const testTimeout = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
 export default testTimeout