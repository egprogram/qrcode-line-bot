const https = require("https")
const express = require("express")
const app = express()
const qrCode = require("qrcode")
const base64 = require("urlsafe-base64")
const crypto = require("crypto");
const aws = require("aws-sdk")
const s3 = new aws.S3()

require('dotenv').config()

// 環境変数を読み込む
const PORT = process.env.PORT || 3000
const TOKEN = process.env.LINE_ACCESS_TOKEN
const s3ImgUrl = process.env.S3_IMG_URL
const s3Key = process.env.S3_KEY

app.use(express.json())
app.use(express.urlencoded({
  extended: true
}))

// AWSの設定ファイル
const s3Config = {
  region: process.env.S3_REGION
}
aws.config.update(s3Config);

// QRコード作成関数
const generateQrcode = async (str, width) => {
  return new Promise((resolve, reject) => {
    const opts = {
      width: width || 100
    }
    qrCode.toDataURL(str, opts, (err, url) => {
      if(err){
        reject(new Error(err.message))
      }else{
        const decodeData = base64.decode(url.replace("data:image/png;base64,", ""))
        resolve(decodeData)
      }
    })
  }) 
}

// S3アップロード関数
const s3Upload = async (decodeData, fileName) => {
  const params = {
    Bucket: process.env.S3_BACKET,
    Key: `${s3Key}/${fileName}`,
    Body: decodeData,
    ContentType: "image/png"
  }
  return new Promise((resolve, reject) => {
    s3.putObject(params,(err, data) => {
      if(err){
          console.log("failed to upload")
          reject(new Error(err.message))
          return
      }
      console.log("complete upload")
      resolve()
    })
  }) 
}

app.get("/healthcheck", (req, res) => {
  res.send({ status: true })
})

app.post("/webhook", async (req, res) => {
  if (req.body.events[0].type === "message" && req.body.events[0].message.text) {
    const words = req.body.events[0].message.text.split('\n')
    if(words[0] === 'qrcode'){
      // QRコードを作成
      const str = req.body.events[0].message.text
      const width = 200
      const qrcodeBuffer = await generateQrcode(str, width)

      // S3にアップロード
      const fileName = crypto.randomBytes(20).toString('hex') + '.png'
      await s3Upload(qrcodeBuffer, fileName)

      // QRコードのURL
      const qrcodeUrl = `${s3ImgUrl}/${s3Key}/${fileName}`

      const messages = [
        {
          "type": "image",
          "originalContentUrl": qrcodeUrl, 
          "previewImageUrl": qrcodeUrl
        }
      ]

      const dataString = JSON.stringify({
        replyToken: req.body.events[0].replyToken,
        messages: messages
      })

      // リクエストヘッダー
      const headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + TOKEN
      }

      // リクエストに渡すオプション
      const webhookOptions = {
        "hostname": "api.line.me",
        "path": "/v2/bot/message/reply",
        "method": "POST",
        "headers": headers,
        "body": dataString
      }

      // リクエストの定義
      const request = https.request(webhookOptions, (res) => {
        res.on("data", (d) => {
          process.stdout.write(d)
        })
      })

      // エラーをハンドル
      request.on("error", (err) => {
        console.error(err)
      })

      // データを送信
      request.write(dataString)
      request.end()
    }
  }
})

app.listen(PORT, () => {
  console.log(`Example app listening at http://localhost:${PORT}`)
})
