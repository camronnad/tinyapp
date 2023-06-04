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
   "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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

////////////////////////////////////////////////////////////////////////////////
// Routes
////////////////////////////////////////////////////////////////////////////////

// SENDS "Hello!" to that URL
app.get("/", (req, res) => {
  console.log("hello")
res.send("Hello!");
});

//DISPLAYS the Register Form
app.get("/register", (req,res) => {
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
users[id] = {
  id: id,
  email,
  password,
}
res.cookie("user_id", id);
  res.redirect("/urls");
});

//
app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  delete urlDatabase[id];
  res.redirect("/urls")
})

//
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
})

app.get("/login", (req, res) => {
  const templateVars = { 
    user: req.cookies["user_id"]
  }
  res.render("urls_login.ejs", templateVars);
});
//
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  

// If our email and passwords fields are left empty, return status code
if (!email || !password) {
  res.status(400).send("Email and password cannot be empty");
  return;
}

const findUser = findUserByEmail(email)
if (!findUser) {
res.status(403).send(`No email under ${email} was found.`)
}
if (!findUser || findUser.password !== password) {
res.status(403).send("Email or Password is incorrect")
}
res.cookie("user_id", findUser.id); 
res.redirect("/urls");
});

//
app.get("/urls/new", (req, res) => {
 res.render("urls_new.ejs");
});

//
app.post("/urls", (req, res) => {
  const shortUrl = generateRandomString()
urlDatabase[shortUrl] = req.body.longURL
 res.redirect(`/urls/${shortUrl}`); 
});

//
app.get("/u/:id", (req, res) => {
  const id = req.params.id
  const longURL = urlDatabase[id];
  res.redirect(longURL);
});

//
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//
app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id], username: req.cookies["user_id"] };
  res.render("urls_show.ejs", templateVars);
});

//
app.post("/urls/:id/edit", (req, res) => {
  const shortUrl = req.params.id;
  const longUrl  = req.body.editUrl;
  urlDatabase[shortUrl] = longUrl;
  res.redirect("/urls");
}); 

//
app.get("/urls", (req, res) => {
  const templateVars = { 
        user: req.cookies["user_id"],
        urls: urlDatabase,
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

