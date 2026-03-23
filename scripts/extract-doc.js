const mammoth = require("mammoth");
const path = require("path");

const docPath = process.argv[2] || path.join(process.env.USERPROFILE || "", "Desktop", "הסכם שכיר - עותק.doc");

mammoth
  .extractRawText({ path: docPath })
  .then((result) => {
    console.log("=== RAW TEXT ===");
    console.log(result.value);
    if (result.messages.length) console.error("Messages:", result.messages);
  })
  .then(() => mammoth.convertToHtml({ path: docPath }))
  .then((result) => {
    console.log("\n=== HTML (structure) ===");
    console.log(result.value);
    if (result.messages.length) console.error("Messages:", result.messages);
  })
  .catch((err) => {
    console.error("Error:", err.message);
    process.exit(1);
  });
