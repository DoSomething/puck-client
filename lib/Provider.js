import React from 'react';
import PropTypes from 'prop-types';
import io from 'socket.io-client';
import { generateUniqueId } from './helpers';

const DEVICE_ID = 'DEVICE_ID';
const SPEC_VERSION = '1.0.0';

class Provider extends React.Component {
  constructor(props) {
    super(props);

    const { puckUrl } = props;
    this.socket = puckUrl ? io(puckUrl) : null;

    this.trackEvent = this.trackEvent.bind(this);

    this.deviceId = localStorage.getItem(DEVICE_ID) || generateUniqueId();
    localStorage.setItem(DEVICE_ID, this.deviceId);
  }

  getChildContext() {
    return {
      trackEvent: this.trackEvent,
    };
  }

  trackEvent(name, data = null) {
    const { source, mapStoreToUser } = this.props;

    const event = {
      event: {
        name,
        source,
      },
      meta: {
        timestamp: new Date(),
        version: SPEC_VERSION,
      },
      user: {
        northstarId: mapStoreToUser(),
        deviceId: this.deviceId,
      },
      page: {
        // TODO
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
