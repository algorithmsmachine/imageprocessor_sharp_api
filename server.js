const express = require('express'),
    Path = require('path'),
    bodyparser = require('body-parser'),
    swaggerJsdoc = require("swagger-jsdoc"),
    swaggerUi = require("swagger-ui-express"),
    fs = require('fs'),
    HttpStatus = require('http-status-codes'),
    formidable = require('formidable');
const { check, oneOf, validationResult } = require('express-validator');
const {v4: uuidv4} = require('uuid');
const lib = require('./lib/processImage.js');
const fileh = require('./lib/filehandler.js');
const app = express();
app.use(bodyparser.urlencoded({extended: true}))

app.use((req, res, next) => {
    console.log('Time:', Date.now(), req.method,);
    next(); // call the next function on the chain
});


app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.append('subject', 'CPSC-5200');
    next();
});


const options = {
    definition: {
        // swagger: "2.0",
        openapi: '3.0.0',
        info: {
            title: "Image Processor",
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
 *     description: Uploads an Image system, processes it according to set of arguments and returns
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


app.post('/image',
    oneOf([
        check('fliphorizontal').exists(),
        check('flipvertical').exists(),
        check('greyscale').exists(),
        check('thumbnail').exists(),
        check('rotate').exists(),
        check('rotateleft').exists(),
        check('rotateright').exists(),
        check('resize').exists()
    ], 'you must provide at least one of operations fliphorizontal , flipvertical, greyscale , thumbnail, rotate , rotateleft, rotateright or resize'),

    (req, res) => {

    const isvalid = validationResult(req);
    console.log("validationresult ", isvalid);
    if(isvalid.errors.length>0){
        console.log("validationresult ", isvalid.errors);
        return res.status(400).send(isvalid.errors[0].msg);
    }

    try {
        if (!req.query) {
            // return res.status(HttpStatus.BAD_REQUEST).send(new Error('Specify operation on to be processed in file such as resize , rotate, greyscale'));
            return res.status(HttpStatus.BAD_REQUEST).send('Specify operation on to be processed in file such as resize , rotate, greyscale');
        }

        const query = (req.url.split('?'))[1];
        // console.log('query', query); // do not req.query since it will overwrite if operation is used twice
        const opqueryList = query.split('&');
        // console.log('opqueryList', opqueryList);
        let oplist = [];
        try {
            for (x in opqueryList) {
                console.log(opqueryList[x]);
                var op = (opqueryList[x]).split("=");
                oplist.push({opname: op[0], options: op[1] || null});
            }
            oplist.push({opname: "end"});
        } catch (err) {
            console.error('Error in creating set of operation List fromm query params -', err);
            // throw err;
            return res.status(HttpStatus.BAD_REQUEST).send(new Error('Missing required attributes'));
        }

        // get the uploaded form
        let imgfile;
        const form = new formidable.IncomingForm().parse(req, (err, fields, files) => {
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
                // self.emit('progess', bytesReceived, bytesExpected)
                const percent = (bytesReceived / bytesExpected * 100) | 0;
                console.log('Uploading: %' + percent + '\r');
            })
            .on('end', () => {
                if (!imgfile || imgfile.size <= 0 || !imgfile.type.includes("image")) {
                    return res.status(HttpStatus.BAD_REQUEST).send('Missing required attributes- image file');
                }
                console.log('Uploaded File - ', imgfile.name);
                imgfile.uuid = uuidv4();
                imgfile.serverpath = 'image/' + imgfile.name;
                imgfile.processedpath = 'processedimage/' + imgfile.name;
                fs.rename(imgfile.path, imgfile.serverpath, function (err) {
                    if (err) {
                        console.error( imgfile.uuid, 'Error in copy the file from tmp to spcific location ', err);
                        throw err;
                    }

                    lib.processImage(imgfile.serverpath, oplist, imgfile.processedpath);

                    fileh.isFileReady(imgfile.processedpath, (filename) => {
                        console.log( imgfile.uuid , ' Image resizing and manipulation is complete');
                        res.status(201).sendFile(__dirname + "/" + filename);
                        res.on('finish', () => {
                            console.log( imgfile.uuid, ' End Processing, unlink stored files');
                            fileh.deleteFile(imgfile.serverpath);
                            fileh.deleteFile(imgfile.processedpath);
                        })
                    });
                });
            });

    } catch (error) {
        console.error(error);
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(new Error('Failed to process'));
    }
})

app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(specs, {explorer: true})
);

app.listen(8080, () => {
    console.log("Server Running!")
})