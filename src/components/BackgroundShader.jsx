import React, { useRef, useEffect } from 'react';

const vertexShaderSource = `
    attribute vec4 position;
    void main() {
        gl_Position = position;
    }
`;

const fragmentShaderSource = `
    precision mediump float;
    uniform vec2 resolution;
    uniform float time;
    
    #define SPIN_ROTATION -2.0
    #define SPIN_SPEED 2.0
    #define OFFSET vec2(0.0)
    uniform vec4 COLOUR_1;
    uniform vec4 COLOUR_2;
    uniform vec4 COLOUR_3; 
    #define CONTRAST 1.5
    #define LIGTHING 0.1
    #define SPIN_AMOUNT 0.05
    uniform float PIXEL_FILTER; // default 920.0
    #define SPIN_EASE 1.0
    #define PI 3.14159265359
    #define IS_ROTATE false

    vec4 effect(vec2 screenSize, vec2 screen_coords) {
        float pixel_size = length(screenSize.xy) / PIXEL_FILTER;
        vec2 uv = (floor(screen_coords.xy*(1./pixel_size))*pixel_size - 0.5*screenSize.xy)/length(screenSize.xy) - OFFSET;
        float uv_len = length(uv);

        float speed = (SPIN_ROTATION*SPIN_EASE*0.2);
        if(IS_ROTATE){
            speed = time * speed;
        }
        speed += 302.2;
        float new_pixel_angle = atan(uv.y, uv.x) + speed - SPIN_EASE*20.*(1.*SPIN_AMOUNT*uv_len + (1. - 1.*SPIN_AMOUNT));
        vec2 mid = (screenSize.xy/length(screenSize.xy))/2.;
        uv = (vec2((uv_len * cos(new_pixel_angle) + mid.x), (uv_len * sin(new_pixel_angle) + mid.y)) - mid);

        uv *= 30.;
        speed = time*(SPIN_SPEED);
        vec2 uv2 = vec2(uv.x+uv.y);

        for(int i=0; i < 5; i++) {
            uv2 += sin(max(uv.x, uv.y)) + uv;
            uv  += 0.5*vec2(cos(5.1123314 + 0.353*uv2.y + speed*0.131121),sin(uv2.x - 0.113*speed));
            uv  -= 1.0*cos(uv.x + uv.y) - 1.0*sin(uv.x*0.711 - uv.y);
        }

        float contrast_mod = (0.25*CONTRAST + 0.5*SPIN_AMOUNT + 1.2);
        float paint_res = min(2., max(0.,length(uv)*(0.035)*contrast_mod));
        float c1p = max(0.,1. - contrast_mod*abs(1.-paint_res));
        float c2p = max(0.,1. - contrast_mod*abs(paint_res));
        float c3p = 1. - min(1., c1p + c2p);
        float light = (LIGTHING - 0.2)*max(c1p*5. - 4., 0.) + LIGTHING*max(c2p*5. - 4., 0.);
        return (0.3/CONTRAST)*COLOUR_1 + (1. - 0.3/CONTRAST)*(COLOUR_1*c1p + COLOUR_2*c2p + vec4(c3p*COLOUR_3.rgb, c3p*COLOUR_1.a)) + light;
    }

    void mainImage(out vec4 fragColor, in vec2 fragCoord) {
        vec2 uv = fragCoord / resolution.xy;
        fragColor = effect(resolution.xy, uv * resolution.xy);
    }

    void main() {
        vec4 fragment_color;
        mainImage(fragment_color, gl_FragCoord.xy);
        gl_FragColor = fragment_color;
    }
`;

const BackgroundShader = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const gl = canvas.getContext('webgl');

        if (!gl) {
            console.error('WebGL not supported');
            return;
        }

        const createShader = (gl, type, source) => {
            const shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.error('Shader compile error:', gl.getShaderInfoLog(shader));
                gl.deleteShader(shader);
                return null;
            }
            return shader;
        };

        const createProgram = (gl, vertexShader, fragmentShader) => {
            const program = gl.createProgram();
            gl.attachShader(program, vertexShader);
            gl.attachShader(program, fragmentShader);
            gl.linkProgram(program);
            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                console.error('Program link error:', gl.getProgramInfoLog(program));
                gl.deleteProgram(program);
                return null;
            }
            return program;
        };

        const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
        const program = createProgram(gl, vertexShader, fragmentShader);

        if (!program) return;

        // Position Buffer
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1, -1,
            1, -1,
            -1, 1,
            -1, 1,
            1, -1,
            1, 1,
        ]), gl.STATIC_DRAW);

        const positionLocation = gl.getAttribLocation(program, "position");
        const timeLocation = gl.getUniformLocation(program, "time");
        const resolutionLocation = gl.getUniformLocation(program, "resolution");
        const colour1Location = gl.getUniformLocation(program, 'COLOUR_1');
        const colour2Location = gl.getUniformLocation(program, 'COLOUR_2');
        const colour3Location = gl.getUniformLocation(program, 'COLOUR_3');
        const pixelFilterLocation = gl.getUniformLocation(program, 'PIXEL_FILTER');

        const startTime = Date.now();
        let animationFrameId;

        const resize = () => {
             // Make sure canvas size matches window size
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            gl.viewport(0, 0, canvas.width, canvas.height);
        };
        window.addEventListener('resize', resize);
        resize();

        const render = () => {
            gl.useProgram(program);
            
            gl.enableVertexAttribArray(positionLocation);
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

            gl.uniform1f(timeLocation, (Date.now() - startTime) / 1000);
            gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
            gl.uniform1f(pixelFilterLocation, 700.0);

            // Set colors (Weblatro style)
            gl.uniform4f(colour1Location, 0.2, 0.2, 0.2, 1.0); // Darker base
            gl.uniform4f(colour2Location, 0.3, 0.3, 0.35, 1.0); 
            gl.uniform4f(colour3Location, 0.1, 0.1, 0.15, 1.0); 

            gl.drawArrays(gl.TRIANGLES, 0, 6);

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
            if (gl) {
                gl.deleteProgram(program);
                gl.deleteShader(vertexShader);
                gl.deleteShader(fragmentShader);
            }
        };
    }, []);

    return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full -z-50 pointer-events-none" />;
};

export default BackgroundShader;
