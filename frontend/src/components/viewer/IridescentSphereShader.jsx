import React, { useRef, useEffect } from 'react';

// Iridescent Sphere Shader - Creates a smooth, glossy sphere with fluid color transitions
const fragmentShader = `
precision mediump float;
uniform vec2 iResolution;
uniform float iTime;
varying vec2 vTextureCoord;

// Iridescent sphere with smooth color transitions
void main() {
    vec2 fragCoord = vTextureCoord * iResolution;
    
    // Center and normalize coordinates
    vec2 uv = (fragCoord - iResolution.xy * 0.5) / min(iResolution.x, iResolution.y);
    float dist = length(uv);
    
    // Circular mask
    if (dist > 0.45) {
        discard;
    }
    
    // Create sphere using distance field
    float sphere = 1.0 - smoothstep(0.0, 0.45, dist);
    
    // 3D sphere coordinates for lighting
    float z = sqrt(1.0 - dist * dist);
    vec3 normal = normalize(vec3(uv, z));
    
    // Rotating light direction for dynamic highlights
    vec3 lightDir = normalize(vec3(
        sin(iTime * 0.5) * 0.7,
        cos(iTime * 0.3) * 0.5 + 0.8,
        -0.3
    ));
    
    // Fresnel effect for edge glow
    float fresnel = pow(1.0 - dot(normal, vec3(0.0, 0.0, 1.0)), 2.0);
    
    // Iridescent color based on viewing angle and time - smooth fluid transitions
    float angle = atan(normal.y, normal.x) + iTime * 0.15;
    float height = normal.z;
    
    // Create flowing color gradients - more vibrant and smooth
    vec3 color1 = vec3(0.2, 0.5, 0.95); // Deep Blue
    vec3 color2 = vec3(0.65, 0.3, 0.9); // Purple
    vec3 color3 = vec3(0.85, 0.4, 0.75); // Pink
    vec3 color4 = vec3(0.35, 0.75, 0.95); // Cyan/Teal
    vec3 color5 = vec3(0.5, 0.6, 0.95); // Light Blue
    
    // Smooth color blending using multiple sine waves for fluid effect
    float t1 = sin(angle * 1.5 + iTime * 0.3) * 0.5 + 0.5;
    float t2 = sin(angle * 2.5 + iTime * 0.5 + height) * 0.5 + 0.5;
    float t3 = sin(height * 3.0 + iTime * 0.4) * 0.5 + 0.5;
    float t4 = sin(angle * 4.0 - iTime * 0.2) * 0.3 + 0.7;
    
    // Multi-layer color mixing for rich iridescent effect
    vec3 baseColor = mix(
        mix(mix(color1, color2, t1), mix(color3, color4, t2), t3),
        color5,
        t4 * 0.3
    );
    
    // Add subtle wave patterns for fluid motion
    float wave = sin(dist * 6.0 - iTime * 1.5) * 0.08 + 1.0;
    float wave2 = cos(dist * 10.0 + iTime * 2.0) * 0.05 + 1.0;
    baseColor *= wave * wave2;
    
    // Enhance color saturation for more vibrant appearance
    baseColor = mix(baseColor, baseColor * 1.2, 0.3);
    
    // Enhanced lighting calculations for glossy appearance
    float NdotL = max(dot(normal, lightDir), 0.0);
    
    // Multiple specular highlights for more realistic glossy surface
    vec3 viewDir = vec3(0.0, 0.0, 1.0);
    vec3 halfDir = normalize(lightDir + viewDir);
    float specular1 = pow(max(dot(normal, halfDir), 0.0), 64.0); // Sharp highlight
    float specular2 = pow(max(dot(normal, halfDir), 0.0), 16.0); // Softer highlight
    
    // Combine lighting with iridescent colors - brighter base for glossy look
    vec3 finalColor = baseColor * (0.4 + NdotL * 0.8);
    
    // Add multiple specular highlights for wet/glossy appearance
    finalColor += vec3(1.0, 1.0, 1.0) * specular1 * 1.2; // Bright sharp highlight
    finalColor += baseColor * specular2 * 0.4; // Colored softer highlight
    
    // Enhanced fresnel for edge glow - more pronounced
    finalColor += baseColor * fresnel * 0.6;
    
    // Apply sphere mask with smooth edges
    finalColor *= sphere;
    
    // Add subtle inner glow for depth
    float innerGlow = smoothstep(0.4, 0.0, dist);
    finalColor += baseColor * innerGlow * 0.15;
    
    // Add rim light for extra polish
    float rimLight = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.0);
    finalColor += baseColor * rimLight * 0.3;
    
    // Smooth alpha for edges
    float alpha = smoothstep(0.45, 0.4, dist);
    
    gl_FragColor = vec4(finalColor, alpha);
}
`;

const vertexShader = `
attribute vec2 a_position;
varying vec2 vTextureCoord;

void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    vTextureCoord = (a_position + 1.0) * 0.5;
}
`;

const IridescentSphereShader = ({ width = 64, height = 64, className = '' }) => {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { 
      alpha: true, 
      premultipliedAlpha: false,
      antialias: true 
    }) || canvas.getContext('experimental-webgl', { 
      alpha: true, 
      premultipliedAlpha: false,
      antialias: true 
    });
    
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    // Enable blending for transparency
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Create shaders
    const vertexShaderObj = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShaderObj, vertexShader);
    gl.compileShader(vertexShaderObj);

    if (!gl.getShaderParameter(vertexShaderObj, gl.COMPILE_STATUS)) {
      console.error('Vertex shader compilation error:', gl.getShaderInfoLog(vertexShaderObj));
      return;
    }

    const fragmentShaderObj = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShaderObj, fragmentShader);
    gl.compileShader(fragmentShaderObj);

    if (!gl.getShaderParameter(fragmentShaderObj, gl.COMPILE_STATUS)) {
      console.error('Fragment shader compilation error:', gl.getShaderInfoLog(fragmentShaderObj));
      return;
    }

    // Create program
    const program = gl.createProgram();
    gl.attachShader(program, vertexShaderObj);
    gl.attachShader(program, fragmentShaderObj);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program linking error:', gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Setup geometry
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Get uniform locations
    const resolutionLocation = gl.getUniformLocation(program, 'iResolution');
    const timeLocation = gl.getUniformLocation(program, 'iTime');

    // Set viewport
    gl.viewport(0, 0, width, height);

    // Render loop
    const render = () => {
      const currentTime = (Date.now() - startTimeRef.current) / 1000;

      // Set uniforms
      gl.uniform2f(resolutionLocation, width, height);
      gl.uniform1f(timeLocation, currentTime);

      // Clear and draw
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
      style={{
        display: 'block',
        borderRadius: '50%',
        overflow: 'hidden',
      }}
    />
  );
};

export default IridescentSphereShader;

