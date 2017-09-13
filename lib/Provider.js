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

    this.state = {
      landingTimestamp: localStorage.getItem(LANDING_TIMESTAMP),
      heartbeat: localStorage.getItem(HEARTBEAT_TIMESTAMP),
    };

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
    const { landingTimestamp, heartbeat } = this.state;

    localStorage.setItem(LANDING_TIMESTAMP, landingTimestamp);
    localStorage.setItem(HEARTBEAT_TIMESTAMP, heartbeat);
  }

  updatingLandingTimestamp(callback) {
    let { landingTimestamp, heartbeat } = this.state;
    let visitEventDispatchTime = null;

    if (! landingTimestamp || ! heartbeat || isSessionExpired(heartbeat)) {
      landingTimestamp = Date.now();
      visitEventDispatchTime = landingTimestamp;
    }

    heartbeat = Date.now();

    this.setState({ landingTimestamp, heartbeat }, () => {
      this.writeStateToStorage();

      if (visitEventDispatchTime === this.state.landingTimestamp) {
        this.dispatchEvent('visit');
      }

      if (callback) {
        callback();
      }
    });
  }

  trackEvent(name, data = null) {
    this.updatingLandingTimestamp(
      // The blank timeout ensures the 'visit' event will
      // fire before any custom events thereafter.
      () => setTimeout(
        () => this.dispatchEvent(name, data),
      ),
    );
  }

  dispatchEvent(name, data = null) {
    const { source, mapStoreToUser } = this.props;
    const { landingTimestamp } = this.state;

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
        deviceId: this.deviceId,
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
