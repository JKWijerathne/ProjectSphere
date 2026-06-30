// Cloudinary upload helper utilities
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary.js';
import fs from 'fs';

// Upload single image to Cloudinary and delete temp file
export const uploadSingleImage = async (file, folder = 'projectsphere') => {
  if (!file || !file.path) {
    throw new Error('No file provided for upload');
  }

  try {
    const imageUrl = await uploadToCloudinary(file.path, folder);
    fs.unlinkSync(file.path); // Delete temp file
    return imageUrl;
  } catch (error) {
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path); // Cleanup on error
    throw error;
  }
};

// Upload multiple images to Cloudinary and delete temp files
export const uploadMultipleImages = async (files, folder = 'projectsphere') => {
  if (!files || files.length === 0) {
    throw new Error('No files provided for upload');
  }

  try {
    const uploadPromises = files.map(file => uploadToCloudinary(file.path, folder));
    const imageUrls = await Promise.all(uploadPromises);
    files.forEach(file => fs.unlinkSync(file.path)); // Delete temp files
    return imageUrls;
  } catch (error) {
    files.forEach(file => {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path); // Cleanup on error
    });
    throw error;
  }
};

// Extract Cloudinary public_id from URL for deletion
export const extractPublicId = (cloudinaryUrl) => {
  if (!cloudinaryUrl || typeof cloudinaryUrl !== 'string') return null;
  const parts = cloudinaryUrl.split('/');
  const filename = parts[parts.length - 1];
  const folder = parts.slice(parts.indexOf('upload') + 1, -1).join('/');
  const publicId = folder + '/' + filename.split('.')[0];
  return publicId;
};

// Delete image from Cloudinary using URL
export const deleteImageByUrl = async (cloudinaryUrl) => {
  const publicId = extractPublicId(cloudinaryUrl);
  if (!publicId) throw new Error('Invalid Cloudinary URL');
  await deleteFromCloudinary(publicId);
};

// Replace old image with new image (upload new, delete old)
export const replaceImage = async (file, oldImageUrl, folder = 'projectsphere') => {
  const newImageUrl = await uploadSingleImage(file, folder);
  if (oldImageUrl) {
    await deleteImageByUrl(oldImageUrl).catch(err => {
      console.warn('Failed to delete old image:', err.message);
    });
  }
  return newImageUrl;
};
