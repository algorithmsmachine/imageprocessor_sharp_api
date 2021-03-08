var express = require('express'),
    Path = require('path'),
    bodyparser = require('body-parser'),
    fs = require('fs'),
    HttpStatus = require('http-status-codes'),
    formidable = require('formidable');

const {v4: uuidv4} = require('uuid');
var lib = require('./lib/processImage.js'),
    app = express();
app.use(bodyparser.urlencoded({extended: true}))

app.use( (req, res, next)=> {
    console.log('Time:', Date.now());
    next(); //call the next function on the chain
});

app.post('/image', (req, res) => {

    try {
        console.log('req.query', req.query);
        let oplist = [];
        var opqueryList = req.query;
        for (x in opqueryList) {
            oplist.push({opname: x, options: opqueryList[x]})
        }
        oplist.push({opname: "end"});
        // oplist.push({opname: name , options: field});

        var form = new formidable.IncomingForm().parse(req, (err, fields, files) => {
            if (err) {
                console.error('Error', err);
                res.status(500).send("Server Error");
                throw err;
            }
            const missingRequiredAttributes = !files || !fields;//|| req.files.size === 0;
            if (missingRequiredAttributes) {
                return res.status(HttpStatus.BAD_REQUEST).send(new Error('Missing required attributes'));
            }
        });

        form.on('file', (name, imgfile) => {
            if (!imgfile.type.includes("image")) {
                return res.status(HttpStatus.BAD_REQUEST).send(new Error('Missing Image'));
            }
            console.log('Received : file Name -', imgfile.name, "Type - ", imgfile.type, imgfile.size, imgfile.path);
            imgfile.serverpath = 'image/' + imgfile.name;
            imgfile.processedpath = 'processedimage/' + imgfile.name;
            fs.rename(imgfile.path, imgfile.serverpath, function (err) {
                if (err) {
                    console.error("Error", err);
                    res.status(500).send("Server Error");
                }
                lib.processImage(imgfile.serverpath, oplist, imgfile.processedpath)
                    .on('finish', (err) => {
                        console.log("Finish Processing");
                        if (err) {
                            console.error(err);
                            res.status(500).send("Server Error");
                        }
                        if (fs.existsSync(__dirname + "/" + imgfile.processedpath)) {
                            res.status(201).sendFile(__dirname + "/" + imgfile.processedpath);
                        }else{
                            setTimeout(_=>{
                                res.status(201).sendFile(__dirname + "/" + imgfile.processedpath)
                            }, 2000)
                        }
                    })
                    .on('end', (err) => {
                        console.log("End Processing, unlink stored files");
                        if(err){
                            console.error("Error on Processing end ", err);
                        }

                        fs.unlinkSync(imgfile.serverpath, err => {
                            if (err) console.error(err);
                            console.log('File deleted!');
                        });

                        if (fs.existsSync(__dirname + "/" + imgfile.processedpath)) {
                            fs.unlinkSync(imgfile.processedpath, err => {
                                if (err)  console.error(err);
                                console.log('File deleted!');
                            });
                        }
                        return ;
                    });

            });
        })
            .on('aborted', () => {
                console.error('Request aborted by the user')
            })
            .on('error', (err) => {
                console.error('Error', err);
                res.status(500).send("Server Error");
            })
            .on('end', () => {
                console.log('Uploaded');
            });
    } catch
        (error) {
        console.error(error);
        res.status(500).send(new Error('Failed to create'));
    }
})


app.listen(3000, () => {
    console.log("Server Running!")
})