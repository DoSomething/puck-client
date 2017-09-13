import React from 'react';
import PropTypes from 'prop-types';
import io from 'socket.io-client';

const SPEC_VERSION = '1.0.0';

class Provider extends React.Component {
  constructor(props) {
    super(props);

    const { puckUrl } = props;
    this.socket = puckUrl ? io(puckUrl) : null;

    this.trackEvent = this.trackEvent.bind(this);
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
        deviceId: false, // TODO
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
