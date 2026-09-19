import '@fontsource-variable/geist/wght.css'
import '~/shared/i18n'
import './styles/index.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './App.tsx'

const container = document.getElementById('root')
if (!container) throw new Error('No root element!')

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
