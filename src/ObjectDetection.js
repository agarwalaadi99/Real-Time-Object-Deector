import React, { useState, useEffect, useRef } from "react";
import Layout from './components/Layout'
import Viewer from './components/Viewer'
import Dropzone from './components/Dropzone'
import "@tensorflow/tfjs";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import { useDropzone } from "react-dropzone";
import "./App.css";
import Head from 'next/head';

// const API_URL = process.env.API_URL 

// async function fetchPredict(file, setObjects, setStatus) {
//   setStatus('loading')
//   window.scrollTo(0, 0)
//   setObjects([])
//   const res = await fetch(`${API_URL}/predict`, {
//     method: 'POST',
//     body: file
//   })
//   if (!res.ok) {
//     setStatus('error')
//     return
//   }
//   const json = await res.json()
//   setObjects(json)
//   setStatus('success')
// }

// async function fetchWarm() {
//   await fetch(`${API_URL}/warm`)
// }

function shuffle(arr) {
  const a = [...arr]
  var j, x, i
  for (i = a.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1))
    x = a[i]
    a[i] = a[j]
    a[j] = x
  }
  return a
}

const ExampleImage = ({
  src,
  topic,
}) => {
  const [img, setImg] = useState()

  useEffect(() => {
    fetch(src)
      .then(res => res.blob())
      .then(blob => {
        blob.src = URL.createObjectURL(blob)
        setImg(blob)
      })
  }, [])

  return (
    <div className="sample-img">
      {img ? (
        <div className="img-frame show">
          <img
            src={img.src}
            alt={`A ${topic}`}
            onClick={() => {
              console.log("Clicked on img")
              setImg(Object.assign(img, { preview: URL.createObjectURL(img)}))
              console.log(img)
          }}
          />
        </div>
      ) : (
        <div className="img-frame" />
      )}
      <style jsx>{`
        .sample-img {
          position: relative;
          width: 190px;
          height: 190px;
          float: left;
        }
        .img-frame {
          margin-right: 10px;
          margin-bottom: 15px;
          padding: 12px;
          border-radius: 5px;
          border: 1px solid #ddd;
          box-shadow: 0 4px 5px 0 rgba(0, 0, 0, 0.1);
          opacity: 0;
          transition: 0.7s ease-in;
          cursor: pointer;
        }
        .img-frame.show {
          opacity: 1;
        }
        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
        }
      `}</style>
    </div>
  )
}

const TOPICS = [
  'person',
  'bicycle',
  'car',
  'motorcycle',
  'airplane',
  'bus',
  'train',
  'truck',
  'boat',
  'traffic light',
  'fire hydrant',
  'street sign',
  'stop sign',
  'parking meter',
  'bench',
  'bird',
  'cat',
  'dog',
  'horse',
  'sheep',
  'cow',
  'elephant',
  'bear',
  'zebra',
  'giraffe',
  'hat',
  'backpack',
  'umbrella',
  'shoe',
  'eye glasses',
  'handbag',
  'tie',
  'suitcase',
  'frisbee',
  'skis',
  'snowboard',
  'sports ball',
  'kite',
  'baseball bat',
  'baseball glove',
  'skateboard',
  'surfboard',
  'tennis racket',
  'bottle',
  'plate',
  'wine glass',
  'cup',
  'fork',
  'knife',
  'spoon',
  'bowl',
  'banana',
  'apple',
  'sandwich',
  'orange',
  'broccoli',
  'carrot',
  'hot dog',
  'pizza',
  'donut',
  'cake',
  'chair',
  'couch',
  'potted plant',
  'bed',
  'mirror',
  'dining table',
  'window',
  'desk',
  'toilet',
  'door',
  'tv',
  'laptop',
  'mouse',
  'remote',
  'keyboard',
  'cell phone',
  'microwave',
  'oven',
  'toaster',
  'sink',
  'refrigerator',
  'blender',
  'book',
  'clock',
  'vase',
  'scissors',
  'teddy bear',
  'hair drier',
  'toothbrush',
  'hair brush',
]

const Examples = ({ topics, ...props }) => {
  return (
    <div>
      {topics.slice(0, 6).map(topic => (
        <ExampleImage
          key={topic}
          src={`https://source.unsplash.com/500x500/?${topic}`}
          topic={topic}
          {...props}
        />
      ))}
      <div className="float-reset" />
      <style jsx>{`
        .float-reset {
          clear: both;
          margin-bottom: 2em;
        }
      `}</style>
    </div>
  )
}

const thumb = {
  display: "none",
  marginBottom: 8,
  marginRight: 8,
  width: 500,
  height: 500,
  padding: 4,
  boxSizing: "border-box",
};

const thumbInner = {
  display: "flex",
  minWidth: 0,
  overflow: "hidden",
};

const img = {
  display: "block",
  width: "auto",
  height: "100%",
};

