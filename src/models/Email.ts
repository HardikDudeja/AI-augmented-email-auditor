export interface ParsedEmail {
  subject: string;
  from: string;
  to: string;
  date: string;
  text: string;
  html?: string;
  messageId?: string;
  inReplyTo?: string;
  references?: string[];
  attachments?: { name: string; contentType: string }[];
}
