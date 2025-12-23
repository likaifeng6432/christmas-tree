// src/useHandTracking.js
import { useEffect, useState } from 'react';
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

// 导出这个引用，App.jsx 会把 canvas 传给它
export const previewCanvasRefGlobal = { current: null };

export const useHandTracking = () => {
  const [handState, setHandState] = useState({ x: 0.5, hasHand: false, mode: 0 });
  
  useEffect(() => {
    let handLandmarker = null;
    let video = null;
    let animationId = null;

    const setup = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );
      handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numHands: 1
      });
      startWebcam();
    };

    const startWebcam = () => {
      video = document.createElement("video");
      navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
        video.srcObject = stream;
        video.play();
        video.addEventListener("loadeddata", predict);
      });
    };

    const predict = () => {
      if (video && handLandmarker) {
        let startTimeMs = performance.now();
        const results = handLandmarker.detectForVideo(video, startTimeMs);

        // --- 核心绘图逻辑 ---
        const canvas = previewCanvasRefGlobal.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          ctx.save();
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          // 镜像翻转
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
          // 画背景图
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          // 画骨骼线
          if (results.landmarks && results.landmarks.length > 0) {
            results.landmarks.forEach(landmarks => {
              ctx.strokeStyle = "#00ffde"; 
              ctx.lineWidth = 4;
              ctx.fillStyle = "#ffffff";

              // 手部骨骼连接索引
              const connections = [
                [0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],
                [5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],
                [15,16],[13,17],[17,18],[18,19],[19,20],[0,17]
              ];

              connections.forEach(([i, j]) => {
                ctx.beginPath();
                ctx.moveTo(landmarks[i].x * canvas.width, landmarks[i].y * canvas.height);
                ctx.lineTo(landmarks[j].x * canvas.width, landmarks[j].y * canvas.height);
                ctx.stroke();
              });

              landmarks.forEach(pt => {
                ctx.beginPath();
                ctx.arc(pt.x * canvas.width, pt.y * canvas.height, 5, 0, Math.PI * 2);
                ctx.fill();
              });
            });
          }
          ctx.restore();
        }

        if (results.landmarks.length > 0) {
          const landmarks = results.landmarks[0];
          const x = 1 - landmarks[8].x;
          const distance = Math.hypot(landmarks[8].x - landmarks[4].x, landmarks[8].y - landmarks[4].y);
          setHandState({ x, hasHand: true, mode: distance < 0.1 ? 1 : 0 });
        } else {
          setHandState(prev => ({ ...prev, hasHand: false }));
        }
        animationId = requestAnimationFrame(predict);
      }
    };

    setup();
    return () => {
      if(video && video.srcObject) video.srcObject.getTracks().forEach(t => t.stop());
      cancelAnimationFrame(animationId);
    };
  }, []);

  return handState;
};