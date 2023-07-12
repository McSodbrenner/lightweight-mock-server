const api = function(app, env) {
	// if you want all your routes to be available via /api/* use this,
	// otherwise you would have to use app.* instead of router.* for all route definitions
	const router = env.express.Router()
	app.use('/api', router)
	
	// a simple possibility to delay all requests to simulate a slow network
	router.use((req, res, next) => {
		setTimeout(next, env.args.build ? 0 : 1000)
	})

	// an example which renders your README.md with the docs for your API
	// the command "sendMarkdown" is an extension for the response object by lightweight-mock-server
	// endpoint available via /api
	app.get('/', (req, res) => {
		res.sendMarkdown('README.md')
	})    

	// if your response doesn't have to be dynamic you can also just return a file you've prepared
	// endpoint available via /api/colors
	router.get('/colors', (req, res) => {
		res.sendFile('colors.json', { root: env.data })
	})    

	// faker is already included
	// endpoint available via /api/fake
	router.get('/fake', (req, res) => {
		res.json({ name: env.falso.randFullName() })
	})    

	// session handling is already included (useful to fake a simple login system)
	// endpoint available via /api/user
	router.get('/user', (req, res) => {
		if (!req.query.action) {
			res.send('logged in: ' + (env.session.loggedin ? 'true' : 'false'))
		}
		else if (req.query.action === 'login') {
			env.session.loggedin = true
			res.send('logged in')
		}
		else if (req.query.action === 'logout') {
			env.session.loggedin = false
			res.send('logged out')
		}
	})
}

const build = function(_app, env) {
	return [
		env.saveRoute('get', ['/'], '../../mock-data-static/api/README.htm'),
		env.saveRoute('get', ['/api/colors'], '../../mock-data-static/api/colors'),
		env.saveRoute('get', ['/api/faker'], '../../mock-data-static/api/faker'),
	]
}

export {
	api as default,
	build,
};

