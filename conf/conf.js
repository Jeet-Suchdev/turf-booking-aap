const conf = {
  APPWRITE_ENDPOINT: String(import.meta.env.VITE_APPWRITE_ENDPOINT),
  APPWRITE_PROJECT_ID: String(import.meta.env.VITE_APPWRITE_PROJECT_ID),
  APPWRITE_DATABASE_ID: String(import.meta.env.VITE_APPWRITE_DATABASE_ID),
  TURFS_COLLECTION_ID: String(import.meta.env.VITE_TURFS_COLLECTION_ID),
  BOOKINGS_COLLECTION_ID: String(import.meta.env.VITE_BOOKINGS_COLLECTION_ID),
  TURF_IMAGES_BUCKET_ID: String(import.meta.env.VITE_TURF_IMAGES_BUCKET_ID),
};

export default conf;
