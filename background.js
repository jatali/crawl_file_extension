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