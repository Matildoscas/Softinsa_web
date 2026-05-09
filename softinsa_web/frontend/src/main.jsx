import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx' // <--- ESTA LINHA É A QUE FALTA OU ESTÁ ERRADA
import 'bootstrap/dist/css/bootstrap.min.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)