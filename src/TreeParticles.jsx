// src/TreeParticles.jsx
import { useMemo, useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber'; 
import * as THREE from 'three';

const vertexShader = `
  uniform float uTime;
  uniform float uMorph;
  attribute vec3 positionTree;
  attribute vec3 positionImage;
  attribute vec3 colorTree;
  attribute vec3 colorImage;
  attribute float pSize;
  varying vec3 vColor;

  void main() {
    // 基础形态转换
    vec3 pos = mix(positionTree, positionImage, uMorph);
    vColor = mix(colorTree, colorImage, uMorph);
    
    // 添加一点随机闪烁感 (呼吸效果)
    float blink = sin(uTime * 2.0 + pos.x * 10.0 + pos.y * 5.0) * 0.1 + 0.9;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    // 粒子大小随距离变化，并受闪烁影响
    gl_PointSize = pSize * blink * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  void main() {
    // 圆形粒子抗锯齿处理
    float dist = distance(gl_PointCoord, vec2(0.5));
    if (dist > 0.5) discard;
    
    // 核心亮，边缘柔和
    float alpha = 1.0 - (dist * 2.0);
    gl_FragColor = vec4(vColor, alpha);
  }
`;

const COUNT = 55000; 
const SNOW_COUNT = 2000; 

export const TreeParticles = ({ handState }) => {
  const meshRef = useRef();
  const snowRef = useRef();
  const { camera, size } = useThree(); 
  
  const currentMorph = useRef(0);
  const currentRotation = useRef(0);
  const smoothedX = useRef(0.5);

  const [attributes, setAttributes] = useState(null);
  const [snowAttributes, setSnowAttributes] = useState(null);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uMorph: { value: 0 }
  }), []);

  // 1. 响应式相机位置调整
  useEffect(() => {
    const treeHeight = 22; 
    const padding = 1.4; 
    const fovInRadians = (camera.fov * Math.PI) / 180;
    let distance = (treeHeight * padding) / (2 * Math.tan(fovInRadians / 2));
    const aspect = size.width / size.height;
    if (aspect < 1) distance = distance / aspect; 
    camera.position.set(0, 0, distance);
    camera.lookAt(0, 0, 0);
  }, [size, camera]);

  // 2. 粒子数据生成
  useEffect(() => {
    const generateData = () => {
      const lightColors = [
        { r: 1.0, g: 0.2, b: 0.2 }, // 红
        { r: 1.0, g: 0.9, b: 0.2 }, // 黄
        { r: 0.2, g: 0.6, b: 1.0 }, // 蓝
        { r: 0.9, g: 0.3, b: 1.0 }, // 紫
        { r: 1.0, g: 1.0, b: 1.0 }, // 白
      ];

      const pTree = new Float32Array(COUNT * 3);
      const pImage = new Float32Array(COUNT * 3);
      const cTree = new Float32Array(COUNT * 3);
      const cImage = new Float32Array(COUNT * 3);
      const sizes = new Float32Array(COUNT);

      const STAR_COUNT = 3000; 
      const TRUNK_COUNT = 8000; 
      const SPIRAL_COUNT = 7000; 

      for (let i = 0; i < COUNT; i++) {
        const i3 = i * 3;

        // --- 树的形态逻辑 ---
        if (i < STAR_COUNT) {
          // 顶部五角星
          const t = i / STAR_COUNT;
          const pts = [];
          for (let k = 0; k < 10; k++) {
            const r = k % 2 === 0 ? 1.15 : 0.45;
            const angle = k * (Math.PI / 5) - Math.PI / 2; 
            pts.push({ x: Math.cos(angle) * r, y: -Math.sin(angle) * r }); 
          }
          const segT = (t * 10) % 1;
          const p1 = pts[Math.floor(t * 10) % 10];
          const p2 = pts[(Math.floor(t * 10) + 1) % 10];
          pTree[i3] = p1.x + (p2.x - p1.x) * segT;
          pTree[i3 + 1] = 8.0 + (p1.y + (p2.y - p1.y) * segT);
          pTree[i3 + 2] = (Math.random() - 0.5) * 0.1;
          cTree[i3] = 1.0; cTree[i3 + 1] = 0.95; cTree[i3 + 2] = 0.4;
          sizes[i] = Math.random() * 0.5 + 0.4;

        } else if (i < STAR_COUNT + TRUNK_COUNT) {
          // 树干
          const t = (i - STAR_COUNT) / TRUNK_COUNT;
          pTree[i3] = Math.cos(Math.random() * 6.28) * Math.sqrt(Math.random()) * 0.45;
          pTree[i3 + 1] = t * 20.0 - 13.0;
          pTree[i3 + 2] = Math.sin(Math.random() * 6.28) * Math.sqrt(Math.random()) * 0.45;
          cTree[i3] = 0.25; cTree[i3 + 1] = 0.15; cTree[i3 + 2] = 0.05;
          sizes[i] = Math.random() * 0.3 + 0.1;

        } else if (i < STAR_COUNT + TRUNK_COUNT + SPIRAL_COUNT) {
          // 绕树装饰线
          const t = (i - STAR_COUNT - TRUNK_COUNT) / SPIRAL_COUNT;
          const y = t * 17.5 - 7.5; 
          const angle = t * Math.PI * 2 * 8.0; 
          const progress = (y + 7.5) / 18.0; 
          const r = (1.0 - progress) * 7.2 + 0.15; 
          pTree[i3] = Math.cos(angle) * r;
          pTree[i3 + 1] = y;
          pTree[i3 + 2] = Math.sin(angle) * r;
          const fade = Math.pow(1.0 - progress, 0.4);
          cTree[i3] = 1.0 * fade; cTree[i3 + 1] = 0.95 * fade; cTree[i3 + 2] = 0.6 * fade;
          sizes[i] = (Math.random() * 0.4 + 0.1) * (1.1 - progress);

        } else {
          // 树叶
          const t = Math.random();
          const y = t * 14.5 - 7;
          const layerT = (y + 7) / 14.5;
          const rMax = (1 - layerT) * 7.0 * Math.pow(1 - (layerT * 6 % 1), 0.45);
          const r = Math.sqrt(Math.random()) * rMax;
          const angle = Math.random() * Math.PI * 2;
          pTree[i3] = Math.cos(angle) * r;
          pTree[i3 + 1] = y;
          pTree[i3 + 2] = Math.sin(angle) * r;

          if (Math.random() > 0.992) {
            const rc = lightColors[Math.floor(Math.random() * lightColors.length)];
            cTree[i3] = rc.r; cTree[i3 + 1] = rc.g; cTree[i3 + 2] = rc.b;
            sizes[i] = 0.7;
          } else {
            const color = new THREE.Color();
            color.setHSL(0.32 + Math.random() * 0.08, 0.9, 0.12 + Math.random() * 0.18);
            cTree[i3] = color.r; cTree[i3 + 1] = color.g; cTree[i3 + 2] = color.b;
            sizes[i] = Math.random() * 0.4 + 0.1;
          }
        }

        // --- 心的形态逻辑 ---
        const ra = Math.random() * 6.28;
        // 心形公式调整，使其更饱满
        pImage[i3] = 16 * Math.pow(Math.sin(ra), 3) * 0.45;
        pImage[i3 + 1] = (13 * Math.cos(ra) - 5 * Math.cos(2 * ra) - 2 * Math.cos(3 * ra) - Math.cos(4 * ra)) * 0.45;
        pImage[i3 + 2] = (Math.random() - 0.5) * 0.5;
        cImage[i3] = 1.0; cImage[i3 + 1] = 0.1; cImage[i3 + 2] = 0.3;
      }
      setAttributes({ pTree, pImage, cTree, cImage, sizes });

      // 雪花初始化
      const snowPos = new Float32Array(SNOW_COUNT * 3);
      for (let i = 0; i < SNOW_COUNT; i++) {
        snowPos[i * 3] = (Math.random() - 0.5) * 45;
        snowPos[i * 3 + 1] = (Math.random() - 0.5) * 45;
        snowPos[i * 3 + 2] = (Math.random() - 0.5) * 45;
      }
      setSnowAttributes(snowPos);
    };
    generateData();
  }, []);

  // 3. 每一帧的动态更新
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (meshRef.current && attributes) {
      meshRef.current.material.uniforms.uTime.value = t;
      
      // 鼠标交互平滑处理
      smoothedX.current = THREE.MathUtils.lerp(smoothedX.current, handState.x, 0.08);
      currentMorph.current = THREE.MathUtils.lerp(currentMorph.current, handState.mode, 0.08);
      meshRef.current.material.uniforms.uMorph.value = currentMorph.current;

      // 旋转逻辑：树形态下旋转，心形态下固定
      const targetRot = currentMorph.current < 0.5 ? (smoothedX.current - 0.5) * 10 : 0;
      currentRotation.current = THREE.MathUtils.lerp(currentRotation.current, targetRot, 0.1);
      meshRef.current.rotation.y = currentRotation.current;
    }

    // 雪花飘落逻辑
    if (snowRef.current) {
      const positions = snowRef.current.geometry.attributes.position.array;
      for (let i = 0; i < SNOW_COUNT; i++) {
        positions[i * 3 + 1] -= 0.045;
        if (positions[i * 3 + 1] < -22) positions[i * 3 + 1] = 22;
      }
      snowRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  if (!attributes) return null;

  return (
    <group position={[0, -1.2, 0]}>
      {/* 主粒子系统 */}
      <points ref={meshRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-positionTree" count={COUNT} array={attributes.pTree} itemSize={3} />
          <bufferAttribute attach="attributes-positionImage" count={COUNT} array={attributes.pImage} itemSize={3} />
          <bufferAttribute attach="attributes-colorTree" count={COUNT} array={attributes.cTree} itemSize={3} />
          <bufferAttribute attach="attributes-colorImage" count={COUNT} array={attributes.cImage} itemSize={3} />
          <bufferAttribute attach="attributes-pSize" count={COUNT} array={attributes.sizes} itemSize={1} />
          <bufferAttribute attach="attributes-position" count={COUNT} array={attributes.pTree} itemSize={3} />
        </bufferGeometry>
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent={true} 
          depthWrite={false} 
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* 雪花子系统 */}
      {snowAttributes && (
        <points ref={snowRef}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" count={SNOW_COUNT} array={snowAttributes} itemSize={3} />
          </bufferGeometry>
          <pointsMaterial 
            size={0.15} 
            color="#ffffff" 
            transparent 
            opacity={0.6} 
            sizeAttenuation={true} 
          />
        </points>
      )}
    </group>
  );
};