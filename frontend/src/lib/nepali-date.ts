import DateConverter from "@remotemerge/nepali-date-converter";
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
    const bs = new DateConverter(adDate).toBs();
    const month = String(bs.month).padStart(2, "0");
    const day = String(bs.date).padStart(2, "0");
    return `${bs.year}/${month}/${day}`;
  } catch {
    return "";
  }
}
