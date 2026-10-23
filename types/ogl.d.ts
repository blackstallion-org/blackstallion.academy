declare module "ogl" {
  export class Renderer {
    constructor(options?: { canvas?: HTMLCanvasElement; dpr?: number; alpha?: boolean; premultipliedAlpha?: boolean; antialias?: boolean; powerPreference?: string });
    dpr: number;
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
    remove(): void;
  }

  export class Texture {
    constructor(gl: WebGLRenderingContext, options?: { minFilter?: number; magFilter?: number; premultiplyAlpha?: boolean; generateMipmaps?: boolean });
    image: HTMLImageElement | HTMLCanvasElement;
    texture: WebGLTexture;
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
        depthTest?: boolean;
        depthWrite?: boolean;
      }
    );
    uniforms: Record<string, { value: unknown }>;
    remove(): void;
  }

  export class Mesh {
    constructor(gl: WebGLRenderingContext, options: { geometry: Geometry; program: Program; mode?: number; frustumCulled?: boolean });
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
