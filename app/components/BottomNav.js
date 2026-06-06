// 底部导航栏组件
// 使用方式: <bottom-nav active="500强"></bottom-nav>
// active 可选值: "百富榜" | "500强"

// 组件样式（仅注入一次）
(function injectStyles() {
    if (document.getElementById('bottom-nav-styles')) return;
    const style = document.createElement('style');
    style.id = 'bottom-nav-styles';
    style.textContent = `
        body {
            padding-bottom: 80px;
        }
        .bottom-nav {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: white;
            box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.08);
            display: flex;
            justify-content: space-around;
            align-items: center;
            z-index: 9999;
            padding: 8px 0;
            padding-bottom: env(safe-area-inset-bottom, 8px);
        }
        .nav-item {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-decoration: none;
            color: #999;
            transition: all 0.3s;
            padding: 5px 0;
            cursor: pointer;
        }
        .nav-item i {
            font-size: 24px;
            margin-bottom: 4px;
        }
        .nav-item span {
            font-size: 12px;
        }
        .nav-item.active {
            color: #1890ff;
        }
        .nav-item:hover {
            color: #1890ff;
            transform: translateY(-2px);
        }
        @media (max-width: 768px) {
            .bottom-nav {
                padding: 0px 0;
                padding-bottom: calc(0px + env(safe-area-inset-bottom, 6px));
            }
            .nav-item i {
                font-size: 22px;
            }
            .nav-item span {
                font-size: 11px;
            }
        }
    `;
    document.head.appendChild(style);
})();

const BottomNav = {
    props: {
        active: { type: String, default: '' },
        richPath: { type: String, default: 'rich.html' },
        top500Path: { type: String, default: '500data.html' }
    },
    template: `
        <nav class="bottom-nav">
            <a :href="richPath" class="nav-item" :class="{ active: active === '百富榜' }">
                <i class="bi bi-trophy"></i>
                <span>百富榜</span>
            </a>
            <a :href="top500Path" class="nav-item" :class="{ active: active === '500强' }">
                <i class="bi bi-building-fill"></i>
                <span>500强</span>
            </a>
        </nav>
    `
};
