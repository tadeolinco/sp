import './index.css'
import 'semantic-ui-css/semantic.min.css'

import App from './App'
import { NotificationsProvider } from './providers/NotificationsProvider'
import { PlatformProvider } from './providers/PlatformProvider'
import React from 'react'
import ReactDOM from 'react-dom'
import { SessionProvider } from './providers/SessionProvider'
// import registerServiceWorker from './registerServiceWorker'

ReactDOM.render(
  <PlatformProvider>
    <NotificationsProvider>
      <SessionProvider>
        <App />
      </SessionProvider>
    </NotificationsProvider>
  </PlatformProvider>,
  document.getElementById('root')
)

// registerServiceWorker()
