function findUserByEmail(email, database) {
  for (const userId in database) {
    if (database[userId].email === email) {
      return database[userId];
    }
  }
  return null;
}

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


module.exports = {findUserByEmail, generateRandomString}



