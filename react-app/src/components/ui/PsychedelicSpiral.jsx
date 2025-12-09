import React, { useEffect, useRef } from 'react'

const PsychedelicSpiral = ({
  className = '',
  spinRotation = -2.0,
  spinSpeed = 7.0,
  offset = [0.0, 0.0],
  // these colors are overriden 
  color1 = '#DE443B',
  color2 = '#006BB4',
  color3 = '#162325',
  contrast = 3.5,
  lighting = 0.4,
  spinAmount = 0.25,
  pixelFilter = 745.0,
  spinEase = 1.0,
  isRotate = true,
  ...props
}) => {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    if (!gl) {
      console.warn('WebGL not supported')
      return
    }

    // Vertex shader
    const vertexShaderSource = `
      attribute vec2 a_position;
      varying vec2 v_uv;
      void main() {
        v_uv = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `

    // Fragment shader with the psychedelic spiral effect
    const fragmentShaderSource = `
      precision mediump float;
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform float u_spinRotation;
      uniform float u_spinSpeed;
      uniform vec2 u_offset;
      uniform vec4 u_color1;
      uniform vec4 u_color2;
      uniform vec4 u_color3;
      uniform float u_contrast;
      uniform float u_lighting;
      uniform float u_spinAmount;
      uniform float u_pixelFilter;
      uniform float u_spinEase;
      uniform float u_isRotate;
      varying vec2 v_uv;

      vec4 effect(vec2 screenSize, vec2 screen_coords) {
        float pixel_size = length(screenSize) / u_pixelFilter;
        vec2 uv = (floor(screen_coords * (1.0 / pixel_size)) * pixel_size - 0.5 * screenSize) / length(screenSize) - u_offset;
        float uv_len = length(uv);

        float speed = u_spinRotation * u_spinEase * 0.2;
        if (u_isRotate > 0.5) {
          speed = u_time * speed;
        }
        speed += 302.2;

        float new_pixel_angle = atan(uv.y, uv.x) + speed - u_spinEase * 20.0 * (u_spinAmount * uv_len + (1.0 - u_spinAmount));
        vec2 mid = (screenSize / length(screenSize)) / 2.0;
        uv = vec2((uv_len * cos(new_pixel_angle) + mid.x), (uv_len * sin(new_pixel_angle) + mid.y)) - mid;

        uv *= 30.0;
        speed = u_time * u_spinSpeed;
        vec2 uv2 = vec2(uv.x + uv.y);

        for (int i = 0; i < 5; i++) {
          uv2 += sin(max(uv.x, uv.y)) + uv;
          uv += 0.5 * vec2(cos(5.1123314 + 0.353 * uv2.y + speed * 0.131121), sin(uv2.x - 0.113 * speed));
          uv -= 1.0 * cos(uv.x + uv.y) - 1.0 * sin(uv.x * 0.711 - uv.y);
        }

        float contrast_mod = 0.25 * u_contrast + 0.5 * u_spinAmount + 1.2;
        float paint_res = min(2.0, max(0.0, length(uv) * 0.035 * contrast_mod));
        float c1p = max(0.0, 1.0 - contrast_mod * abs(1.0 - paint_res));
        float c2p = max(0.0, 1.0 - contrast_mod * abs(paint_res));
        float c3p = 1.0 - min(1.0, c1p + c2p);
        float light = (u_lighting - 0.2) * max(c1p * 5.0 - 4.0, 0.0) + u_lighting * max(c2p * 5.0 - 4.0, 0.0);

        return (0.3 / u_contrast) * u_color1 + (1.0 - 0.3 / u_contrast) * (u_color1 * c1p + u_color2 * c2p + vec4(c3p * u_color3.rgb, c3p * u_color1.a)) + vec4(light, light, light, 0.0);
      }

      void main() {
        vec2 uv = v_uv * u_resolution;
        gl_FragColor = effect(u_resolution, uv);
      }
    `

    const createShader = (type, source) => {
      const shader = gl.createShader(type)
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader))
        gl.deleteShader(shader)
        return null
      }
      return shader
    }

    const vertexShader = createShader(gl.VERTEX_SHADER, vertexShaderSource)
    const fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentShaderSource)
    if (!vertexShader || !fragmentShader) return

    const program = gl.createProgram()
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program))
      return
    }

    const positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)

    const positionLocation = gl.getAttribLocation(program, 'a_position')
    const timeLocation = gl.getUniformLocation(program, 'u_time')
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution')
    const spinRotationLocation = gl.getUniformLocation(program, 'u_spinRotation')
    const spinSpeedLocation = gl.getUniformLocation(program, 'u_spinSpeed')
    const offsetLocation = gl.getUniformLocation(program, 'u_offset')
    const color1Location = gl.getUniformLocation(program, 'u_color1')
    const color2Location = gl.getUniformLocation(program, 'u_color2')
    const color3Location = gl.getUniformLocation(program, 'u_color3')
    const contrastLocation = gl.getUniformLocation(program, 'u_contrast')
    const lightingLocation = gl.getUniformLocation(program, 'u_lighting')
    const spinAmountLocation = gl.getUniformLocation(program, 'u_spinAmount')
    const pixelFilterLocation = gl.getUniformLocation(program, 'u_pixelFilter')
    const spinEaseLocation = gl.getUniformLocation(program, 'u_spinEase')
    const isRotateLocation = gl.getUniformLocation(program, 'u_isRotate')

    const hexToVec4 = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result
        ? [
            parseInt(result[1], 16) / 255,
            parseInt(result[2], 16) / 255,
            parseInt(result[3], 16) / 255,
            1.0
          ]
        : [0, 0, 0, 1]
    }

    const resize = () => {
      canvas.width = canvas.clientWidth
      canvas.height = canvas.clientHeight
      gl.viewport(0, 0, canvas.width, canvas.height)
    }

    resize()
    window.addEventListener('resize', resize)

    const startTime = Date.now()

    const render = () => {
      const currentTime = (Date.now() - startTime) / 1000

      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.useProgram(program)

      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
      gl.enableVertexAttribArray(positionLocation)
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

      gl.uniform1f(timeLocation, currentTime)
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height)
      gl.uniform1f(spinRotationLocation, spinRotation)
      gl.uniform1f(spinSpeedLocation, spinSpeed)
      gl.uniform2f(offsetLocation, offset[0], offset[1])
      gl.uniform4fv(color1Location, hexToVec4(color1))
      gl.uniform4fv(color2Location, hexToVec4(color2))
      gl.uniform4fv(color3Location, hexToVec4(color3))
      gl.uniform1f(contrastLocation, contrast)
      gl.uniform1f(lightingLocation, lighting)
      gl.uniform1f(spinAmountLocation, spinAmount)
      gl.uniform1f(pixelFilterLocation, pixelFilter)
      gl.uniform1f(spinEaseLocation, spinEase)
      gl.uniform1f(isRotateLocation, isRotate ? 1.0 : 0.0)

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

      animationRef.current = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', resize)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [spinRotation, spinSpeed, offset, color1, color2, color3, contrast, lighting, spinAmount, pixelFilter, spinEase, isRotate])

  return (
    <div className={className} {...props}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  )
}

export default PsychedelicSpiral
