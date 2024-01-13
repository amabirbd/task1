const {OAuthAccessTokenModel: FeOAuthAccessTokenModel} = require("../models/feOAuthAccessToken.model")
const {OAuthAccessTokenModel: BeOAuthAccessTokenModel} = require("../models/beOAuthAccessToken.model")

const getAccessTokenFeUserId = async (req) => {
    const accessToken = req.headers['authorization'].split(' ')[1]
    if (accessToken) {
        const tokenInfo = await FeOAuthAccessTokenModel.findOne({_id: accessToken}, {user: true, _id: false})
        if (tokenInfo) {
            return tokenInfo.user
        } else {
            return null
        }
    }
    return null
}

const getAccessTokenBeUserId = async (req) => {
    const accessToken = req.headers['authorization'].split(' ')[1]
    if (accessToken) {
        const tokenInfo = await BeOAuthAccessTokenModel.findOne({_id: accessToken}, {user: true, _id: false})
        if (tokenInfo) {
            return tokenInfo.user
        } else {
            return null
        }
    }
    return null
}

const getFeUserInfoByAccessToken = async (req) => {
    const accessToken = req.headers['authorization'].split(' ')[1]
    if (accessToken) {
        const tokenInfo = await FeOAuthAccessTokenModel
            .findOne({_id: accessToken}, {user: true, _id: false})
            .populate('user', 'firstName lastName photo email')
        if (tokenInfo) {
            return tokenInfo.user
        } else {
            return null
        }
    }
    return null
}

const getBeUserInfoByAccessToken = async (req) => {
    const accessToken = req.headers['authorization'].split(' ')[1]
    if (accessToken) {
        const tokenInfo = await BeOAuthAccessTokenModel
            .findOne({_id: accessToken}, {user: true, _id: false})
            .populate('user', 'personal.firstName personal.lastName personal.photo email')
        if (tokenInfo) {
            return tokenInfo.user
        } else {
            return null
        }
    }
    return null
}

module.exports = {
    getAccessTokenFeUserId, getFeUserInfoByAccessToken,
    getAccessTokenBeUserId, getBeUserInfoByAccessToken
}
