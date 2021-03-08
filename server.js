var express = require('express'),
    Path = require('path'),
    bodyparser = require('body-parser'),
    swaggerJsdoc = require("swagger-jsdoc"),
    swaggerUi = require("swagger-ui-express"),
    fs = require('fs'),
    HttpStatus = require('http-status-codes'),
    formidable = require('formidable');

const {v4: uuidv4} = require('uuid');
var lib = require('./lib/processImage.js'),
    app = express();
app.use(bodyparser.urlencoded({extended: true}))

const options = {
    definition: {
        // swagger: "2.0",
        openapi: '3.0.0',
        info: {
            title: "Image Processorr",
            version: "0.1.0",
            description:
                "This is a image processor API application made with Express and documented with Swagger",
            license: {
                name: "MIT",
                url: "https://spdx.org/licenses/MIT.html",
            },
            contact: {
                name: "Altanai",
                email: "abisht@seattleu.edu",
            },
        },
        servers: [
            {
                url: "http://localhost:3000/",
                description: 'Local server',
            },
        ],
    },
    apis: ["./server.js"],
};
const specs = swaggerJsdoc(options);

/**
 * @swagger
 * /image:
 *   post:
 *     summary: Processes an Image
 *     description: Uoloads an Image system, processes it according to set of argumentd and returns
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: image
 *         type: file
 *         required: true
 *         description: Image file
 *       - in: path
 *         name: greyscale
 *         description: Whether video image should turn grey
 *         type: string
 *       - in: path
 *         name: rotate
 *         description: Rotate the Image
 *         type : string
 *       - in: path
 *         name: resize
 *         description: Resize the image
 *         schema:
 *           type: integer
 *       - in: path
 *         name: thumbnail
 *         description: generate and return a thumbnail version for image
 *         schema:
 *           type: integer
 *       - in: path
 *         name: rotateright
 *         description: rotate the image by 90 degree
 *         schema:
 *           type: string
 *       - in: path
 *         name: rotateleft
 *         description: rotate the image by 270 degree
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Processes and returns successfully
 *       400:
 *         description: Missing required attributes
 *       500:
 *         description: Failed to create Object
 */
app.post('/image', (req, res) => {

    try {
        console.log('req.query', req.query);
        if (!req.query) {
            // return res.status(HttpStatus.BAD_REQUEST).send(new Error('Specify operation on to be processed in file such as resize , rotate, greyscale'));
            return res.status(HttpStatus.BAD_REQUEST).send('Specify operation on to be processed in file such as resize , rotate, greyscale');
        }

        let oplist = [];
        let opqueryList = req.query;

        // Parse query strings
        try {
            for (x in opqueryList) {
                oplist.push({opname: x, options: opqueryList[x]})
            }
            oplist.push({opname: "end"});
        } catch (err) {
            console.error('Error in creating set of operation List fromm query params -', err);
            // throw err;
            return res.status(HttpStatus.BAD_REQUEST).send(new Error('Missing required attributes'));
        }

        // get the uploaded form
        var imgfile;
        var form = new formidable.IncomingForm().parse(req, (err, fields, files) => {
            if (err) {
                console.error('Error in reading incoming form - ', err);
                throw err;
            }
        });

        // get the image file from uploaded image files
        form.on('file', (name, file) => {
            console.log('Received : file Name -', file.name, "Type - ", file.type, file.size, file.path);
            imgfile = file;
        })
            .on('aborted', () => {
                console.error('Request aborted by the user');
            })
            .on('error', (err) => {
                console.error('Error in parsing file from form - ', err);
                throw err;
            })
            .on('progress', function (bytesReceived, bytesExpected) {
                //self.emit('progess', bytesReceived, bytesExpected)
                var percent = (bytesReceived / bytesExpected * 100) | 0;
                console.log('Uploading: %' + percent + '\r');
            })
            .on('end', () => {
                if (!imgfile || imgfile.size <= 0 || !imgfile.type.includes("image")) {
                    return res.status(HttpStatus.BAD_REQUEST).send('Missing required attributes- image file');
                }

                console.log('Uploaded File - ', imgfile);
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
                            } else {
                                setTimeout(_ => {
                                    res.status(201).sendFile(__dirname + "/" + imgfile.processedpath)
                                }, 2000)
                            }
                        })
                        .on('end', (err) => {
                            console.log("End Processing, unlink stored files");
                            if (err) {
                                console.error("Error on Processing end ", err);
                            }

                            fs.unlinkSync(imgfile.serverpath, err => {
                                if (err) console.error(err);
                                console.log('File deleted!');
                            });

                            if (fs.existsSync(__dirname + "/" + imgfile.processedpath)) {
                                fs.unlinkSync(imgfile.processedpath, err => {
                                    if (err) console.error(err);
                                    console.log('File deleted!');
                                });
                            }
                        });
                });
            });


    } catch (error) {
        console.error(error);
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(new Error('Failed to create'));
    }
})


app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(specs, {explorer: true})
);

app.listen(3000, () => {
    console.log("Server Running!")
})