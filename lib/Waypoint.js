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

  handleIntersection(event) {
    const { isIntersecting } = event;
    if (! isIntersecting) return;

    const { name, trackEvent, waypointData } = this.props;

    trackEvent('waypoint reached', {
      waypointName: name,
      waypointData,
    });
  }

  render() {
    const { children, onlyOnce } = this.props;

    const options = {
      onChange: this.handleIntersection,
      onlyOnce,
    };

    return (
      <Observer {...options}>
        <div>
          { React.Children.only(children) }
        </div>
      </Observer>
    );
  }
}

Waypoint.defaultProps = {
  onlyOnce: true,
  waypointData: null,
};

Waypoint.propTypes = {
  children: PropTypes.node.isRequired,
  name: PropTypes.string.isRequired,
  onlyOnce: PropTypes.bool,
  trackEvent: PropTypes.func.isRequired,
  waypointData: PropTypes.object, // eslint-disable-line react/forbid-prop-types
};

export default Connector(Waypoint);
