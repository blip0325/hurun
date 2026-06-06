// 通用下拉选择组件
// 使用方式:
// <select-dropdown
//   v-model="selectedValue"
//   :options="optArray"
//   placeholder="请选择"
// ></select-dropdown>
//
// options 格式: [{ label: '显示文本', value: '值' }, ...]
// modelValue 为 null/undefined/'' 时显示 placeholder

// 组件样式（仅注入一次）
(function injectSelectDropdownStyles() {
    if (document.getElementById('select-dropdown-styles')) return;
    const style = document.createElement('style');
    style.id = 'select-dropdown-styles';
    style.textContent = `
        .select-dropdown {
            position: relative;
            display: inline-block;
            flex-shrink: 0;
        }

        .select-dropdown-trigger {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 4px 10px;
            border: 1px solid var(--border-color, #dee2e6);
            border-radius: 8px;
            font-size: 13px;
            color: #333;
            background: #f5f6f8;
            cursor: pointer;
            outline: none;
            transition: border-color 0.2s, box-shadow 0.2s;
            white-space: nowrap;
            font-family: inherit;
        }

        .select-dropdown-trigger:hover {
            border-color: var(--primary-color, #1890ff);
            background: #f0f2f5;
        }

        .select-dropdown-arrow {
            transition: transform 0.2s;
            flex-shrink: 0;
        }

        .select-dropdown-arrow.open {
            transform: rotate(180deg);
        }

        .select-dropdown-menu {
            display: none;
            max-height: 260px;
            overflow-y: auto;
            background: #fff;
            border: 1px solid var(--border-color, #dee2e6);
            border-radius: 8px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
            list-style: none;
            padding: 4px 0;
            margin: 0;
        }

        .select-dropdown-menu.show {
            display: block;
            animation: sdFadeIn 0.15s ease;
        }

        .select-dropdown-menu li {
            padding: 6px 14px;
            font-size: 13px;
            color: #333;
            cursor: pointer;
            white-space: nowrap;
            transition: background 0.1s;
        }

        .select-dropdown-menu li:hover {
            background: var(--hover-bg, #f0f7ff);
        }

        .select-dropdown-menu li.active {
            color: var(--primary-color, #1890ff);
            font-weight: 600;
            background: var(--hover-bg, #f0f7ff);
        }

        .select-dropdown-menu li.sd-label-wrap {
            padding: 0;
        }

        .select-dropdown-menu .sd-check-label {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 6px 14px;
            cursor: pointer;
            margin: 0;
            font-size: 13px;
            color: #333;
        }

        .select-dropdown-menu .sd-check-label:hover {
            background: var(--hover-bg, #f0f7ff);
        }

        .select-dropdown-menu .sd-check-label input[type="checkbox"] {
            accent-color: var(--primary-color, #1890ff);
        }

        @keyframes sdFadeIn {
            from { opacity: 0; transform: translateY(-4px); }
            to { opacity: 1; transform: translateY(0); }
        }

        /* 移动端适配 */
        @media (max-width: 768px) {
            .select-dropdown-trigger {
                font-size: 12px;
                padding: 3px 8px;
            }
            .select-dropdown-menu li {
                font-size: 12px;
                padding: 5px 12px;
            }
        }

        /* 暗色模式 */
        @media (prefers-color-scheme: dark) {
            body[data-theme="dark"] .select-dropdown-trigger,
            :root .select-dropdown-trigger {
                background: #2a2a40;
                color: #f0f0f5;
                border-color: var(--border-color, #3a3a55);
            }

            body[data-theme="dark"] .select-dropdown-trigger:hover,
            :root .select-dropdown-trigger:hover {
                background: #333350;
                border-color: var(--primary-color, #4da6ff);
            }

            body[data-theme="dark"] .select-dropdown-menu,
            :root .select-dropdown-menu {
                background: #2a2a40;
                border-color: var(--border-color, #3a3a55);
            }

            body[data-theme="dark"] .select-dropdown-menu li,
            :root .select-dropdown-menu li {
                color: #e0e0e8;
            }

            body[data-theme="dark"] .select-dropdown-menu li:hover,
            :root .select-dropdown-menu li:hover {
                background: var(--hover-bg, #333350);
            }

            body[data-theme="dark"] .select-dropdown-menu li.active,
            :root .select-dropdown-menu li.active {
                color: var(--primary-color, #4da6ff);
                background: var(--hover-bg, #333350);
            }

            body[data-theme="dark"] .select-dropdown-menu .sd-check-label,
            :root .select-dropdown-menu .sd-check-label {
                color: #e0e0e8;
            }

            body[data-theme="dark"] .select-dropdown-menu .sd-check-label:hover,
            :root .select-dropdown-menu .sd-check-label:hover {
                background: var(--hover-bg, #333350);
            }
        }
    `;
    document.head.appendChild(style);
})();

