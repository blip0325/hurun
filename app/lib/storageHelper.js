/**
 * LocalStorage 帮助类
 * 从 bjl/common.js 提取，提供简化的 localStorage 操作接口
 * 支持自动序列化/反序列化和过期时间（静态方法）
 */
class StorageHelper {
    /**
     * 生成完整的键名
     * @param {string} key - 原始键名
     * @param {string} prefix - 键名前缀，默认 'app'
     * @returns {string}
     * @private
     */
    static _getKey(key, prefix = 'app') {
        return `${prefix}:${key}`;
    }

    /**
     * 设置数据
     * @param {string} key - 键名
     * @param {any} value - 值（可以是任何类型，会自动序列化）
     * @param {number|null} expireSeconds - 过期时间（秒），可选
     * @param {string} prefix - 键名前缀，默认 'app'
     */
    static set(key, value, expireSeconds = null, prefix = 'app') {
        try {
            const fullKey = this._getKey(key, prefix);
            const data = {
                value: value,
                timestamp: Date.now(),
                expire: expireSeconds ? Date.now() + (expireSeconds * 1000) : null
            };
            localStorage.setItem(fullKey, JSON.stringify(data));
        } catch (error) {
            console.error('StorageHelper.set 失败:', error);
        }
    }

    /**
     * 获取数据
     * @param {string} key - 键名
     * @param {any} defaultValue - 默认值
     * @param {string} prefix - 键名前缀，默认 'app'
     * @returns {any}
     */
    static get(key, defaultValue = null, prefix = 'app') {
        try {
            const fullKey = this._getKey(key, prefix);
            const item = localStorage.getItem(fullKey);
            if (!item) return defaultValue;

            const data = JSON.parse(item);
            if (data.expire && Date.now() > data.expire) {
                this.remove(key, prefix);
                return defaultValue;
            }
            return data.value;
        } catch (error) {
            console.error('StorageHelper.get 失败:', error);
            return defaultValue;
        }
    }

    /**
     * 删除数据
     * @param {string} key - 键名
     * @param {string} prefix - 键名前缀，默认 'app'
     */
    static remove(key, prefix = 'app') {
        try {
            const fullKey = this._getKey(key, prefix);
            localStorage.removeItem(fullKey);
        } catch (error) {
            console.error('StorageHelper.remove 失败:', error);
        }
    }
}
