/* global localStorage, location, document */

import React from 'react';
import PropTypes from 'prop-types';
import io from 'socket.io-client';
import {
  generateUniqueId, isSessionExpired,
  getUrlData, getBrowserSize,
} from './helpers';

const DEVICE_ID = 'DEVICE_ID';
const LANDING_TIMESTAMP = 'LANDING_TIMESTAMP';
const HEARTBEAT_TIMESTAMP = 'HEARTBEAT_TIMESTAMP';
const SESSION_REFERRER = 'SESSION_REFERRER';
const SPEC_VERSION = '1.0.0';

class Provider extends React.Component {
  constructor(props) {
    super(props);

    const { puckUrl } = props;
    this.socket = puckUrl ? io(puckUrl) : null;

    this.trackEvent = this.trackEvent.bind(this);
    this.dispatchEvent = this.dispatchEvent.bind(this);

    this.deviceId = localStorage.getItem(DEVICE_ID) || generateUniqueId();
    localStorage.setItem(DEVICE_ID, this.deviceId);

    // Intentionally not using state for these vars. The async nature of state
    // along with the render() rules made it the wrong choice.
    this.landingTimestamp = localStorage.getItem(LANDING_TIMESTAMP);
    this.heartbeat = localStorage.getItem(HEARTBEAT_TIMESTAMP);
    this.referrer = localStorage.getItem(SESSION_REFERRER);

    this.writeStateToStorage = this.writeStateToStorage.bind(this);
    this.writeStateToStorage();

    this.pageViewListener = this.pageViewListener.bind(this);
    this.pageViewListener();
  }

  getChildContext() {
    return {
      trackEvent: this.trackEvent,
    };
  }

  componentDidMount() {
    this.updatingLandingTimestamp();

    if (this.props.history) {
      this.props.history.listen(this.pageViewListener);
    }
  }

  pageViewListener() {
    this.trackEvent('view');
  }

  writeStateToStorage() {
    const { landingTimestamp, heartbeat, referrer } = this;

    localStorage.setItem(LANDING_TIMESTAMP, landingTimestamp);
    localStorage.setItem(HEARTBEAT_TIMESTAMP, heartbeat);
    localStorage.setItem(SESSION_REFERRER, referrer);
  }

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

  trackEvent(name, data = null) {
    this.updatingLandingTimestamp();
    this.dispatchEvent(name, data);
  }

  dispatchEvent(name, data = null) {
    const { source, getUser } = this.props;
    const { deviceId, landingTimestamp, referrer } = this;

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

    if (process.env.NODE_ENV !== 'production') {
      console.groupCollapsed('%c Puck: %c Event "%s"',
        'background-color: #2ECC40; display: block; font-weight: bold; line-height: 1.5;',
        'background-color: transparent; font-weight: normal; line-height: 1.5;',
        name,
      );
      console.log(event);
      console.groupEnd();
    }

    if (this.socket) {
      this.socket.emit('analytics', event);
    }
  }

  render() {
    return React.Children.only(this.props.children);
  }
}

Provider.childContextTypes = {
  trackEvent: PropTypes.func,
};

Provider.propTypes = {
  children: PropTypes.node,
  source: PropTypes.string.isRequired,
  puckUrl: PropTypes.string,
  getUser: PropTypes.func.isRequired,
  history: PropTypes.object.shapeOf({
    listen: PropTypes.func,
  }),
};

Provider.defaultProps = {
  puckUrl: null,
  children: null,
  history: null,
};

export default Provider;
