# GITHUB ACTIONS
By [`Santi Martinez`](https://github.com/santimaal)
## Linter Job

```yml
  Linter_job:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install -D
      - run: npm run lint
```
Del fichero “\pages\api\users\[id].js” se cambio las comillas simples por dobles para que quede de esta manera

![Imagen](/assets/Imagen2.png)

También da error en una variable declarada como var y te obliga a cambiarla por let/const

![Imagen](/assets/Imagen3.png)

Del fichero “\pages\api\users\index.js” hay que cambiar las comillas simples por dobles y el default bajarlo a la ultima posicion quedando de esta manera

![Imagen](/assets/Imagen4.png)

#

## Cypress Job

```yml
  Cypress_job:
    needs: Linter_job
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: cypress-io/github-action@v5
        with:
          config-file: cypress.json
          build: npm run build
          start: npm start
        id: cypress
        continue-on-error: true
      - run: echo ${{ steps.cypress.outcome }}  > result.txt
      - uses: actions/upload-artifact@v2
        with:
          name: result
          path: ./result.txt
```

Al ejecutar sale un error en el metodo POST ya que en el fichero “\pages\api\users\index.js” hay un case "POST0" y solo hay que quitar el 0 que hay. El error es el siguiente

![Imagen](/assets/Imagen5.png)

Cuando este solucionado se el error, en el action se vera el result creado por la run y y los problemas que ha pasado correctamente

```yml
- run: echo ${{ steps.cypress.outcome }}  > result.txt
```
Este es el result.txt generado

![Imagen](/assets/Imagen7.png)

![Imagen](/assets/Imagen6.png)

#

## Add Badge Job
```yml
  Add_badge_job:
    needs: Cypress_job
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/download-artifact@v3
        with:
          name: result
      - run: echo "::set-output name=cypress_outcome::$(cat result.txt)"
        id: results
      - uses: ./.github/actions/changereadme
        env:
          resultado: ${{ steps.results.outputs.cypress_outcome }}
      - uses: EndBug/add-and-commit@v9
        with:
          add: "."
          author_name: "Santi Martinez Albert"
          author_email: "santimartinezalbert02@gmail.com"
          message: "Readme Updated succesfully"
          push: true
```

Para hacer el cambio del readme y la custom action tenemos que activar lo siguiente en la configuración de las actions del mismo repositorio

![Imagen](/assets/Imagen8.png)

De esta manera podemos permitir a la action "EndBug/add-and-commit" para poder hacer un push con el cambio del archivo Readme.md

```yml
name: "Change Readme"
description: ""
inputs:
  resultado:
    description: "frase"
    required: true
runs: 
  using: node16
  main: dist/index.js
```
En la custom action que creamos tenemos que pedir el resultado de la action de cypress que la pasamos de la siguiente manera ya que en la action del cypress le he puesto un id

```yml
resultado: ${{ steps.results.outputs.cypress_outcome }}
```

En el index tenemos que recoger el readme que vamos a cambiar y luego leemos el readme para poder añadir el success o la failure

```js
const path = require('path');
const fs = require("fs"); 

const readme = path.resolve('./README.md')
const resultado = process.env.resultado; //para recoger el resultado
let URL_good = 'https://img.shields.io/badge/tested%20with-Cypress-04C38E.svg'
let URL_bad = 'https://img.shields.io/badge/test-failure-red'
let URL = resultado == 'success' ? URL_good : URL_bad; // if para setearle la url buena

fs.readFile(readme, 'utf8', function (err, data) {
    if (err) throw err;
    let new_readme = data.search(URL_good) !== -1 ? data.replace(URL_good, URL) : data.replace(URL_bad, URL) // cambiamos la URL del commit anterior por la URL correcta que ha dado el cypress
    fs.writeFile(readme, new_readme, function (err) {
        if (err) throw err;
        console.log('Archivo actualizado');
    })
});

```

#

## Deploy Job
```yml
  Deploy_job:
    needs: Cypress_job
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          working-directory: ./
```

Para hacer esto tenemos que registrarnos en la web de vercel, luego creamos un proyecto y importamos el nuestro, cuando lo hayamos subido nos saldra esto

![Imagen](/assets/Imagen9.png)

- https://vercel.com/santimaal/github-actions-final
- https://github-actions-final.vercel.app/

#

## Notification Job
```yml
  Notification_job:
    needs: [Cypress_job, Add_badge_job, Linter_job, Deploy_job]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: ./.github/actions/sendMail
        env:
          API_KEY: ${{secrets.MAILGUN_APIKEY}}
          DOMAIN: ${{secrets.MAILGUN_DOMAIN}}
          destinatario: ${{secrets.destinatario}}
          linter_job: ${{needs.Linter_job.result}}
          cypress_job: ${{needs.Cypress_job.result}}
          add_badge_job: ${{needs.Add_badge_job.result}}
          deploy_job: ${{needs.Deploy_job.result}}
```

Para poder hacer el job de notificaciones he utilizado [Mailgun](https://www.mailgun.com/) (super intuitivo y perfecto). Le envio a al custom action los resultados de los jobs que estan en needs con el ApiKey del mailgun y la domain.

Action
```yml
name: "Change Readme"
description: ""
inputs:
  API_KEY:
    description: "apimailgun"
    required: true
  DOMAIN:
    description: "domainmailgun"
    required: true
  destinatario:
    description: "destinatario"
    required: true
  linter_job:
    description: "resultado linter_job"
    required: true
  cypress_job:
    description: "resultado cypress_job"
    required: true
  add_badge_job:
    description: "resultado add_badge_job"
    required: true
  deploy_job:
    description: "resultado deploy_job"
    required: true
runs:
  using: node16
  main: dist/index.js
```

Luego en el index seteamos la ApiKey y el domain para poder enviar mails, recogemos el resultado de todos los tests y se lo enviamos con la funcion "mg.messages.create"

```js
var API_KEY = process.env.API_KEY;
var DOMAIN = process.env.DOMAIN;
const formData = require('form-data');
const Mailgun = require('mailgun.js');
const mailgun = new Mailgun(formData);
const mg = mailgun.client({ username: 'api', key: API_KEY }); //Seteamos el cliente

let errors = 0
let destinatario = process.env.destinatario
let linter_job = process.env.linter_job
let cypress_job = process.env.cypress_job
let add_badge_job = process.env.add_badge_job
let deploy_job = process.env.deploy_job
if (linter_job != 'success' || add_badge_job != 'success' || cypress_job != 'success' || deploy_job != 'success') { 
    errors++;
} //De esta manera si alguno tiene error seteamos un asunto o otro
let asunto = "Workflow success";
if (errors != 0) {
    asunto = "Workflow failure";
}

const body = `
    <div>
        <p>Se ha realizado un push en la rama master que ha provocado la ejecución del
            workflow GithubActions_Final con los siguientes resultados:</p>
        <ul>
            <li>
                linter_job: ${linter_job}
            </li>
            <li>
                cypress_job: ${cypress_job}
            </li>
            <li>
                add_badge_job: ${add_badge_job}
            </li>
            <li>
                deploy_job: ${deploy_job}
            </li>
        </ul>
    </div>`;

mg.messages.create(DOMAIN, {
    from: "santimartinezalbert@gmail.com",
    to: [destinatario],
    subject: asunto,
    html: body
})
    .then(msg => console.log(msg)) // logs response data
    .catch(err => console.error(err)); // logs any error
```
#

## Github Metrics

```yml
name: GithubActions_Final
on: 
  push:
   branches:
    - master
jobs:
  Github-metrics:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: lowlighter/metrics@latest
        with:
          token: ${{ secrets.METRICS_TOKEN }}
```

El workflow lo ponemos en el readme.md principal de nuestro perfil, en el readme ponemos lo siguiente
```md
![Metrics](/github-metrics.svg)
```

Para cuando se cree una github-metrics se setee automaticamente y entonces en el perfil podemos ver algo parecido a esto

![Imagen](/assets/Imagen10.png)

RESULTADO DEL ÚLTIMO TEST

![Cypress.io](https://img.shields.io/badge/tested%20with-Cypress-04C38E.svg)