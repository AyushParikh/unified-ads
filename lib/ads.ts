import { GoogleAdsApi, errors } from "google-ads-api";

export type ErrorDetail = { field?: string; message: string };

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var ${name}`);
  return v;
}

export function getCustomer() {
  const client = new GoogleAdsApi({
    client_id: env("GOOGLE_ADS_CLIENT_ID"),
    client_secret: env("GOOGLE_ADS_CLIENT_SECRET"),
    developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN ?? "",
  });
  const customerId = env("GOOGLE_ADS_CUSTOMER_ID");
  const customer = client.Customer({
    customer_id: customerId,
    login_customer_id: env("GOOGLE_ADS_LOGIN_CUSTOMER_ID"),
    refresh_token: env("GOOGLE_ADS_REFRESH_TOKEN"),
  });
  return { customer, customerId };
}

export function describeError(err: unknown): ErrorDetail[] {
  if (err instanceof errors.GoogleAdsFailure) {
    return err.errors.map((e) => ({
      field: e.location?.field_path_elements
        ?.map((p) => (p.index != null ? `${p.field_name}[${p.index}]` : p.field_name))
        .join("."),
      message: e.message ?? "Unknown Google Ads error",
    }));
  }
  return [{ message: err instanceof Error ? err.message : String(err) }];
}
