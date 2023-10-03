const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const format = require("date-fns/format");
var isValid = require("date-fns/isValid");

const dbPath = path.join(__dirname, "todoApplication.db");
const app = express();

app.use(express.json());

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(-1);
  }
};
initializeDBAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    category: dbObject.category,
    priority: dbObject.priority,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  };
};

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryAndPriorityProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.category !== undefined
  );
};

const hasCategoryAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery, response) => {
  if (requestQuery.priority !== undefined) {
    if (isValidProperty(requestQuery.priority)) {
      response.status(400);
      response.send("Invalid Todo Property");
      return false;
    } else {
      return true;
    }
  }
};

const hasCategoryProperty = (requestQuery, response) => {
  if (requestQuery.category !== undefined) {
    if (isValidCategory(requestQuery.category)) {
      response.status(400);
      response.send("Invalid Todo Category");
      return false;
    } else {
      return true;
    }
  }
};

const hasStatusProperty = (requestQuery, response) => {
  if (requestQuery.status !== undefined) {
    if (isValidStatus(requestQuery.status)) {
      response.status(400);
      response.send("Invalid Todo Status");
      return false;
    } else {
      return true;
    }
  }
};

const hasIdProperty = (id) => {
  return id !== undefined;
};
const hasTodoProperty = (requestQuery) => {
  return requestQuery.todo !== undefined;
};
const hasDueDateProperty = (requestQuery) => {
  if (requestQuery.due_date !== undefined) {
    if (isValid(requestQuery.due_date)) {
      response.status(400);
      response.send("Invalid Due Date");
      return false;
    } else {
      return true;
    }
  }
};

const isValidCategory = (category) => {
  if (
    (category !== "WORK") &
    (category !== "HOME") &
    (category !== "LEARNING")
  ) {
    return true;
  }
};

const isValidStatus = (status) => {
  if ((status !== "TO DO") & (status !== "IN PROGRESS") & (status !== "DONE")) {
    return true;
  }
};

const isValidProperty = (priority) => {
  if ((priority !== "HIGH") & (priority !== "MEDIUM") & (priority !== "LOW")) {
    return true;
  }
};

//GET todos API
app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status, category } = request.query;
  switch (true) {
    case hasStatusProperty(request.query, response):
      getTodosQuery = `
        SELECT
            *
        FROM
            todo 
        WHERE
            todo LIKE '%${search_q}%'
            AND status = '${status}';`;
      break;
    case hasPriorityProperty(request.query, response):
      getTodosQuery = `
        SELECT
            *
        FROM
            todo 
        WHERE
            todo LIKE '%${search_q}%'
            AND priority = '${priority}';`;
      break;
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
        SELECT
            *
        FROM
            todo 
        WHERE
            todo LIKE '%${search_q}%'
            AND status = '${status}'
            AND priority = '${priority}';`;
      break;
    case hasCategoryProperty(request.query, response):
      getTodosQuery = `
        SELECT
            *
        FROM
            todo 
        WHERE
            todo LIKE '%${search_q}%'
            AND category = '${category}';`;
      break;
    case hasCategoryAndStatusProperties(request.query):
      getTodosQuery = `
        SELECT
            *
        FROM
            todo 
        WHERE
            todo LIKE '%${search_q}%'
            AND status = '${status}'
            AND category = '${category}';`;
      break;
    case hasCategoryAndPriorityProperties(request.query):
      getTodosQuery = `
        SELECT
            *
        FROM
            todo 
        WHERE
            todo LIKE '%${search_q}%'
            AND status = '${status}'
            AND category = '${category}';`;
      break;
    default:
      getTodosQuery = `
        SELECT
            *
        FROM
            todo 
        WHERE
            todo LIKE '%${search_q}%';`;
  }
  data = await db.all(getTodosQuery);
  response.send(
    data.map((eachTodo) => convertDbObjectToResponseObject(eachTodo))
  );
});

//GET todo API
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `SELECT *
  FROM todo
  WHERE id=${todoId};`;
  const oneTodo = await db.get(getTodoQuery);
  response.send(convertDbObjectToResponseObject(oneTodo));
});

//GET date API
app.get("/agenda/", async (request, response) => {
  let { date } = request.query;
  date = format(new Date(date), "yyyy-MM-dd");
  let getDateQuery = `SELECT * FROM todo 
      WHERE due_date='${date}';`;
  const dateTodos = await db.all(getDateQuery);
  response.send(
    dateTodos.map((eachTodo) => convertDbObjectToResponseObject(eachTodo))
  );
});

// POST todo API
app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  const { id, todo, category, priority, status, dueDate } = todoDetails;
  const addTodoQuery = `
  INSERT INTO todo(id,todo,category,priority,status,due_date)
    VALUES(
        ${id},
        '${todo}',
        '${category}',
        '${priority}',
        '${status}',
        '${dueDate}'
    );`;
  const addTodo = await db.run(addTodoQuery);
  response.status(200);
  response.send("Todo Successfully Added");
});

// PUT todo API
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;
  let updateColumn = "";
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.category !== undefined:
      updateColumn = "Category";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
    case requestBody.dueDate !== undefined:
      updateColumn = "Due Date";
      break;
  }

  const previousTodoQuery = `
  SELECT *
  FROM todo
  WHERE id=${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);
  const {
    todo = previousTodo.todo,
    category = previousTodo.category,
    status = previousTodo.status,
    priority = previousTodo.priority,
    dueDate = previousTodo.due_date,
  } = request.body;
  const updateTodoQuery = `
  UPDATE todo
  SET
        todo='${todo}',
        category='${category}',
        status='${status}',
        priority='${priority}',
        due_date='${dueDate}'
  WHERE id=${todoId};`;
  await db.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

// DELETE todo API
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE FROM todo
    WHERE id=${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
