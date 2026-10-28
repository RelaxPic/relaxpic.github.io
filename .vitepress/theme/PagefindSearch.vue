<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useData } from 'vitepress'
import '@pagefind/default-ui/css/ui.css'

const props = defineProps({ modal: Boolean })
const { lang } = useData()
const isChinese = computed(() => lang.value.startsWith('zh'))
const label = computed(() => isChinese.value ? '搜索文档' : 'Search docs')
const element = ref()
const dialog = ref()
const trigger = ref()
const error = ref('')
let ui
let disposed = false
let loading = false
async function initSearch() {
  if (ui || loading) return
  loading = true
  error.value = ''
  if (import.meta.env.DEV) {
    error.value = isChinese.value ? '开发模式不生成搜索索引，请运行 npm run build && npm run preview 后体验搜索。' : 'Build and preview the site to try search.'
    loading = false
    return
  }
  try {
    const { PagefindUI } = await import('@pagefind/default-ui')
    if (disposed) return
    ui = new PagefindUI({
      element: element.value,
      bundlePath: '/pagefind/',
      showImages: false,
      showSubResults: true,
      processResult(result) {
        result.url = result.url.replace(/\.html(?=#|$)/, '')
        for (const sub of result.sub_results || []) sub.url = sub.url.replace(/\.html(?=#|$)/, '')
        return result
      },
      translations: isChinese.value ? {
        placeholder: '搜索文档…',
        clear_search: '清除',
        load_more: '加载更多结果',
        search_label: '站内搜索',
        filters_label: '筛选',
        zero_results: '没有找到“[SEARCH_TERM]”的相关结果',
        one_result: '找到 [COUNT] 个结果',
        many_results: '找到 [COUNT] 个结果',
        results_label: '搜索结果',
        input_hint: '输入关键词后显示结果',
        loading: '正在加载',
        error_search: '搜索失败，请刷新页面重试',
        searching: '正在搜索…'
      } : {}
    })
  } catch {
    error.value = isChinese.value ? '搜索加载失败，请关闭后重试。' : 'Search failed to load. Please close and try again.'
  } finally {
    loading = false
  }
}
async function open() {
  if (dialog.value.open) return
  dialog.value.showModal()
  await initSearch()
  await nextTick()
  if (dialog.value?.open) element.value?.querySelector('input')?.focus()
}
function shortcut(event) {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    dialog.value.open ? dialog.value.close() : open()
  }
}
function navigateResults(event) {
  if (event.isComposing) return
  const links = [...element.value.querySelectorAll('a.pagefind-ui__result-link')]
  if (!links.length) return
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    const current = links.indexOf(document.activeElement)
    const index = current < 0 ? (event.key === 'ArrowDown' ? 0 : links.length - 1) : (current + (event.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length
    links[index].focus()
  } else if (event.key === 'Enter' && event.target.tagName === 'INPUT') {
    event.preventDefault()
    links[0].click()
  }
}
function selectResult(event) {
  if (event.target.closest('a.pagefind-ui__result-link') && !event.ctrlKey && !event.metaKey && !event.shiftKey && event.button === 0) dialog.value.close()
}
onMounted(() => {
  if (props.modal) document.addEventListener('keydown', shortcut)
  else initSearch()
})
onUnmounted(() => { disposed = true; document.removeEventListener('keydown', shortcut); ui?.destroy() })
</script>

<template>
  <template v-if="modal">
    <button ref="trigger" type="button" class="search-trigger" aria-haspopup="dialog" @click="open">
      <span class="vpi-search" aria-hidden="true" />
      <span>{{ label }}</span><kbd>⌘ / Ctrl K</kbd>
    </button>
    <Teleport to="body">
      <dialog ref="dialog" class="search-dialog" :aria-label="label" @click.self="dialog.close()" @close="trigger?.focus()" @keydown="navigateResults">
        <div class="search-dialog-header">
          <span>{{ label }}</span>
          <button type="button" :aria-label="isChinese ? '关闭搜索' : 'Close search'" @click="dialog.close()">Esc</button>
        </div>
        <p v-if="error" role="status">{{ error }}</p>
        <div ref="element" class="search-results" @click="selectResult" />
        <footer class="search-dialog-footer">
          <span><kbd>↑ ↓</kbd> {{ isChinese ? '切换结果' : 'Navigate' }}</span>
          <span><kbd>Enter</kbd> {{ isChinese ? '打开' : 'Open' }}</span>
          <span><kbd>Esc</kbd> {{ isChinese ? '关闭' : 'Close' }}</span>
        </footer>
      </dialog>
    </Teleport>
  </template>
  <main v-else class="search-page" aria-labelledby="search-title">
    <h1 id="search-title">{{ label }}</h1>
    <p>{{ isChinese ? '查找使用说明、常见问题和版本更新记录。' : 'Search guides, FAQs and release notes.' }}</p>
    <p v-if="error" role="status">{{ error }}</p>
    <div ref="element" />
  </main>
</template>
