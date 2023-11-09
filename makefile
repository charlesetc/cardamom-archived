build:
	esbuild app.jsx --bundle --minify --sourcemap --target=chrome58,firefox58 --outfile=out.js

watch:
	esbuild app.jsx --bundle --sourcemap --target=chrome58,firefox58 --outfile=out.js --watch

serve:
	python -m http.server 8000
