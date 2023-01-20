var API_KEY = process.env.API_KEY;
var DOMAIN = process.env.DOMAIN;
const formData = require('form-data');
const Mailgun = require('mailgun.js');
const mailgun = new Mailgun(formData);
const mg = mailgun.client({ username: 'api', key: API_KEY });

let errors = 0
let destinatario = process.env.destinatario
let linter_job = process.env.linter_job
let cypress_job = process.env.cypress_job
let add_badge_job = process.env.add_badge_job
let deploy_job = process.env.deploy_job
if (linter_job != 'success' || add_badge_job != 'success' || cypress_job != 'success' || deploy_job != 'success') {
    errors++;
}
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
