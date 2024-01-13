const axios = require("axios")

const sendSms = async (number, message) => {
    // return await axios({
    //     method: 'post',
    //     url: process.env.SSL_SMS_URL,
    //     data: {
    //         api_token: process.env.SSL_SMS_API_TOKEN,
    //         sid: process.env.SSL_SMS_SID,
    //         msisdn: number,
    //         sms: message,
    //         csms_id: process.env.SSL_SMS_CSMSID,
    //     },
    //     headers: {'Content-Type': 'application/json'}
    // })
    //     .then(function (response) {
    //         //handle success
    //         console.log(response)
    //         return true;
    //     })
    //     .catch(function (response) {
    //         //handle error
    //         console.log(response)
    //         return false;
    //     })
    console.log('--------- ', message)
    return true
}

module.exports = {sendSms}