const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendEmail = async ({to, subject, text, html, templateId, dynamicData}) => {
    const msg = { to, from: 'unishopr.com <info@unishopr.com>', subject };

    if (text) Object.assign(msg, {text});
    if (templateId) Object.assign(msg, {template_id: templateId});
    if (dynamicData) Object.assign(msg, {dynamic_template_data: dynamicData});

    return await sgMail
        .send(msg)
        .then((response) => {
            return true
        })
        .catch((error) => {
            console.error(error)
            console.log(error)
            console.log(error?.response)
            console.log(error?.response?.body)
            console.log(error?.response?.body?.errors)
            return false
        })
}

module.exports = {sendEmail}
