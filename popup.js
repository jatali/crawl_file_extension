// 更新显示当前存储的URL
function updateUrlDisplay() {
    chrome.storage.local.get(['url'], (result) => {
        document.getElementById("urlDisplay").innerText = result.url || "No URL received.";
    });
}

document.getElementById("startButton").addEventListener("click", () => {
    // 从chrome.storage中读取URL
    chrome.storage.local.get(['url'], (result) => {
        const url = result.url || "https://github.com/laravel/laravel/tree/5.7/";
        const pattern = /tree\/[^/]+\//;
        const match = url.match(pattern);

        if (match) {
            const directoryPre = match[0];
            const filePre = directoryPre.replace("tree/", "blob/");

            chrome.runtime.sendMessage(
                {
                    action: "startCrawling",
                    url,
                    directoryPre,
                    filePre,
                },
                (response) => {
                    console.log(response.status);
                }
            );
        } else {
            console.error("未匹配到'tree/版本号/'模式");
        }
    });

    // 立即更新显示
    updateUrlDisplay();
});

// 监听来自content.js的消息（如果需要实时更新）
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "forwardUrl") {
        // 当接收到新URL时，更新chrome.storage并刷新显示
        chrome.storage.local.set({url: request.url}, () => {
            updateUrlDisplay(); // 更新UI显示
        });
    }
});

// 页面加载时初始化显示
updateUrlDisplay();