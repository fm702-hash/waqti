import React from 'react'
import ReactDOM from 'react-dom/client'

// inline App to avoid src folder issue
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
