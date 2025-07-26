import { Client, Account, Databases, Storage, ID } from "appwrite";
import conf from "../conf/conf";

// --- Configuration ---
// Make sure to replace these with your actual Appwrite project details.
const APPWRITE_ENDPOINT = conf.APPWRITE_ENDPOINT; // e.g., 'https://cloud.appwrite.io/v1'
const APPWRITE_PROJECT_ID = conf.APPWRITE_PROJECT_ID;
export const APPWRITE_DATABASE_ID = conf.APPWRITE_DATABASE_ID;
export const TURFS_COLLECTION_ID = conf.TURFS_COLLECTION_ID;
export const BOOKINGS_COLLECTION_ID = conf.BOOKINGS_COLLECTION_ID;
export const TURF_IMAGES_BUCKET_ID = conf.TURF_IMAGES_BUCKET_ID;
// --- End Configuration ---

const client = new Client();

client.setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);
export const AppwriteID = ID;
export const storage = new Storage(client);
