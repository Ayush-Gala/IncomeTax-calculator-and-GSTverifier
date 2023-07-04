//importing all required packages
const express = require('express')
const upload = require('express-fileupload')
const fs = require('fs')
const request = require('request')
const ejs = require('ejs')

//creating server instance
const app = express()


//allowing the app to use the express-fileupload framework to access the files from the users computer
app.use(upload())
app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded());
app.use( express.static( "public" ) );


app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  res.render('home');
})


//if the user visits the home page via the root directory
app.get('/uploadInvoice', (req, res) => {
    // res.sendFile(__dirname + '/index.html')
    res.render('index')
})

app.get('/results', (req, res) => {
  res.render('results', {data: {merchantName:'h', merchantAddress:'h', date:'h', receiptNo: 'h', totalAmt:0, gstNum:'bf'}, verified: false})
})


app.get('/calculator', (req, res) => {
  res.render('calc');
})


//if the user clicks on the upload button on the html page
app.post('/ocr', (req, res) => {
    if(req.files){
        // console.log(req.files)
        var file = req.files.file
        var filename = file.name
        console.log(filename)

        //uploading file to temp folder
        file.mv('./uploads/' + filename, function(err){
            if(err){
                res.send(err)
            } else{

                //logic of API calls
                const receiptOcrEndpoint = 'https://ocr.asprise.com/api/v1/receipt'
                request.post({
                    url: receiptOcrEndpoint,
                    formData: {
                      api_key: 'TEST',        // Use 'TEST' for testing purpose
                      recognizer: 'auto',        // can be 'US', 'CA', 'JP', 'SG' or 'auto'
                      ref_no: 'ocr_nodejs_123', // optional caller provided ref code
                      file: fs.createReadStream('./uploads/'+filename) // the image file
                    },
                  }, function(error, response, body) {
                    if(error) {
                      console.error(error);
                    }

                    console.log(body);

                    body = JSON.parse(body)

                    //fetching the data from the API response body
                    var merchantName = body.receipts[0].merchant_name;
                    var merchantAddress = body.receipts[0].merchant_address;
                    var receiptNo = body.receipts[0].receipt_no;
                    var date = body.receipts[0].date;
                    var totalAmt = body.receipts[0].total;
                    var gstNum = body.receipts[0].merchant_tax_reg_no;

                    //creating a JSON object to store the data
                    var jsonResponse = {
                      merchantName: merchantName,
                      merchantAddress: merchantAddress,
                      receiptNo: receiptNo,
                      date: date,
                      totalAmt: totalAmt,
                      gstNum: gstNum
                    }

                    console.log(jsonResponse)
                    //sending the JSON object as a response to the client
                    res.render('results', {data: jsonResponse, verified: false})
                  });
            }
        })
    }
})


app.listen(5000)