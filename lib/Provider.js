/* global localStorage */

import React from 'react';
import PropTypes from 'prop-types';
import io from 'socket.io-client';
import { generateUniqueId, isSessionExpired } from './helpers';

const DEVICE_ID = 'DEVICE_ID';
const LANDING_TIMESTAMP = 'LANDING_TIMESTAMP';
const HEARTBEAT_TIMESTAMP = 'HEARTBEAT_TIMESTAMP';
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

    this.writeStateToStorage = this.writeStateToStorage.bind(this);
    this.writeStateToStorage();
  }

  getChildContext() {
    return {
      trackEvent: this.trackEvent,
    };
  }

  componentDidMount() {
    this.updatingLandingTimestamp();
  }

  writeStateToStorage() {
    const { landingTimestamp, heartbeat } = this;

    localStorage.setItem(LANDING_TIMESTAMP, landingTimestamp);
    localStorage.setItem(HEARTBEAT_TIMESTAMP, heartbeat);
  }

  updatingLandingTimestamp() {
    const { landingTimestamp, heartbeat } = this;
    let dispatchVisitEvent = false;

    if (! landingTimestamp || ! heartbeat || isSessionExpired(heartbeat)) {
      this.landingTimestamp = Date.now();
      dispatchVisitEvent = true;
    }

    this.heartbeat = Date.now();
    this.writeStateToStorage();

    if (dispatchVisitEvent) {
      this.dispatchEvent('visit');
    }
  }

  trackEvent(name, data = null) {
    this.updatingLandingTimestamp();
    this.dispatchEvent(name, data);
  }

  dispatchEvent(name, data = null) {
    const { source, mapStoreToUser } = this.props;
    const { deviceId, landingTimestamp } = this;

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
        northstarId: mapStoreToUser(),
        deviceId,
      },
      page: {
        landingTimestamp,
        // TODO...
      },
      data,
    };

    console.log(event); // TODO: Pretty format if dev env
    // TODO: Send over socket
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
  mapStoreToUser: PropTypes.func.isRequired,
};

Provider.defaultProps = {
  puckUrl: null,
  children: null,
};

export default Provider;
