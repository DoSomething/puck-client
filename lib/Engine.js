/* global localStorage, location, document */

import io from 'socket.io-client';

import {
  generateUniqueId, isSessionExpired,
  getUrlData, getBrowserSize,
} from './helpers';

const DEVICE_ID = 'DEVICE_ID';
const LANDING_TIMESTAMP = 'LANDING_TIMESTAMP';
const HEARTBEAT_TIMESTAMP = 'HEARTBEAT_TIMESTAMP';
const SESSION_REFERRER = 'SESSION_REFERRER';
const SPEC_VERSION = '1.4.0';

class Engine {
  constructor(params) {
    const { source, puckUrl, getUser, isAuthenticated, history, onError } = params;

    this.source = source || null;
    this.getUser = getUser || (() => null);
    this.isAuthenticated = isAuthenticated || (() => null);
    this.history = history || { listen: () => {} };
    this.onError = onError || (() => null);

    this.puckUrl = puckUrl;
    this.socket = puckUrl ? io(puckUrl) : null;

    this.initErrorListener = this.initErrorListener.bind(this);
    this.initErrorListener();

    this.deviceId = localStorage.getItem(DEVICE_ID) || generateUniqueId();
    localStorage.setItem(DEVICE_ID, this.deviceId);

    this.landingTimestamp = localStorage.getItem(LANDING_TIMESTAMP);
    this.heartbeat = localStorage.getItem(HEARTBEAT_TIMESTAMP);
    this.referrer = localStorage.getItem(SESSION_REFERRER);

    this.writeStateToStorage = this.writeStateToStorage.bind(this);
    this.writeStateToStorage();

    this.pageViewListener = this.pageViewListener.bind(this);
    this.pageViewListener();

    this.trackEvent = this.trackEvent.bind(this);
    this.dispatchEvent = this.dispatchEvent.bind(this);

    this.ping = this.ping.bind(this);
    this.ping();
  }

  /**
   * Listen for socket emitted errors and invoke the onError parameter function.
   */
  initErrorListener() {
    if (! this.socket) {
      return;
    }

    this.socket.on('error', (error) => {
      this.onError('error', error);
    });

    this.socket.on('connect_error', (error) => {
      this.onError('connect_error', error);
    });
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
   * TODO: Implement sync logic.
   */
  writeStateToStorage() {
    const { landingTimestamp, heartbeat, referrer } = this;

    localStorage.setItem(LANDING_TIMESTAMP, landingTimestamp);
    localStorage.setItem(HEARTBEAT_TIMESTAMP, heartbeat);
    localStorage.setItem(SESSION_REFERRER, referrer);
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
   * Track a custom event that occured.
   *
   * @param  {String} name
   * @param  {Object|null} [data=null]
   */
  trackEvent(name, data = null) {
    this.updatingLandingTimestamp();
    this.dispatchEvent(name, data);
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
      source, getUser, isAuthenticated,
      deviceId, landingTimestamp, referrer,
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
        ip: null,
        northstarId: getUser(),
        isAuthenticated: isAuthenticated(),
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

    if (this.socket) {
      this.socket.emit('analytics', event);
    }
  }

  /**
   * Keep the HTTP connection "alive" for Heroku.
   */
  ping() {
    if (! this.socket) {
      return;
    }

    setInterval(() => {
      this.socket.emit('ping');
    }, 10 * 1000);
  }
}

export default Engine;
