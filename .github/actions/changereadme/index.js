const path = require('path');
const fs = require("fs");

const readme = path.resolve('./README.md')
const resultado = process.env.resultado;
let URL = resultado == 'success' ? 'https://img.shields.io/badge/tested%20with-Cypress-04C38E.svg' : 'https://img.shields.io/badge/test-failure-red';
URL = "![Cypress.io](" + URL + ")"

fs.readFile(readme, 'utf8', function(err, data) {
    if (err) throw err;
    data += URL;
    fs.writeFile(readme, data, function (err) {
        if (err) throw err;
        console.log('Archivo actualizado');
    })
});
