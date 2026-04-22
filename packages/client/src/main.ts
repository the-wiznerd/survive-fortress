import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './styles/styles.scss'
import App from '~client/App.vue'

const app = createApp(App)
app.use(createPinia())
app.mount('#app')