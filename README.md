# @dosomething/puck-client

This is a client for sending data to [Puck](https://github.com/DoSomething/puck) over a websocket. It integrates with your applications Redux store and React components to provide a clean way to send custom metrics. Additionally, it standardizes and automatically injects data that is useful across any event. Checkout the [Puck data model](https://github.com/DoSomething/puck#data-model) to see what that looks like.

## Usage

#### 1. Install the puck client
```sh
$ npm install @dosomething/puck-client
```

#### 2. Add the Puck Provider to your React+Redux application.

```js
import React from 'react';
import { Provider } from 'react-redux';
import { PuckProvider } from '@dosomething/puck-client';
import initializeStore from './initializeStore';
import historyInit from './historyInit';

const App = () => (
  const store = initializeStore();
  const history = historyInit();

  const getUser = () => (
    store.getState().user.id
  );

  return (
    <Provider store={store}>
      <PuckProvider
        source="your-app-name"
        puckUrl={window.ENV.PUCK_URL}
        getUser={getUser}
        history={history}
      >
        {/* ... */}
      </PuckProvider>
    </Provider>
  );
);

export default App;
```

#### 3. Connect your components to Puck.

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

#### 4. Track events! You can either do this in your Redux container or the component itself.

```js
const mapPropsToEvents = trackEvent => ({
  clickedViewMore: props => (
    trackEvent('feed clicked view more', { campaignId: props.campaignId })
  ),
});

export default connect(mapStateToProps, actionCreators)(PuckConnector(Feed, mapPropsToEvents));
```

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
