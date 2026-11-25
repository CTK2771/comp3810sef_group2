# comp3810sef_group2
Github repository: https://github.com/CTK2771/comp3810sef_group2.git
## Project Information
**Project name:** Machine Learning Experiment Tracker

This server-side application keeps a record of machine learning experiment. A user logs in with a name and password, or with Facebook, and then creates, searches, updates, and delete that user's own experiments. The same records can also be created, read, updated, and deleted through RESTful API services.

**Cloud-based server URL:** https://sample-deploy-13492771-app-c9daebfabsavebca.southafricanorth-01.azurewebsites.net
## Group Information
Group Number: 2
- Cheung Tsz Kin, 13492771
  - Role: Group leader and backend developer
  - Responsibilities: Coordinated the group and managed the project submission. Built the Express server, the MongoDB connection and the deployment on Azure.
- Chu Pak Yeun, 13484052
  - Role: Authentication developer
  - Responsibilities: Built the Facebook login and the name-and-password login for the guest and developer accounts, including the logout and the rule that the experiment pages open only after login.
- Li Yu Hong, 13812771
  - Role: Web developer
  - Responsibilities: Built the pages for creating an experiment, viewing its details, updating it, and deleting it after confirmation.
- Wong Chun Ho, 13486322 
  - Role: API developer
  - Responsibilities: Built the experiment search and the eight RESTful services: create, read by title, update, delete, read by status, search, read all, and count, including the curl commands.
- Liu Chun Kuen, 13496388
  - Role: UI developer
  - Responsibilities: Built the page layout and styling, and wrote the README and the demo script.
## Project File Introduction
- `server.js`
    - Starts the Express server on `process.env.PORT`, or on port 8099 when that variable is unset.
    - Connects to MongoDB with `process.env.MONGODB_URI`, using the database `comp3810sef` and collection `experiments`.
    - Provides login with the names `guest` and `developer`, and Facebook login through Passport. The login is kept in `express-session`, and logout is provided. The experiment pages require a user to log in.
    - For a logged-in user, provides web pages to create an experiment, search and list that user's experiments, open details, update an experiment, and delete an experiment after confirmation.
    - Provides eight RESTful services without login: create, read by title, update by title, delete by title, read by status, search, read all, and count.
    - Provides public `/privacy` and `/deletion` pages.
- `package.json`
    - **body-parser** `*`: Reads form and JSON request bodies
    - **ejs** `*`: Renders the pages in `views`
    - **express** `*`: Web framework and routing
    - **express-session** `*`: Stores the login session
    - **mongodb** `^6.7.0`: MongoDB Node.js driver
    - **nodemon** `*`: Included for development restarts, `npm start` does not use it
    - **passport** `*`: Authentication middleware for Node.js
    - **passport-facebook** `*`: Node.js authentication strategy for Passport to allow logins from Facebook
- `public`
    - **HKMU-logo-full-v.png**: Image of HKMU logo
    - **style.css**: Custom UI and responsive design
- `views`
    - **confirm.ejs**: Page for delete confirmation 
    - **create.ejs**: Page for creating experiments
    - **deletion.ejs**: Page for handling data deletion of Facebook name and ID
    - **details.ejs**: Page for displaying the details of the created experiments
    - **edit.ejs**: Page for updating the details of the experiments
    - **footer.ejs**: Reusable footer component
    - **header.ejs**: Reusable header component
    - **info.ejs**: Message page that shown after an update or a delete, with a button back to the experiments page.
    - **list.ejs**: Page for listing all the experiments created
    - **login.ejs**: Login page
    - **privacy.ejs**: Page for informing the use of users' credentials and created experiments
## Operation Guides
### How to Start
#### Cloud
The application is deployed and available at: https://sample-deploy-13492771-app-c9daebfabsavebca.southafricanorth-01.azurewebsites.net/login
#### Local Development (need MongoDB URI from application owner)
To run the application locally:
1. Open the link https://github.com/CTK2771/comp3810sef_group2.git and download all the files or `git clone` the link.
2. Install dependencies:
    ```bash
    npm install
    ```
3. In the same terminal, enter MongoDB URI:
    ```bash
    export MONGODB_URI='mongodb+srv://xxxxxxx'
    ```
4. Start the server, then open http://localhost:8099. Leave `CALLBACK_URL` unset.
    ```bash
    npm start
    ```
### Login
Open the cloud URL. The login page has two ways to log in.

