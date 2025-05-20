require('dotenv').config()
const express = require('express')
const multer = require('multer')
const cors = require('cors')
const axios = require('axios')
const pdfParse = require('pdf-parse')
const path = require('path')
const fs = require('fs')
const oAuth = require('./auth')

const app = express()
const PORT = process.env.PORT ?? 3000
const { AI_URL } = process.env

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		const uploadDir = 'uploads'
		if (!fs.existsSync(uploadDir)) {
			fs.mkdirSync(uploadDir)
		}
		cb(null, uploadDir)
	},
	filename: function (req, file, cb) {
		cb(null, Date.now() + '-' + file.originalname)
	},
})

const upload = multer({
	storage: storage,
	fileFilter: function (req, file, cb) {
		if (file.mimetype !== 'application/pdf') {
			return cb(new Error('Только PDF файлы разрешены'))
		}
		cb(null, true)
	},
})

app.post('/analyze-resume', upload.single('resume'), async (req, res) => {
	try {
		if (!req.file) {
			return res.status(400).json({ error: 'Файл не загружен' })
		}

		const dataBuffer = fs.readFileSync(req.file.path)
		const pdfData = await pdfParse(dataBuffer)

		const { access_token } = await oAuth()

		const prompt = `Проанализируй следующее резюме и выдели ключевые моменты в следующем формате:
        1. Основные навыки
        2. Опыт работы
        3. Образование
        4. Ключевые достижения
        5. Рекомендации по улучшению

        Текст резюме:
        ${pdfData.text}`

		const response = await axios.post(
			AI_URL,
			{
				model: 'GigaChat',
				messages: [{ role: 'user', content: prompt }],
			},
			{
				headers: {
					Authorization: `Bearer ${access_token}`,
					'Content-Type': 'application/json',
				},
			}
		)

		fs.unlinkSync(req.file.path)

		res.json(response.data)
	} catch (error) {
		console.error('Ошибка обработки файла:', error)
		res.status(500).json({ error: 'Ошибка при обработке файла' })
	}
})

app.listen(PORT, () => {
	console.log(`Сервер запущен на порту ${PORT}`)
})
