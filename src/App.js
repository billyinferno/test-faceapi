import React, { useState, useRef, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import './App.css';

function App() {
  const [initialized, setinitialized] = useState(false);
  const [faceMatcher, setFaceMatcher] = useState(null);
  const [currentStatus, setCurrentStatus] = useState("Initialized");
  const videoWidth = 300;
  const videoHeight = 300;
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const MODEL_URL = process.env.PUBLIC_URL + '/models';

    const loadImages = async () => {
      setCurrentStatus("🖼 Load Images");
      const labels = ['Adi Martha', 'Seno', 'Wendy'];
      const IMAGE_URL = process.env.PUBLIC_URL + '/images/';
      console.log("Loading Labeled Images");
      return Promise.all(
        labels.map(async label => {
          const descriptions = [];
          for (let i = 1; i <= 2; i++) {
            const img = await faceapi.fetchImage(IMAGE_URL + label + '/' + i + '.jpg');
            const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
            descriptions.push(detections.descriptor);
          }  
          return new faceapi.LabeledFaceDescriptors(label, descriptions);
        })
      );
    };

    const loadFaceMatcher = async () => {
      setCurrentStatus("🎭 Create Face Matcher");
      const labelFaceDescriptors = await loadImages();
      const faceMatcher = new faceapi.FaceMatcher(labelFaceDescriptors, 0.6);
      setFaceMatcher(faceMatcher);
      console.log("Create Face Matcher");
    };


    const loadModels = async () => {
      setCurrentStatus("Loading Models");
      console.log("Loading models");
      // load all the model for face detector
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
      await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
      await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
      // once finished, then load all the face models
      await loadFaceMatcher();
      // once finished then we can start the video
      setinitialized(true);
    };

    loadModels();
  }, []);

  useEffect(() => {
    // start the video once the initialized is already set into true
    if(initialized) {
      console.log("Start video");
      setCurrentStatus("📹 Ready");
      navigator.mediaDevices.getUserMedia({ audio: false, video: { width: videoWidth, height: videoHeight } }).then(function(stream) {
        videoRef.current.srcObject = stream;
      }).catch(function (err) {
        console.error("startVideo error: " + err);
        setCurrentStatus("🛑 Error: " + err.message);
      });
    }
  }, [initialized]);

  const detectFace = () => {
    setInterval(async () => {
      if(initialized) {
        // should be initialized
        canvasRef.current.innerHTML = faceapi.createCanvasFromMedia(videoRef.current);
        faceapi.matchDimensions(canvasRef.current, {
          width: videoWidth,
          height: videoHeight
        });
        console.log("Set canvas dimension same as video");

        const detection = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions().withFaceDescriptors();
        const resizedDetections = faceapi.resizeResults(detection, { width: videoWidth, height: videoHeight });
        // match the face
        // const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor));
        resizedDetections.forEach(({detection, descriptor}, i) => {
          canvasRef.current.getContext('2d').clearRect(0, 0, videoWidth, videoHeight);
          faceapi.draw.drawDetections(canvasRef.current, resizedDetections[i]);
          faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections[i]);
          faceapi.draw.drawFaceExpressions(canvasRef.current, resizedDetections[i]);
          const box = detection.box;
          const label = faceMatcher.findBestMatch(descriptor);
          const drawBox = new faceapi.draw.DrawBox(box, {
            label: label
          });
          drawBox.draw(canvasRef.current);
        });
        // console.log("detect something");
      }
      else {
        console.log("Not yet initialized");
      }
    }, 100);
  }

  return (
    <div className="App">
      <div className="display-flex justify-content-center">
        <span>
          {`${currentStatus}`}
        </span>
      </div>
      <video
        ref={videoRef}
        style = {
          {
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            left: 0,
            right: 0,
            textAlign: "center",
            zindex: 9,
            width: 300,
            height: 300,
          }
        }
        width="300"
        height="300"
        onPlay={detectFace}
        playsInline="true"
        autoPlay muted />
      <canvas
        ref={canvasRef}
        style = {
          {
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            left: 0,
            right: 0,
            textAlign: "center",
            zindex: 9,
            width: 300,
            height: 300,
          }
        }
      />
    </div>
  );
}

export default App;