For a name and password, type one of these accounts and click **Log in**:

- Name `guest`, password `guest`
- Name `developer`, password `developer`

Each account sees only the experiments created while that account is logged in. A wrong name or password stays on the login page and shows `The name or password is not correct.`

For Facebook, click **Log in with Facebook** and approve the request. This works for the Facebook account that owns the app, or for an account that has accepted a tester invitation. The server stores that person's Facebook name and Facebook id.

After either login, the experiments page opens. The header shows `Welcome` and that person's name. The experiment pages cannot be opened before login. A direct visit is redirected to `/login`.
### Logout
- On any experiment page, you can click **Logout** at the right side of the top bar. The server ends the session and returns to the login page. Create, search, update, and delete are unavailable until the user logs in again.
### CRUD
#### Create
- **Page Entry**: Click **New experiment** in the top bar. The **Create a new experiment** link appears only when the list is empty.    
- authenticated users can create a new experiment by filling in the form:
    - Title (user-define)
    - Status ("Queued", "Running", "Completed", "Failed")
    - Model (user-define)
    - Dataset (user-define)
    - Metric name ("Accuracy", "Precision", "Recall", "F1", "RMSE", "MAE", "MSE", "BLEU", "Other")
    - Other metric name (user-define, if metric name is "Other")
    - Score (user-define)
    - Loss (user-define)
    - Learning rate (user-define)
    - Epochs (user-define)
    - Batch size (user-define)
    - Tags (user-define)
    - Notes (user-define)
- if "Create" button is clicked, a new experiment will be created and users will be redirected to the experiments page while the created experiment will also be displayed on the experiments page.
#### Read
##### Search
- **Page Entry**: Access automatically after login or through "Experiments" button on the right side of the top panel
Operation(s):
- authenticated users can search experiments based on any of the following requirements:
    - Status
    - Model
    - Dataset
    - Tag
    - Title contains
    - Metric name
    - Minimum score
- if "Search" button is clicked, only experiments which are matching the criteria will be displayed.
- if "Clear" button is clicked, all criteria entered will be cleared and all created experiments will be displayed.
##### Display of Experiments (main page)
- **Page Entry**: Access automatically after login or through "Experiments" button on the right side of the top panel
Operation(s):
- authenticated users can see the search panel, number of experiments for 4 statuses and created experiments.
- a minimum score is applied only when a metric name is also filled in. The four status counts show all of that user's experiments, including experiments outside the current search.
- each status can be selected, and experiments with some of their details (experiment, model and dataset names, and score of the defined metric) from that status will be displayed.
- if no experiments available or no matching experiments, "No experiments match this search. Create a new experiment." is shown.
##### Display of Experiments (experiment details page)
- **Page Entry**: Access through clicking one of the created experiments
Operation(s):
- authenticated users can select an experiment and check its full details with additional information, including the time created and the owner of the experiment.
#### Update
##### Edit
- **Page Entry**: Access through "Edit" button after clicking one of the created experiments
Operation(s):
- authenticated users can edit the details of the experiment in the form similarly to the create page.
##### Update Notification
- **Page Entry**: On the edit page, click **Update**.
- The page shows `Updated 1 experiment.`
- Click **Back to experiments** to return to the experiments page.
#### Delete
- On the details page, click **Delete**. The confirmation page shows the experiment title.
- Click **Delete** to remove it. The next page shows `Experiment "<title>" removed.`
- Click **Back to experiments** to return to the list.
- Click **Cancel** on the confirmation page to keep the experiment and return to its details.
## RESTful CRUD Services
### List of API
(HTTP Request Type | Path URI)
1. `GET | '/api/experiments'`
2. `GET | '/api/experiments/search'`
3. `GET | '/api/experiments/count'`
4. `GET | '/api/experiments/title/:title'`
5. `GET | '/api/experiments/status/:status'`
6. `POST | '/api/experiments'`
7. `PUT | '/api/experiments/title/:title'`
8. `DELETE | '/api/experiments/title/:title'`
### Testing Commands (run in order)
The JSON blocks below are examples from one test. A new run receives a new `_id` and `createdAt`. Read-all and count return every experiment in the database, so those two results can contain more records than `curl-test`.
### Cloud commands:
1. Create - HTTP Request Type: POST
<br/>Path URI: `/api/experiments`

