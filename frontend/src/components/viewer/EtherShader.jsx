import React, { useRef, useEffect } from 'react';

const etherShader = `
precision mediump float;
uniform vec2 iResolution;
uniform float iTime;
uniform vec2 iMouse;
uniform bool hasActiveReminders;
uniform bool hasUpcomingReminders;
uniform bool disableCenterDimming;
varying vec2 vTextureCoord;

// Ether by nimitz 2014 (twitter: @stormoid)
// https://www.shadertoy.com/view/MsjSW3
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License

#define t iTime
mat2 m(float a){float c=cos(a), s=sin(a);return mat2(c,-s,s,c);}
float map(vec3 p){
    p.xz*= m(t*0.4);p.xy*= m(t*0.3);
    vec3 q = p*2.+t;
    return length(p+vec3(sin(t*0.7)))*log(length(p)+1.) + sin(q.x+sin(q.z+sin(q.y)))*0.5 - 1.;
}

void main() {
    vec2 fragCoord = vTextureCoord * iResolution;
    
    // Calculate distance from center for circular mask
    vec2 center = iResolution * 0.5;
    float dist = distance(fragCoord, center);
    float radius = min(iResolution.x, iResolution.y) * 0.5;
    
    // Only render inside circle
    if (dist >= radius) {
        discard;
    }
    
    // Calculate aspect-corrected UV coordinates
    vec2 p = fragCoord.xy/min(iResolution.x, iResolution.y) - vec2(0.9, 0.5);
    // Shift center for our circular viewport
    p.x += 0.4;
    
    vec3 cl = vec3(0.0);
    float d = 2.5;
    
    // Ray marching loop
    for(int i=0; i<=5; i++) {
        vec3 p3d = vec3(0.0, 0.0, 5.0) + normalize(vec3(p, -1.0))*d;
        float rz = map(p3d);
        float f = clamp((rz - map(p3d+0.1))*0.5, -0.1, 1.0);
        
        // Adjust colors based on reminder states
        vec3 baseColor;
        if(hasActiveReminders) {
            // Blue palette for active reminders
            baseColor = vec3(0.05, 0.2, 0.5) + vec3(4.0, 2.0, 5.0)*f;
        } else if(hasUpcomingReminders) {
            // Green palette for upcoming reminders
            baseColor = vec3(0.05, 0.3, 0.1) + vec3(2.0, 5.0, 1.0)*f;
        } else {
            // Original purple-blue palette
            baseColor = vec3(0.1, 0.3, 0.4) + vec3(5.0, 2.5, 3.0)*f;
        }
        
        cl = cl*baseColor + smoothstep(2.5, 0.0, rz)*0.7*baseColor;
        d += min(rz, 1.0);
    }
    
    // Add subtle mouse interaction
    float mouseInfluence = 0.0;
    if(iMouse.x > 0.0 || iMouse.y > 0.0) {
        vec2 mousePos = iMouse.xy;
        float mouseDist = length(p - (mousePos*2.0-vec2(1.0))*0.5);
        mouseInfluence = smoothstep(0.6, 0.0, mouseDist);
        
        // Add subtle glow around mouse
        if(hasActiveReminders) {
            cl += vec3(0.2, 0.4, 1.0) * mouseInfluence * 0.3;
        } else if(hasUpcomingReminders) {
            cl += vec3(0.2, 1.0, 0.4) * mouseInfluence * 0.3;
        } else {
            cl += vec3(0.5, 0.3, 0.7) * mouseInfluence * 0.3;
        }
    }
    
    // Calculate distance from center for dimming the center
    float centerDist = distance(fragCoord, center);
    float centerRadius = min(iResolution.x, iResolution.y) * 0.5;
    
    // Create a dimming factor for the center area (30% of the radius)
    float centerDim = disableCenterDimming ? 1.0 : smoothstep(centerRadius * 0.3, centerRadius * 0.5, centerDist);
    
    vec4 fragColor = vec4(cl, 1.0);
    
    // Apply center dimming only if not disabled
    if (!disableCenterDimming) {
        fragColor.rgb = mix(fragColor.rgb * 0.3, fragColor.rgb, centerDim);
    }
    
    gl_FragColor = fragColor;
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

const EtherShader = ({ width = 64, height = 64, className = '' }) => {
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
    const vertexShaderSource = vertexShader;
    const fragmentShaderSource = etherShader;

    const vertexShaderObj = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShaderObj, vertexShaderSource);
    gl.compileShader(vertexShaderObj);

    if (!gl.getShaderParameter(vertexShaderObj, gl.COMPILE_STATUS)) {
      console.error('Vertex shader compilation error:', gl.getShaderInfoLog(vertexShaderObj));
      return;
    }

    const fragmentShaderObj = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShaderObj, fragmentShaderSource);
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
    const mouseLocation = gl.getUniformLocation(program, 'iMouse');
    const hasActiveRemindersLocation = gl.getUniformLocation(program, 'hasActiveReminders');
    const hasUpcomingRemindersLocation = gl.getUniformLocation(program, 'hasUpcomingReminders');
    const disableCenterDimmingLocation = gl.getUniformLocation(program, 'disableCenterDimming');

    // Set viewport
    gl.viewport(0, 0, width, height);

    // Render loop
    const render = () => {
      const currentTime = (Date.now() - startTimeRef.current) / 1000;

      // Set uniforms
      gl.uniform2f(resolutionLocation, width, height);
      gl.uniform1f(timeLocation, currentTime);
      gl.uniform2f(mouseLocation, 0.5, 0.5); // Center mouse position
      gl.uniform1i(hasActiveRemindersLocation, false);
      gl.uniform1i(hasUpcomingRemindersLocation, false);
      gl.uniform1i(disableCenterDimmingLocation, true); // Disable center dimming for small icon

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

export default EtherShader;

