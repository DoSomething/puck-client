import React from 'react';
import PropTypes from 'prop-types';
import Observer from '@researchgate/react-intersection-observer';
import 'intersection-observer'; // TODO: Only import if polyfill is needed
import Connector from './Connector';

class Waypoint extends React.Component {
  constructor(props) {
    super(props);

    this.handleIntersection = this.handleIntersection.bind(this);
  }

  handleIntersection(event, unobserve) {
    const { isIntersecting } = event;
    if (! isIntersecting) return;

    const { name, trackEvent, waypointData } = this.props;

    trackEvent('waypoint reached', {
      waypointName: name,
      waypointData,
    });

    unobserve();
  }

  render() {
    const options = {
      onChange: this.handleIntersection,
    };

    return (
      <Observer {...options}>
        <div />
      </Observer>
    );
  }
}

Waypoint.defaultProps = {
  waypointData: null,
};

Waypoint.propTypes = {
  name: PropTypes.string.isRequired,
  trackEvent: PropTypes.func.isRequired,
  waypointData: PropTypes.object, // eslint-disable-line react/forbid-prop-types
};

export default Connector(Waypoint);
