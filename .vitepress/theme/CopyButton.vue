<script setup>
import { ref } from 'vue'
const props = defineProps({ text: { type: String, required: true } })
const label = ref('点击复制')
async function copy() {
  try {
    await navigator.clipboard.writeText(props.text)
    label.value = '已复制'
  } catch {
    label.value = '复制失败，请手动复制'
  }
}
</script>

<template><button type="button" class="copy-button" @click="copy">{{ label }}</button><span role="status" class="sr-only">{{ label }}</span></template>
