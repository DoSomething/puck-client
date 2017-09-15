import React from 'react';
import PropTypes from 'prop-types';

function Connector(WrappedComponent) {
  return class Wrapper extends React.Component {
    static contextTypes: {
      trackEvent: PropTypes.func,
    };

    constructor(props, context) {
      super(props);

      this.trackEvent = context.trackEvent;
    }

    render() {
      return (
        <WrappedComponent {...this.props} trackEvent={this.trackEvent} />
      );
    }
  };
}

export default Connector;
