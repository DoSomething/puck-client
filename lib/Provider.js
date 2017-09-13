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
    return this.trackEvent;
  }

  trackEvent(name, data = null) {
    const event = {
      event: {
        name,
        source: this.props.source,
      },
      meta: {
        timestamp: new Date(),
        version: SPEC_VERSION,
      },
      user: {
        // TODO
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
    return this.props.children;
  }
}

Provider.childContextTypes = {
  trackEvent: PropTypes.func,
};

Provider.propTypes = {
  children: PropTypes.node,
  source: PropTypes.string.isRequired,
  puckUrl: PropTypes.string,
};

Provider.defaultProps = {
  puckUrl: null,
  children: null,
};

export default Provider;
