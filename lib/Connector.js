import React from 'react';
import PropTypes from 'prop-types';

const errorMissingProvider = (name) => {
  console.error(`Puck is unable to track ${name}. Is the Puck Provider missing?`);
};

function Connector(WrappedComponent, mapPropsToEvents = null) {
  class PuckWrapper extends React.Component {
    constructor(props, context) {
      super(props);

      this.trackEvent = context.trackEvent || errorMissingProvider;
    }

    render() {
      let props = {
        ...this.props,
        trackEvent: this.trackEvent,
      };

      if (mapPropsToEvents && typeof mapPropsToEvents === 'function') {
        const mappedPropsToEvents = mapPropsToEvents(this.trackEvent);
        const overrides = {};

        Object.keys(mappedPropsToEvents).forEach(key => {
          const actualFunction = props[key].__PUCK_ACTUAL__ || props[key];

          const fixedWithTracking = (...args) => {
            mappedPropsToEvents[key](this.props);
            actualFunction(args);
          };

          fixedWithTracking.__PUCK_ACTUAL__ = actualFunction;
          overrides[key] = fixedWithTracking;
        });

        props = {
          ...props,
          ...overrides,
        };
      }

      return (
        <WrappedComponent {...props} />
      );
    }
  }

  PuckWrapper.contextTypes = {
    trackEvent: PropTypes.func,
  };

  return PuckWrapper;
}

export default Connector;
