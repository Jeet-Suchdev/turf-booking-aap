import { Client, Account, Databases, Storage, ID } from "appwrite";
import conf from "../../conf/conf"; // Adjust path as needed

const client = new Client();

client.setEndpoint(conf.APPWRITE_ENDPOINT);
client.setProject(conf.APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const AppwriteID = ID;

// Export constants from conf (optional, if needed elsewhere)
export const APPWRITE_DATABASE_ID = conf.APPWRITE_DATABASE_ID;
export const TURFS_COLLECTION_ID = conf.TURFS_COLLECTION_ID;
export const BOOKINGS_COLLECTION_ID = conf.BOOKINGS_COLLECTION_ID;
export const TURF_IMAGES_BUCKET_ID = conf.TURF_IMAGES_BUCKET_ID;
