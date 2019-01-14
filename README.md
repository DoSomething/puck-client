# @dosomething/puck-client

This is a client for sending data to [Puck](https://github.com/DoSomething/puck) over a websocket. It integrates with your applications Redux store and React components to provide a clean way to send custom metrics. Additionally, it standardizes and automatically injects data that is useful across any event. Checkout the [Puck data model](https://github.com/DoSomething/puck/blob/master/documentation/spec.md) to see what that looks like.

## Installation

```sh
$ npm install @dosomething/puck-client
```

## Usage with React

Add the Puck Provider to your React+Redux application.

```js
import React from 'react';
import { Provider } from 'react-redux';
import { PuckProvider } from '@dosomething/puck-client';
import initializeStore from './initializeStore';
import historyInit from './historyInit';
import report from './error-handler';

const App = () => (
  const store = initializeStore();
  const history = historyInit();

  const getUser = () => (
    store.getState().user.id
  );
  
  const isAuthenticated = () => (
    store.getState().user.isAuthenticated
  );

  return (
    <Provider store={store}>
      <PuckProvider
        source="your-app-name"
        puckUrl={window.ENV.PUCK_URL}
        getUser={getUser}
        isAuthenticated={isAuthenticated}
        history={history}
        onError={report}
      >
        {/* ... */}
      </PuckProvider>
    </Provider>
  );
);

export default App;
```

Next, connect your components to Puck using the `PuckConnector`.

```js
import { connect } from 'react-redux';
import { PuckConnector } from '@dosomething/puck-client';
import Feed from './Feed';
import { clickedViewMore } from '../../actions';

const mapStateToProps = state => ({
  campaignId: state.campaign.legacyCampaignId,
});

const actionCreators = {
  clickedViewMore
};

export default connect(mapStateToProps, actionCreators)(PuckConnector(Feed));
```

From here you can either wrap a Redux action with `trackEvent`,

```js
const mapPropsToEvents = trackEvent => ({
  clickedViewMore: props => (
    trackEvent('feed clicked view more', { campaignId: props.campaignId })
  ),
});

export default connect(mapStateToProps, actionCreators)(PuckConnector(Feed, mapPropsToEvents));
```

Or you can manually decide when to call `trackEvent` by using the function the props.

```js
import React from 'react';

const Feed = ({ trackEvent, campaignId }) => {
  trackEvent('feed render', { campaignId });

  return (
    <div className="feed" />
  );
};

export default Feed;
```

## Usage without React

When using Puck without React, add the Puck Engine to your app.

```js
import { Engine } from '@dosomething/puck-client';
import report from './error-reporter'

let puck = null;

function onReady() {
  puck = new Engine({
    source: "your-app-name",
    puckUrl: window.env.PUCK_URL,
    getUser: () => window.state.userId,
    onError: report,
  });
}

function onClick() {
  puck.trackEvent('on click', { button: true });
}
```

All of the same params from the React version can be used here, but some have been intentionally omitted (eg: `history`) because they are irrelevant for non-React Router based applications.

When using the pure Puck engine, simply call `trackEvent` on it.

## React Waypoints

Use Waypoints to track when users scroll past a certain point.

```js
import { PuckWaypoint } from '@dosomething/puck-client';

const Example = () => (
  <div className="container" style={{ height: '1000px' }}>
    <PuckWaypoint name="half-way-point" />
  </div>
);
```

Available props:
**name**: Required. Name of the waypoint.
**onlyOnce**: Optional (Defaults  true). Waypoint only emits an event one time.
**waypointData**: Optional (Defaults null). Additional data to track on the waypoint event.
