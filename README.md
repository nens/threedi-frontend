# threedi-frontend
Extraction and refactoring of the threedi frontend. Angular frontend for threedi.

## install and running
This uses npm for packaging and npm scripts for running it in development mode.
For development mode we use webpack. So don't get startled when you install
the dependencies, it's a whole lot. But only a small part is being used in
production.

* Clone repository
* Install dependencies
* Run webpack

```bash
git clone git@github.com:nens/threedi-ng
cd threedi-ng
npm install
npm start
```

## Roadmap

Working hard to fix the current bugs

- [ ] serving of static files in dev mode
- [ ] deployment
- [ ] authentication (thinking of jwt tokens)
- [ ] get the map back
- [ ] sliders
- [x] modals refactor
- [x] restructure app
- [x] linting
- [x] webpack for builds
- [x] independent(-ish) of back-end
- [x] proxy backend with dev-server

## developing
The start point of the app is `app/threedi.js` and `app/index.html`.
This is the file that instantiates the angular module and includes all files
that are needed.

To get started with development like adding a new widget. We would like all new
things to be like components. A component has its own HTML/CSS/JS and lives
in its own folder like so:
```
components
components\mywidget
components\mywidget\mywidget.html
components\mywidget\mywidget.scss
components\mywidget\mywidget.js
```
For now this needs to be included manually in the `threedi.js` file.

### scss
The styleguides at the moment are plain old CSS stored as SCSS, but we use Sass
to compile it already, so it can easily be refactored.
The styles can be found in `app/styles`

### templates
Angular uses templates that in our case are stored in the `app/templates`
folder.
For now the templates need to be manually included otherwise they won't be build
by webpack. You can find this in `app/templates.js`

### controllers
The biggest mess is still in `app/controllers`. This folder contains all of the
angular controllers, that really don't need be controllers but are. Sorry about
that.
We're working hard on refactoring that.
