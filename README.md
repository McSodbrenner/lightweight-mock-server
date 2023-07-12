# Lightweight Mock Server

A lightweight and simple but flexible mock server for [node](http://nodejs.org) which is based on the [Express](https://expressjs.com/) framework and just extended with some convenience features.

Unlike other solutions, the endpoints are specified programmatically rather than descriptively, which gives you more freedom to design your endpoints (e.g. sorting or filtering of entries can actually be implemented).


## Quick Start

Install it as local dev dependency for your project:  
`$ npm i --save-dev lightweight-mock-server`

Start the server:  
`$ npx lightweight-mock-server`  
or better (to automatically restart the server on changes to your API)  
`$ npx nodemon --exec npx lightweight-mock-server`

View this README at: http://localhost:3030/-


## Configuration

You can pass some arguments to adjust the behaviour of the mock server. For example pass the port if you want a port different from 3030.  
`$ npx lightweight-mock-server --port=3000`

See all parameters via:  
`$ npx lightweight-mock-server --help`

At the moment there are three parameters:

| Parameter | Abbreviation | Description
|-----------|------------|-----
| `--port` | `-p` | Port of the mock server. (default: 3030)
| `--entrypoint` | `-e` | Path to the entrypoint file with your API definitions. (default: `./mock-data/api.js`)
| `--build` | `-b` | Build a static representation of the mock definitions.
| `--help` | `-h` | Display help.


## Create your own mock environment

You have to create a file an entrypoint file (default: `./mock-data/api.js`) for your mock definitions.
This file has to export a default function and gets two parameters passed:

| Parameter | Description
|-----------|------------
| **app** | A standard "Express" app object you can use to define your routes and your API functionality.
| **env** | An object with some variables and helpers.
| *env*.root | The path to the mock library root.
| *env*.data | The path to the entrypoint dir.
| *env*.args | The arguments which were passed to the CLI command.
| *env*.express | The [Express](http://expressjs.com/) object. Useful to instantiate a Router object.
| *env*.axios | An axios instance.
| *env*.session | An [express-session](https://www.npmjs.com/package/express-session) object to be able to handle e.g. authentication.
| *env*.saveRoute | ...


### Commented example  

```js
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

export {
	api as default,
};
```


## Convenience routes

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


## Static build generation

If you have a static build of your clickdummy it could make sense to have a static build of your mocked api too to be able to upload your complete clickdummy to a webspace which is only capable of delivering static ressources. For this reason it's possible to save static files of your API endpoints. As your API endpoints can be very individually programmed it is not possible to simple generate the static files without your assistance.

For this to work you have to export a function named `build` from your entrypoint file (default: `./mock-data/api.js`).


### Example

```js
const build = function(_app, env) {
	return [
		env.saveRoute('get', ['/'], 'dist/api/README.htm'),
		env.saveRoute('get', ['/api/colors'], 'dist/api/colors'),
		env.saveRoute('get', ['/api/faker'], 'dist/api/faker'),
	]
}

export {
	api as default,
	build,
};
```

This function has to return an array of promises. lightweight-mock-server provides a helper function called `saveRoute()` which utilizes [axios](https://axios-http.com/) to access your API. It excepts three parameters: `axiosMethod` (the method of axios that will be called), `axiosParams` (parameters that will be passed to axios via apply; so you are free to finetune your HTTP request) and `filePath` (the path the result of the HTTP request will be saved to).

To generate your static build, simply call:  
`$ npx lightweight-mock-server --build`

## License

[ISC License (ISC)](https://opensource.org/licenses/ISC)  
Copyright 2021 Christoph Erdmann

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.