```bash
curl -X POST -H "Content-Type: application/json" -d '{"title":"curl-test","model":"logistic","dataset":"iris","status":"queued","metricName":"F1","metricValue":0.74,"loss":0.42,"learningRate":0.01,"epochs":10,"batchSize":32,"tags":"demo","notes":"first run"}' "https://sample-deploy-13492771-app-c9daebfabsavebca.southafricanorth-01.azurewebsites.net/api/experiments"
```
Response:
```json
{"title":"curl-test","model":"logistic","dataset":"iris","status":"queued","metricName":"F1","metricValue":0.74,"loss":0.42,"learningRate":0.01,"epochs":10,"batchSize":32,"tags":"demo","notes":"first run","createdAt":"2026-11-24T09:10:09.091Z","_id":"6b0554714c584295f0d61602"}
```
2. Read (by title) - HTTP Request Type: GET
<br/>Path URI: `/api/experiments/title/:title`

```bash
curl "https://sample-deploy-13492771-app-c9daebfabsavebca.southafricanorth-01.azurewebsites.net/api/experiments/title/curl-test"
```
Response:
```json
[{"_id":"6b0554714c584295f0d61602","title":"curl-test","model":"logistic","dataset":"iris","status":"queued","metricName":"F1","metricValue":0.74,"loss":0.42,"learningRate":0.01,"epochs":10,"batchSize":32,"tags":"demo","notes":"first run","createdAt":"2026-11-24T09:10:09.091Z"}]
```
3. Update - HTTP Request Type: PUT
<br/>Path URI: `/api/experiments/title/:title`

```bash
curl -X PUT -H "Content-Type: application/json" -d '{"metricName":"F1","metricValue":0.91,"status":"completed"}' "https://sample-deploy-13492771-app-c9daebfabsavebca.southafricanorth-01.azurewebsites.net/api/experiments/title/curl-test"
```
Response:
```json
{"acknowledged":true,"modifiedCount":1,"upsertedId":null,"upsertedCount":0,"matchedCount":1}
```
4. Read (by status) - HTTP Request Type: GET
<br/>Path URI: `/api/experiments/status/:status`

```bash
curl "https://sample-deploy-13492771-app-c9daebfabsavebca.southafricanorth-01.azurewebsites.net/api/experiments/status/completed"
```
Response:
```json
[{"_id":"6b0554714c584295f0d61602","title":"curl-test","model":"logistic","dataset":"iris","status":"completed","metricName":"F1","metricValue":0.91,"loss":0.42,"learningRate":0.01,"epochs":10,"batchSize":32,"tags":"demo","notes":"first run","createdAt":"2026-11-24T09:10:09.091Z"}]
```
5. Search - HTTP Request Type: GET
<br/>Path URI: `/api/experiments/search`

```bash
curl "https://sample-deploy-13492771-app-c9daebfabsavebca.southafricanorth-01.azurewebsites.net/api/experiments/search?status=completed&metric=F1&minScore=0.90"
```
Response:
```json
[{"_id":"6b0554714c584295f0d61602","title":"curl-test","model":"logistic","dataset":"iris","status":"completed","metricName":"F1","metricValue":0.91,"loss":0.42,"learningRate":0.01,"epochs":10,"batchSize":32,"tags":"demo","notes":"first run","createdAt":"2026-11-24T09:10:09.091Z"}]
```
6. Read (all) - HTTP Request Type: GET
<br/>Path URI: `/api/experiments`

```bash
curl "https://sample-deploy-13492771-app-c9daebfabsavebca.southafricanorth-01.azurewebsites.net/api/experiments"
```
Response:
```json
[{"_id":"6b0554714c584295f0d61602","title":"curl-test","model":"logistic","dataset":"iris","status":"completed","metricName":"F1","metricValue":0.91,"loss":0.42,"learningRate":0.01,"epochs":10,"batchSize":32,"tags":"demo","notes":"first run","createdAt":"2026-11-24T09:10:09.091Z"}]
```
7. Count - HTTP Request Type: GET
<br/>Path URI: `/api/experiments/count`

```bash
curl "https://sample-deploy-13492771-app-c9daebfabsavebca.southafricanorth-01.azurewebsites.net/api/experiments/count"
```
Response:
```json
{"total":1,"queued":0,"running":0,"completed":1,"failed":0}
```
8. Delete - HTTP Request Type: DELETE
<br/>Path URI: `/api/experiments/title/:title`

