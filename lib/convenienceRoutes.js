const path = require('path')

module.exports = function(app, env) {
	// create a router for all internal requests that start with /-
	const internalRouter = env.express.Router()
	app.use('/-', internalRouter)

	// homepage of interal routes
	internalRouter.get('/', (req, res) => {
		res.sendMarkdown(path.join(__dirname, '../README.md'))
	})

	// send response for http status code, e.g. /500 or /400
	internalRouter.all('/:code(\\d{3})', (req, res) => {
		res.sendStatus(parseInt(req.params.code, 10))
	})

	// send response for http status code, e.g. /500 or /400
	internalRouter.all(/\/mirror(\/(.+))?/, (req, res) => {
		res.json({
			body: req.body,
			cookies: req.cookies,
			file: req.file,
			files: req.files,
			fresh: req.fresh,
			headers: req.headers,
			hostname: req.hostname,
			ip: req.ip,
			method: req.method,
			originalUrl: req.originalUrl,
			params: req.params,
			path: req.path,
			protocol: req.protocol,
			query: req.query,
			secure: req.secure,
			xhr: req.xhr,
		})
	})
}