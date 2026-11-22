const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const session = require('express-session');
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");


app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));


// Facebook OAuth
const facebookAuth = {
    'clientID'        : '923403890739846', //This is the Facebook app ID
    'clientSecret'    : '63d302eb1044b53cbf7e839be6d21164', //This is the Facebook app secret
    'callbackURL'     : process.env.CALLBACK_URL || 'http://localhost:8099/auth/facebook/callback'
};


var user = {};
passport.serializeUser(function (user, done) {
    done(null, user);
});
passport.deserializeUser(function (id, done) {
    done(null, user);
});


passport.use(new FacebookStrategy({
    "clientID"        : facebookAuth.clientID,
    "clientSecret"    : facebookAuth.clientSecret,
    "callbackURL"     : facebookAuth.callbackURL
},
function (token, refreshToken, profile, done) {
    console.log("Facebook Profile: ");
    console.log(profile);
    user = {};
    user['id'] = profile.id;
    user['name'] = profile.displayName;
    user['type'] = profile.provider;
    console.log('user object: ' + JSON.stringify(user));
    return done(null, user);
}));


app.use(session({
    secret: "tHiSiSasEcRetStr",
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());


function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();
    res.redirect('/login');
}


//MongoDB database info
const mongourl = process.env.MONGODB_URI; //MONGODB_URL already set in Azure
const dbName = 'comp3810sef';
const collectionName = 'experiments';


const client = new MongoClient(mongourl, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


const insertDocument = async (db, doc) => {
    var collection = db.collection(collectionName);
    let results = await collection.insertOne(doc);
    console.log("insert one document:" + JSON.stringify(results));
    return results;
}


const findDocument = async (db, criteria) => {
    var collection = db.collection(collectionName);
    let results = await collection.find(criteria).toArray();
    console.log("find the documents:" + JSON.stringify(results));
    return results;
}


const updateDocument = async (db, criteria, updateData) => {
    var collection = db.collection(collectionName);
    let results = await collection.updateOne(criteria, { $set: updateData });
    console.log("update one document:" + JSON.stringify(results));
    return results;
}


const deleteDocument = async (db, criteria) => {
    var collection = db.collection(collectionName);
    let results = await collection.deleteMany(criteria);
    console.log("delete one document:" + JSON.stringify(results));
    return results;
}


const escapeRegex = (value) => {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}


const buildCriteria = (query, userid) => {
    let criteria = {};
    if (userid) {
        criteria['userid'] = userid;
    }
    if (query.status) {
        criteria['status'] = query.status;
    }
    if (query.model) {
        criteria['model'] = { $regex: escapeRegex(query.model), $options: 'i' };
    }
    if (query.dataset) {
        criteria['dataset'] = { $regex: escapeRegex(query.dataset), $options: 'i' };
    }
    if (query.tag) {
        criteria['tags'] = { $regex: escapeRegex(query.tag), $options: 'i' };
    }
    if (query.keyword) {
        criteria['title'] = { $regex: escapeRegex(query.keyword), $options: 'i' };
    }
    if (query.metric) {
        criteria['metricName'] = { $regex: escapeRegex(query.metric), $options: 'i' };
    }
    if (query.metric && query.minScore) {
        criteria['metricValue'] = { $gte: Number(query.minScore) };
    }
    return criteria;
}


const numberOrBlank = (value) => {
    if (value === undefined || value === '') {
        return '';
    }
    return Number(value);
}


const experimentFromForm = (body) => {
    let metricName = body.metricName || '';
    if (body.metricChoice) {
        if (body.metricChoice === 'Other') {
            metricName = (body.metricOther || '').trim();
        } else {
            metricName = body.metricChoice;
        }
    }
    let metricValue = numberOrBlank(body.metricValue);
    if (!metricName && body.accuracy !== undefined && body.accuracy !== '') {
        metricName = 'Accuracy';
        metricValue = Number(body.accuracy);
    }
    return {
        title: body.title,
        model: body.model,
        dataset: body.dataset,
        status: body.status,
        metricName: metricName,
        metricValue: metricValue,
        loss: numberOrBlank(body.loss),
        learningRate: numberOrBlank(body.learningRate),
        epochs: numberOrBlank(body.epochs),
        batchSize: numberOrBlank(body.batchSize),
        tags: body.tags,
        notes: body.notes
    };
}


const handle_Find = async (req, res) => {
    await client.connect();
    console.log("Connected successfully to server");
    const db = client.db(dbName);
    let criteria = buildCriteria(req.query, req.user.id);
    const docs = await findDocument(db, criteria);
    const owned = await findDocument(db, { userid: req.user.id });
    let counts = { queued: 0, running: 0, completed: 0, failed: 0 };
    for (var doc of owned) {
        if (counts[doc.status] != undefined) {
            counts[doc.status] = counts[doc.status] + 1;
        }
    }
    res.status(200).render('list', {
        nExperiments: docs.length,
        experiments: docs,
        user: req.user,
        query: req.query,
        counts: counts
    });
}


const handle_Create = async (req, res) => {
    await client.connect();
    console.log("Connected successfully to server");
    const db = client.db(dbName);
    let newDoc = experimentFromForm(req.body);
    newDoc.createdAt = new Date();
    newDoc.userid = req.user.id;
    newDoc.username = req.user.name;
    await insertDocument(db, newDoc);
    res.redirect('/experiments');
}


const handle_Details = async (req, res) => {
    await client.connect();
    console.log("Connected successfully to server");
    const db = client.db(dbName);
    if (!req.query._id) {
        res.status(200).render('info', { message: 'Missing experiment id.', user: req.user });
        return;
    }
    let DOCID = { _id: ObjectId.createFromHexString(req.query._id) };
    const docs = await findDocument(db, DOCID);
    if (docs.length > 0 && docs[0].userid == req.user.id) {
        res.status(200).render('details', { experiment: docs[0], user: req.user });
    } else {
        res.status(200).render('info', { message: 'Experiment not found, or you are not the owner.', user: req.user });
    }
}


const handle_Edit = async (req, res) => {
    await client.connect();
    console.log("Connected successfully to server");
    const db = client.db(dbName);
    if (!req.query._id) {
        res.status(200).render('info', { message: 'Missing experiment id.', user: req.user });
        return;
    }
    let DOCID = { _id: ObjectId.createFromHexString(req.query._id) };
    const docs = await findDocument(db, DOCID);
    if (docs.length > 0 && docs[0].userid == req.user.id) {
        res.status(200).render('edit', { experiment: docs[0], user: req.user });
    } else {
        res.status(200).render('info', { message: 'Unable to edit because the experiment was not found, or you are not the owner.', user: req.user });
    }
}


const handle_Update = async (req, res) => {
    await client.connect();
    console.log("Connected successfully to server");
    const db = client.db(dbName);
    if (!req.body._id) {
        res.status(200).render('info', { message: 'Missing experiment id.', user: req.user });
        return;
    }
    let DOCID = { _id: ObjectId.createFromHexString(req.body._id) };
    const docs = await findDocument(db, DOCID);
    if (docs.length > 0 && docs[0].userid == req.user.id) {
        let updateData = experimentFromForm(req.body);
        const results = await updateDocument(db, DOCID, updateData);
        res.status(200).render('info', { message: `Updated ${results.modifiedCount} experiment(s).`, user: req.user });
    } else {
        res.status(200).render('info', { message: 'Unable to update because the experiment was not found, or you are not the owner.', user: req.user });
    }
}


const handle_DeleteConfirm = async (req, res) => {
    await client.connect();
    console.log("Connected successfully to server");
    const db = client.db(dbName);
    if (!req.query._id) {
        res.status(200).render('info', { message: 'Missing experiment id.', user: req.user });
        return;
    }
    let DOCID = { _id: ObjectId.createFromHexString(req.query._id) };
    const docs = await findDocument(db, DOCID);
    if (docs.length > 0 && docs[0].userid == req.user.id) {
        res.status(200).render('confirm', { experiment: docs[0], user: req.user });
    } else {
        res.status(200).render('info', { message: 'Unable to delete because the experiment was not found, or you are not the owner.', user: req.user });
    }
}


const handle_Delete = async (req, res) => {
    await client.connect();
    console.log("Connected successfully to server");
    const db = client.db(dbName);
    let id = req.body._id || req.query._id;
    if (!id) {
        res.status(200).render('info', { message: 'Missing experiment id.', user: req.user });
        return;
    }
    let DOCID = { _id: ObjectId.createFromHexString(id) };
    const docs = await findDocument(db, DOCID);
    if (docs.length > 0 && docs[0].userid == req.user.id) {
        await deleteDocument(db, DOCID);
        res.status(200).render('info', { message: `Experiment "${docs[0].title}" removed.`, user: req.user });
    } else {
        res.status(200).render('info', { message: 'Unable to delete because the experiment was not found, or you are not the owner.', user: req.user });
    }
}


app.get('/login', function (req, res) {
    res.render('login');
});


app.get('/auth/facebook', passport.authenticate('facebook', { scope: 'email' }));


app.get('/auth/facebook/callback',
    passport.authenticate('facebook', {
        successRedirect: '/',
        failureRedirect: '/login'
    }));


app.get('/', isLoggedIn, function (req, res) {
    res.redirect('/experiments');
});


app.get('/experiments', isLoggedIn, (req, res) => {
    handle_Find(req, res);
});


app.get('/experiments/create', isLoggedIn, (req, res) => {
    res.status(200).render('create', { user: req.user });
});


app.post('/experiments/create', isLoggedIn, (req, res) => {
    handle_Create(req, res);
});


app.get('/experiments/details', isLoggedIn, (req, res) => {
    handle_Details(req, res);
});


app.get('/experiments/edit', isLoggedIn, (req, res) => {
    handle_Edit(req, res);
});


app.post('/experiments/update', isLoggedIn, (req, res) => {
    handle_Update(req, res);
});


app.get('/experiments/delete', isLoggedIn, (req, res) => {
    handle_DeleteConfirm(req, res);
});


app.post('/experiments/delete', isLoggedIn, (req, res) => {
    handle_Delete(req, res);
});


app.get('/logout', function (req, res, next) {
    req.logout(function (err) {
        if (err) { return next(err); }
        res.redirect('/');
    });
});


//RESTful services: READ ~ GET
//curl "http://localhost:8099/api/experiments"
app.get('/api/experiments', async (req, res) => {
    await client.connect();
    console.log("Connected successfully to server");
    const db = client.db(dbName);
    const docs = await findDocument(db, {});
    res.status(200).type('json').json(docs).end();
});


//curl "http://localhost:8099/api/experiments/search?status=completed&metric=F1&minScore=0.7"
app.get('/api/experiments/search', async (req, res) => {
    await client.connect();
    console.log("Connected successfully to server");
    const db = client.db(dbName);
    let criteria = buildCriteria(req.query);
    const docs = await findDocument(db, criteria);
    res.status(200).type('json').json(docs).end();
});


//curl "http://localhost:8099/api/experiments/count"
app.get('/api/experiments/count', async (req, res) => {
    await client.connect();
    console.log("Connected successfully to server");
    const db = client.db(dbName);
    const docs = await findDocument(db, {});
    let counts = { total: docs.length, queued: 0, running: 0, completed: 0, failed: 0 };
    for (var doc of docs) {
        if (counts[doc.status] != undefined) {
            counts[doc.status] = counts[doc.status] + 1;
        }
    }
    res.status(200).type('json').json(counts).end();
});


//curl "http://localhost:8099/api/experiments/title/curl-test"
app.get('/api/experiments/title/:title', async (req, res) => {
    await client.connect();
    console.log("Connected successfully to server");
    const db = client.db(dbName);
    let criteria = { title: req.params.title };
    const docs = await findDocument(db, criteria);
    res.status(200).type('json').json(docs).end();
});


//curl "http://localhost:8099/api/experiments/status/queued"
app.get('/api/experiments/status/:status', async (req, res) => {
    await client.connect();
    console.log("Connected successfully to server");
    const db = client.db(dbName);
    let criteria = { status: req.params.status };
    const docs = await findDocument(db, criteria);
    res.status(200).type('json').json(docs).end();
});


//RESTful services: CREATE ~ POST
//curl -X POST -H "Content-Type: application/json" -d '{"title":"curl-test","model":"logistic","dataset":"iris","status":"queued","metricName":"F1","metricValue":0.5,"loss":1.2,"learningRate":0.01,"epochs":10,"batchSize":16,"tags":"demo","notes":"from curl"}' http://localhost:8099/api/experiments
app.post('/api/experiments', async (req, res) => {
    await client.connect();
    console.log("Connected successfully to server");
    const db = client.db(dbName);
    let newDoc = experimentFromForm(req.body);
    newDoc.createdAt = new Date();
    await insertDocument(db, newDoc);
    res.status(200).type('json').json(newDoc).end();
});


//RESTful services: UPDATE ~ PUT
//curl -X PUT -H "Content-Type: application/json" -d '{"metricName":"F1","metricValue":0.9,"status":"completed"}' http://localhost:8099/api/experiments/title/curl-test
app.put('/api/experiments/title/:title', async (req, res) => {
    await client.connect();
    console.log("Connected successfully to server");
    const db = client.db(dbName);
    let DOCID = { title: req.params.title };
    let updateData = {};
    if (req.body.title != undefined) updateData.title = req.body.title;
    if (req.body.model != undefined) updateData.model = req.body.model;
    if (req.body.dataset != undefined) updateData.dataset = req.body.dataset;
    if (req.body.status != undefined) updateData.status = req.body.status;
    if (req.body.metricName != undefined) updateData.metricName = req.body.metricName;
    if (req.body.metricValue != undefined) updateData.metricValue = Number(req.body.metricValue);
    if (req.body.accuracy != undefined) updateData.metricValue = Number(req.body.accuracy);
    if (req.body.loss != undefined) updateData.loss = Number(req.body.loss);
    if (req.body.learningRate != undefined) updateData.learningRate = Number(req.body.learningRate);
    if (req.body.epochs != undefined) updateData.epochs = Number(req.body.epochs);
    if (req.body.batchSize != undefined) updateData.batchSize = Number(req.body.batchSize);
    if (req.body.tags != undefined) updateData.tags = req.body.tags;
    if (req.body.notes != undefined) updateData.notes = req.body.notes;
    const results = await updateDocument(db, DOCID, updateData);
    res.status(200).type('json').json(results).end();
});


//RESTful services: DELETE ~ DELETE
//curl -X DELETE "http://localhost:8099/api/experiments/title/curl-test"
app.delete('/api/experiments/title/:title', async (req, res) => {
    await client.connect();
    console.log("Connected successfully to server");
    const db = client.db(dbName);
    let criteria = { title: req.params.title };
    const results = await deleteDocument(db, criteria);
    res.status(200).type('json').json(results).end();
});

const port = process.env.PORT || 8099;
app.listen(port, () => { console.log(`Listening at http://localhost:${port}`); });

