/**
 * IndexedDB 帮助类（从 bjl 提取）
 * 提供简化的 IndexedDB 操作接口（静态方法）
 */
class IndexedDBHelper {
    static _dbCache = new Map();

    static async _getConnection(dbName, version = 1, stores = []) {
        const cacheKey = `${dbName}_${version}`;
        if (this._dbCache.has(cacheKey)) {
            return this._dbCache.get(cacheKey);
        }
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(dbName, version);
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                // 清理不在 stores 列表中的旧 objectStore
                const keepNames = new Set(stores.map(s => s.name));
                const toDelete = [];
                for (let i = 0; i < db.objectStoreNames.length; i++) {
                    if (!keepNames.has(db.objectStoreNames[i])) {
                        toDelete.push(db.objectStoreNames[i]);
                    }
                }
                toDelete.forEach(name => db.deleteObjectStore(name));
                // 创建新 store
                stores.forEach(store => {
                    if (!db.objectStoreNames.contains(store.name)) {
                        db.createObjectStore(store.name, {
                            keyPath: store.keyPath || 'id',
                            autoIncrement: store.autoIncrement || false,
                            ...store.options
                        });
                    }
                });
            };
            request.onsuccess = (event) => {
                this._dbCache.set(cacheKey, event.target.result);
                resolve(event.target.result);
            };
            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    static async get(dbName, storeName, key, version = 1, stores = []) {
        const db = await this._getConnection(dbName, version, stores);
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => {
                console.error('IndexedDB get error:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    static async put(dbName, storeName, data, version = 1, stores = []) {
        const db = await this._getConnection(dbName, version, stores);
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);
            // 监听事务完成，确保数据落盘
            transaction.oncomplete = () => {
                console.log(`IndexedDB put success: ${storeName}/${data.id}, rows: ${data.value?.length}`);
                resolve(request.result);
            };
            transaction.onerror = (event) => {
                console.error('IndexedDB put error:', event.target.error);
                reject(event.target.error);
            };
            transaction.onabort = () => {
                console.warn('IndexedDB put aborted');
                reject(new Error('Transaction aborted'));
            };
            request.onerror = (event) => {
                console.error('IndexedDB put request error:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    static async getAll(dbName, storeName, version = 1, stores = []) {
        const db = await this._getConnection(dbName, version, stores);
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    static async delete(dbName, storeName, key, version = 1, stores = []) {
        const db = await this._getConnection(dbName, version, stores);
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);
            transaction.oncomplete = () => resolve();
            transaction.onerror = (event) => reject(event.target.error);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    static async clear(dbName, storeName, version = 1, stores = []) {
        const db = await this._getConnection(dbName, version, stores);
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();
            transaction.oncomplete = () => resolve();
            transaction.onerror = (event) => reject(event.target.error);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    static async count(dbName, storeName, version = 1, stores = []) {
        const db = await this._getConnection(dbName, version, stores);
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.count();
            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }
}
