const path = require('path');
const fs = require("fs");

const readme = path.resolve('./README.md')
const resultado = process.env.resultado;
let URL_good = 'https://img.shields.io/badge/tested%20with-Cypress-04C38E.svg'
let URL_bad = 'https://img.shields.io/badge/test-failure-red'
let URL = resultado == 'success' ? URL_good : URL_bad;

fs.readFile(readme, 'utf8', function (err, data) {
    if (err) throw err;
    let new_readme = data.search(URL_good) !== -1 ? data.replace(URL_good, URL) : data.replace(URL_bad, URL)
    fs.writeFile(readme, new_readme, function (err) {
        if (err) throw err;
        console.log('Archivo actualizado');
    })
});
