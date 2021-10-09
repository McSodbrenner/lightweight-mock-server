#!/usr/bin/node
const path = require('path')
const fs = require('fs')
const express = require('express')
const session = require('express-session')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const faker = require('faker')
const marked = require('marked')
const axios = require('axios')
const initConvenienceRoutes = require('./lib/convenienceRoutes')
const highlightjs = require('highlight.js')
const { Command } = require('commander')

// ---------- handle CLI parameters
const program = new Command()

program
  .option('-b, --build', 'Build a static representation of the mock definitions.')
  .option('-p, --port <port>', 'Port of the mock server.', 3030)
  .option('-e, --entrypoint <path>', 'Path to the entrypoint file with your API definitions.', './mock-data/api.js')

program.parse(process.argv)
const args = program.opts()
args.datapath = path.dirname(args.entrypoint)

function log(msg) {
	const date = new Date()
	console.log(`[${date.toTimeString()}:] ${msg}`)
}

// ---------- init environment
// extend the response object
express.response.sendMarkdown = function(filepath) {
	const css = fs.readFileSync(require.resolve('bare-css/css/bare.min.css')).toString()
	const css2 = fs.readFileSync(require.resolve('highlight.js/styles/atom-one-light.css')).toString()
	const content = marked(fs.readFileSync(filepath).toString(), {
		highlight: function(code, lang) {
			const language = highlightjs.getLanguage(lang) ? lang : 'plaintext'
			return highlightjs.highlight(code, { language }).value
		}
	})
	const html = `<section>${content}</section><style>${css}${css2}</style>`
	this.send(html)
}

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
	args,
	express,
	axios,
	session,
	faker,
	saveRoute,
}

// ---------- init express and all middlewares
const app = express()
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
	log('< ' + 'http://localhost' + req.originalUrl)
	next()
})

// ---------- integration of convenience and user routes
if (fs.existsSync(args.entrypoint)) {
	const cwd = process.cwd();
	process.chdir(args.datapath)
	const initUserRoutes = require(path.join(cwd, args.entrypoint)).default
	initUserRoutes(app, env)
} else {
	log(`Entrypoint file (${args.entrypoint}) does not exist and thus is ignored.`);
}
initConvenienceRoutes(app, env)

// ---------- default routes
// as routes cannot be overwritten in express we define them after the user routes so the user is able to replace them

// favicon.ico handling
app.get('/favicon.ico', (req, res) => {
	res.sendFile('favicon.ico', { root: __dirname })
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
