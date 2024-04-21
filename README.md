# Takweed Backend APP

<!--toc:start-->

- [Takweed Backend APP](#takweed-backend-app)
  - [Description](#description)
  - [Most important](#most-important)
  - [Install](#install)
  - [Dependencies used](#dependencies-used) - [Dependencies](#dependencies) - [DevDependencies used](#devdependencies-used)
  <!--toc:end-->

## Description

A backend app written in typescript nodejs using express framework,
It is hosted on firebase functions (Serverless)

## Most important

- Name of farm
- First point of farm cords
- detailed Address
- number of plots
- Date of committee (GPX Date?)

## Install

```bash
# Run npm install to install deps
npm install
# Build the project
npm run build
# for dev
npm run dev
# OR for firebase emulation, will build project.
npm run serve
# Or to deploy
npm run deploy
```

Note: All endpoints have pre appended `/takweed-eg/us-central1` in their routes

ex a client route: `GET /topics` will be `GET /takweed-eg/us-central1/client/topics`

## Dependencies used

### Dependencies

- @google-cloud/storage: Cloud Storage client for nodejs
- @turf/turf: used for performing geospatial operations with GeoJSON
- bcryptjs: Used to encrypt user passwords
- busboy: Streaming parser for HTML form data, used to handle recieved Files (Firebase functions don't have a way to parse multipart bodies)
- cors: Cors Middleware
- dotenv: Used to help in dev.
- exceljs: Workbook manager to read and write xlsx and csv Files.
- express: Unopinionated minimalist framework.
- fcm-node: used to send msgs using cloud messages (DEPRECATED)
- firebase-functions: Used to host and deploy our app
- form-data: Used to handle form data (In mail sending)
- mahaseel-gpxparser: Parses GPX Files and generates geoJson format.
- jsonwebtoken: JWT
- mongodb: Native is used for somequeries (MOVE TO MONGOOSE!)
- mongoose: ORM for mongodb
- node-fetch: behaves like browser fetch Api (Move to axios!)
- pdfkit: Used to generate PDF files
- qrcode: Creates QRCode using canvas
- swagger-jsdoc: Generates swagger files using jsdoc yaml comments
- swagger-ui-express: Hosts swagger files and serves them
- twitter_cldr: JavaScript implementation of the ICU (International Components for Unicode)

### DevDependencies used

Any `@types` package is for typescript

- typescript: Application Scale js development
- eslint: Pattern Checker for js (Static checker)
- prettier: Opinionated code formatter
- @typescript-eslint/eslint-plugin: Eslint plug for ts
- @typescript-eslint/parser: A custom parser for eslint that leverages Typescript ESTree
- eslint-config-google: Eslint google config (Hate it)
- eslint-config-prettier: Eslint prettier config (Don't format using eslint)
- eslint-plugin-prettier: Eslint prettier plugin (Any eslint format will be directed to prettier)
- firebase-functions-test: A testing companion to firebase-functions.
- jest: Delightful js testing
- supertest: sugeragent driven lib for testing http servers (e2e)
- ts-jest: a jest transformer that allows usage of jest in ts projects
- ts-node-dev: Used to launch dev server that respawns (Like nodemon)
