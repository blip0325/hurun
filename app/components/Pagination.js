// 分页组件
// 使用方式: <pagination-bar
//   :current-page="currentPage"
//   :total-pages="totalPages"
//   :total-records="filteredData.length"
//   :page-size="pageSize"
//   :page-sizes="pageSizes"
//   @update:page-size="pageSize = $event"
//   @page-change="goToPage($event)"
// ></pagination-bar>

// 组件样式（仅注入一次）
(function injectPaginationStyles() {
    if (document.getElementById('pagination-bar-styles')) return;
    const style = document.createElement('style');
    style.id = 'pagination-bar-styles';
    style.textContent = `
        .pagination-wrapper {
            padding: 8px 16px;
            border-top: 1px solid #f0f0f0;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            flex-wrap: wrap;
        }

        .pagination-left {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 12px;
            color: var(--text-muted, #6c757d);
            flex-shrink: 0;
        }

        .page-size-group {
            display: flex;
            align-items: center;
            gap: 3px;
            font-size: 12px;
            color: var(--text-muted, #6c757d);
        }

        .pagination {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 2px;
            flex: 1;
        }

        .page-btn {
            min-width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid var(--border-color, #dee2e6);
            border-radius: 4px;
            background: white;
            cursor: pointer;
            font-size: 12px;
            padding: 0 5px;
            transition: all 0.15s;
            color: #495057;
        }

        .page-btn:hover:not(:disabled) {
            border-color: var(--primary-color, #1890ff);
            color: var(--primary-color, #1890ff);
            background: var(--hover-bg, #f0f7ff);
        }

        .page-btn.active {
            background: var(--primary-color, #1890ff);
            color: white;
            border-color: var(--primary-color, #1890ff);
            font-weight: 600;
        }

        .page-btn:disabled {
            opacity: 0.4;
            cursor: not-allowed;
        }

        .page-btn.ellipsis {
            border: none;
            background: transparent;
            cursor: default;
            min-width: 16px;
            font-size: 14px;
            font-weight: 700;
        }

        .page-info {
            font-size: 12px;
            color: var(--text-muted, #6c757d);
        }

        @media (max-width: 768px) {
            .pagination-wrapper {
                padding: 6px 10px;
            }
            .pagination-left {
                font-size: 11px;
                gap: 8px;
            }
            .page-size-group {
                font-size: 11px;
            }
            .page-btn {
                min-width: 26px;
                height: 26px;
                font-size: 11px;
            }
            .page-info {
                font-size: 11px;
            }
        }

        @media (max-width: 480px) {
            .pagination-wrapper {
                padding: 4px 6px;
                gap: 3px;
                flex-wrap: nowrap;
                overflow: hidden;
                max-width: 100vw;
            }
            .pagination-left {
                font-size: 10px;
                gap: 3px;
                flex-shrink: 0;
            }
            .page-size-group {
                font-size: 10px;
                gap: 1px;
                flex-shrink: 0;
            }
            .pagination {
                overflow: hidden;
                flex-shrink: 1;
            }
            .page-btn {
                min-width: 22px;
                height: 22px;
                font-size: 10px;
                padding: 0 3px;
                flex-shrink: 0;
            }
            .page-btn.ellipsis {
                min-width: 12px;
                font-size: 11px;
                flex-shrink: 0;
            }
            .page-info {
                font-size: 10px;
                flex-shrink: 0;
            }
            .page-info .info-detail {
                display: none;
            }
        }
    `;
    document.head.appendChild(style);
})();

const PaginationBar = {
    props: {
        currentPage: { type: Number, required: true },
        totalPages: { type: Number, required: true },
        totalRecords: { type: Number, required: true },
        pageSize: { type: Number, required: true },
        pageSizes: { type: Array, required: true }
    },
    emits: ['update:pageSize', 'page-change'],
    computed: {
        pageButtons() {
            const total = this.totalPages;
            const current = this.currentPage;
            const pages = [];

            if (total <= 7) {
                for (let i = 1; i <= total; i++) pages.push(i);
            } else {
                pages.push(1);
                if (current > 5) pages.push('...');
                const start = Math.max(2, current - 2);
                const end = Math.min(total - 1, current + 2);
                for (let i = start; i <= end; i++) pages.push(i);
                if (current < total - 4) pages.push('...');
                pages.push(total);
            }
            return pages;
        },
        pageSizeOptions() {
            return this.pageSizes.map(s => ({ label: s + '条', value: s }));
        }
    },
    methods: {
        onPageSizeUpdate(value) {
            this.$emit('update:pageSize', Number(value));
            this.$emit('page-change', 1);
        },
        goToPage(page) {
            const p = Math.max(1, Math.min(page, this.totalPages));
            if (p !== this.currentPage) {
                this.$emit('page-change', p);
            }
        }
    },
    template: `
        <div class="pagination-wrapper">
            <div class="pagination-left">
                <span class="page-info">
                    <span class="info-short">{{ currentPage }}/{{ totalPages }}({{ totalRecords }})</span>
                    <span class="info-detail">&nbsp;页 · 共 {{ totalRecords }} 条</span>
                </span>
                <div class="page-size-group">
                    <select-dropdown
                        :modelValue="pageSize"
                        :options="pageSizeOptions"
                        @update:modelValue="onPageSizeUpdate"
                    ></select-dropdown>
                </div>
            </div>
            <div class="pagination">
                <button class="page-btn" :disabled="currentPage <= 1" @click="goToPage(currentPage - 1)">‹</button>
                <template v-for="(p, idx) in pageButtons" :key="idx">
                    <button v-if="p === '...'" class="page-btn ellipsis" disabled>…</button>
                    <button
                        v-else
                        class="page-btn"
                        :class="{ active: p === currentPage }"
                        @click="goToPage(p)"
                    >{{ p }}</button>
                </template>
                <button class="page-btn" :disabled="currentPage >= totalPages" @click="goToPage(currentPage + 1)">›</button>
            </div>
        </div>
    `
};
