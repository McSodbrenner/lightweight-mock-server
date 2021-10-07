# Lightweight Mock Server

A lightweight and simple but flexible mock server for [node](http://nodejs.org) which is based on the [Express](https://expressjs.com/) framework and just extended with some convenience features.

---

## Quick Start

Install it as local dependency for your project:  
`$ npm install lightweight-mock-server`

Start the server:  
`$ npx nodemon lightweight-mock-server`

View this README at: http://localhost:3030/-

---

## Configuration

You can pass some arguments the behaviour of lightweight-mock-server. For example pass the port if you want a port different from 3030.  
`$ npx nodemon lightweight-mock-server --port=3000`

See all parameters via:  
`$ npx lightweight-mock-server --help`

---

## Create your own mock environment

You have to create a file an entrypoint file (default: `./mock-data/api.js`) for your mock definitions.
This ES6 file has to export a function and gets two parameters passed:

| Parameter | Description
|-----------|------------
| **app** | A standard "Express" app object you can use to define your routes and your API functionality.
| **env** | An object with some variables and helpers.
| *env*.args | The arguments which were passed to the CLI command.
| *env*.express | The [Express](http://expressjs.com/) object. Useful to instantiate an Router object.
| *env*.session | An [express-session](https://www.npmjs.com/package/express-session) object to be able to handle use login/logout functionality.
| *env*.faker | A [faker](http://marak.github.io/faker.js/) instance to be able to use fake data.
| *env*.__dirname | As we use ES6 syntax __dirname is usually not available. But it is faked to be able to send a file as response.

---

## Commented example  

```js
export default function(app, env) {
	// if you want all your routes to be available via /api/* use this,
	// otherwise you would have to use app.* instead of router.* for all route definitions
	const router = env.express.Router()
	app.use('/api', router)
	
	// a simple possibility to delay all requests to simulate a slow network
	// if we create a static build we don't want to have this delay
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
		res.sendFile('colors.json', { root: env.__dirname })
	})    

	// faker is already included
	// endpoint available via /api/faker
	router.get('/faker', (req, res) => {
		res.json({ name: env.faker.helpers.createCard() })
	})    

	// session handling is already included (useful to fake a simple login system)
	// endpoint available via /api/user
	router.get('/user', (req, res) => {
		if (!req.query.action) {
			res.send('logged in: ' + (req.session.loggedin ? 'true' : 'false'))
		}
		else if (req.query.action === 'login') {
			req.session.loggedin = true
			res.send('logged in')
		}
		else if (req.query.action === 'logout') {
			req.session.loggedin = false
			res.send('logged out')
		}
	})
}     
```

---

## Convenience functions

All routes starting with `/-/` are endpoints with convenience functionality.


| Endpoint | Description |
|-----------|-----------|
| `/-` or `/-/` | Shows this README. |
| `/-/500`<br />`/-/404`<br />`/-/403`<br />`/-/xxx` | Returns the HTTP error message with the corresponding HTTP status code. |
| `/-/mirror` | Returns a JSON object with several data you can use to analyze your request. |

The response (`res`) object was extended with the following methods:

| Method | Description |
|-----------|-----------|
| `res.sendMarkdown(FILEPATH)` | Sends a nicely rendered Markdown file as response. It will be rendered by [marked](https://marked.js.org/) and styled by [bare.css](https://barecss.com/). |

---

## Static build generation

If you have a static build of your clickdummy it could make sense to have a static build of your mocked api too. For this reason it's possible to save static files of your API endpoints. As your API endpoints can be very individual programmed it is not possible to simple generate the static files without your assistance.

For this to work you have to export a function named `build` from your entrypoint file (default: `./mock-data/api.js`).

### Example

```js
export function build(_app, env) {
	return [
		env.saveRoute('get', ['/'], 'dist/api/README.htm'),
		env.saveRoute('get', ['/colors'], 'dist/api/colors'),
		env.saveRoute('get', ['/api/faker'], 'dist/api/faker'),
	]
}
```

This function has to return an array of promises. lightweight-mock-server provides a helper function which utilizes [axios](https://axios-http.com/) to access your API called `saveRoute()`. It excepts three parameters: `axiosMethod` (the method of axios that will be called), `axiosParams` (params that will be passed to axios via apply; so you are free to finetune your HTTP request) and `filePath` (the path the result of the HTTP request will be saved to).

To generate you static build, simply call:  
`$ npx lightweight-mock-server --build`

---

## License

[ISC License (ISC)](https://opensource.org/licenses/ISC)  
Copyright 2021 Christoph Erdmann

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.