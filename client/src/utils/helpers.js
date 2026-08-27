import { MAX_FILE_SIZE, ALLOWED_FILE_TYPES, FILE_ICON_MAP } from './constants.js';

/**
 * Format file size for display
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Validate file before upload
 */
export function validateFile(file) {
  if (!file) return { valid: false, error: 'No file selected' };
  
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File is too large. Max size: ${formatFileSize(MAX_FILE_SIZE)}`,
    };
  }

  const allAllowedTypes = Object.values(ALLOWED_FILE_TYPES).flat();
  if (!allAllowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'File type not allowed. Supported: images, documents, spreadsheets, archives',
    };
  }

  return { valid: true };
}

/**
 * Get file type category
 */
export function getFileCategory(mimeType) {
  for (const [category, types] of Object.entries(ALLOWED_FILE_TYPES)) {
    if (types.includes(mimeType)) {
      return category;
    }
  }
  return 'unknown';
}

/**
 * Get file icon emoji
 */
export function getFileIcon(mimeType) {
  return FILE_ICON_MAP[mimeType] || '📎';
}

/**
 * Format date/time for messages
 */
export function formatMessageTime(date) {
  const now = new Date();
  const messageDate = new Date(date);
  const diffMs = now - messageDate;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return messageDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format date for date separators
 */
export function formatDateSeparator(date) {
  const messageDate = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (messageDate.toDateString() === today.toDateString()) return 'Today';
  if (messageDate.toDateString() === yesterday.toDateString()) return 'Yesterday';
  
  return messageDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Get initials from name
 */
export function getInitials(name) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Generate random color for avatar
 */
export function generateAvatarColor(id) {
  const colors = [
    'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-cyan-500',
  ];
  return colors[id % colors.length];
}

/**
 * Truncate text
 */
export function truncateText(text, length) {
  if (!text) return '';
  return text.length > length ? text.substring(0, length) + '...' : text;
}

/**
 * Check if URL is an image
 */
export function isImageUrl(url) {
  if (!url) return false;
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
}

/**
 * Check if URL is a video
 */
export function isVideoUrl(url) {
  if (!url) return false;
  return /\.(mp4|webm|mov)$/i.test(url);
}

/**
 * Sanitize file name
 */
export function sanitizeFileName(fileName) {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .substring(0, 255);
}

/**
 * Debounce function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
