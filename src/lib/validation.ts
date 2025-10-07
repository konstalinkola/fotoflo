/**
 * Enhanced request validation utilities
 * 
 * This module provides comprehensive validation functions for user inputs,
 * including XSS prevention, length limits, and format validation.
 */
import { ERRORS } from './error-handler';

/**
 * Validates and sanitizes project names
 * 
 * Ensures project names are safe, properly formatted, and within length limits.
 * Prevents XSS attacks and validates against malicious content.
 * 
 * @param name - The project name to validate (can be any type)
 * @returns Sanitized project name string
 * @throws {ValidationError} When name is invalid, empty, too long, or contains malicious content
 * 
 * @example
 * ```typescript
 * try {
 *   const validName = validateProjectName("My Photography Project");
 *   console.log(validName); // "My Photography Project"
 * } catch (error) {
 *   console.error("Invalid project name:", error.message);
 * }
 * ```
 */
export function validateProjectName(name: unknown): string {
  if (!name || typeof name !== 'string') {
    throw ERRORS.VALIDATION_ERROR('Project name is required');
  }
  
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    throw ERRORS.VALIDATION_ERROR('Project name cannot be empty');
  }
  
  if (trimmed.length > 100) {
    throw ERRORS.VALIDATION_ERROR('Project name must be less than 100 characters');
  }
  
  // Check for potentially malicious content
  if (trimmed.includes('<script>') || trimmed.includes('javascript:')) {
    throw ERRORS.VALIDATION_ERROR('Project name contains invalid characters');
  }
  
  return trimmed;
}

export function validateStorageBucket(bucket: unknown): string {
  if (!bucket || typeof bucket !== 'string') {
    throw ERRORS.VALIDATION_ERROR('Storage bucket is required');
  }
  
  const trimmed = bucket.trim();
  if (trimmed.length === 0) {
    throw ERRORS.VALIDATION_ERROR('Storage bucket cannot be empty');
  }
  
  // Validate bucket name format (alphanumeric and hyphens only)
  if (!/^[a-z0-9-]+$/.test(trimmed)) {
    throw ERRORS.VALIDATION_ERROR('Storage bucket name contains invalid characters');
  }
  
  return trimmed;
}

export function validateUrl(url: unknown, fieldName: string): string | null {
  if (!url) return null;
  
  if (typeof url !== 'string') {
    throw ERRORS.VALIDATION_ERROR(`${fieldName} must be a valid URL`);
  }
  
  try {
    const urlObj = new URL(url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      throw new Error('Invalid protocol');
    }
    return url;
  } catch {
    throw ERRORS.VALIDATION_ERROR(`${fieldName} is not a valid URL`);
  }
}

export function validateColor(color: unknown, fieldName: string): string | null {
  if (!color) return null;
  
  if (typeof color !== 'string') {
    throw ERRORS.VALIDATION_ERROR(`${fieldName} must be a valid color`);
  }
  
  // Validate hex color format
  if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
    throw ERRORS.VALIDATION_ERROR(`${fieldName} must be a valid hex color (e.g., #FF0000)`);
  }
  
  return color;
}

export function sanitizeFileName(fileName: string): string {
  // Remove or replace potentially dangerous characters
  return fileName
    .replace(/[<>:"/\\|?*]/g, '_') // Replace dangerous characters with underscore
    .replace(/\.{2,}/g, '.') // Replace multiple dots with single dot
    .replace(/^\.+|\.+$/g, '') // Remove leading/trailing dots
    .substring(0, 255); // Limit length
}
