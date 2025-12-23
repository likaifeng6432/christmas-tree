// src/App.jsx
import { useEffect, useRef, useState } from 'react'; 
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { TreeParticles } from './TreeParticles';
import { useHandTracking, previewCanvasRefGlobal } from './useHandTracking';

function App() {
  const handState = useHandTracking();
  const debugCanvasRef = useRef(null);
  
  // 1. 实时监听窗口宽度
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    previewCanvasRefGlobal.current = debugCanvasRef.current;
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000000', overflow: 'hidden', position: 'relative' }}>
      
      {/* 1. 【中央大字】根据 isMobile 动态调整参数 */}
      <div style={{ 
        position: 'absolute', 
        top: '50%',           
        left: '50%', 
        // 电脑端 -185%, 手机端 -210% (防止压到树尖)
        transform: `translate(-50%, ${isMobile ? '-225%' : '-220%'})`, 
        zIndex: 5, 
        pointerEvents: 'none',
        textAlign: 'center'
      }}>
        <h1 style={{ 
          margin: 0, 
          // 电脑端 7.5rem, 手机端 3.2rem (确保不换行)
          fontSize: isMobile ? '3.2rem' : '7.5rem', 
          lineHeight: '0.85', 
          fontWeight: 'normal',
          fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
          fontStyle: 'italic',
          textTransform: 'uppercase',
          color: '#ffffff', 
          textShadow: '0 0 10px rgba(255, 255, 255, 0.8), 0 10px 30px rgba(0, 0, 0, 0.5)',
          letterSpacing: isMobile ? '4px' : '6px',
          whiteSpace: 'nowrap'
        }}>
          Merry<br />Christmas
        </h1>
      </div>

      {/* 2. 【左侧 UI】手机端缩小字号和边距 */}
      <div style={{ 
        position: 'absolute', 
        top: isMobile ? 15 : 30, 
        left: isMobile ? 15 : 30, 
        color: 'white', 
        zIndex: 10, 
        fontFamily: 'Arial, sans-serif', 
        pointerEvents: 'none' 
      }}>
        <p style={{ 
          opacity: 0.8, 
          fontSize: isMobile ? '0.85rem' : '1.1rem', 
          lineHeight: '1.6', 
          margin: 0 
        }}>
          👋 <b>{isMobile ? '左右移动' : '左右平移手'}</b>: 旋转树<br/>
          🤏 <b>{isMobile ? '捏合' : '捏合手指'}</b>: 变成心
        </p>
      </div>

      {/* 3. 【右侧预览】限制最大比例，防止手机上爆框 */}
      <div style={{
        position: 'fixed', 
        top: isMobile ? '15px' : '20px', 
        right: isMobile ? '15px' : '20px', 
        zIndex: 100,
        background: 'rgba(0,0,0,0.6)', 
        padding: '3px', 
        borderRadius: '10px',
        border: '1px solid rgba(255,255,255,0.2)', 
        backdropFilter: 'blur(8px)',
        // 电脑 180px，手机 100px
        width: isMobile ? '100px' : '180px'
      }}>
        <canvas 
          ref={debugCanvasRef} 
          style={{ width: '100%', height: 'auto', borderRadius: '7px', display: 'block' }} 
        />
        <div style={{ color: 'white', fontSize: '9px', textAlign: 'center', marginTop: '3px', opacity: 0.5 }}>
          {isMobile ? "预览" : "实时手势追踪"}
        </div>
      </div>

      {/* 4. 【3D 场景层】 */}
      <Canvas camera={{ position: [0, 0, 18], fov: 45 }}>
        <color attach="background" args={['#050505']} />
        <TreeParticles handState={handState} />
        <EffectComposer>
          <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} intensity={2.0} radius={0.8} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}

export default App;