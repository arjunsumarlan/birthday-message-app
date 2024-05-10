/**
 * Delays the execution for a specified amount of time.
 * This function uses a Promise to pause the execution of the function without blocking the Node.js event loop.
 *
 * @param ms The number of milliseconds to delay the execution.
 * @returns A promise that resolves after the specified delay, effectively pausing the async function.
 */
export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
