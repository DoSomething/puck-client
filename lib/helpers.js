const THIRTY_MINUTES = 30 * 60 * 1000;

/**
 * Generate a random unique id based on the current time
 * and a random 5 digit number.
 *
 * @return {String}
 */
export function generateUniqueId() {
  const salt = Math.floor(Math.random() * 90000) + 10000;
  return `${Date.now()}${salt}`;
}

/**
 * Check if the given timestamp has exceeded its lifespan of max time.
 *
 * @param  {int}  timestamp    Timestamp in milliseconds.
 * @return {Boolean}
 */
export function isSessionExpired(timestamp) {
  return (parseInt(timestamp, 10) + THIRTY_MINUTES) < Date.now();
}
