// sw.js
const RUNTIME = 'docsify'
const HOSTNAME_WHITELIST = [
  self.location.hostname,
  'fonts.gstatic.com',
  'fonts.googleapis.com',
  'cdn.jsdelivr.net'
]

// 存储当前生效的版本号
let CURRENT_VERSION = 'default';

// 监听来自页面的版本消息
self.addEventListener('message', event => {
  if (event.data && event.data.action === 'SET_VERSION') {
    console.log('收到版本更新指令:', event.data.version);
    CURRENT_VERSION = event.data.version;

    // 可以设置版本过期时间（可选）
    setTimeout(() => {
      console.log('版本强制刷新模式结束');
      CURRENT_VERSION = 'default';
    }, 5 * 60 * 1000); // 5分钟后自动恢复默认
  }
});

// 修改 fetch 事件，添加版本感知
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 对 Markdown 文件使用版本化缓存策略
  if (url.pathname.endsWith('.md')) {
    event.respondWith(
        (async () => {
          // 创建版本化的请求标识
          const versionedRequest = new Request(
              `${event.request.url}?v=${CURRENT_VERSION}`,
              event.request
          );

          try {
            // 首先尝试从缓存获取（带版本号）
            const cachedResponse = await caches.match(versionedRequest);

            if (cachedResponse) {
              console.log('从版本化缓存中获取:', url.pathname);
              return cachedResponse;
            }

            // 缓存中没有，从网络获取
            console.log('从网络获取最新内容:', url.pathname);
            const networkResponse = await fetch(event.request);

            if (networkResponse.ok) {
              // 将响应存储到版本化缓存中
              const cache = await caches.open(RUNTIME);
              await cache.put(versionedRequest, networkResponse.clone());
            }

            return networkResponse;
          } catch (error) {
            console.log('获取失败，尝试回退到默认缓存:', error);
            // 如果都失败，尝试获取不带版本号的缓存（兼容旧版本）
            return await caches.match(event.request) || new Response('无法加载内容');
          }
        })()
    );
    return;
  }

  // 其他资源保持原有逻辑
  if (HOSTNAME_WHITELIST.indexOf(url.hostname) > -1) {
    const cached = caches.match(event.request)
    const fixedUrl = getFixedUrl(event.request)
    const fetched = fetch(fixedUrl, { cache: 'no-store' })
    const fetchedCopy = fetched.then(resp => resp.clone())

    event.respondWith(
        Promise.race([fetched.catch(_ => cached), cached])
            .then(resp => resp || fetched)
            .catch(_ => { /* eat any errors */ })
    )

    event.waitUntil(
        Promise.all([fetchedCopy, caches.open(RUNTIME)])
            .then(([response, cache]) => response.ok && cache.put(event.request, response))
            .catch(_ => { /* eat any errors */ })
    )
  }
});

// 保持其他原有函数不变
const getFixedUrl = (req) => {
  var now = Date.now()
  var url = new URL(req.url)
  url.protocol = self.location.protocol
  if (url.hostname === self.location.hostname) {
    url.search += (url.search ? '&' : '?') + 'cache-bust=' + now
  }
  return url.href
}

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim())
});