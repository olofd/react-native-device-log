export { default as LogView } from "./debug-view";
import deviceLog from "./debug-service";
export { default as InMemoryAdapter } from "./adapters/in-memory";
export {
    default as StorageServerHocWriter,
} from "./data-writers/storage-server-hoc-writer";
export default deviceLog;
export {
    default as StringifyDataWriter,
} from "./data-writers/stringify-data-writer";
export {
    default as RealmDataWriter,
    RealmBaseScheme,
} from "./data-writers/realm-data-writer";
