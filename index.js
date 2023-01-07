const https = require("https")
const express = require("express")
const app = express()
const qrCode = require("qrcode")

require('dotenv').config()

const PORT = process.env.PORT || 3000
const TOKEN = process.env.LINE_ACCESS_TOKEN

app.use(express.json())
app.use(express.urlencoded({
  extended: true
}))

// QRコード作成関数
const generateQrcode = async (str, width) => {
  return new Promise((resolve, reject) => {
    const opts = {
      width: width || 100
    }

    qrCode.toFile('./img/test.png', str, opts, (err, string) => {
      if(err){
        reject(false)
      }else{
        resolve(true)
      }
    })
  }) 
}

app.get("/healthcheck", (req, res) => {
  res.send({ status: true })
})

app.post("/webhook", async (req, res) => {
  // ユーザーがボットにメッセージを送った場合、返信メッセージを送る
  if (req.body.events[0].type === "message") {
    // QRコードを作成
    const str = 'test'
    const width = 200
    const status = await generateQrcode(str, width)

    let messages = []
    if(status){
      messages.push({ "type": "text", "text": "success to generate the Qrcode." })
    }else{
      messages.push({ "type": "text", "text": "failed to generate the Qrcode." })
    }
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
