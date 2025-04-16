import { logger } from '#/utils';

export function formatTimestamp(date: Date): string {
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) throw new Error('Invalid date format');
    const year = String(dateObj.getFullYear()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    return `\`[${year} ${month}/${day} ${hours}:${minutes}]\``;
  } catch (error) {
    logger.error('Failed to format timestamp:', error);
    return `\`[?? ??/?? ??:??]\``;
  }
}
