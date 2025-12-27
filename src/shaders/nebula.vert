// Advanced Nebula Vertex Shader
uniform float uTime;
uniform float uIntensity;

attribute float size;
attribute vec3 customColor;

varying vec3 vColor;
varying float vDistance;
varying float vSize;
varying float vIntensity;

void main() {
    vColor = customColor;
    vIntensity = uIntensity;
    
    // Add subtle vertex animation based on time
    vec3 pos = position;
    float wave = sin(pos.x * 0.05 + uTime) * cos(pos.z * 0.05 + uTime * 0.7);
    pos.y += wave * uIntensity * 2.0;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    vDistance = -mvPosition.z;
    
    // Dynamic size based on intensity and distance
    float dynamicSize = size * (1.0 + uIntensity * 0.5);
    vSize = dynamicSize;
    gl_PointSize = dynamicSize * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
}
