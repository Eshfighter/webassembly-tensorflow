# ID card segmentation web app
This app is to capture the ID card using TF.js and opencv without any backend logic.

tfjs branch runs the latest model with opencv and tensorflow.js

## Development
run

```npm run start```

## Build for production
```npm run prod_start```

## Docker Deployment
```docker build -t registry.gammalab.sg/open-web:latest .```

```docker push registry.gammalab.sg/open-web```

## Models
The segmentation model is from the project ID-Segmentation. Then we use tensorflowjs-converter to convert the keras model to tfjs format.
