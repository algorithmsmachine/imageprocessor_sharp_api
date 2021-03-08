# Image processor API for node

Performs operations
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



## Dockerizing 

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

### sharp
https://sharp.pixelplumbing.com/

### Nodejs Streams 


### Swagger 
https://swagger.io/docs/

### Docker
