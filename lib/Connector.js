import React from 'react';
import PropTypes from 'prop-types';

class Connector extends React.Component {
  constructor(props, context) {
    super(props);

    this.trackEvent = context.trackEvent;
  }

  render() {
    const { Component, mapPropsToEvents } = this.props;

    const props = {
      ...Component.props,
      trackEvent: this.trackEvent,
    };

    return (<Component.type {...props} />);
  }
}

Connector.contextTypes = {
  trackEvent: PropTypes.func,
};

Connector.propTypes = {
  Component: PropTypes.element.isRequired,
  mapPropsToEvents: PropTypes.object, // eslint-disable-line react/forbid-prop-types
};

Connector.defaultProps = {
  mapPropsToEvents: null,
};

function ConnectWrapper(mapPropsToEvents = null) {
  return function ConnectFactory(Component) {
    return (
      <Connector
        mapPropsToEvents={mapPropsToEvents}
        Component={Component}
      />
    );
  };
}

export default ConnectWrapper;