// 全局单例：保证同时只有一个下拉框打开
var __sdActiveInstance = null;
var __sdDocClickBound = false;

function __sdGlobalDocClick(e) {
    if (!__sdActiveInstance) return;
    if (!__sdActiveInstance.$el.contains(e.target)) {
        __sdActiveInstance.close();
    }
}

const SelectDropdown = {
    props: {
        modelValue: { default: '' },
        options: { type: Array, default: () => [] },
        placeholder: { type: String, default: '请选择' }
    },
    emits: ['update:modelValue'],
    data() {
        return { open: false, menuStyle: {} };
    },
    computed: {
        selectedLabel() {
            if (this.modelValue === '' || this.modelValue === null || this.modelValue === undefined) {
                return this.placeholder;
            }
            const opt = this.options.find(o => o.value === this.modelValue);
            return opt ? opt.label : this.placeholder;
        }
    },
    methods: {
        toggle() {
            if (this.open) {
                this.close();
                return;
            }
            // 先关闭其他已打开的
            if (__sdActiveInstance && __sdActiveInstance !== this) {
                __sdActiveInstance.close();
            }
            this.open = true;
            __sdActiveInstance = this;
            this.$nextTick(() => {
                const trigger = this.$refs.trigger;
                if (!trigger) return;
                const rect = trigger.getBoundingClientRect();
                const menu = this.$refs.menu;
                if (!menu) return;
                const menuHeight = menu.offsetHeight || 200;
                const spaceBelow = window.innerHeight - rect.bottom;
                const spaceAbove = rect.top;
                const top = spaceBelow >= menuHeight || spaceBelow >= spaceAbove
                    ? rect.bottom + 4
                    : rect.top - menuHeight - 4;
                this.menuStyle = {
                    position: 'fixed',
                    top: top + 'px',
                    left: rect.left + 'px',
                    minWidth: rect.width + 'px',
                    zIndex: '1100'
                };
            });
        },
        select(value) {
            this.$emit('update:modelValue', value);
            this.close();
        },
        close() {
            if (__sdActiveInstance === this) {
                __sdActiveInstance = null;
            }
            this.open = false;
        },
        onResize() {
            if (this.open) this.close();
        }
    },
    mounted() {
        if (!__sdDocClickBound) {
            document.addEventListener('click', __sdGlobalDocClick);
            __sdDocClickBound = true;
        }
        window.addEventListener('resize', this.onResize);
    },
    beforeUnmount() {
        window.removeEventListener('resize', this.onResize);
        if (__sdActiveInstance === this) {
            __sdActiveInstance = null;
        }
    },
    template: `
        <div class="select-dropdown">
            <button ref="trigger" class="select-dropdown-trigger" @click.stop="toggle">
                <span>{{ selectedLabel }}</span>
                <svg class="select-dropdown-arrow" :class="{ open: open }" width="10" height="10" viewBox="0 0 10 10">
                    <path d="M2 3.5l3 3 3-3" stroke="#888" stroke-width="1.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>
            <ul ref="menu" class="select-dropdown-menu" :class="{ show: open }" :style="open ? menuStyle : {}">
                <slot>
                    <li
                        v-for="opt in options"
                        :key="opt.value"
                        :class="{ active: modelValue === opt.value }"
                        @click.stop="select(opt.value)"
                    >{{ opt.label }}</li>
                </slot>
            </ul>
        </div>
    `
};
