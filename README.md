# qrcode-line-bot

## About this Repository

It is a LINE-BOT which can generate "QR Code" from string.

<br>

![qrcode](https://user-images.githubusercontent.com/78995078/211179579-1fea81b6-b2bb-44ab-a3b9-e603ca54c3d2.gif)

## Usage

Add this account
 - ID
   - @306cimah
 - URL
   - [https://line.me/R/tip/%40306cimah]

and

Put the following in the input field of the line！

```
qrcode (Required)
target string (Required)
length (INT) 
```

## Use software

### environments

- AWS
  - S3
  - Lambda
    - Node.js 18.x
    
### the way to build

- aws cli install [https://docs.aws.amazon.com/ja_jp/cli/latest/userguide/getting-started-install.html]
- git clone https://github.com/egprogram/qrcode-line-bot
- write prd.yml
- npx serverless deploy


