import React from 'react';
import PropTypes from 'prop-types';
import Engine from './Engine';

class Provider extends React.Component {
  constructor(props) {
    super(props);

    this.engine = new Engine(props);
  }

  getChildContext() {
    return {
      trackEvent: this.engine.trackEvent,
    };
  }

  render() {
    return React.Children.only(this.props.children);
  }
}

Provider.childContextTypes = {
  trackEvent: PropTypes.func,
};

/* eslint-disable react/no-unused-prop-types */
Provider.propTypes = {
  children: PropTypes.node,
  source: PropTypes.string,
  puckUrl: PropTypes.string,
  getUser: PropTypes.func,
  onError: PropTypes.func,
  history: PropTypes.shape({
    listen: PropTypes.func,
  }),
};
/* eslint-enable react/no-unused-prop-types */

Provider.defaultProps = {
  puckUrl: null,
  children: null,
  history: null,
  source: null,
  getUser: null,
  onError: null,
};

export default Provider;
