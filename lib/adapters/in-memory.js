/**
 * Stores the log messages in memory
 */
export default class InMemory {
    /**
     * Create a new instance of the InMemory adapter
     */
    constructor() {
        this.data = {};
    }
    /**
     * Stores a value in the adapter then executes the callback
     *
     * @param   {string}  key         Key for the entry
     * @param   {any}  value          Value to be stored
     * @param   {Function}  callback  Function to be executed after the value is stored
     *
     * @return  {Promise}            The promise that is created
     */
    async setItem(key, value, callback) {
        return await this.promisify(() => {
            this.data[key] = value;
            callback && callback();
        });
    }
    /**
     * Retrieves an item from the in memory adapter
     *
     * @param   {string}  key       Key to look up the value to be retrieved
     * @param   {Function}  callback  Function to be executed afte the value is retrieved
     *
     * @return  {Promise}            Promise returned
     */
    async getItem(key, callback) {
        return await this.promisify(() => {
            const data = this.data[key];
            callback && callback(data);
            return data;
        });
    }
    /**
     * Remove an item from the in memory adapter
     *
     * @param   {string}  key       Key to look up the value to be removed
     * @param   {Function}  callback  Function to be executed afer the item is removed
     *
     * @return  {Promise}            Promise retured
     */
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
