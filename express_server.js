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


const cookieParser = require('cookie-parser');
const express = require('express');
const app = express();
const PORT = 8080;

app.set("view-engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use((req, res, next) => { 
  if (req.cookies["username"]) {
    req.username = req.cookies["username"]
  }
  next()
});

const urlDatabase = {
   "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  console.log("hello")
res.send("Hello!");
});

app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  delete urlDatabase[id];
  res.redirect("/urls")
})

app.post("/logout", (req, res) => {
  res.clearCookie("username")
  res.redirect("/urls");
})

app.post("/login", (req, res) => {
  res.cookie("username", req.body.username);
  res.redirect("/urls");
});

app.get("/urls/new", (req, res) => {
 res.render("urls_new.ejs");
});

app.post("/urls", (req, res) => {
  const shortUrl = generateRandomString()
urlDatabase[shortUrl] = req.body.longURL
 res.redirect(`/urls/${shortUrl}`); 
});

app.get("/u/:id", (req, res) => {
  const id = req.params.id
  const longURL = urlDatabase[id];
  res.redirect(longURL);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id], username: req.cookies["username"] };
  res.render("urls_show.ejs", templateVars);
});

app.post("/urls/:id/edit", (req, res) => {
  const shortUrl = req.params.id;
  const longUrl  = req.body.editUrl;
  urlDatabase[shortUrl] = longUrl;
  res.redirect("/urls");
}); 

app.get("/urls", (req, res) => {
  const templateVars = { 
    username: req.cookies["username"],
        urls: urlDatabase 
      };
  res.render("urls_index.ejs", templateVars);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});