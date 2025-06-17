import { ParsedEmail } from "../models/Email";

export function sortEmailThread(emails: ParsedEmail[]): ParsedEmail[] {
  return emails.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}
