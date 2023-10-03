const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server Running at http://localhost:3000");
    });
  } catch (e) {
    console.log("DB Error:${e.message}");
    process.exit(1);
  }
};
initializeDBAndServer();

const convertDbObjectToResponseObject1 = (dbObject) => ({
  stateId: dbObject.state_id,
  stateName: dbObject.state_name,
  population: dbObject.population,
});

const convertDbObjectToResponseObject2 = (dbObject) => ({
  districtId: dbObject.district_id,
  districtName: dbObject.district_name,
  stateId: dbObject.state_id,
  cases: dbObject.cases,
  cured: dbObject.cured,
  active: dbObject.active,
  deaths: dbObject.deaths,
});

const convertDbObjectToResponseObject3 = (dbObject) => ({
  totalCases: dbObject["SUM(cases)"],
  totalCured: dbObject["SUM(cured)"],
  totalActive: dbObject["SUM(active)"],
  totalDeaths: dbObject["SUM(deaths)"],
});

//Returns a list of all states in the state table
app.get("/states/", async (request, response) => {
  const getStatesQuery = `SELECT *
    FROM state
    ORDER BY state_id;`;
  const statesArray = await db.all(getStatesQuery);
  response.send(
    statesArray.map((eachState) => convertDbObjectToResponseObject1(eachState))
  );
});

//Returns a state based on the state ID
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT *
    FROM state
    WHERE state_id=${stateId};`;
  const oneState = await db.get(getStateQuery);
  response.send(convertDbObjectToResponseObject1(oneState));
});

//Create a district in the district table, `district_id` is auto-incremented

app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const addDistrictQuery = `
    INSERT INTO district(district_name,state_id,cases,cured,active,deaths)
    VALUES(
        '${districtName}',
        ${stateId},
        ${cases},
        ${cured},
        ${active},
        ${deaths}
    );`;
  const dbResponse = await db.run(addDistrictQuery);
  response.send("District Successfully Added");
});

//Returns a district based on the district ID
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT *
    FROM district
    WHERE district_id=${districtId};`;
  const oneDistrict = await db.get(getDistrictQuery);
  response.send(convertDbObjectToResponseObject2(oneDistrict));
});

//Deletes a district from the district table based on the district ID
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
    DELETE FROM district
    WHERE district_id=${districtId};`;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//Updates the details of a specific district based on the district ID

app.put("/districts/:districtId/", async (request, response) => {
  const districtDetails = request.body;
  const { districtId } = request.params;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateDistrictQuery = `
    UPDATE district
    SET
        district_name='${districtName}',
        state_id=${stateId},
        cases=${cases},
        cured=${cured},
        active=${active},
        deaths=${deaths}
    WHERE district_id=${districtId};`;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//Returns the statistics of total cases, cured, active, deaths of a specific state based on state ID

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateDetailsQuery = `
    SELECT SUM(cases),SUM(cured),SUM(active),SUM(deaths)
    FROM district
    WHERE state_id=${stateId};`;
  const oneState = await db.get(getStateDetailsQuery);
  response.send(convertDbObjectToResponseObject3(oneState));
});

//Returns an object containing the state name of a district based on the district ID
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateNameQuery = `
    SELECT state_name
    FROM district NATURAL JOIN state
    WHERE district_id=${districtId};`;
  const stateName = await db.get(getStateNameQuery);
  response.send({
    stateName: stateName.state_name,
  });
});
module.exports = app;
