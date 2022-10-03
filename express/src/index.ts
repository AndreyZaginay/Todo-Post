import express from 'express';
import cors from 'cors';
import fs from 'node:fs/promises';
import path from 'node:path';

namespace Users {
  const PATH: string = path.resolve(path.join(__dirname, '..', 'users.json'));
  let PRIMARY_KEY: number = -1;

  export interface User {
    id: number;
    firstname: string;
    lastname: string;
    age: number;
    birthday: Date;
  }

  export type CreateUserDto = Omit<User, 'id'>;
  export type UpdateUserDto = Partial<Omit<User, 'id' | 'age' | 'birthday'>>;

  export async function init(): Promise<void> {
    const users: User[] | undefined = await findAll();
    if (!users) return;
    PRIMARY_KEY = users[users.length - 1].id++;
  }

  async function read(): Promise<Buffer> {
    return fs.readFile(PATH)
  }

  async function write<T>(data: T): Promise<void> {
    await fs.writeFile(PATH, JSON.stringify(data, null, 3));
  }

  export async function findAll(): Promise<User[]> {
    return JSON.parse((await read()).toString()) as User[];
  }

  export async function find(userId: number): Promise<User | undefined> {
    return (await findAll()).find(({ id }: Users.User) => id === userId);
  }

  export async function add(payload: CreateUserDto): Promise<User> {
    const users: User[] = await findAll();
    const newUser: User = { id: ++PRIMARY_KEY, ...payload };
    users.push(newUser);
    await write<User[]>(users);
    return newUser;
  }

  export async function patch(userId: number, payload: UpdateUserDto): Promise<User | undefined> {
    const users: User[] = await findAll();
    const user: User | undefined = users.find(({ id }: User) => id === userId);
    if (!user) return;
    const updatedUser: User = { ...user, ...payload };
    users.splice(users.indexOf(user), 1, updatedUser);
    await write<User[]>(users);
    return updatedUser;
  }

  export async function remove(userId: number): Promise<User | undefined> {
    const users: User[] = await findAll();
    const removedUser: User | undefined = users.find(({ id }: User) => id === userId);
    if (!removedUser) return;
    users.splice(users.indexOf(removedUser), 1);
    await write<User[]>(users);
    return removedUser;
  }
}

const app: express.Express = express();
app.use(cors({
  origin: 'http://localhost:4200',
  methods: 'GET, POST, PATCH, DELETE'
}));
app.use(express.json());

app.get('/users', async (req, res) => {
  try {
    const data: Users.User[] | undefined = await Users.findAll();
    if (!data) res.status(500).json({ message: `users not found` })
    res.json(data);
  } catch (e) {
    res.status(500);
  }
});

app.get('/users/:id', async (req, res) => {
  try {
    const userId: number = +req.params.id;
    const user: Users.User | undefined = await Users.find(userId);
    if (!user) res.status(400).json({ message: `user ${ userId } not found` });
    res.json(user);
  } catch (e) {
    res.status(500);
  }
});

app.post('/users', async (req, res) => {
  try {
    const payload: Users.CreateUserDto = req.body;
    const newUser: Users.User | undefined = await Users.add(payload);
    if (!newUser) res.status(500).json({ message: `user creation has failed` });
    res.status(201).json(newUser);
  } catch (e) {
    res.status(500);
  }
});

app.patch('/users/:id', async (req, res) => {
  try {
    const userId: number = +req.params.id;
    const payload: Users.UpdateUserDto = req.body;
    const updatedUser: Users.User | undefined = await Users.patch(userId, payload);
    if (!updatedUser) res.status(500).json({ message: `user updating has failed` });
    res.json(updatedUser);
  } catch (e) {
    res.status(500);
  }
});

app.delete('/users/:id', async (req, res) => {
  try {
    const userId: number = +req.params.id;
    const removedUser: Users.User | undefined = await Users.remove(userId);
    if (!removedUser) res.status(500).json({ message: `user removing has failed` });
    res.json(removedUser);
  } catch (e) {
    res.status(500);
  }
});

app.listen(4500, async () => await Users.init());

app.on('error', (e) => console.log(e));