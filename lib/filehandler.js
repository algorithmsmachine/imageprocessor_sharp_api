const checkTime = 1000;
const fs = require('fs');

var filehandler = {
    isFileReady: function (filename, cb) {
        setTimeout(() => {
            fs.readFile(filename, 'utf8', function (err, data) {
                if (err) {
                    // got error reading the file, call check() again
                    filehandler.isFileReady(filename);
                } else {
                    // we have the file contents here, so do something with it
                    // can delete the source file too
                    console.log('File is ready', filename);
                    // eslint-disable-next-line node/no-callback-literal
                    cb(filename);
                }
            });
        }, checkTime)
        // the file is unavailable because it is:
        // still being written to
        // or being processed by another thread
        // or does not exist (has already been processed)
    },
    deleteFile: function (filename) {
        if (fs.existsSync(__dirname + "/../" + filename)) {
            fs.unlinkSync(filename, err => {
                if (err) console.error(err);
                console.log('File is deleted!');
            });
        }else{
            console.log(" files doent exists ",__dirname + "/../" + filename);
        }
    }

};

module.exports = filehandler;