import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

// createApp crée une instance d'application à partir du composant racine,
// puis mount() la rend dans <div id="app"> (équivalent de createRoot(el).render(<App />)).
createApp(App).mount('#app')
