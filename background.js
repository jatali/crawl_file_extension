// 创建右键菜单
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "showFolderLink",
        title: "显示链接",
        contexts: ["link"],
        documentUrlPatterns: ["https://github.com/*"]
    });
});

// 处理右键菜单点击
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "showFolderLink") {
        chrome.tabs.sendMessage(tab.id, {
            action: "showLink",
            url: info.linkUrl
        });
    }
}); 