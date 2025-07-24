import { Client, Account, Databases, Storage, ID } from "appwrite";

// --- Configuration ---
// Make sure to replace these with your actual Appwrite project details.
const APPWRITE_ENDPOINT = "https://nyc.cloud.appwrite.io/v1"; // e.g., 'https://cloud.appwrite.io/v1'
const APPWRITE_PROJECT_ID = "6880f4b800240e42c831";
export const APPWRITE_DATABASE_ID = "6880f4f4003a325b922e";
export const TURFS_COLLECTION_ID = "6880f500002e801a9d73";
export const BOOKINGS_COLLECTION_ID = "6880f604001a5130520f";
// --- End Configuration ---

const client = new Client();

client.setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);
export const AppwriteID = ID;
export const storage = new Storage(client);
export const TURF_IMAGES_BUCKET_ID = "6881364b001a092149e1";
