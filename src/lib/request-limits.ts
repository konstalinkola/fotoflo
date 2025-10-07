// Request size limiting middleware
import { NextRequest } from 'next/server';

export const MAX_REQUEST_SIZE = 50 * 1024 * 1024; // 50MB
export const MAX_JSON_SIZE = 1024 * 1024; // 1MB for JSON
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB for files

export function checkRequestSize(request: NextRequest): { allowed: boolean; error?: string } {
  const contentLength = request.headers.get('content-length');
  
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    
    if (size > MAX_REQUEST_SIZE) {
      return {
        allowed: false,
        error: `Request too large. Maximum size is ${MAX_REQUEST_SIZE / (1024 * 1024)}MB.`
      };
    }
  }
  
  return { allowed: true };
}

export function checkJSONSize(data: unknown): { allowed: boolean; error?: string } {
  const jsonString = JSON.stringify(data);
  const size = new Blob([jsonString]).size;
  
  if (size > MAX_JSON_SIZE) {
    return {
      allowed: false,
      error: `JSON payload too large. Maximum size is ${MAX_JSON_SIZE / (1024 * 1024)}MB.`
    };
  }
  
  return { allowed: true };
}

export function checkFileSize(file: File): { allowed: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return {
      allowed: false,
      error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`
    };
  }
  
  return { allowed: true };
}
