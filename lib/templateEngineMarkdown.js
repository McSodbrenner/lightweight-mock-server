import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { Marked } from 'marked';
import { markedHighlight } from "marked-highlight";
import hljs from 'highlight.js';

const nodeModules = execSync('npm root').toString().trim();
const cssBare	= fs.readFileSync(path.join(nodeModules, './bare-css/css/bare.min.css')).toString()
const cssHljs	= fs.readFileSync(path.join(nodeModules, './highlight.js/styles/atom-one-light.css')).toString()

const marked = new Marked(
	markedHighlight({
		langPrefix: 'hljs language-',
		highlight(code, lang) {
			const language = hljs.getLanguage(lang) ? lang : 'plaintext';
			return hljs.highlight(code, { language }).value;
		}
	})
);

export default function init(env) {
	return (filepath, data, callback) => { // define the template engine
		const content			= marked.parse(fs.readFileSync(filepath).toString())
		const html = `<section>${content}</section><style>${cssBare}${cssHljs}</style>`
		return callback(null, html);
	};
};
