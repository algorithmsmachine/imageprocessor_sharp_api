# Image processor API for node

Stateless image processing Service 


## Overview 
Receive an image in one of the acceptable image formats. 
Perform any of the combinations of the operations: flip horizontal and vertical , rotate +/- in degrees , Convert to grayscale, resize , generate a thumbnail , rotate left and right, as specified in the request accounting the image post request.
Return the processed image and delete any server side copies of original and processed image .

**Performs operations**
- Flip horizontal and vertical
- Rotate +/- n degrees 
- Convert to grayscale 
- Resize
- Generate a thumbnail
- Rotate left
- Rotate right


## API usage 

http://localhost:3000/image?resize=400,300&greyscale=1&rotate=60

http://localhost:3000/image?thumbail=&rotate=70&resize=200,400&greyscale

### Swagger 

API docs - http://localhost:3000/api-docs 


### CURL

```shell
curl -X POST -F  "image=@/pathtoimagefifle" --output -i "localhost:3000/image?resize=400,300&greyscale=1&rotate=60"
```

Example 
```shell
curl -X POST -F  "image=@/home/altanai/Desktop/Altanai-Bisht1.jpg" --output  -i "localhost:3000/image?resize=400,300&greyscale=1&rotate=60"  
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100  147k  100 30661  100  117k  1575k  6163k --:--:-- --:--:-- --:--:-- 7352k
```

## Sample outouot for one process 

```shell
Uploading: %0
Uploading: %19
Uploading: %22
Uploading: %42
Uploading: %61
Uploading: %61
Uploading: %81
Uploading: %99
Uploading: %100
Received : file Name - _RAK7880.JPG Type -  image/jpeg 165945 /tmp/upload_86ee70ddc0100d1f81e51a519910b91a
Uploaded File -  _RAK7880.JPG
Transformer Oplist  [
  { opname: 'resize', options: '200,400' },
  { opname: 'greyscale', options: null },
  { opname: 'fliphorizontal', options: null },
  { opname: 'resize', options: '100' },
  { opname: 'resize', options: '500' },
  { opname: 'flipvertical', options: null },
  { opname: 'end' }
]
Op   resize 200,400
Op   greyscale null
Op   fliphorizontal null
Op   resize 100
Op   resize 500
Op   flipvertical null
Op   end undefined
Transformer Tofile {
  format: 'jpeg',
  width: 500,
  height: 333,
  channels: 3,
  premultiplied: false,
  size: 19377
}
File is ready processedimage/_RAK7880.JPG
image resizing and manipulation is complete
End Processing, unlink stored files

```

## Solution Design 

The solution is built as a nodejs project using 

1. Installation of libvipis image processing library on server and interface using npm module sharp.

2. Web server using HTTP 1.1 protocol to expose web service API primarily on HTTP methods POST

3. npm modules to support various operations such as 
- building HTTP servers for APIs, 
- processing files as nodejs streams ,
- auto generating API documentation using annotations , 
- linter for code quality analysis and so on. 

4. Npm packaging and  scripts to install and start processes  

5. Docker to containerize the service 


## Flow 

The solution builds an operation sequence with image processing transformations  serialized in a single post request query string. It also accepts a file as a multipart request.
The image is read into a data stream and passed for processing according to pipelined operations.
The operations are individually defined in a library which invokes a core library sharp and builds a pipeline according to matchinging switch case .
At the end of the pipeline , the writable stream is written to a file and returned as output.

![solution](screenshots/Image processor CnC.jpg)

## Dockerizing and Cloud Deployment

![solution](screenshots/cloud image processor Archietcture.jpg)

Make image
```shell
docker build -t altanai/imageprocessor-sharp-api .
```

Run Image 
```shell
docker run -p 3000:3000 -d altanai/imageprocessor-sharp-api
```


Other operations on docker 
```shell
# Get container ID
$ docker ps

# Print app output
$ docker logs <container id>

# Enter the container
$ docker exec -it <container id> /bin/bash
```

## References 

- sharp https://sharp.pixelplumbing.com/
- Nodejs Streams
- Express Validation https://express-validator.github.io/
- Swagger https://swagger.io/docs/
- Docker
