require('dotenv').config()
const axios = require('axios')
const crypto = require('crypto')
const https = require('https')
const { AUTH_URL, AUTH_KEY_PERS } = process.env

axios.defaults.httpsAgent = new https.Agent({
	rejectUnauthorized: false,
})

const payloadCorp = { scope: 'GIGACHAT_API_B2B' }
const payloadPers = { scope: 'GIGACHAT_API_PERS' }

const axiosInstance = axios.create({
	maxBodyLength: Infinity,
	headers: {
		'Content-Type': 'application/x-www-form-urlencoded',
		Accept: 'application/json',
		RqUID: crypto.randomUUID(),
		Authorization: `Basic ${AUTH_KEY_PERS}`,
	},
})

function oAuth() {
	return axiosInstance
		.post(AUTH_URL, payloadPers)
		.then(({ data }) => data)
		.catch((error) => console.log(error))
}

module.exports = oAuth
