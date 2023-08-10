import fs from 'node:fs';
import path from 'node:path';
import { Marked } from 'marked';
import { markedHighlight } from "marked-highlight";
import hljs from 'highlight.js';

const __dirname = path.dirname(import.meta.url.substring(7));
const cssBare	= fs.readFileSync(path.join(__dirname, '../node_modules/bare-css/css/bare.min.css')).toString()
const cssHljs	= fs.readFileSync(path.join(__dirname, '../node_modules/highlight.js/styles/atom-one-light.css')).toString()

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
