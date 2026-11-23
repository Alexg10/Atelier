import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import './style.css'

// createApp crée une instance d'application à partir du composant racine,
// puis mount() la rend dans <div id="app"> (équivalent de createRoot(el).render(<App />)).
const app = createApp(App)

// Un plugin s'installe sur l'application avant le mount : le routeur devient disponible dans tous les composants.
app.use(router)

app.mount('#app')
