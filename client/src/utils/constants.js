// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';
export const MAX_FILE_SIZE = parseInt(import.meta.env.VITE_MAX_FILE_SIZE || '10485760');

// File Types
export const ALLOWED_FILE_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/markdown'],
  spreadsheets: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  archives: ['application/zip', 'application/x-rar-compressed'],
};

export const FILE_ICON_MAP = {
  'image/jpeg': '🖼️',
  'image/png': '🖼️',
  'image/gif': '🖼️',
  'image/webp': '🖼️',
  'application/pdf': '📄',
  'application/msword': '📝',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
  'text/plain': '📋',
  'text/markdown': '📋',
  'application/vnd.ms-excel': '📊',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
  'application/zip': '📦',
};

// Validation Rules
export const VALIDATION = {
  MIN_MESSAGE_LENGTH: 1,
  MAX_MESSAGE_LENGTH: 5000,
  MIN_TICKET_TITLE: 2,
  MAX_TICKET_TITLE: 140,
  MIN_TODO_TITLE: 2,
  MAX_TODO_TITLE: 100,
};

// UI Configuration
export const UI_CONFIG = {
  TOAST_DURATION: 3200,
  ANIMATION_SPEED: 'fast',
  BREAKPOINTS: {
    mobile: 640,
    tablet: 1024,
    desktop: 1280,
  },
};

// WebSocket Events
export const WS_EVENTS = {
  TICKET_COMMENT: 'ticket_comment',
  GET_COMMENTS: 'get_ticket_comments',
  COMMENTS_HISTORY: 'ticket_comments_history',
  FILE_UPLOADED: 'file_uploaded',
  USER_TYPING: 'user_typing',
  REACTION_ADDED: 'reaction_added',
  CONNECTION_READY: 'connection_ready',
};
