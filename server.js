const express = require("express")
const port = 8273;
const app = express();

app.use(express.static("."));
app.use(express.static("site"));

app.listen(port, () => {
  console.log("Listening on port", port, "...");
});
