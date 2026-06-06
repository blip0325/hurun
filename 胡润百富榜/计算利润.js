// ==UserScript==
// @name         ckkckckckckckc----------------------计算利润表
// @namespace    http://tampermonkey.net/
// @version      2026-04-17
// @description  自动计算并显示毛利率、净利率、费用率，支持动态刷新
// @author       You
// @match        https://xueqiu.com/snowman/S/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=xueqiu.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    function parseNumber(str) {
        if (!str) return 0;
        str = str.replace(/[^\d\.亿万]/g, '');
        if (str.includes("亿")) return parseFloat(str) * 1e8;
        if (str.includes("万")) return parseFloat(str) * 1e4;
        return parseFloat(str) || 0;
    }

    function getRowValues(table, rowName) {
        const rows = table.querySelectorAll('tbody tr');
        for (let row of rows) {
            if (row.textContent.includes(rowName)) {
                const cells = row.querySelectorAll('td p:first-child');
                // 去掉第一列（标题），取后面所有数据列
                return Array.from(cells).map(cell => parseNumber(cell.textContent));
            }
        }
        return [];
    }

    function addFinancialRatios(table) {
        const revenue = getRowValues(table, "营业收入");
        const cogs = getRowValues(table, "营业成本");
        const sales = getRowValues(table, "销售费用");
        const admin = getRowValues(table, "管理费用");
        const rd = getRowValues(table, "研发费用");
        const netIncome = getRowValues(table, "利润总额");

        console.log('[利润计算] 营业收入:', revenue);
        console.log('[利润计算] 净利润:', netIncome);
        console.log('[利润计算] 数据长度 - 收入:', revenue.length, '净利润:', netIncome.length);

        // 确保所有数组长度一致，以最长的为准
        const maxLength = Math.max(revenue.length, cogs.length, sales.length, admin.length, rd.length, netIncome.length);
        
        // 补齐数组长度
        const padArray = (arr, len) => {
            while (arr.length < len) arr.push(0);
            return arr;
        };
        
        const paddedRevenue = padArray([...revenue], maxLength);
        const paddedCogs = padArray([...cogs], maxLength);
        const paddedSales = padArray([...sales], maxLength);
        const paddedAdmin = padArray([...admin], maxLength);
        const paddedRd = padArray([...rd], maxLength);
        const paddedNetIncome = padArray([...netIncome], maxLength);

        const expenses = paddedSales.map((v, i) => v + paddedAdmin[i] + paddedRd[i]);

        const grossMargins = paddedRevenue.map((v, i) => v ? (((v - paddedCogs[i]) / v) * 100).toFixed(2) + "%" : "");
        const netMargins = paddedRevenue.map((v, i) => v ? ((paddedNetIncome[i] / v) * 100).toFixed(2) + "%" : "");
        const expenseRatios = paddedRevenue.map((v, i) => v ? ((expenses[i] / v) * 100).toFixed(2) + "%" : "");

        console.log('[利润计算] 毛利率:', grossMargins);
        console.log('[利润计算] 净利率:', netMargins);
        console.log('[利润计算] 费用率:', expenseRatios);

        const tbody = table.querySelector('tbody');
        const colCount = tbody.rows[0].cells.length;

        // 定义不同指标的颜色配置
        const metricConfig = {
            '毛利率': {
                color: '#52c41a',
                bgColor: '#f6ffed',
                borderColor: '#52c41a',
                icon: '📈'
            },
            '净利率': {
                color: '#1890ff',
                bgColor: '#e6f7ff',
                borderColor: '#1890ff',
                icon: '💰'
            },
            '费用率': {
                color: '#fa8c16',
                bgColor: '#fff7e6',
                borderColor: '#fa8c16',
                icon: '📊'
            }
        };

        function insertRow(name, values) {
            const newRow = tbody.insertRow(0);
            const config = metricConfig[name] || { color: '#333', bgColor: '#fafafa', borderColor: '#ddd', icon: '' };
            
            for (let i = 0; i < colCount; i++) {
                const cell = newRow.insertCell(i);
                if (i === 0) {
                    cell.colSpan = 2;
                    cell.innerHTML = `<span style="margin-right: 5px;">${config.icon}</span>${name}`;
                    // 标签单元格样式
                    cell.style.fontWeight = 'bold';
                    cell.style.color = config.color;
                    cell.style.backgroundColor = config.bgColor;
                    cell.style.borderLeft = `4px solid ${config.borderColor}`;
                    cell.style.padding = '10px 12px';
                    cell.style.transition = 'all 0.2s';
                    
                    // 悬停效果
                    newRow.addEventListener('mouseenter', () => {
                        cell.style.backgroundColor = lightenColor(config.bgColor, 20);
                        cell.style.transform = 'translateX(2px)';
                    });
                    newRow.addEventListener('mouseleave', () => {
                        cell.style.backgroundColor = config.bgColor;
                        cell.style.transform = 'translateX(0)';
                    });
                } else {
                    const value = values[i - 1] || '';
                    cell.textContent = value;
                    // 数据单元格样式
                    cell.style.fontWeight = '600';
                    cell.style.color = '#262626';
                    cell.style.backgroundColor = '#fafafa';
                    cell.style.textAlign = 'right';
                    cell.style.padding = '10px 8px';
                    cell.style.borderBottom = '1px solid #f0f0f0';
                    
                    // 根据数值添加颜色指示
                    if (value && value.includes('%')) {
                        const numValue = parseFloat(value);
                        if (name === '毛利率') {
                            cell.style.color = numValue > 30 ? '#52c41a' : (numValue > 15 ? '#faad14' : '#ff4d4f');
                        } else if (name === '净利率') {
                            cell.style.color = numValue > 10 ? '#52c41a' : (numValue > 0 ? '#faad14' : '#ff4d4f');
                        }
                    }
                }
            }
            
            // 整行悬停效果
            newRow.style.transition = 'background-color 0.2s';
            newRow.addEventListener('mouseenter', () => {
                newRow.style.backgroundColor = '#f5f5f5';
            });
            newRow.addEventListener('mouseleave', () => {
                newRow.style.backgroundColor = '';
            });
        }

        insertRow("费用率", expenseRatios);
        insertRow("净利率", netMargins);
        insertRow("毛利率", grossMargins);
    }
    
    // 辅助函数：颜色变亮
    function lightenColor(color, percent) {
        const num = parseInt(color.replace("#",""), 16),
        amt = Math.round(2.55 * percent),
        R = (num >> 16) + amt,
        B = (num >> 8 & 0x00FF) + amt,
        G = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (B<255?B<1?0:B:255)*0x100 + (G<255?G<1?0:G:255)).toString(16).slice(1);
    }

    // 执行
    function init() {
        const table = document.querySelector('.table.table-bordered.table-hover');
        if (table) {
            addFinancialRatios(table);
        }
        
        // 监听 stock-info-btn-list 下的 span 点击事件，重新计算
        const btnList = document.querySelector('div.stock-info-btn-list');
        if (btnList) {
            btnList.addEventListener('click', function(e) {
                if (e.target.tagName === 'SPAN') {
                    console.log('[利润计算] 检测到按钮点击，重新计算...');
                    // 延迟执行，等待页面更新
                    setTimeout(() => {
                        const updatedTable = document.querySelector('.table.table-bordered.table-hover');
                        if (updatedTable) {
                            // 移除旧的计算结果
                            const oldRows = updatedTable.querySelectorAll('tbody tr');
                            oldRows.forEach(row => {
                                if (row.textContent.includes('毛利率') || 
                                    row.textContent.includes('净利率') || 
                                    row.textContent.includes('费用率')) {
                                    row.remove();
                                }
                            });
                            // 重新计算
                            addFinancialRatios(updatedTable);
                        }
                    }, 500);
                }
            });
        }
    }
    
    init();

    // Your code here...
})();
