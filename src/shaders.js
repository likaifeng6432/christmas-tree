// src/shaders.js

export const vertexShader = `
  uniform float uTime;
  uniform float uMorph; 
  
  attribute vec3 positionTree;
  attribute vec3 positionImage;
  attribute vec3 colorTree;
  attribute vec3 colorImage;
  attribute float pSize;

  varying vec3 vColor;

  void main() {
    // 1. 位置混合：星星粒子现在会平滑移动到心形位置，而不是消失
    vec3 finalPos = mix(positionTree, positionImage, uMorph);

    // 2. 呼吸动效
    float breath = sin(uTime * 1.5 + finalPos.y * 0.5) * 0.05 * (1.0 - uMorph);
    finalPos.x += breath;
    finalPos.z += breath;

    // 3. 颜色混合
    vColor = mix(colorTree, colorImage, uMorph);
    
    vec4 viewPosition = modelViewMatrix * vec4(finalPos, 1.0);
    gl_Position = projectionMatrix * viewPosition;

    // 4. 大小计算
    gl_PointSize = pSize * (300.0 / -viewPosition.z);
  }
`;

export const fragmentShader = `
  varying vec3 vColor;

  void main() {
    float d = distance(gl_PointCoord, vec2(0.5));
    if(d > 0.5) discard;

    float strength = 1.0 - (d * 2.0);
    strength = pow(strength, 1.5);

    gl_FragColor = vec4(vColor, strength); 
  }
`;