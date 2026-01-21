import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// import App from './App.tsx'  // Auth version
import App from './App.demo.tsx'  // Demo version (no auth required)
// import { Amplify } from 'aws-amplify'
// import outputs from '../../amplify_outputs.json'

// Amplify.configure(outputs)  // Uncomment when backend is deployed

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
