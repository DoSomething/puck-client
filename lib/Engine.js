/* global localStorage, location, document, window */

import io from 'socket.io-client';

import {
  generateUniqueId, isSessionExpired,
  getUrlData, getBrowserSize,
  DEVICE_ID, LANDING_TIMESTAMP,
  HEARTBEAT_TIMESTAMP, SESSION_REFERRER,
  FRAME_GET, FRAME_PUSH,
} from './helpers';

const SPEC_VERSION = '1.0.0';

class Engine {
  constructor(params) {
    const { source, puckUrl, getUser, history } = params;

    this.source = source || null;
    this.getUser = getUser || (() => null);
    this.history = history || { listen: () => {} };

    this.puckUrl = puckUrl;
    this.socket = puckUrl ? io(puckUrl) : null;

    this.iframe = null;
    this.setupIframe();
    this.sendFrameMessage = this.sendFrameMessage.bind(this);
    this.pushStateToFrame = this.pushStateToFrame.bind(this);

    // TODO: Sync this.
    this.deviceId = localStorage.getItem(DEVICE_ID) || generateUniqueId();
    localStorage.setItem(DEVICE_ID, this.deviceId);

    // TODO: Sync these.
    this.landingTimestamp = localStorage.getItem(LANDING_TIMESTAMP);
    this.heartbeat = localStorage.getItem(HEARTBEAT_TIMESTAMP);
    this.referrer = localStorage.getItem(SESSION_REFERRER);

    // TODO: This should trigger a sync/needs refactor.
    this.writeStateToStorage = this.writeStateToStorage.bind(this);
    this.writeStateToStorage();

    this.pageViewListener = this.pageViewListener.bind(this);
    this.pageViewListener();

    this.difference = this.difference.bind(this);
    this.trackEvent = this.trackEvent.bind(this);
    this.dispatchEvent = this.dispatchEvent.bind(this);
  }

  /**
   * If not production, log an event to the console.
   *
   * @param  {String} name
   * @param  {Object} event
   */
  static logEvent(name, event) {
    if (process.env.NODE_ENV !== 'production') {
      console.groupCollapsed('%c Puck: %c Event "%s"',
        'background-color: #2ECC40; display: block; font-weight: bold; line-height: 1.5;',
        'background-color: transparent; font-weight: normal; line-height: 1.5;',
        name,
      );
      console.log(event);
      console.groupEnd();
    }
  }

  /**
   * Write all state vars to local storage.
   */
  writeStateToStorage() {
    const { landingTimestamp, heartbeat, referrer } = this;

    localStorage.setItem(LANDING_TIMESTAMP, landingTimestamp);
    localStorage.setItem(HEARTBEAT_TIMESTAMP, heartbeat);
    localStorage.setItem(SESSION_REFERRER, referrer);
  }

  /**
   * Setup iframe for cross-domain chatter.
   */
  setupIframe() {
    const { puckUrl } = this;

    if (! puckUrl) {
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = puckUrl;

    document.body.appendChild(iframe);
    this.iframe = iframe;
  }

  /**
   * Send a message to the attached iframe.
   *
   * @param  {Object} message
   * @param  {Function} callback
   */
  sendFrameMessage(message, callback) {
    function onRecieve(response) {
      window.removeEventListener('message', onRecieve);
      callback(response);
    }

    window.addEventListener('message', onRecieve);
    this.iframe.postMessage(JSON.stringify(message), '*');
  }

  /**
   * Push the current state to the frame.
   */
  pushStateToFrame() {
    const {
      landingTimestamp, heartbeat,
      referrer, deviceId,
    } = this;

    this.sendFrameMessage({
      type: FRAME_PUSH,
      data: {
        pairs: [
          { key: LANDING_TIMESTAMP, value: landingTimestamp },
          { key: HEARTBEAT_TIMESTAMP, value: heartbeat },
          { key: SESSION_REFERRER, value: referrer },
          { key: DEVICE_ID, value: deviceId },
        ],
      },
    });
  }

  /**
   * Track when a page view occurs.
   */
  pageViewListener() {
    this.trackEvent('view');
  }

  /**
   * Update the landing timestamp, heartbeat
   * and dispatch any relevant events.
   */
  updatingLandingTimestamp() {
    const { landingTimestamp, heartbeat } = this;

    if (! landingTimestamp || ! heartbeat || isSessionExpired(heartbeat)) {
      this.landingTimestamp = Date.now();
      this.referrer = document.referrer;
      this.dispatchEvent('visit');
    }

    this.heartbeat = Date.now();
    this.writeStateToStorage();
  }

  /**
   * Find the differences between this instances data
   * and the data parameter and apply priority rules.
   * Updates the data of this instance based on the diff.
   *
   * @param  {Object} newData
   */
  difference(newData) {
    if (! newData) {
      return;
    }

    if (newData[DEVICE_ID] && newData[DEVICE_ID] !== this.deviceId) {
      this.deviceId = newData[DEVICE_ID];
    }

    if (newData[LANDING_TIMESTAMP] && newData[LANDING_TIMESTAMP] > this.landingTimestamp) {
      this.landingTimestamp = newData[LANDING_TIMESTAMP];
      this.referrer = newData[SESSION_REFERRER];
    }

    if (newData[HEARTBEAT_TIMESTAMP] && newData[HEARTBEAT_TIMESTAMP] > this.heartbeat) {
      this.heartbeat = newData[HEARTBEAT_TIMESTAMP];
    }
  }

  /**
   * Track a custom event that occured.
   *
   * @param  {String} name
   * @param  {Object|null} [data=null]
   */
  trackEvent(name, data = null) {
    this.updatingLandingTimestamp();

    const frameMessage = {
      type: FRAME_GET,
      data: {
        keys: [
          LANDING_TIMESTAMP, DEVICE_ID,
          SESSION_REFERRER, HEARTBEAT_TIMESTAMP,
        ],
      },
    };

    this.sendFrameMessage(frameMessage, (response) => {
      this.difference(JSON.parse(response));
      this.writeStateToStorage();
      this.pushStateToFrame();
      this.dispatchEvent(name, data);
    });
  }

  /**
   * Construct a fully formed event object and dispatch
   * it to Puck.
   *
   * @param  {String} name
   * @param  {Object|null} [data=null]
   */
  dispatchEvent(name, data = null) {
    const {
      source, socket, getUser, deviceId,
      landingTimestamp, referrer,
    } = this;

    const sessionId = `${deviceId}${landingTimestamp}`;

    const event = {
      event: {
        name,
        source,
      },
      meta: {
        timestamp: Date.now(),
        version: SPEC_VERSION,
      },
      user: {
        northstarId: getUser(),
        deviceId,
      },
      page: {
        landingTimestamp,
        sessionId,
        ...getUrlData(location.href),
        referrer: {
          ...getUrlData(referrer),
        },
      },
      browser: {
        size: getBrowserSize(),
      },
      data,
    };

    Engine.logEvent(name, event);

    if (socket) {
      socket.emit('analytics', event);
    }
  }
}

export default Engine;
