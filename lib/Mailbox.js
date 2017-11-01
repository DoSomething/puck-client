/* global localStorage, window */

import { FRAME_GET, FRAME_PUSH } from './helpers';

function get(keys) {
  return keys.reduce((acc, key) => {
    acc[key] = localStorage.getItem(key);
    return acc;
  }, {});
}

function push(pairs) {
  pairs.forEach(pair => localStorage.setItem(pair.key, pair.value));
}

/**
 * Setup a dummy mailbox.
 */
export default function mailbox() {
  window.addEventListener('message', (event) => {
    const parsed = JSON.parse(event.message);
    let data = {};

    switch (parsed.type) {
      case FRAME_GET:
        data = get(parsed.data.keys);
        break;
      case FRAME_PUSH:
        push(parsed.data.pairs);
        break;
      default: break;
    }

    event.source.postMessage(JSON.stringify(data), '*');
  });
}
