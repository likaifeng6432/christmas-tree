// src/App.jsx
import { useEffect, useRef } from 'react'; 
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { TreeParticles } from './TreeParticles';
import { useHandTracking, previewCanvasRefGlobal } from './useHandTracking';

function App() {
  const handState = useHandTracking();
  const debugCanvasRef = useRef(null);

  useEffect(() => {
    previewCanvasRefGlobal.current = debugCanvasRef.current;
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000000', overflow: 'hidden' }}>
      
      {/* 1. 【中央大字】纯白不加粗版 - 精准定位在星星上方 */}
      <div style={{ 
        position: 'absolute', 
        top: '50%',           // 定位到垂直中心
        left: '50%',          // 水平中心
        // transform Y轴的 -185% 是关键，将文字推到 3D 树尖星星的上方
        // 如果位置偏高或偏低，只需微调这里的 -185% 数值
        transform: 'translate(-50%, -225%)', 
        zIndex: 5, 
        pointerEvents: 'none',
        textAlign: 'center'
      }}>
        <h1 style={{ 
          margin: 0, 
          fontSize: '7.5rem', 
          lineHeight: '0.85', 
          fontWeight: 'normal', // 去掉 900 加粗，改用常规粗细
          fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', // 换用更优雅的字体
          fontStyle: 'italic',
          textTransform: 'uppercase',
          color: '#ffffff', 
          textShadow: `
            0 0 10px rgba(255, 255, 255, 0.8),
            0 0 20px rgba(255, 255, 255, 0.3),
            0 10px 30px rgba(0, 0, 0, 0.5)
          `,
          letterSpacing: '6px', // 增加字间距让纤细字体更具设计感
          whiteSpace: 'nowrap'
        }}>
          Merry<br />Christmas!
        </h1>
      </div>

      {/* 2. 【左侧 UI】中文说明 */}
      <div style={{ 
        position: 'absolute', 
        top: 30, 
        left: 30, 
        color: 'white', 
        zIndex: 10, 
        fontFamily: 'Arial, sans-serif', 
        pointerEvents: 'none' 
      }}>
        <p style={{ 
          opacity: 0.8, 
          fontSize: '1.1rem', 
          lineHeight: '1.8', 
          margin: 0,
          textShadow: '0 2px 4px rgba(0,0,0,0.5)'
        }}>
          👋 <b>左右平移手</b>: 旋转树<br/>
          🤏 <b>捏合手指 (OK手势)</b>: 变成心
        </p>
        
        <div style={{ 
          marginTop: 15, 
          display: 'flex', 
          alignItems: 'center', 
          gap: 12,
          padding: '6px 16px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ 
            width: 10, height: 10, borderRadius: '50%', 
            background: handState.hasHand ? '#00ff00' : '#ff0000',
            boxShadow: handState.hasHand ? '0 0 10px #00ff00' : '0 0 10px #ff0000'
          }} />
          <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
            {handState.hasHand ? "已识别到手势" : "请在摄像头前挥手"}
          </span>
        </div>
      </div>

      {/* 3. 【右侧预览】视频监控框 */}
      <div style={{
        position: 'fixed', 
        top: '20px', 
        right: '20px', 
        zIndex: 100,
        background: 'rgba(0,0,0,0.6)', 
        padding: '4px', 
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.2)', 
        backdropFilter: 'blur(8px)'
      }}>
        <canvas 
          ref={debugCanvasRef} 
          style={{ width: '180px', height: 'auto', borderRadius: '8px', display: 'block' }} 
        />
        <div style={{ color: 'white', fontSize: '10px', textAlign: 'center', marginTop: '4px', opacity: 0.7 }}>
          实时手势追踪
        </div>
      </div>

      {/* 4. 【3D 场景层】 */}
      <Canvas camera={{ position: [0, 0, 18], fov: 45 }}>
        <color attach="background" args={['#050505']} />
        <TreeParticles handState={handState} />
        <EffectComposer>
          <Bloom 
            luminanceThreshold={0.2} 
            luminanceSmoothing={0.9} 
            intensity={2.0} 
            radius={0.8} 
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}

export default App;