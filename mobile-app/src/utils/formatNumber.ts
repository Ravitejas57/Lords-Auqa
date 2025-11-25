/**
 * Format a number with thousand separators (commas)
 * @param num - The number to format
 * @returns Formatted string with commas (e.g., 1,234,567)
 */
export const formatNumber = (num: number | string | null | undefined): string => {
  if (num === null || num === undefined || num === '') return '0';

  const numValue = typeof num === 'string' ? parseFloat(num) : num;

  if (isNaN(numValue)) return '0';

  return numValue.toLocaleString('en-IN');
};

/**
 * Parse a formatted number string back to a number
 * Removes commas and converts to number
 * @param formattedNum - Formatted string with commas
 * @returns The numeric value
 */
export const parseFormattedNumber = (formattedNum: string): number => {
  if (!formattedNum) return 0;

  // Remove all commas
  const cleaned = formattedNum.replace(/,/g, '');
  const num = parseFloat(cleaned);

  return isNaN(num) ? 0 : num;
};

/**
 * Format number as user types (for input fields) using Indian numbering system
 * Allows only digits and automatically adds commas in Indian format (lakhs, crores)
 * Examples: 1,000 | 10,000 | 1,00,000 | 10,00,000 | 1,00,00,000
 * @param value - The input value
 * @returns Formatted value for display
 */
export const formatNumberInput = (value: string): string => {
  // Remove all non-digit characters except decimal point
  const cleaned = value.replace(/[^\d.]/g, '');

  // Split into integer and decimal parts
  const parts = cleaned.split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1];

  // Format integer part with Indian numbering system
  // Indian format: last 3 digits, then groups of 2
  // Example: 12,34,56,789
  let formatted = '';
  if (integerPart.length <= 3) {
    formatted = integerPart;
  } else {
    // Get last 3 digits
    const lastThree = integerPart.slice(-3);
    // Get remaining digits
    const remaining = integerPart.slice(0, -3);

    // Add commas every 2 digits for the remaining part
    const remainingFormatted = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',');

    formatted = remainingFormatted + ',' + lastThree;
  }

  // Add decimal part back if it exists
  return decimalPart !== undefined ? `${formatted}.${decimalPart}` : formatted;
};
