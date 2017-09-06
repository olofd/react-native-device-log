export default class InMemory {
    constructor() {
        this.data = {};
    }

    async setItem(key, value, callback) {
        return await this.promisify(() => {
            this.data[key] = value;
            callback && callback();
        });
    }

    async getItem(key, callback) {
        return await this.promisify(() => {
            let data = this.data[key];
            callback && callback(data);
            return data;
        });
    }

    async removeItem(key, callback) {
        return await this.promisify(() => {
            delete this.data[key];
            callback && callback();
        });
    }

    promisify(cb) {
        return new Promise((resolve, reject) => {
            resolve(cb());
        });
    }
}
