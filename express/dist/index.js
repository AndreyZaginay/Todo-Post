"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
var Users;
(function (Users) {
    const PATH = node_path_1.default.resolve(node_path_1.default.join(__dirname, '..', 'users.json'));
    let PRIMARY_KEY = -1;
    function init() {
        return __awaiter(this, void 0, void 0, function* () {
            const users = yield findAll();
            if (!users)
                return;
            PRIMARY_KEY = users[users.length - 1].id++;
        });
    }
    Users.init = init;
    function read() {
        return __awaiter(this, void 0, void 0, function* () {
            return promises_1.default.readFile(PATH);
        });
    }
    function write(data) {
        return __awaiter(this, void 0, void 0, function* () {
            yield promises_1.default.writeFile(PATH, JSON.stringify(data, null, 3));
        });
    }
    function findAll() {
        return __awaiter(this, void 0, void 0, function* () {
            return JSON.parse((yield read()).toString());
        });
    }
    Users.findAll = findAll;
    function find(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield findAll()).find(({ id }) => id === userId);
        });
    }
    Users.find = find;
    function add(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            const users = yield findAll();
            const newUser = Object.assign({ id: ++PRIMARY_KEY }, payload);
            users.push(newUser);
            yield write(users);
            return newUser;
        });
    }
    Users.add = add;
    function patch(userId, payload) {
        return __awaiter(this, void 0, void 0, function* () {
            const users = yield findAll();
            const user = users.find(({ id }) => id === userId);
            if (!user)
                return;
            const updatedUser = Object.assign(Object.assign({}, user), payload);
            users.splice(users.indexOf(user), 1, updatedUser);
            yield write(users);
            return updatedUser;
        });
    }
    Users.patch = patch;
    function remove(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const users = yield findAll();
            const removedUser = users.find(({ id }) => id === userId);
            if (!removedUser)
                return;
            users.splice(users.indexOf(removedUser), 1);
            yield write(users);
            return removedUser;
        });
    }
    Users.remove = remove;
})(Users || (Users = {}));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: 'http://localhost:4200',
    methods: 'GET, POST, PATCH, DELETE'
}));
app.use(express_1.default.json());
app.get('/users', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield Users.findAll();
        if (!data)
            res.status(500).json({ message: `users not found` });
        res.json(data);
    }
    catch (e) {
        res.status(500);
    }
}));
app.get('/users/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = +req.params.id;
        const user = yield Users.find(userId);
        if (!user)
            res.status(400).json({ message: `user ${userId} not found` });
        res.json(user);
    }
    catch (e) {
        res.status(500);
    }
}));
app.post('/users', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const payload = req.body;
        const newUser = yield Users.add(payload);
        if (!newUser)
            res.status(500).json({ message: `user creation has failed` });
        res.status(201).json(newUser);
    }
    catch (e) {
        res.status(500);
    }
}));
app.patch('/users/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = +req.params.id;
        const payload = req.body;
        const updatedUser = yield Users.patch(userId, payload);
        if (!updatedUser)
            res.status(500).json({ message: `user updating has failed` });
        res.json(updatedUser);
    }
    catch (e) {
        res.status(500);
    }
}));
app.delete('/users/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = +req.params.id;
        const removedUser = yield Users.remove(userId);
        if (!removedUser)
            res.status(500).json({ message: `user removing has failed` });
        res.json(removedUser);
    }
    catch (e) {
        res.status(500);
    }
}));
app.listen(4500, () => __awaiter(void 0, void 0, void 0, function* () { return yield Users.init(); }));
app.on('error', (e) => console.log(e));
