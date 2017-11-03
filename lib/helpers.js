/* global URL, window, screen, document */

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

/**
 * Transform params from the given query string to an object.
 * eg: (?test=1, #test=1, test=1)
 *
 * @see https://stackoverflow.com/a/3855394/2129670
 * @param  {String} query
 * @return {Object}
 */
export function getParamsFromQuery(query) {
  if (! query) {
    return {};
  }

  return (/^[?#]/.test(query) ? query.slice(1) : query)
    .split('&')
    .reduce((params, param) => {
      const newParams = { ...params };
      const [key, value] = param.split('=');
      newParams[key] = value ? decodeURIComponent(value.replace(/\+/g, ' ')) : '';

      return newParams;
    }, {});
}

/**
 * Get information about the given url.
 *
 * @param  {String} url
 * @return {Object}
 */
export function getUrlData(url) {
  let urlObj = {};

  try {
    urlObj = new URL(url);
  } catch (exception) {
    return {};
  }

  const { href, host, pathname, search } = urlObj;

  return {
    href,
    host,
    path: pathname,
    query: getParamsFromQuery(search),
  };
}

/**
 * Get a string identifying the browser size.
 *
 * @return {String}
 */
export function getBrowserSize() {
  const screenWidth = Math.min(window.innerWidth, screen.availWidth);

  const breakpoints = [
    {
      name: 'small',
      test: width => (width <= 759),
    },
    {
      name: 'medium',
      test: width => (width >= 760 && width <= 959),
    },
    {
      name: 'large',
      test: width => (width >= 960),
    },
  ];

  return breakpoints.find(breakpoint => breakpoint.test(screenWidth)).name;
}

/**
 * Get the Puck cookie from the cookies on this page.
 *
 * @return {String|null}
 */
export function getPuckCookie() {
  const cookie = document.cookie
    .split(';')
    .map(item => item.trim())
    .find(item => item.startsWith('_puck'));

  if (! cookie) {
    return null;
  }

  return cookie.replace('_puck', '');
}
