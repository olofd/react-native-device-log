/**
 * Stores the log messages in memory
 */
export default class InMemory {
    data: any;
    /**
     * Create a new instance of the InMemory adapter
     */
    constructor();
    /**
     * Stores a value in the adapter then executes the callback
     *
     * @param   {string}  key         Key for the entry
     * @param   {any}  value          Value to be stored
     * @param   {Function}  callback  Function to be executed after the value is stored
     *
     * @return  {Promise}            The promise that is created
     */
    setItem(key: string, value: any, callback: () => any): Promise<any>;
    /**
     * Retrieves an item from the in memory adapter
     *
     * @param   {string}  key       Key to look up the value to be retrieved
     * @param   {Function}  callback  Function to be executed afte the value is retrieved
     *
     * @return  {Promise}            Promise returned
     */
    getItem(key: string, callback: Function): Promise<any>;
    /**
     * Remove an item from the in memory adapter
     *
     * @param   {string}  key       Key to look up the value to be removed
     * @param   {Function}  callback  Function to be executed afer the item is removed
     *
     * @return  {Promise}            Promise retured
     */
    removeItem(key: string, callback: Function): Promise<any>;
    promisify(cb: {
        (): void;
        (): any;
        (): void;
        (): unknown;
    }): Promise<unknown>;
}
