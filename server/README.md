# JSON Server (temporary API)

This folder holds the mock database for [json-server](https://github.com/typicode/json-server), used as a temporary backend until Firebase is integrated.

## Run the API

From the project root:

```bash
npm install
npm run api
```

The API will be at **http://localhost:3000** with:

- `GET/POST/PATCH/DELETE /residents`
- `GET/POST/PATCH/DELETE /requests`
- `GET/POST/PATCH/DELETE /households`
- `GET/POST/PATCH/DELETE /users`
- `GET/POST/PATCH/DELETE /roles`

Then run the app in another terminal: `npm start`. The app is configured to use this API when `USE_JSON_SERVER` is `true` in `app.config.ts`. Set it to `false` to use localStorage again.

## Data

Edit `db.json` to change seed data. json-server persists changes to the file when you add/update/delete via the API.
