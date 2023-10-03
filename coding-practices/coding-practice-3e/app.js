const express = require("express");
const app = express();

app.get("/", (request, response) => {
  const date = new Date();
  console.log(`${date.getDate()}-${date.getMonth()}-${date.getFullYear()}`);
  response.send(
    `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`
  );
});

module.exports = app;
