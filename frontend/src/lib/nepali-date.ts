import { ADtoBS } from "nepali-date-library";
import { format } from "date-fns";

/**
 * Converts an AD (Gregorian) date to Bikram Sambat miti string (YYYY/MM/DD).
 */
export function formatNepaliMiti(dateInput: Date | string | number): string {
  try {
    const date = new Date(dateInput);
    if (Number.isNaN(date.getTime())) {
      return "";
    }

    const adDate = format(date, "yyyy-MM-dd");
    const bsDate = ADtoBS(adDate);
    return bsDate.replace(/-/g, "/");
  } catch {
    return "";
  }
}
