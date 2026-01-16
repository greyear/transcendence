db = db.getSiblingDB("auth_db"); // create auth_db

// create user for auth_db
db.createUser({
  user: "auth_user",
  pwd: "auth_password",
  roles: [
    { role: "readWrite", db: "auth_db" },  // to read and write data
    { role: "dbAdmin", db: "auth_db" }     // for managing the database
  ]
});

// create collections
db.createCollection("users");
db.createCollection("sessions");
db.createCollection("roles");

// insert test data
db.users.insertOne({
  _id: "user-1",
  username: "Alice",
  passwordHash: "hashed_password_example",
  role: "user",
  createdAt: new Date()
});

print("✅ Auth DB initialized successfully!");
