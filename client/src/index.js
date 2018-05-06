import React from 'react'
import ReactDOM from 'react-dom'
import 'semantic-ui-css/semantic.min.css'
import App from './App'
import './index.css'
import { NotificationsProvider } from './providers/NotificationsProvider'
import { PlatformProvider } from './providers/PlatformProvider'
import { SessionProvider } from './providers/SessionProvider'
import { MapSizeProvider } from './providers/MapSizeProvider'

import registerServiceWorker from './registerServiceWorker'

ReactDOM.render(
  <PlatformProvider>
    <NotificationsProvider>
      <SessionProvider>
        <MapSizeProvider>
          <App />
        </MapSizeProvider>
      </SessionProvider>
    </NotificationsProvider>
  </PlatformProvider>,
  document.getElementById('root')
)

registerServiceWorker()
