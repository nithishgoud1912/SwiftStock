import { Resend } from "resend";

// Create a Resend client instance using the environment variable
// Visit https://resend.com/api-keys to create your free API key
export const resend = new Resend(
  process.env.RESEND_API_KEY || "re_dummy_key_to_prevent_crash_during_dev",
);
