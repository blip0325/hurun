// ==UserScript==
// @name         !我的自定义js - ckckckckckckckckckckcckckckckkckckck划词搜索
// @namespace    http://tampermonkey.net/
// @version      2026-04-13
// @description  try to take over the world!
// @author       You
// @match        *://*/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=1.7
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
    let lastText = '';
    let timer = null;
    let lastClickX = 0;
    let lastClickY = 0;

    // 禁用系统默认右键/长按菜单
    document.addEventListener("contextmenu", function (e) {
        e.preventDefault();
        return false;
    });

    document.addEventListener("mousedown", function (e) {
        lastClickX = e.clientX;
        lastClickY = e.clientY;
    });

    document.addEventListener("selectionchange", function () {
        clearTimeout(timer);

        timer = setTimeout(() => {
            let sel = window.getSelection();
            let selectedText = sel.toString().trim();

            if (!selectedText || selectedText.length < 1) {
                lastText = "";
                return;
            }
            if (selectedText === lastText) return;
            lastText = selectedText;

            let oldMenu = document.getElementById("searchMenu");
            if (oldMenu) oldMenu.remove();

            let activeEl = document.activeElement;
            let rect;
            try {
                if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")) {
                    rect = activeEl.getBoundingClientRect();
                } else {
                    let range = sel.getRangeAt(0);
                    rect = range.getBoundingClientRect();
                    // 如果选区没有有效位置，使用鼠标位置
                    if (!rect || (rect.top === 0 && rect.left === 0 && rect.width === 0 && rect.height === 0)) {
                        rect = null;
                    }
                }
            } catch (err) {
                console.log('获取选区位置失败:', err);
                rect = null;
            }

            let menu = document.createElement("div");
            menu.id = "searchMenu";
            menu.classList.add("notranslate");
            menu.style.position = "fixed";
            menu.style.background = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
            menu.style.border = "none";
            menu.style.borderRadius = "12px";
            menu.style.padding = "3px 4px";
            menu.style.zIndex = "2147483647"; // 最大 z-index
            menu.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
            menu.style.fontSize = "13px";
            menu.style.color = "#fff";
            menu.style.display = "flex";
            menu.style.flexDirection = "row";
            menu.style.gap = "2px";
            menu.style.alignItems = "center";
            menu.style.boxShadow = "0 8px 24px rgba(102, 126, 234, 0.4)";
            menu.style.backdropFilter = "blur(10px)";
            menu.style.animation = "fadeIn 0.2s ease-out";
            menu.style.flexWrap = "nowrap";
            menu.style.maxWidth = "90vw";
            menu.style.overflow = "hidden";
            menu.style.pointerEvents = "auto"; // 确保可以交互

            // 添加动画样式
            if (!document.getElementById('searchMenuStyles')) {
                const style = document.createElement('style');
                style.id = 'searchMenuStyles';
                style.textContent = `
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes pulse {
                        0%, 100% { transform: scale(1); }
                        50% { transform: scale(1.1); }
                    }
                `;
                document.head.appendChild(style);
            }

            document.body.appendChild(menu);

            // 复制按钮
            let copyBtn = document.createElement("span");
            copyBtn.textContent = "📋";
            copyBtn.style.cursor = "pointer";
            copyBtn.style.fontSize = "15px";
            copyBtn.style.minWidth = "16px";
            copyBtn.style.height = "21px";
            copyBtn.style.display = "flex";
            copyBtn.style.alignItems = "center";
            copyBtn.style.justifyContent = "center";
            copyBtn.style.borderRadius = "4px";
            copyBtn.style.transition = "all 0.2s ease";
            copyBtn.title = "复制";
            copyBtn.onmouseover = () => {
                copyBtn.style.background = "rgba(255, 255, 255, 0.2)";
                copyBtn.style.transform = "scale(1.1)";
            };
            copyBtn.onmouseout = () => {
                copyBtn.style.background = "transparent";
                copyBtn.style.transform = "scale(1)";
            };
            copyBtn.onclick = () => {
                // 尝试使用现代 API
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(selectedText).then(() => {
                        copyBtn.textContent = "✓";
                        copyBtn.style.animation = "pulse 0.3s ease";
                        setTimeout(() => {
                            copyBtn.textContent = "📋";
                        }, 1000);
                    }).catch(err => {
                        console.error('复制失败:', err);
                        fallbackCopy();
                    });
                } else {
                    // 降级方案：使用 execCommand
                    fallbackCopy();
                }

                function fallbackCopy() {
                    const textArea = document.createElement("textarea");
                    textArea.value = selectedText;
                    textArea.style.position = "fixed";
                    textArea.style.left = "-9999px";
                    document.body.appendChild(textArea);
                    textArea.select();
                    try {
                        document.execCommand('copy');
                        copyBtn.textContent = "✓";
                        copyBtn.style.animation = "pulse 0.3s ease";
                        setTimeout(() => {
                            copyBtn.textContent = "📋";
                        }, 1000);
                    } catch (err) {
                        console.error('复制失败:', err);
                        alert('复制失败，请手动复制');
                    }
                    document.body.removeChild(textArea);
                }
            };
            menu.appendChild(copyBtn);

            // 分隔线
            let divider1 = document.createElement("div");
            divider1.style.width = "1px";
            divider1.style.height = "13px";
            divider1.style.background = "rgba(255, 255, 255, 0.3)";
            divider1.style.margin = "0 1px";
            menu.appendChild(divider1);

            // 搜索链接（使用 {query} 作为搜索词占位符）
            let sites = {
                "Douyin": "https://www.douyin.com/jingxuan/search/{query}",
                "Xueqiu": "https://xueqiu.com/k?q={query}#/stock",
                "Google": "https://www.google.com/search?q={query}",
                "X": "https://x.com/search?q={query}",
                "YouTube": "https://www.youtube.com/results?search_query={query}",
                "Bili": "https://search.bilibili.com/all?keyword={query}",
                "Wiki": "https://zh.wikipedia.org/w/index.php?search={query}",
                "Map": "https://www.google.com.hk/maps/search/{query}",
            };

            // 网站图标（使用 emoji）
            let siteIcons = {
                "Google": "🔍",
                "Douyin": "🎵",
                "X": "𝕏",
                "Xueqiu": "📈",
                "YouTube": "▶️",
                "Bili": "📺",
                "Wiki": "📚",
                "Map": "🗺️",
            };

            for (let site in sites) {
                // 添加分隔线（除了第一个）
                if (Object.keys(sites).indexOf(site) > 0) {
                    let divider = document.createElement("div");
                    divider.style.width = "1px";
                    divider.style.height = "13px";
                    divider.style.background = "rgba(255, 255, 255, 0.3)";
                    divider.style.margin = "0 1px";
                    menu.appendChild(divider);
                }

                let link = document.createElement("a");
                link.href = sites[site].replace('{query}', encodeURIComponent(selectedText));
                link.target = "_blank";
                link.rel = "noopener noreferrer";
                link.title = site; // 鼠标悬停显示网站名称

                // 使用 emoji 图标
                link.innerText = siteIcons[site] || site.substring(0, 3);
                link.style.textDecoration = "none";
                link.style.color = "#fff";
                link.style.fontWeight = "500";
                link.style.padding = "4px 6px";
                link.style.borderRadius = "4px";
                link.style.transition = "all 0.2s ease";
                link.style.textAlign = "center";
                link.style.fontSize = "15px"; // emoji 尺寸
                link.style.whiteSpace = "nowrap";
                link.style.minWidth = "14px";
                link.style.display = "flex";
                link.style.alignItems = "center";
                link.style.justifyContent = "center";
                link.style.cursor = "pointer";
                link.style.userSelect = "none"; // 防止再次选中

                // 点击事件 - 使用 mousedown 更早触发
                link.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();

                    const url = sites[site].replace('{query}', encodeURIComponent(selectedText));

                    // 不关闭菜单，直接打开链接
                    window.open(url, '_blank');
                });
                link.onmouseover = () => {
                    link.style.background = "rgba(255, 255, 255, 0.25)";
                    link.style.transform = "translateY(-1px) scale(1.1)";
                };
                link.onmouseout = () => {
                    link.style.background = "transparent";
                    link.style.transform = "translateY(0) scale(1)";
                };

                menu.appendChild(link);
            }

            let left, top;
            let gap = 6; // 菜单与选区的间距
            if (rect && rect.top !== 0 && rect.left !== 0) {
                left = rect.left;
                // 先放在选区上方
                top = rect.top - gap;
            } else {
                left = lastClickX;
                top = lastClickY - gap;
            }

            let menuWidth = menu.offsetWidth;
            let menuHeight = menu.offsetHeight;
            let winWidth = window.innerWidth;
            let winHeight = window.innerHeight;

            // 水平边界
            if (left + menuWidth > winWidth) {
                left = winWidth - menuWidth - 10;
            }
            if (left < 0) left = 10;

            // 上方空间不足，回退到下方
            if (top - menuHeight < 0) {
                top = rect ? rect.bottom + gap : lastClickY + gap;
                // 下方也不够的话，贴底部
                if (top + menuHeight > winHeight) {
                    top = winHeight - menuHeight - 10;
                }
            } else {
                top = top - menuHeight;
                // 如果上方计算后还是负的，贴顶部
                if (top < 0) top = 10;
            }

            menu.style.left = left + "px";
            menu.style.top = top + "px";
        }, 500);
    });

    // 在插入菜单后添加关闭逻辑
    document.addEventListener("click", function (e) {
        let menu = document.getElementById("searchMenu");
        if (!menu) return;

        // 如果点击的是菜单内部元素，就不关闭
        if (menu.contains(e.target)) {
            return;
        }

        // 如果点击的是页面其他空白区域，就关闭
        menu.remove();lastText = "";
    });


})();