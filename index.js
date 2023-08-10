#!/usr/bin/node
import fs from 'node:fs';
import path from 'node:path';
import url from 'url';
import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import axios from 'axios';
import initConvenienceRoutes from './lib/convenienceRoutes.js';
import templateEngineMarkdown from './lib/templateEngineMarkdown.js';
import { Command } from 'commander';

// ---------- handle CLI parameters
const program = new Command()

program
  .option('-b, --build', 'Build a static representation of the mock definitions.')
  .option('-p, --port <port>', 'Port of the mock server.', 3030)
  .option('-e, --entrypoint <path>', 'Path to the entrypoint file with your API definitions.', './mock-data/api.js')

program.parse(process.argv)
const args = program.opts()
const cwd = process.cwd();
const root = path.dirname(url.fileURLToPath(import.meta.url));
const data = path.resolve(path.join(cwd, path.dirname(args.entrypoint)));

function log(msg) {
	console.log(`[${new Date().toLocaleTimeString()}] ${msg}`)
}

// ---------- init environment
const saveRoute = function(axiosMethod, axiosParams, filepath) {
	axiosParams[0] = new URL(axiosParams[0], `http://localhost:${args.port}`).href;
	return axios[axiosMethod].apply(this, axiosParams).then(function(response) {
		fs.writeFile(filepath, response.data, function (err) {
			if (err) return log(err)
			log(`> "${filepath}"`)
		})
	})
}

// by default axios tries to interpret the result. We don't want this as we just want to save the raw data
axios.defaults.responseType = 'arraybuffer'

const env = {
	cwd,
	data,
	args,
	express,
	axios,
	session,
	saveRoute,
}

// ---------- init express and all middlewares
const app = express()

app.engine('md', templateEngineMarkdown(env));
app.set('views', '.')
app.set('view engine', 'md')

app.use(cors())
app.use(session({
	secret: 'mock-server',
	resave: false,
	saveUninitialized: false,
	cookie: { maxAge: 60000 },
}))
app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
app.use(cookieParser())

// show current request in console
app.use('*', (req, res, next) => {
	log('< ' + `${req.method} ${req.protocol}://${req.hostname}:${args.port}` + req.originalUrl)
	next()
})

// ---------- integration of convenience and user routes
if (fs.existsSync(args.entrypoint)) {
	process.chdir(path.dirname(args.entrypoint))
	const initUserRoutes = (await import(path.join(env.cwd, args.entrypoint))).default;
	initUserRoutes(app, env)
} else {
	log(`Entrypoint file (${args.entrypoint}) does not exist and thus is ignored.`);
}
initConvenienceRoutes(app, env)

// ---------- default routes
// as routes cannot be overwritten in express we define them after the user routes so the user is able to replace them

// favicon.ico handling
app.get('/favicon.ico', (req, res) => {
	res.sendFile('favicon.ico', { root })
})

// 404 handling for non existing routes
app.get('*', (req, res) => {
	res.status(404)
	res.send('Route not defined')
})

// ---------- start the server
const server = app.listen(args.port, () => {
	log(`Mock server listening at http://localhost:${args.port}`)
})

if (args.build) {
	(async function(){
		const buildUserRoutes = require(path.join(cwd, args.entrypoint)).build
		axios.all(buildUserRoutes(app, env)).then(() => {
			server.close();
		})
	})()
}
