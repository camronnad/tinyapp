////////////////////////////////////////////////////////////////////////////////
// Helper Functions
////////////////////////////////////////////////////////////////////////////////

// function to Use for generating Ids 
function generateRandomString() {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < 6) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

// function to lookup a user by email
function findUserByEmail(email) {
  for (const userId in users) {
    if (users[userId].email === email) {
      return users[userId];
    }
  }
  return null; // Return null if user not found
}



////////////////////////////////////////////////////////////////////////////////
// Constants
////////////////////////////////////////////////////////////////////////////////

const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const express = require('express');
const bcrypt = require('bcryptjs')

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
app.use(cookieParser());
app.use(morgan('dev'));
app.use((req, res, next) => {
  if (req.cookies["user_id"]) {
    req.user = req.cookies["user_id"]
  }
  next()
});

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
  console.log("hello")
  res.send("Hello!");
});

//DISPLAYS the Register Form
app.get("/register", (req, res) => {

  if (req.cookies["user_id"]) {
    res.redirect("/urls");
    return;
  }
  const templateVars = {
    user: req.cookies["user_id"]
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
  const findUser = findUserByEmail(email)
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
  res.cookie("user_id", id);
  res.redirect("/urls");
});

//
app.post("/urls/:id/delete", (req, res) => {
  const userId = req.user; // Access the logged-in user ID from the request object
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
  res.clearCookie("user_id");
  res.redirect("/login");
})

app.get("/login", (req, res) => {
  if (req.cookies["user_id"]) {
    res.redirect("/urls");
    return;
  }
  const templateVars = {
    user: req.cookies["user_id"]
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

  const user = findUserByEmail(email);

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

  res.cookie("user_id", user.id);
  res.redirect("/urls");
});


//
app.get("/urls/new", (req, res) => {

  if (!req.cookies["user_id"]) {
    res.redirect("/login");
    return;
  }


  console.log(req.params)
  const templateVars = {
    user: req.cookies["user_id"],

  }
  res.render("urls_new.ejs", templateVars);
});

//
app.post("/urls", (req, res) => {

  // console.log("sessionvalues is: ", req.cookies["user_id"])
  if (!req.cookies["user_id"]) {
    res.status(401).send("You need to be logged in to shorten URLs.");
    return;
  }
  const id = generateRandomString();
  urlDatabase[id] = { longURL: req.body.longURL, userID: req.cookies["user_id"] };
  console.log("urlDatabase:", urlDatabase)
  res.redirect(`/urls/${id}`);
});

//
app.get("/u/:id", (req, res) => {
  const id = req.params.id
  const longURL = urlDatabase[id].longUrl;
  if (res.cookies["user_id"]) {
    res.status(401).send("You need to be logged in")
    return;
  }

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

  const userId = req.user;

  if (!req.cookies["user_id"]) {
    res.redirect("/login")
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
  const templateVars = { id, longURL, user: req.cookies["user_id"] };

  res.render("urls_show.ejs", templateVars);
});

//
app.post("/urls/:id/edit", (req, res) => {
  const userId = req.user; // Access the logged-in user ID from the request object
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

  if (!req.cookies["user_id"]) {
    res.redirect("/login")
    return;
  }

  const urls = urlsForUser(urlDatabase, req.cookies["user_id"])

  const templateVars = {
    user: req.cookies["user_id"],
    urls
  };
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

