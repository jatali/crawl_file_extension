const urlRoot = "https://github.com";
const maxWorkers = 5; // 最大并发数
const visitedUrls = new Set();
const fileList = new Set();
const lock = false; // 简单的锁机制
// 当扩展程序安装或更新时触发此事件监听器。
chrome.runtime.onInstalled.addListener(() => {
    // 创建一个新的右键菜单项。这个菜单项会在特定条件下出现在链接的右键菜单中。
    chrome.contextMenus.create({
        id: "showFolderLink", // 菜单项的唯一标识符，用于识别菜单项。
        title: "显示链接", // 右键菜单中显示的文字。
        contexts: ["link"], // 定义在哪些上下文（比如文本、图片、链接等）下显示该菜单项。这里指定为链接。
        documentUrlPatterns: ["https://github.com/*"] // 限制菜单项只在符合此模式的网页上显示。这里的模式是GitHub的所有页面。
    });
});

// 添加一个事件监听器，用于处理右键菜单点击事件。
chrome.contextMenus.onClicked.addListener((info, tab) => {
    // 检查被点击的菜单项是否是我们创建的那个（通过比较id来实现）。
    if (info.menuItemId === "showFolderLink") {
        // 如果是，向当前标签页发送一条消息，包含动作和链接URL。
        chrome.tabs.sendMessage(tab.id, {
            action: "showLink", // 动作名称，可以在接收端用来判断需要执行的操作。
            url: info.linkUrl // 用户右键点击的链接地址。
        });
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "saveUrl") {
        // 使用 chrome.storage.local.set 存储 URL
        chrome.storage.local.set({url: message.url}, () => {
            console.log("URL已存储:", message.url);
            
            // 可选：通知 popup.js 有新的 URL 可用
            chrome.runtime.sendMessage({
                action: "forwardUrl",
                url: message.url
            });
        });
    }
});



// 随机延迟函数
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 获取随机 User-Agent
function getRandomUserAgent() {
  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15",
  ];
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

// 添加规则以修改请求头
chrome.declarativeNetRequest.updateDynamicRules({
  addRules: [
    {
      id: 1,
      priority: 1,
      action: {
        type: "modifyHeaders",
        requestHeaders: [
          { header: "User-Agent", operation: "set", value: getRandomUserAgent() },
        ],
      },
      condition: {
        urlFilter: "https://github.com/*",
        resourceTypes: ["xmlhttprequest", "main_frame"],
      },
    },
  ],
  removeRuleIds: [1], // 移除旧规则
});

// 解析 HTML 并提取链接
function extractLinks(html, directoryPre, filePre) {
  const linkRegex = /<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1/g;
  const links = [];
  let match;

  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[2];
    if (href.includes(directoryPre)) {
      links.push(urlRoot + href);
    } else if (href.includes(filePre)) {
      const filePath = href.split(filePre)[1];
      fileList.add(filePath);
    }
  }

  return links;
}

// 爬取 GitHub 文件结构
async function crawlGitHubFileStructure(url, directoryPre, filePre) {
  if (visitedUrls.has(url)) return [];

  visitedUrls.add(url);

  try {
    await sleep(Math.random() * 2000 + 1000); // 随机延迟 1-3 秒
    const response = await fetch(url);
    const text = await response.text();

    console.log("访问成功:", url);

    const newUrls = extractLinks(text, directoryPre, filePre);
    return newUrls;
  } catch (error) {
    console.error(`请求失败: ${url}, 错误:`, error);
    return [];
  }
}

// 启动爬取
async function startCrawling(startUrl, directoryPre, filePre) {
  const queue = [startUrl];

  while (queue.length > 0) {
    const currentUrl = queue.shift();
    const newUrls = await crawlGitHubFileStructure(currentUrl, directoryPre, filePre);
    queue.push(...newUrls);
  }

  // 将 Set 转换为数组并存储
  const fileListArray = Array.from(fileList);
  chrome.storage.local.set({ fileList: fileListArray }, () => {
    console.log("文件列表已存储:", fileListArray);
    
    // 验证存储是否成功
    chrome.storage.local.get(['fileList'], (result) => {
      if (Array.isArray(result.fileList)) {
        console.log("存储成功，文件数量:", result.fileList.length);
      } else {
        console.log("存储失败，结果不是数组");
      }
    });
  });
}

// 监听消息，启动爬取
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "startCrawling") {
    const { url, directoryPre, filePre } = request;
    startCrawling(url, directoryPre, filePre);
    sendResponse({ status: "started" });
  }
  return true;
});