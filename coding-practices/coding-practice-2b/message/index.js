const greetings = require("../greeting/index");
console.log(greetings);

let newMsg = `Hello Rahul! ${greetings}`;
console.log(newMsg);
module.exports = newMsg;
