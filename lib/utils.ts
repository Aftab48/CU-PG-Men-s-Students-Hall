// lib/utils.ts

export const formatIndianDate = (date: Date) => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};


export function toISODate(date: string | Date) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().split("T")[0]; // YYYY-MM-DD
}
