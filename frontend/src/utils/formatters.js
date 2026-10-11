/**
 * Format currency to Indian Rupees with LPA display option
 */
export function formatSalary(amount, showLPA = true) {
  if (amount === null || amount === undefined || isNaN(amount)) return 'N/A';
  const num = Number(amount);
  
  if (showLPA && num >= 100000) {
    const lpa = (num / 100000).toFixed(2);
    return `???${parseFloat(lpa)} LPA`;
  }
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Format date string to readable format: "15 Jan 2027"
 */
export function formatDate(dateString) {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Check if a date string is past today
 */
export function isExpired(dateString) {
  if (!dateString) return false;
  const deadline = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return deadline < today;
}

/**
 * Format percentage: 85.5 -> "85.5%"
 */
export function formatPercentage(val) {
  if (val === null || val === undefined || isNaN(val)) return '0.0%';
  return `${Number(val).toFixed(1)}%`;
}

/**
 * Capitalize first letter
 */
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
