import { Client, Account, Databases, Storage, ID } from "appwrite";

// --- Configuration ---
// Make sure to replace these with your actual Appwrite project details.
const APPWRITE_ENDPOINT = "https://syd.cloud.appwrite.io/v1"; // e.g., 'https://cloud.appwrite.io/v1'
const APPWRITE_PROJECT_ID = "6881f0ce000e46aa1dcd";
export const APPWRITE_DATABASE_ID = "6881f138003e47ccf55d";
export const TURFS_COLLECTION_ID = "6881f175000ffe3ccb7e";
export const BOOKINGS_COLLECTION_ID = "6881f1510003e8464adb";
// --- End Configuration ---

const client = new Client();

client.setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);
export const AppwriteID = ID;
export const storage = new Storage(client);
export const TURF_IMAGES_BUCKET_ID = "6881f3680035b17d36ad";
