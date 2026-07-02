import React, { useEffect, useRef } from 'react';

const fragmentShaderSource = `#version 300 es
precision highp float;
out vec4 O;
uniform float time;
uniform vec2 resolution;
uniform vec3 u_color;

#define FC gl_FragCoord.xy
#define R resolution
#define T (time+660.)

float rnd(vec2 p){p=fract(p*vec2(12.9898,78.233));p+=dot(p,p+34.56);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);return mix(mix(rnd(i),rnd(i+vec2(1,0)),u.x),mix(rnd(i+vec2(0,1)),rnd(i+1.),u.x),u.y);}
float fbm(vec2 p){float t=.0,a=1.;for(int i=0;i<3;i++){t+=a*noise(p);p*=mat2(1,-1.2,.2,1.2)*2.;a*=.5;}return t;}

void main(){
  vec2 uv=(FC-.5*R)/R.y;
  vec3 col=vec3(1);
  uv.x+=.25;
  uv*=vec2(2,1);

  float n=fbm(uv*.28-vec2(T*.01,0));
  n=noise(uv*3.+n*2.);

  col.r-=fbm(uv+vec2(0,T*.015)+n);
  col.g-=fbm(uv*1.003+vec2(0,T*.015)+n+.003);
  col.b-=fbm(uv*1.006+vec2(0,T*.015)+n+.006);

  col=mix(col, u_color, dot(col,vec3(.21,.71,.07)));

  col=mix(vec3(.08),col,min(time*.1,1.));
  col=clamp(col,.08,1.);
  O=vec4(col,1);
}`;

const vertexSrc = `#version 300 es
precision highp float;
in vec4 position;
void main(){gl_Position=position;}`;

class Renderer {
    private readonly vertices = [-1, 1, -1, -1, 1, 1, 1, -1];

    private gl: WebGL2RenderingContext;
    private canvas: HTMLCanvasElement;
    private program: WebGLProgram | null = null;
    private vs: WebGLShader | null = null;
    private fs: WebGLShader | null = null;
    private buffer: WebGLBuffer | null = null;
    private color: [number, number, number] = [0.5, 0.5, 0.5];

    constructor(canvas: HTMLCanvasElement, fragmentSource: string) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl2') as WebGL2RenderingContext;
        this.setup(fragmentSource);
        this.init();
    }

    updateColor(newColor: [number, number, number]) {
        this.color = newColor;
    }

    updateScale() {
        // Cap the device-pixel-ratio: a full-screen fragment shader at retina
        // 2x renders 4x the pixels for no perceptible gain on a soft smoke
        // background. 1.25 keeps it crisp while slashing GPU cost.
        const dpr = Math.min(1.25, Math.max(1, window.devicePixelRatio));
        const { clientWidth: width, clientHeight: height } = this.canvas.parentElement || this.canvas;
        this.canvas.width = Math.floor(width * dpr);
        this.canvas.height = Math.floor(height * dpr);
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    private compile(shader: WebGLShader, source: string) {
        const gl = this.gl;
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error(`Shader compilation error: ${gl.getShaderInfoLog(shader)}`);
        }
    }

    reset() {
        const { gl, program, vs, fs } = this;
        if (!program) return;
        if (vs) { gl.detachShader(program, vs); gl.deleteShader(vs); }
        if (fs) { gl.detachShader(program, fs); gl.deleteShader(fs); }
        gl.deleteProgram(program);
        this.program = null;
    }

    private setup(fragmentSource: string) {
        const gl = this.gl;
        this.vs = gl.createShader(gl.VERTEX_SHADER);
        this.fs = gl.createShader(gl.FRAGMENT_SHADER);
        const program = gl.createProgram();
        if (!this.vs || !this.fs || !program) return;
        this.compile(this.vs, vertexSrc);
        this.compile(this.fs, fragmentSource);
        this.program = program;
        gl.attachShader(this.program, this.vs);
        gl.attachShader(this.program, this.fs);
        gl.linkProgram(this.program);
        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            console.error(`Program linking error: ${gl.getProgramInfoLog(this.program)}`);
        }
    }

    private init() {
        const { gl, program } = this;
        if (!program) return;
        this.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);
        const position = gl.getAttribLocation(program, 'position');
        gl.enableVertexAttribArray(position);
        gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
        Object.assign(program, {
            resolution: gl.getUniformLocation(program, 'resolution'),
            time: gl.getUniformLocation(program, 'time'),
            u_color: gl.getUniformLocation(program, 'u_color'),
        });
    }

    render(now = 0) {
        const { gl, program, buffer, canvas } = this;
        if (!program || !gl.isProgram(program)) return;
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(program);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.uniform2f((program as any).resolution, canvas.width, canvas.height);
        gl.uniform1f((program as any).time, now * 1e-3);
        gl.uniform3fv((program as any).u_color, this.color);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
}

const hexToRgb = (hex: string): [number, number, number] | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? [
            parseInt(result[1], 16) / 255,
            parseInt(result[2], 16) / 255,
            parseInt(result[3], 16) / 255,
        ]
        : null;
};

interface SmokeBackgroundProps {
    smokeColor?: string;
}

export const SmokeBackground: React.FC<SmokeBackgroundProps> = ({
    smokeColor = '#808080',
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rendererRef = useRef<Renderer | null>(null);

    useEffect(() => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;

        // Respect reduced-motion: render a single static frame, no loop.
        const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

        const renderer = new Renderer(canvas, fragmentShaderSource);
        rendererRef.current = renderer;

        const handleResize = () => renderer.updateScale();
        handleResize();
        window.addEventListener('resize', handleResize);

        // Pause when the canvas is scrolled off-screen (IntersectionObserver)
        // or the tab is hidden (visibilitychange). A drifting smoke background
        // has no reason to burn GPU cycles the user can't see.
        let onScreen = true;
        const io = new IntersectionObserver(
            ([entry]) => { onScreen = entry.isIntersecting; },
            { threshold: 0 }
        );
        io.observe(canvas);

        if (reducedMotion) {
            renderer.render(1000);
            return () => {
                window.removeEventListener('resize', handleResize);
                io.disconnect();
                renderer.reset();
            };
        }

        // Throttle to ~30fps — smoke is slow-moving, 60fps is wasted work.
        const frameInterval = 1000 / 30;
        let animationFrameId: number;
        let last = 0;
        const loop = (now: number) => {
            animationFrameId = requestAnimationFrame(loop);
            if (!onScreen || document.hidden) return;
            if (now - last < frameInterval) return;
            last = now;
            renderer.render(now);
        };
        animationFrameId = requestAnimationFrame(loop);

        return () => {
            window.removeEventListener('resize', handleResize);
            io.disconnect();
            cancelAnimationFrame(animationFrameId);
            renderer.reset();
        };
    }, []);

    useEffect(() => {
        const renderer = rendererRef.current;
        if (renderer) {
            const rgbColor = hexToRgb(smokeColor);
            if (rgbColor) {
                renderer.updateColor(rgbColor);
            }
        }
    }, [smokeColor]);

    return <canvas ref={canvasRef} className="w-full h-full block" />;
};
