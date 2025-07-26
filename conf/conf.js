const conf = {
  APPWRITE_ENDPOINT: String(import.meta.env.APPWRITE_ENDPOINT),
  APPWRITE_PROJECT_ID: String(import.meta.env.APPWRITE_PROJECT_ID),
  APPWRITE_DATABASE_ID: String(import.meta.env.APPWRITE_DATABASE_ID),
  TURFS_COLLECTION_ID: String(import.meta.env.TURFS_COLLECTION_ID),
  BOOKINGS_COLLECTION_ID: String(import.meta.env.BOOKINGS_COLLECTION_ID),
  URF_IMAGES_BUCKET_ID: String(import.meta.env.URF_IMAGES_BUCKET_ID),
};
// there was a name issue with the import.meta.env.VITE_APPWRITE_URL, it was later fixed in debugging video

export default conf;
