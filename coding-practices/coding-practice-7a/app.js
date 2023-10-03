const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");
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

const convertDbObjectToResponseObject1 = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertDbObjectToResponseObject2 = (oneMatch) => {
  return {
    matchId: oneMatch.match_id,
    match: oneMatch.match,
    year: oneMatch.year,
  };
};

//1 Returns a list of all the players in the player table

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT *
    FROM player_details
    ORDER BY player_id;`;
  const playersArray = await db.all(getPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) =>
      convertDbObjectToResponseObject1(eachPlayer)
    )
  );
});

//2 Returns a specific player based on the player ID
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `SELECT * 
    FROM player_details
    WHERE player_id=${playerId};`;
  const player = await db.get(getPlayerQuery);
  response.send(convertDbObjectToResponseObject1(player));
});

//3 Updates the details of a specific player based on the player ID
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updatePlayerQuery = `
    UPDATE player_details
    SET player_name='${playerName}'
    WHERE player_id=${playerId};`;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//4 Returns the match details of a specific match
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `SELECT *
    FROM match_details
    WHERE match_id=${matchId};`;
  const oneMatch = await db.get(getMatchQuery);
  response.send({
    matchId: oneMatch.match_id,
    match: oneMatch.match,
    year: oneMatch.year,
  });
});

//5 Returns a list of all the matches of a player
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getListOfMatchesQuery = `
    SELECT *
    FROM match_details
    WHERE match_id IN (SELECT match_id
                        FROM player_match_score NATURAL JOIN match_details
                        WHERE player_id=${playerId})
    ORDER BY match_id;`;
  const matchesArray = await db.all(getListOfMatchesQuery);
  response.send(
    matchesArray.map((eachMatch) => convertDbObjectToResponseObject2(eachMatch))
  );
});

//6 Returns a list of players of a specific match
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getListPlayersQuery = `
    SELECT player_id,player_name
    FROM player_details NATURAL JOIN player_match_score
    WHERE match_id=${matchId};`;
  const playersArray = await db.all(getListPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) =>
      convertDbObjectToResponseObject1(eachPlayer)
    )
  );
});

//7 Returns the statistics of the total score, fours, sixes of a specific player based on the player ID

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getStatisticsOfPlayer = `
    SELECT player_id,player_name,SUM(score),SUM(fours),SUM(sixes)
    FROM player_details NATURAL JOIN player_match_score
    WHERE player_id=${playerId};`;
  const playerStatistics = await db.get(getStatisticsOfPlayer);
  response.send({
    playerId: playerStatistics.player_id,
    playerName: playerStatistics.player_name,
    totalScore: playerStatistics["SUM(score)"],
    totalFours: playerStatistics["SUM(fours)"],
    totalSixes: playerStatistics["SUM(sixes)"],
  });
});
module.exports = app;
