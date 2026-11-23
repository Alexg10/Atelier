import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router'
import './style.css'

// createApp crée une instance d'application à partir du composant racine,
// puis mount() la rend dans <div id="app"> (équivalent de createRoot(el).render(<App />)).
const app = createApp(App)

// Un plugin s'installe sur l'application avant le mount : le routeur devient disponible dans tous les composants.
app.use(router)
// Pinia est aussi un plugin : il crée le conteneur qui héberge l'unique instance de chaque store.
app.use(createPinia())

app.mount('#app')
