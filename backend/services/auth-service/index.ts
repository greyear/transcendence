import express from 'express';
const app = express();

//Connection port
const port = 3000;

// Parse incoming JSON requests automatically
//https://www.geeksforgeeks.org/node-js/getting-started-with-express-js/
app.use(express.json());

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});