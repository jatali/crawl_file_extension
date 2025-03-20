// 创建链接显示元素
function createLinkDisplay(element) {
    // 检查是否已经添加了链接显示
    if (element.nextSibling?.className === 'github-folder-link') {
        return element.nextSibling;
    }

    const linkDisplay = document.createElement('span');
    linkDisplay.className = 'github-folder-link';
    
    // 获取完整链接
    const baseUrl = window.location.origin;
    const path = element.getAttribute('href');
    const fullUrl = baseUrl + path;
    
    linkDisplay.textContent = fullUrl;
    linkDisplay.style.display = 'none';
    
    // 将链接显示元素插入到元素后面
    element.parentNode.insertBefore(linkDisplay, element.nextSibling);
    return linkDisplay;
}

// 初始化链接显示功能
function initLinks() {
    // 查找所有文件和文件夹元素
    const elements = document.querySelectorAll([
        'div[role="row"] a[href*="/"]', // 文件和文件夹行中的链接
        '.js-navigation-open', // 旧版GitHub的文件和文件夹链接
        'a[href*="/blob/"]', // 文件链接
        'a[href*="/tree/"]', // 文件夹链接
        'a[role="rowheader"]' // 新版GitHub的文件和文件夹链接
    ].join(','));
    
    elements.forEach(element => {
        // 检查是否是文件或文件夹链接（排除其他类型的链接）
        if (element.href) {
            const linkDisplay = createLinkDisplay(element);
            
            // 鼠标悬停时显示链接
            element.addEventListener('mouseenter', () => {
                linkDisplay.style.display = 'inline';
            });
            
            element.addEventListener('mouseleave', () => {
                linkDisplay.style.display = 'none';
            });

            // 为父元素也添加悬停事件
            const parentRow = element.closest('div[role="row"]');
            if (parentRow) {
                parentRow.addEventListener('mouseenter', () => {
                    linkDisplay.style.display = 'inline';
                });
                
                parentRow.addEventListener('mouseleave', () => {
                    linkDisplay.style.display = 'none';
                });
            }
        }
    });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "showLink") {
        // 发送消息给后台脚本以存储 URL
        chrome.runtime.sendMessage({
            action: "saveUrl",
            url: request.url
        }, () => {
            console.log("消息已发送到后台脚本");
        });
    }
});
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "parsePage") {
      const { url, directoryPre, filePre } = request;
  
      // 这里仅模拟解析页面的行为，实际应用中需要根据页面结构提取所需信息
      const fileList = [];
      const newUrls = [];
  
      document.querySelectorAll('a').forEach(link => {
        const href = link.getAttribute('href');
        if (href.startsWith(directoryPre) || href.startsWith(filePre)) {
          newUrls.push(new URL(href, url).href);
        }
      });
  
      document.querySelectorAll('.js-navigation-open').forEach(item => {
        const path = item.getAttribute('data-path');
        if (path && !fileList.includes(path)) {
          fileList.push(path);
        }
      });
  
      sendResponse({
        fileList,
        newUrls
      });
    }
  });
// 监听页面变化
const observer = new MutationObserver((mutations) => {
    initLinks();
});

// 开始观察页面变化
observer.observe(document.body, {
    childList: true,
    subtree: true
});


// 初始加载时执行
initLinks();

// 添加定期检查，以确保动态加载的内容也能正确显示链接
setInterval(initLinks, 2000);