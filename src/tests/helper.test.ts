import { delay } from "../utils/helper";

jest.useFakeTimers();

describe('delay function', () => {
  it('delays the execution by a specified amount of time', () => {
    const ms = 1000; // Delay for 1000 milliseconds
    const mockFn = jest.fn();

    delay(ms).then(mockFn); // Call the mock function after the delay

    // At this point in time, the promise should not have resolved yet, so mockFn should not have been called
    expect(mockFn).not.toHaveBeenCalled();

    // Fast-forward time by 1000ms
    jest.advanceTimersByTime(ms);

    // Now the promise should resolve and call mockFn
    return Promise.resolve().then(() => {
      expect(mockFn).toHaveBeenCalled();
    });
  });
});
