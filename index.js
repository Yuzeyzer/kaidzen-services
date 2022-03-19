import { Low, JSONFile } from 'lowdb';
import { join, dirname } from 'path';
import jsonServer from 'json-server';
import { fileURLToPath } from 'url';

const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();

const __dirname = dirname(fileURLToPath(import.meta.url));

const PORT = process.env.PORT || 8001;

server.use(middlewares);

const file = join(__dirname, 'db.json');
const adapter = new JSONFile(file);
const db = new Low(adapter);

server.use(jsonServer.bodyParser);

server.delete('/issues/column/:id', async (req, res) => {
  const { id } = req.params;
  await db.read();
  const issues = await db.data.issues;
  const column = await issues.columns[id];
  const taskId = req.query.taskId;

  delete issues.tasks[taskId];
  column.taskIds = column.taskIds.filter((id) => id !== taskId);

  await db.write();

  res.jsonp(column);
});

server.patch('/issues/tasks/:id', async (req, res) => {
  await db.read();
  const { id } = req.params;
  const { body } = req;

  const issues = await db.data.issues

  let task = await issues.tasks[id];
  const editedTask = { ...task, ...body };

  issues.tasks[id] = await editedTask;

  await db.write();

  res.json({ message: 'У нас получилось!)' });
});

server.post('/issues', async (req, res) => {
  await db.read();
  const issues = await db.data.issues;
  const body = await req.body;

  issues.tasks[body.id] = await { ...body, taskKey: issues.tasksCount + 1 };
  await issues.columns.column1.taskIds.push(body.id);
  issues.tasksCount = (await issues.tasksCount) + 1;

  await db.write();

  res.jsonp(issues);
});

server.put('/issues/column/', async (req, res) => {
  await db.read();
  const issues = await db.data.issues;
  const { columnIds } = req.query;
  const body = req.body;
  const columns = columnIds.split(',');

  if (columns[0] === columns[1]) {
    issues.columns[columns[0]] = body[columns[0]];
  } else {
    columns.forEach((columnId) => {
      issues.columns[columnId] = body[columnId];
    });
  }

  await db.write();
});

server.use(router);
server.listen(PORT, () => {
  console.log('JSON Server is running on port: ', PORT);
});

module.exports = server
