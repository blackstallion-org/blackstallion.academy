declare module "ogl" {
  export class Renderer {
    constructor(options?: { dpr?: number; alpha?: boolean; premultipliedAlpha?: boolean; antialias?: boolean });
    gl: WebGLRenderingContext & { renderer: { width: number; height: number } };
    setSize(width: number, height: number): void;
    render(options: { scene: Mesh | Mesh[]; camera?: unknown }): void;
  }

  export class Flowmap {
    constructor(gl: WebGLRenderingContext, options?: { falloff?: number; alpha?: number; dissipation?: number });
    aspect: number;
    mouse: Vec2;
    velocity: Vec2;
    uniform: { value: unknown };
    update(): void;
  }

  export class Geometry {
    constructor(gl: WebGLRenderingContext, attributes: Record<string, { size: number; data: Float32Array }>);
  }

  export class Texture {
    constructor(gl: WebGLRenderingContext, options?: { minFilter?: number; magFilter?: number; premultiplyAlpha?: boolean });
    image: HTMLImageElement | HTMLCanvasElement;
  }

  export class Program {
    constructor(
      gl: WebGLRenderingContext,
      options: {
        vertex: string;
        fragment: string;
        uniforms?: Record<string, { value: unknown }>;
        transparent?: boolean;
        cullFace?: unknown;
      }
    );
    uniforms: Record<string, { value: unknown }>;
  }

  export class Mesh {
    constructor(gl: WebGLRenderingContext, options: { geometry: Geometry; program: Program });
    program: Program;
  }

  export class Vec2 {
    constructor(x?: number, y?: number);
    x: number;
    y: number;
    len(): number;
    needsUpdate?: boolean;
    set(x: number, y?: number): this;
    copy(v: Vec2): this;
    lerp(v: Vec2, alpha: number): this;
  }

  export class Vec4 {
    constructor(x?: number, y?: number, z?: number, w?: number);
    x: number;
    y: number;
    z: number;
    w: number;
    set(x: number, y: number, z: number, w: number): this;
  }
}