```bash
curl -X DELETE "https://sample-deploy-13492771-app-c9daebfabsavebca.southafricanorth-01.azurewebsites.net/api/experiments/title/curl-test"
```
Response:
```json
{"acknowledged":true,"deletedCount":1}
```
### Local commands:
1. Create - HTTP Request Type: POST
<br/>Path URI: `/api/experiments`

```bash
curl -X POST -H "Content-Type: application/json" -d '{"title":"curl-test","model":"logistic","dataset":"iris","status":"queued","metricName":"F1","metricValue":0.74,"loss":0.42,"learningRate":0.01,"epochs":10,"batchSize":32,"tags":"demo","notes":"first run"}' "http://localhost:8099/api/experiments"
```
Response:
```json
{"title":"curl-test","model":"logistic","dataset":"iris","status":"queued","metricName":"F1","metricValue":0.74,"loss":0.42,"learningRate":0.01,"epochs":10,"batchSize":32,"tags":"demo","notes":"first run","createdAt":"2026-11-24T11:32:00.661Z","_id":"6b0575b09181cafc9ea29166"}
```
2. Read (by title) - HTTP Request Type: GET
<br/>Path URI: `/api/experiments/title/:title`

```bash
curl "http://localhost:8099/api/experiments/title/curl-test"
```
Response:
```json
[{"_id":"6b0575b09181cafc9ea29166","title":"curl-test","model":"logistic","dataset":"iris","status":"queued","metricName":"F1","metricValue":0.74,"loss":0.42,"learningRate":0.01,"epochs":10,"batchSize":32,"tags":"demo","notes":"first run","createdAt":"2026-11-24T11:32:00.661Z"}]
```
3. Update - HTTP Request Type: PUT
<br/>Path URI: `/api/experiments/title/:title`

```bash
curl -X PUT -H "Content-Type: application/json" -d '{"metricName":"F1","metricValue":0.91,"status":"completed"}' "http://localhost:8099/api/experiments/title/curl-test"
```
Response:
```json
{"acknowledged":true,"modifiedCount":1,"upsertedId":null,"upsertedCount":0,"matchedCount":1}
```
4. Read (by status) - HTTP Request Type: GET
<br/>Path URI: `/api/experiments/status/:status`

```bash
curl "http://localhost:8099/api/experiments/status/completed"
```
Response:
```json
[{"_id":"6b0575b09181cafc9ea29166","title":"curl-test","model":"logistic","dataset":"iris","status":"completed","metricName":"F1","metricValue":0.91,"loss":0.42,"learningRate":0.01,"epochs":10,"batchSize":32,"tags":"demo","notes":"first run","createdAt":"2026-11-24T11:32:00.661Z"}]
```
5. Search - HTTP Request Type: GET
<br/>Path URI: `/api/experiments/search`

```bash
curl "http://localhost:8099/api/experiments/search?status=completed&metric=F1&minScore=0.90"
```
Response:
```json
[{"_id":"6b0575b09181cafc9ea29166","title":"curl-test","model":"logistic","dataset":"iris","status":"completed","metricName":"F1","metricValue":0.91,"loss":0.42,"learningRate":0.01,"epochs":10,"batchSize":32,"tags":"demo","notes":"first run","createdAt":"2026-11-24T11:32:00.661Z"}]
```
6. Read (all) - HTTP Request Type: GET
<br/>Path URI: `/api/experiments`

```bash
curl "http://localhost:8099/api/experiments"
```
Response:
```json
[{"_id":"6b0575b09181cafc9ea29166","title":"curl-test","model":"logistic","dataset":"iris","status":"completed","metricName":"F1","metricValue":0.91,"loss":0.42,"learningRate":0.01,"epochs":10,"batchSize":32,"tags":"demo","notes":"first run","createdAt":"2026-11-24T11:32:00.661Z"}]
```
7. Count - HTTP Request Type: GET
<br/>Path URI: `/api/experiments/count`

```bash
curl "http://localhost:8099/api/experiments/count"
```
Response:
```json
{"total":1,"queued":0,"running":0,"completed":1,"failed":0}
```
8. Delete - HTTP Request Type: DELETE
<br/>Path URI: `/api/experiments/title/:title`

```bash
curl -X DELETE "http://localhost:8099/api/experiments/title/curl-test"
```
Response:
```json
{"acknowledged":true,"deletedCount":1}
```
Run the local commands only while `npm start` is running, in the same order: create, read by title, update, read by status, search, read all, count, then delete.
