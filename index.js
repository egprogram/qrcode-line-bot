const https = require("https")
const express = require("express")
const app = express()
const qrCode = require("qrcode")
const base64 = require("urlsafe-base64")
const aws = require("aws-sdk")
const s3 = new aws.S3()

require('dotenv').config()

const PORT = process.env.PORT || 3000
const TOKEN = process.env.LINE_ACCESS_TOKEN

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
const s3Upload = async (decodeData) => {
  const params = {
    Bucket: process.env.S3_BACKET,
    Key: process.env.S3_KEY,
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
  if (req.body.events[0].type === "message") {
    // QRコードを作成
    const str = 'ラインボット作ったよ！！'
    const width = 200
    const qrcodeBuffer = await generateQrcode(str, width)

    // S3にアップロード
    await s3Upload(qrcodeBuffer)

    const messages = [
      { "type": "text", "text": "以下のリンクがQRコードのリンクになります。" },
      { "type": "text", "text": "https://runrunrinmaru.s3.ap-northeast-1.amazonaws.com/qrcode/qrcode.png" }
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
})

app.listen(PORT, () => {
  console.log(`Example app listening at http://localhost:${PORT}`)
})
