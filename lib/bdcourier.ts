const BASE_URL = "https://api.bdcourier.com";

/** BD mobile: 11 digits, starts with 01, then 3–9, then 8 digits (e.g. 013, 014, 015, 016, 017, 018, 019). */
export const BD_PHONE_REGEX = /^01[3-9]\d{8}$/;

/**
 * Normalize input to 11-digit BD number (01XXXXXXXXX) or empty if invalid.
 * Accepts: 01730285500, +8801730285500, 8801730285500, 01730-285500, 1730285500, etc.
 */
export function normalizeBdPhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 11 && BD_PHONE_REGEX.test(digits)) return digits;
  if (digits.length === 10 && /^1[3-9]\d{8}$/.test(digits)) return "0" + digits;
  if (digits.length === 13 && digits.startsWith("880")) {
    const rest = digits.slice(3);
    if (/^1[3-9]\d{8}$/.test(rest)) return "0" + rest;
  }
  return "";
}

function getHeaders(): HeadersInit {
  const key = process.env.BDCOURIER_API_KEY;
  if (!key) {
    throw new Error("BDCOURIER_API_KEY is not set");
  }
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

export type CourierData = {
  name: string;
  logo: string;
  total_parcel: number;
  success_parcel: number;
  cancelled_parcel: number;
  success_ratio: number;
};

export type SummaryData = {
  total_parcel: number;
  success_parcel: number;
  cancelled_parcel: number;
  success_ratio: number;
};

export type CourierCheckData = {
  pathao: CourierData;
  steadfast: CourierData;
  redx: CourierData;
  parceldex: CourierData;
  paperfly: CourierData;
  carrybee: CourierData;
  summary: SummaryData;
};

export type CourierCheckSuccess = {
  status: "success";
  data: CourierCheckData;
  reports: unknown[];
};

export type CourierCheckError = {
  status: "error";
  error: string;
};

export async function courierCheck(phone: string): Promise<Response> {
  const res = await fetch(`${BASE_URL}/courier-check`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ phone: phone.trim() }),
  });
  return res;
}

export async function checkConnection(): Promise<Response> {
  const res = await fetch(`${BASE_URL}/check-connection`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${process.env.BDCOURIER_API_KEY || ""}`,
    },
  });
  return res;
}

export async function getMyPlan(): Promise<Response> {
  const res = await fetch(`${BASE_URL}/my-plan`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${process.env.BDCOURIER_API_KEY || ""}`,
    },
  });
  return res;
}

export const COURIER_KEYS = [
  "pathao",
  "steadfast",
  "redx",
  "parceldex",
  "paperfly",
  "carrybee",
] as const;