export default function ObjectDetection() {
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState('waiting');
  const [error, setError] = useState(null);
  const [objects, setObjects] = useState([]);
  const [topics, setTopics] = useState(shuffle(TOPICS));
  const [model, setModel] = useState(null);

  const canvasRef = useRef(null);
  // const { getRootProps, getInputProps } = useDropzone({
  //   accept: "image/*",
  //   maxSize: 5*1024*1024,
  //   multiple: false,
  //   onDrop: (acceptedFiles) => {
  //     setFiles(
  //       acceptedFiles.map((file) =>
  //         Object.assign(file, {
  //           preview: URL.createObjectURL(file),
  //         })
  //       )
  //     );
  //   },
  // });
  const imageChange = async (e) => {
    const ctx = canvasRef.current.getContext("2d");

    const imageWidth = e.target.naturalWidth;
    const imageHeight = e.target.naturalHeight;

    canvasRef.current.width = e.target.width;
    canvasRef.current.height = e.target.height;

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    if (imageWidth > imageHeight) {
      ctx.drawImage(
        e.target,
        (imageWidth - imageHeight) / 2,
        0,
        imageHeight,
        imageHeight,
        0,
        0,
        ctx.canvas.width,
        ctx.canvas.height
      );
    } else {
      ctx.drawImage(
        e.target,
        0,
        (imageHeight - imageWidth) / 2,
        imageWidth,
        imageWidth,
        0,
        0,
        ctx.canvas.width,
        ctx.canvas.height
      );
    }

    const predictions = await model.detect(canvasRef.current);

    for (let prediction of predictions) {
      ctx.strokeStyle = "green";
      ctx.lineWidth = 4;
      ctx.strokeRect(
        prediction.bbox[0],
        prediction.bbox[1],
        prediction.bbox[2],
        prediction.bbox[3]
      );

      const textWidth = ctx.measureText(prediction.class).width;

      ctx.fillStyle = "green";
      ctx.fillRect(prediction.bbox[0], prediction.bbox[1], textWidth + 20, 20);

      ctx.fillStyle = "black";
      ctx.fillText(
        prediction.class + " " + prediction.score.toFixed(2) * 100 + "%",
        prediction.bbox[0] + 5,
        prediction.bbox[1] + 5
      );
    }
  };

  const thumbs = files.map((file) => (
    <div style={thumb} key={file.name}>
      <div style={thumbInner}>
        <img src={file.preview} style={img} onLoad={imageChange} alt="Object" />
      </div>
    </div>
  ));

  useEffect(() => {
    cocoSsd.load().then((model) => {
      setModel(model);
    });

    URL.revokeObjectURL(files.preview);
  }, [files]);

  return (
    <>
    {/* <section className="container App">
        <header className="App-header">
          <p>Drag 'n' drop some files here, or click to select files</p>
          <div {...getRootProps({ className: "dropzone" })}>
            <input {...getInputProps()} />
            {files && <aside>{thumbs}</aside>}
            <canvas id="canvas" ref={canvasRef}></canvas>
          </div>
        </header>
      </section> */}
      <Head>
        <title>Object Detection - An API to detect objects on images</title>
        <meta
          name="description"
          content="An API to detect objects on images using tensorflow-js and Zeit Now"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Layout
        sidebar={
          <>
            {status === 'error' && (
              <div className="alert-red">
                <div className="alert-content">
                  {error || 'The API returned an error'}
                </div>
              </div>
            )}
            {status === 'success' && objects.length === 0 && (
              <div className="alert-orange">
                <div className="alert-content">
                  No objects detected on this image
                </div>
              </div>
            )}
            <div className="padding">
              <h1>Object-Detection</h1>

              <h2>Upload an image</h2>

              <Dropzone
                setStatus={setStatus}
                setFiles={setFiles}
                setError={setError}
              />

              <h2>
                Or drag an example image (
                <button
                  className="link"
                  onClick={() => setTopics(shuffle(TOPICS))}
                >
                  refresh?
                </button>
                )
              </h2>
              <Examples
                topics={topics}
                setFiles={setFiles}
                setStatus={setStatus}
                setObjects={setObjects}
              />
            </div>
          </>
        }
      >
        {/* <Viewer files={files} objects={objects} status={status} /> */}

        {files && <aside>{thumbs}</aside>}
        <canvas id="canvas" width={400} height={400} ref={canvasRef}></canvas>

      </Layout>

      <style jsx global>{`
      * {
        margin: 0;
        padding: 0;
      }
      body {
        font-family: 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif;
      }
      h1 {
        margin-bottom: 1em;
        font-weight: bold;
        font-size: 1.3em;
        padding-bottom: 0.8em;
        color: #555;
        border-bottom: 1px solid #eee;
      }
      h2 {
        margin-bottom: 1em;
        font-weight: bold;
        font-size: 1.3em;
      }
      .alert-orange {
        background: rgba(255, 127, 80, 1);
        color: white;
      }
      .alert-red {
        background: rgba(255, 0, 0, 0.8);
        color: white;
      }
      .alert-content {
        padding: 10px 25px 15px 25px;
        text-align: center;
        font-weight: bold;
      }
      .padding {
        padding: 30px 40px;
      }
      button.link,
      a {
        color: rgb(32, 89, 246);
        border-bottom: 1px solid rgba(32, 89, 246, 0.9);
        border-top: 0;
        border-left: 0;
        border-right: 0;
        text-decoration: none;
        font-size: inherit;
        font-weight: inherit;
        cursor: pointer;
      }
      p {
        line-height: 1.5em;
        font-size: 1.1em;
      }
      p.mb {
        margin-bottom: 1em;
      }
      `}</style>
    </>
  );
}
