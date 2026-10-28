<script setup>
import DefaultTheme from 'vitepress/theme'
import { onMounted, onUnmounted, ref } from 'vue'
import PagefindSearch from './PagefindSearch.vue'

const dialog = ref()
const images = ref([])
const selected = ref(0)
const showFiling = ref(false)
let opener
function openImage(event) {
  const link = event.target.closest('a[data-lightbox]')
  if (!link || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
  event.preventDefault()
  opener = link
  images.value = [...document.querySelectorAll('a[data-lightbox]')].map(a => ({ src: a.href, title: a.dataset.title || '应用截图' }))
  selected.value = [...document.querySelectorAll('a[data-lightbox]')].indexOf(link)
  dialog.value.showModal()
}
function step(delta) {
  selected.value = (selected.value + delta + images.value.length) % images.value.length
}
function close() { dialog.value.close() }
function restoreFocus() { opener?.focus() }
onMounted(() => {
  document.addEventListener('click', openImage)
  showFiling.value = location.hostname === 'relaxpic.cn'
  const google = location.hostname === 'relaxpic.com' ? 'G-KFPZCE8PNJ' : location.hostname === 'relaxpic.cn' ? 'G-VT87SWQH6J' : ''
  const baidu = location.hostname === 'relaxpic.com' ? 'd634ee0f7f6659dd48063c8435062ff9' : location.hostname === 'relaxpic.cn' ? '891604474066f0cd7981a2e4dee55224' : ''
  if (google) {
    window.dataLayer = window.dataLayer || []
    window.gtag = function () { window.dataLayer.push(arguments) }
    window.gtag('js', new Date())
    window.gtag('config', google)
    const script = document.createElement('script')
    script.async = true
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + google
    document.head.appendChild(script)
  }
  if (baidu) {
    window._hmt = window._hmt || []
    const script = document.createElement('script')
    script.async = true
    script.src = 'https://hm.baidu.com/hm.js?' + baidu
    document.head.appendChild(script)
  }
  // shortcut: retire all workers on this dedicated site, revisit if a new offline mode is added.
  if ('serviceWorker' in navigator) navigator.serviceWorker.getRegistrations().then(registrations => Promise.all(registrations.map(r => r.unregister()))).catch(console.error)
})
onUnmounted(() => document.removeEventListener('click', openImage))
</script>

<template>
  <DefaultTheme.Layout>
    <template #nav-bar-content-before><PagefindSearch modal /></template>
    <template #doc-after><p v-if="showFiling" class="filing"><a href="https://beian.miit.gov.cn" target="_blank" rel="noopener">渝ICP备2024048199号-1</a></p></template>
  </DefaultTheme.Layout>
  <dialog ref="dialog" aria-label="应用截图预览" @close="restoreFocus" @click="event => { if (event.target === dialog) close() }" @keydown.left.prevent="step(-1)" @keydown.right.prevent="step(1)">
    <div class="image-controls">
      <button type="button" @click="step(-1)">上一张</button>
      <span aria-live="polite">{{ selected + 1 }} / {{ images.length }}</span>
      <button type="button" @click="step(1)">下一张</button>
      <button type="button" autofocus @click="close">关闭</button>
    </div>
    <img v-if="images.length" :src="images[selected].src" :alt="images[selected].title" />
  </dialog>
</template>
