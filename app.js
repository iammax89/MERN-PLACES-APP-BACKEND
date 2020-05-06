const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.listen(5000, () => {
    console.log('Port started at posrt 5000')
})