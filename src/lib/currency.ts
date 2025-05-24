/**
 * Formats a number as LKR currency
 * @param amount - The amount to format
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number): string => {
  return `LKR ${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Formats a number as LKR currency without decimals for whole numbers
 * @param amount - The amount to format
 * @returns Formatted currency string
 */
export const formatCurrencyCompact = (amount: number): string => {
  if (amount % 1 === 0) {
    return `LKR ${amount.toLocaleString("en-US")}`;
  }
  return `LKR ${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Currency configuration
 */
export const CURRENCY = {
  code: "LKR",
  symbol: "LKR",
  name: "Sri Lankan Rupee",
  locale: "en-US", // Using en-US for number formatting
};
