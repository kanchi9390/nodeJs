const express = require("express");
const app = express();

app.get("/", (request, response) => {
  response.send("Express JS");
});

app.listen(3001);
module.exports = app;
