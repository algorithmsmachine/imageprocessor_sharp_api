# Image processor API for node

Performs operations
- Flip horizontal and vertical
- Rotate +/- n degrees 
- Convert to grayscale 
- Resize
- Generate a thumbnail
- Rotate left
- Rotate right

## API usuage 

http://localhost:3000/image?resize=400,300&greyscale=1&rotate=60

http://localhost:3000/image?thumbail=&rotate=70&resize=200,400&greyscale


API docs - http://localhost:3000/api-docs 

## References 

### sharp
https://sharp.pixelplumbing.com/

## Nodejs Streams 