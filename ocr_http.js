const request = require('request');
const fs = require('fs');

const Tesseract = require('tesseract.js');
const filename = './img/img2.png';

var createImg = fs.createWriteStream(filename);

request('https://www.octoparse.com/media/3613/captcha.png?width=920&height=457')
    .pipe(createImg)
    .on('close', () => {
        console.log('IMG CREATED');
        Tesseract
            .recognize(filename)
            .progress((p) => {
                console.log(`Progress => ${p}`)
            })
            .then((result) => {
                console.log(result);
                console.log(result.text);
            })
            .catch((err) => {
                console.log(`There is an error: ${err}`);
            });
    });