// 创建下载链接元素
function createDownloadLink(folderElement) {
    const link = document.createElement('a');
    link.className = 'github-folder-download';
    link.innerHTML = '⬇️ 下载文件夹';
    link.style.display = 'none';
    folderElement.appendChild(link);
    return link;
}

// 获取文件夹的下载URL
function getFolderDownloadUrl(folderElement) {
    const path = folderElement.getAttribute('href');
    if (!path) return null;
    
    // 从当前URL中获取仓库信息
    const repoMatch = window.location.pathname.match(/\/([^\/]+)\/([^\/]+)/);
    if (!repoMatch) return null;
    
    const [, owner, repo] = repoMatch;
    return `https://github.com/${owner}/${repo}/archive/refs/heads/main.zip`;
}

// 初始化文件夹下载功能
function initFolderDownloads() {
    // 查找所有文件夹元素
    const folderElements = document.querySelectorAll('a[role="rowheader"]');
    
    folderElements.forEach(folderElement => {
        const downloadLink = createDownloadLink(folderElement);
        const downloadUrl = getFolderDownloadUrl(folderElement);
        
        if (downloadUrl) {
            downloadLink.href = downloadUrl;
            
            // 鼠标悬停时显示下载链接
            folderElement.addEventListener('mouseenter', () => {
                downloadLink.style.display = 'inline-block';
            });
            
            folderElement.addEventListener('mouseleave', () => {
                downloadLink.style.display = 'none';
            });
        }
    });
}

// 创建链接显示元素
function createLinkDisplay(folderElement) {
    const linkDisplay = document.createElement('span');
    linkDisplay.className = 'github-folder-link';
    
    // 获取完整链接
    const baseUrl = window.location.origin;
    const folderPath = folderElement.getAttribute('href');
    const fullUrl = baseUrl + folderPath;
    
    linkDisplay.textContent = fullUrl;
    linkDisplay.style.display = 'none';
    
    // 将链接显示元素插入到文件夹元素后面
    folderElement.parentNode.insertBefore(linkDisplay, folderElement.nextSibling);
    return linkDisplay;
}

// 初始化文件夹链接显示功能
function initFolderLinks() {
    // 查找所有文件夹元素
    const folderElements = document.querySelectorAll('a[role="rowheader"]');
    
    folderElements.forEach(folderElement => {
        const linkDisplay = createLinkDisplay(folderElement);
        
        // 鼠标悬停时显示链接
        folderElement.addEventListener('mouseenter', () => {
            linkDisplay.style.display = 'inline';
        });
        
        folderElement.addEventListener('mouseleave', () => {
            linkDisplay.style.display = 'none';
        });
    });
}

// 监听来自background.js的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "showLink") {
        // 创建一个临时的提示框显示链接
        const notification = document.createElement('div');
        notification.className = 'github-link-notification';
        notification.textContent = request.url;
        document.body.appendChild(notification);
        
        // 3秒后自动移除提示框
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
});

// 监听页面变化
const observer = new MutationObserver((mutations) => {
    initFolderDownloads();
    initFolderLinks();
});

// 开始观察页面变化
observer.observe(document.body, {
    childList: true,
    subtree: true
});

// 初始加载时执行
initFolderDownloads();
initFolderLinks(); 