// import fs from "fs";
// import emlformat from "eml-format";
// import { ParsedEmail } from "../models/Email";

// export function parseEmlFile(filePath: string): Promise<ParsedEmail> {
//   return new Promise((resolve, reject) => {
//     fs.readFile(filePath, "utf8", (err, data) => {
//       if (err) {
//         return reject(err);
//       }
//       emlformat.read(data, (err: any, email: any) => {
//         if (err) {
//           return reject(err);
//         }
//         resolve({
//           subject: email.subject,
//           from: email.from,
//           to: email.to,
//           date: email.date,
//           text: email.text,
//           html: email.html,
//           messageId: email.headers?.["message-id"],
//           inReplyTo: email.headers?.["in-reply-to"],
//           references: email.headers?.["references"]?.split(" ") || [],
//           attachments: email.attachments?.map((att: any) => ({
//             name: att.name,
//             contentType: att.contentType,
//           })),
//         });
//       });
//     });
//   });
// }
