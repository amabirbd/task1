const FormData = require('form-data');

const objectToFormData = async (object) => {
    const form = new FormData();
    Object.keys(object).forEach((key) => form.append(`${key}`, `${object[key]}`));
    return form;
}

module.exports = {objectToFormData}