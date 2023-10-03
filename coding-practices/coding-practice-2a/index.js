const addDays = require("date-fns/addDays");
const getDateAfterXDays = (days) => {
  const resultDate = addDays(new Date(2020, 7, 22), days);
  const newDate = `${resultDate.getDate()}-${
    resultDate.getMonth() + 1
  }-${resultDate.getFullYear()}`;
  console.log(newDate);
  return newDate;
};
getDateAfterXDays(10);
module.exports = getDateAfterXDays;
