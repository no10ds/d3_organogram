import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();

console.log(process.env);


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename)
app.use('/assets', express.static(path.join(__dirname, '/assets')))

app.get('/', function(req, res){
    res.sendFile(path.join(__dirname, '/index.html'))
    }
);

app.get('/health', (req, res) => res.sendStatus(200));

app.get('/api/file/:fileName', async function(req, res){
    res.sendFile(path.join(__dirname, '/assets/data', req.params.fileName));
});

app.listen(3000, () => {
    console.log('Application running at: http://localhost:3000')
});
