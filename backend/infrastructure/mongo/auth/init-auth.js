//This is a very default initialisation script, but seems like it should#
//at least do the job. 

//THIS IS WRONG, FIX LATER

//Unless it is required elsewhere I do not think we should store anything but
//username and password hashes in this database, maybe a date of creation....
use auth_db; // create auth_db

// create user for auth_db
// credentials probably should be secreted better in future
db.createUser({
  user: "mongo_user",
  pwd: "mongo_password",
  roles: [
    { role: "readWrite", db: "auth_db" },  // to read and write data
    { role: "dbAdmin", db: "auth_db" }     // for managing the database
  ]
});

// create collection
//not strictly necessary as mongo creates the collection on first insersion
//one collection, two custom fields (maybe three if we want a date)
db.createCollection("users");

// insert test data
//_id is given a unique ObjectId
//createdAt is given a date and time in ISO format at UTC
db.users.insertOne({
  username: "Alice_who_the_fuck_is_Alice",
  passwordHash: "hashed_password_example",
});

print("✅ Auth DB initialized successfully!");
