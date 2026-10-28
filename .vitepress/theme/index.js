import DefaultTheme from 'vitepress/theme'
import Layout from './Layout.vue'
import CopyButton from './CopyButton.vue'
import PagefindSearch from './PagefindSearch.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component('CopyButton', CopyButton)
    app.component('PagefindSearch', PagefindSearch)
  }
}
