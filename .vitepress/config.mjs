import { defineConfig } from 'vitepress'

const pages = [
  ['index', '慢图浏览', '安全、注重隐私的安卓本地相册，支持隐私空间、实况照片、HDR 和局域网文件传输。'],
  ['search', '站内搜索', '搜索慢图浏览的使用说明、常见问题和更新记录。'],
  ['changelog', '正式版本更新历史', '慢图浏览正式版的更新内容与版本记录。'],
  ['test_changelog', '测试版本更新历史', '慢图浏览测试版的更新内容与版本记录。'],
  ['download', '下载正式版应用', '下载慢图浏览安卓正式版，查看最新版本与官方下载渠道。'],
  ['test_download', '下载测试版应用', '下载慢图浏览安卓测试版，体验最新功能。'],
  ['user-guide', '使用说明', '慢图浏览的照片浏览、相册管理和应用设置说明。'],
  ['qaa', '常见问题', '慢图浏览隐私空间、文件传输和后台运行等常见问题解答。'],
  ['i18n', '国际化', '参与慢图浏览的多语言翻译。'],
  ['protect-your-privacy', '如何保护您的隐私？', '了解慢图浏览如何保护您的照片与个人隐私。'],
  ['safe-report', '安全报告', '查看慢图浏览的安全检测报告。'],
  ['agreement', '用户协议', '慢图浏览用户协议。'],
  ['privacy-policy', '隐私政策', '慢图浏览隐私政策与个人信息处理说明。'],
  ['open-source-license', '开源许可', '慢图浏览使用的开源项目及许可信息。']
]
const hostname = 'https://relaxpic.com'
const legacyRoutes = Object.fromEntries(pages.map(([slug]) => [slug, slug === 'index' ? '' : slug]))
legacyRoutes.readme = ''
legacyRoutes[''] = ''
const legacyAnchors = {
  'qaa/_20-安卓文件夹的目录前缀是什么意思？': '_20-安卓文件夹的目录前缀是什么意思',
  'qaa/_4-慢图浏览在后台运行的时候，文件传输助手或者webdav备份无法使用。': '_6-慢图浏览在后台运行的时候-文件传输助手或者无法使用。'
}
const legacyRedirect = `(()=>{const routes=${JSON.stringify(legacyRoutes)},anchors=${JSON.stringify(legacyAnchors)};function redirect(){if(!location.hash.startsWith('#/'))return;const [raw,query='']=location.hash.slice(2).split('?');const path=raw.replace(/\\.md$/,'');if(!Object.prototype.hasOwnProperty.call(routes,path))return;let id=new URLSearchParams(query).get('id');const key=path+'/'+id;if(Object.prototype.hasOwnProperty.call(anchors,key))id=anchors[key];location.replace('/'+routes[path]+(id?'#'+encodeURIComponent(id):''))}redirect();window.addEventListener('hashchange',redirect)})()`

export default defineConfig({
  lang: 'zh-CN',
  title: '慢图浏览 Relax Pic',
  description: pages[0][2],
  cleanUrls: true,
  srcExclude: ['readme.md', '_sidebar.md', '_footer.md', 'MIGRATION.md'],
  sitemap: { hostname },
  transformHtml(html) {
    return html.replace(/(<div\b[^>]*\bclass="vp-doc(?: [^"]*)?")/, '$1 data-pagefind-body')
  },
  head: [
    ['link', { rel: 'icon', href: '/icon-192.png' }],
    ['script', {}, legacyRedirect]
  ],
  transformPageData(page) {
    const name = page.relativePath.replace(/\.md$/, '')
    const metadata = pages.find(([slug]) => slug === name)
    if (!metadata) return
    page.title = metadata[1]
    page.description = metadata[2]
    const url = hostname + (name === 'index' ? '/' : '/' + name)
    page.frontmatter.head = [
      ['meta', { name: 'pagefind-title', 'data-pagefind-meta': 'title', content: metadata[1] }],
      ['link', { rel: 'canonical', href: url }],
      ['meta', { property: 'og:type', content: 'website' }],
      ['meta', { property: 'og:title', content: metadata[1] + ' | 慢图浏览' }],
      ['meta', { property: 'og:description', content: metadata[2] }],
      ['meta', { property: 'og:url', content: url }]
    ]
  },
  themeConfig: {
    nav: [{ text: '首页', link: '/' }, { text: '下载应用', link: '/download' }],
    sidebar: pages.filter(([slug]) => slug !== 'search').map(([slug, text]) => ({ text, link: slug === 'index' ? '/' : '/' + slug })),
    outline: { level: [2, 4], label: '本页目录' },
    docFooter: { prev: '上一页', next: '下一页' },
    editLink: {
      pattern: ({ filePath }) => `https://github.com/RelaxPic/relaxpic.github.io/edit/master/${filePath === 'index.md' ? 'readme.md' : filePath}`,
      text: '编辑此页面'
    }
  }
})
