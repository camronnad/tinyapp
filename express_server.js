////////////////////////////////////////////////////////////////////////////////
// Constants
////////////////////////////////////////////////////////////////////////////////

const { findUserByEmail, generateRandomString, findUserById } = require('./helpers');
const morgan = require('morgan');
const express = require('express');
const bcrypt = require('bcryptjs')
const cookieSession = require('cookie-session');

////////////////////////////////////////////////////////////////////////////////
// Configuration
////////////////////////////////////////////////////////////////////////////////

const app = express();
const PORT = 8080;

////////////////////////////////////////////////////////////////////////////////
// Middleware
////////////////////////////////////////////////////////////////////////////////

app.set("view-engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(cookieSession({
  name: 'session',
  keys: ["user_id"],
  maxAge: 24 * 60 * 60 * 1000, // Cookie expiration time (1 day in milliseconds)
}));


////////////////////////////////////////////////////////////////////////////////
// Database
////////////////////////////////////////////////////////////////////////////////

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};


const users = {
  userRandomID: {
    id: "abc",
    email: "a@a.com",
    password: "123",
  },
  user2RandomID: {
    id: "def",
    email: "b@b.com",
    password: "456",
  },
};

const urlsForUser = (urlDatabase, userID) => {
  const results = {};
  for (let shortUrl in urlDatabase) {
    if (urlDatabase[shortUrl].userID === userID) {
      results[shortUrl] = urlDatabase[shortUrl]
    }
  }
  return results;
};
////////////////////////////////////////////////////////////////////////////////
// Routes
////////////////////////////////////////////////////////////////////////////////

// SENDS "Hello!" to that URL
app.get("/", (req, res) => {
  if (req.session.userId) {
    res.redirect('/urls') 
  }  {
res.redirect('/login')
  }
});

//DISPLAYS the Register Form
app.get("/register", (req, res) => {

  if (req.session.user_id) {
    res.redirect("/urls");
    return;
  }
  const templateVars = {
    user: req.session.user_id
  }
  res.render("urls_register.ejs", templateVars);
});

//ADDS New User Object and Redirects Us to the index page
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  // If our email and passwords fields are left empty, return status code
  if (!email || !password) {
    res.status(400).send("Email and password cannot be empty");
    return;
  }
  // If users info is already in our DB, send status code
  const findUser = findUserByEmail(email, users)
  console.log(findUser)
  if (findUser) {
    res.status(400).send("Email already exists");
    return;
  }

  const id = Math.random().toString(36).substring(2, 8);
  const hashedPassword = bcrypt.hashSync(password, 10); // Hash the password

  users[id] = {
    id: id,
    email,
    password: hashedPassword,

  }
  req.session.user_id = id
  console.log("req.session.user_id", req.session.user_id)
  //res.cookie("user_id", id);
  res.redirect("/urls");
});

//
app.post("/urls/:id/delete", (req, res) => {
  const userId = req.session.user_id; // Access the logged-in user ID from the request object
  const shortUrl = req.params.id;
  const url = urlDatabase[shortUrl];

  // Check if the URL exists
  if (!url) {
    res.status(404).send("URL not found");
    return;
  }

  // Check if the user is logged in
  if (!userId) {
    res.status(401).send("You need to be logged in to perform this action");
    return;
  }

  // Check if the user owns the URL
  if (url.userID !== userId) {
    res.status(403).send("You do not own this URL");
    return;
  }

  // Delete the URL
  delete urlDatabase[shortUrl];
  res.redirect("/urls");
});


//
app.post("/logout", (req, res) => {
req.session = null
  res.redirect("/login");
})

app.get("/login", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
    return;
  }
  const templateVars = {
    user: findUserById(req.session.user_id, users)
  }
  res.render("urls_login.ejs", templateVars);
});
//
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  // If our email and password fields are left empty, return status code
  if (!email || !password) {
    res.status(400).send("Email and password cannot be empty");
    return;
  }

  const user = findUserByEmail(email, users);

  // If no user with the provided email is found, send status code
  if (!user) {
    res.status(403).send(`No email under ${email} was found.`);
    return;
  }

  // Use bcrypt to compare the provided password with the hashed password
  if (!bcrypt.compareSync(password, user.password)) {
    res.status(403).send("Email or password is incorrect");
    return;
  }

  //res.cookie("user_id", user.id);
  req.session.user_id = user.id
  res.redirect("/urls");
});


//
app.get("/urls/new", (req, res) => {

  if (!req.session.user_id) {
    res.redirect("/login");
    return;
  }


  console.log(req.params)
  const templateVars = {
    user: findUserById(req.session.user_id, users),

  }
  res.render("urls_new.ejs", templateVars);
});

//
app.post("/urls", (req, res) => {

  // console.log("sessionvalues is: ", req.session.user_id])
  if (!req.session.user_id) {
    res.status(401).send("You need to be logged in to shorten URLs. <a href='/login'>Login</a>");
    return;
  }
  const id = generateRandomString();
  urlDatabase[id] = { longURL: req.body.longURL, userID: req.session.user_id };
  res.redirect(`/urls/${id}`);
});

//
app.get("/u/:id", (req, res) => {
  const id = req.params.id
  const longURL = urlDatabase[id].longURL;

  if (longURL) {
    res.redirect(longURL);
    return;
  }
  res.status(404).send("not found");
});

//
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//
app.get("/urls/:id", (req, res) => {

  const userId = req.session.user_id;

  if (!req.session.user_id) {
    res.status(401).send("You need to be logged in to access urls. <a href='/login'>Login</a>")
    return;
  }
  const shortUrl = req.params.id;
  const url = urlDatabase[shortUrl];

  if (!url) {
    res.status(404).send("URL not found");
    return;
  }

  if (url.userID !== userId) {
    res.status(403).send("You do not own this URL");
    return;
  }

  const { id } = req.params
  const longURL = urlDatabase[id].longURL
  const templateVars = { id, longURL, user: findUserById(req.session.user_id, users) };

  res.render("urls_show.ejs", templateVars);
});

//
app.post("/urls/:id/edit", (req, res) => {
  const userId = req.session.user_id; // Access the logged-in user ID from the request object
  const shortUrl = req.params.id;
  const url = urlDatabase[shortUrl];

  // Check if the URL exists
  if (!url) {
    res.status(404).send("URL not found");
    return;
  }

  // Check if the user is logged in
  if (!userId) {
    res.status(401).send("You need to be logged in to perform this action");
    return;
  }

  // Check if the user owns the URL
  if (url.userID !== userId) {
    res.status(403).send("You do not own this URL");
    return;
  }

  // Update the URL with the new longURL
  url.longURL = req.body.editUrl;
  res.redirect("/urls");
});


//
app.get("/urls", (req, res) => {

  if (!req.session.user_id) {
    res.status(401).send("You need to be logged in. <a href='/login'>Login</a>")
    return;
  }

  const urls = urlsForUser(urlDatabase, req.session.user_id)

  const templateVars = {
    user: findUserById(req.session.user_id, users),
    urls
  };
  console.log("user" , templateVars.user)
  res.render("urls_index.ejs", templateVars);
});

//
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

////////////////////////////////////////////////////////////////////////////////
// Listener
////////////////////////////////////////////////////////////////////////////////

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

