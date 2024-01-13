const fs = require("fs");
const mime = require("mime");

const decodeBase64Image = (dataString) => {
    let matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/), response = {};
    if (matches.length !== 3) return new Error('Invalid input string');
    response.type = matches[1];
    response.data = Buffer.from(matches[2], 'base64');
    return response;
}

const uploadImg = (imgBase64, uploadPath) => {
    let decodedImg = decodeBase64Image(imgBase64);
    let imageBuffer = decodedImg.data;
    let extType = decodedImg.type;
    let extension = mime.getExtension(extType);
    let fileName = Date.now() + '.' + extension;
    try {
        fs.writeFileSync(uploadPath + '/' + fileName, imageBuffer, 'utf8');
        return fileName
    } catch(err) {
        return false
    }
}

const removeExistingImg = async (filePath) => {
    let success = true;
    await fs.unlink(filePath, (err) => {
        success = false
    });
    return success;
}

module.exports = {
    uploadImg, removeExistingImg
}