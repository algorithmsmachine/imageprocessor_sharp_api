var sharp = require('sharp');
sharp.cache(false);
// sharp.cache({ files : 0 });
var lib = {
    processImage: function (imgfile, oplist, filename) {
        const sharpStream = sharp({
            failOnError: true
        });
        console.log("Oplist ", oplist);
        const transformer = sharp(imgfile)
            .pipe(sharpStream);
        oplist.reduce((_, op) => {
            console.log("Op  ", op.opname, op.options);
            switch (op.opname) {
                case 'greyscale':
                    // console.log("greyscale");
                    transformer.pipe(sharpStream.greyscale());
                    break;
                case 'thumbnail':
                    // console.log("thumbnail");
                    transformer.pipe(sharpStream.resize(200, 200, {fit: sharp.fit.cover}));
                    break;
                case 'rotate':
                    // console.log("rotate", op.options);
                    transformer.pipe(sharpStream.rotate(parseInt(op.options || 0)));
                    break;
                case 'rotateleft':
                    // console.log("rotateleft");
                    transformer.pipe(sharpStream.rotate(90));
                    break;
                case 'rotateright':
                    // console.log("rotateright");
                    transformer.pipe(sharpStream.rotate(270));
                    break;
                case 'resize':
                    // console.log("resize ", op.options);
                    let opt = op.options;
                    if (opt && opt.includes(",")) {
                        let size = opt.split(",");
                        transformer.pipe(sharpStream.resize({
                            height: parseInt(size[0]),
                            width: parseInt(size[1])
                        }))
                            .on('error', (err)=>{ return err });
                    } else {
                        transformer.pipe(sharpStream.resize(parseInt(opt)));
                    }

                    break;
                case 'end':
                    transformer.pipe(
                        sharp().toFile(filename, (err, info) => {
                            if (err)
                                console.error("Transformer Error ", err);
                            else
                                console.log("Transformer To file", info);
                        })
                    );
                    break;
                default:
                    console.log("Unmatched / Default case ")
                    break;
            }
        }, {});

        return transformer;
    }

};

module.exports = lib;