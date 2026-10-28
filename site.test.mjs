import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import { createHash } from 'node:crypto'
import config from './.vitepress/config.mjs'

test('每页生成正文、中文元信息和 canonical，并进入 sitemap', () => {
  const sitemap = fs.readFileSync('.vitepress/dist/sitemap.xml', 'utf8')
  for (const { link } of config.themeConfig.sidebar) {
    const page = link === '/' ? 'index' : link.slice(1)
    const html = fs.readFileSync(`.vitepress/dist/${page}.html`, 'utf8')
    assert.match(html, /lang="zh-CN"/)
    assert.match(html, /<main[\s>]/)
    assert.match(html, /<meta name="description" content="[^"]+"/)
    assert(html.includes(`rel="canonical" href="https://relaxpic.com${link}"`), page)
    assert(sitemap.includes(`https://relaxpic.com${link}</loc>`), page)
    for (const [, href] of html.matchAll(/<a\b[^>]*href="(\/[^"#?]*)(?:#[^"]*)?"/g)) {
      if (href.startsWith('//')) continue
      const target = '.vitepress/dist' + decodeURIComponent(href)
      assert(fs.existsSync(target) || fs.existsSync(target + '.html'), `${page}: ${href}`)
    }
  }
})

test('首页截图恰好八张，顺序为 1–8，放大与缩略图一致', () => {
  const html = fs.readFileSync('.vitepress/dist/index.html', 'utf8')
  const images = [...html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*data-lightbox="[^"]+"[^>]*>\s*<img\b[^>]*src="([^"]+)"/g)]
  assert.equal(images.length, 8)
  images.forEach(([, href, src], i) => {
    assert.equal(src, `/static/images/preview/${i + 1}.webp`)
    assert.equal(href, src)
    assert(fs.existsSync('.vitepress/dist' + src))
  })
})

test('旧 hash 地址在首次打开及页面内变化时跳转，拒绝站外地址', () => {
  const code = config.head.find(([tag]) => tag === 'script')[2]
  for (const [hash, expected] of [['#/download', '/download'], ['#/readme.md', '/'], ['#/test_download', '/test_download'], ['#//example.com', undefined], ['#普通标题', undefined]]) {
    let result
    let listener
    const location = { hash, replace: value => { result = value } }
    vm.runInNewContext(code, { location, URLSearchParams, window: { addEventListener: (_, fn) => { listener = fn } } })
    assert.equal(result, expected)
    location.hash = '#/qaa'
    listener()
    assert.equal(result, '/qaa')
  }
})

test('安卓 App 的旧链接在两个域名都保持页面及帮助定位', () => {
  const code = config.head.find(([tag]) => tag === 'script')[2]
  const paths = ['user-guide', 'qaa', 'agreement', 'privacy-policy', 'open-source-license', 'download', 'test_download']
  const cases = paths.map(path => [`/#/${path}`, `/${path}`])
  cases.push(
    ['//#/changelog', '/changelog'],
    ['/#/qaa?id=_20-安卓文件夹的目录前缀是什么意思？', '/qaa#_20-安卓文件夹的目录前缀是什么意思'],
    ['/#/user-guide?id=_1-webdav备份', '/user-guide#_1-webdav备份'],
    ['/#/qaa?id=_1-如何打开隐私空间', '/qaa#_1-如何打开隐私空间'],
    ['/#/qaa?id=_4-慢图浏览在后台运行的时候，文件传输助手或者webdav备份无法使用。', '/qaa#_6-慢图浏览在后台运行的时候-文件传输助手或者无法使用。']
  )
  for (const host of ['relaxpic.cn', 'relaxpic.com']) {
    for (const [oldPath, expected] of cases) {
      const input = new URL(`https://${host}${oldPath}`)
      const entry = fs.readFileSync(`.vitepress/dist/${input.pathname === '/' ? 'index' : '404'}.html`, 'utf8')
      assert(entry.includes('hashchange'), '首页和 404 都必须包含兼容脚本')
      let target
      vm.runInNewContext(code, {
        URLSearchParams,
        location: { hash: input.hash, replace: value => { target = new URL(value, input) } },
        window: { addEventListener() {} }
      })
      assert.equal(target.origin, input.origin)
      assert.equal(decodeURI(target.pathname + target.hash), expected)
      const page = fs.readFileSync(`.vitepress/dist${target.pathname}.html`, 'utf8')
      if (target.hash) assert(page.includes(`id="${decodeURIComponent(target.hash.slice(1))}"`), oldPath)
    }
  }
})

test('App 运行资源 segmentit.js 保持原路径与固定校验值', () => {
  const asset = fs.readFileSync('.vitepress/dist/static/js/segmentit.js')
  assert.equal(createHash('sha256').update(asset).digest('hex'), '7638d730acaf3d318b886822c0c0e66399977c7ece0370fb41b790776506a155')
})

test('Pagefind 构建中文索引，仅收录文档正文并提供明确标题', () => {
  const entry = JSON.parse(fs.readFileSync('.vitepress/dist/pagefind/pagefind-entry.json', 'utf8'))
  assert.equal(entry.languages['zh-cn'].page_count, config.themeConfig.sidebar.length)
  assert(fs.existsSync('.vitepress/dist/pagefind/pagefind.js'))
  for (const { link } of config.themeConfig.sidebar) {
    const page = link === '/' ? 'index' : link.slice(1)
    const html = fs.readFileSync(`.vitepress/dist/${page}.html`, 'utf8')
    assert.equal(html.includes(' data-pagefind-body'), page !== 'search', page)
    assert.match(html, /data-pagefind-meta="title" content="[^"]+"/)
  }
  assert(!fs.readFileSync('.vitepress/dist/404.html', 'utf8').includes(' data-pagefind-body'))
})
