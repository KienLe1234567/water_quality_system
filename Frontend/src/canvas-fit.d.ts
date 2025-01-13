declare module 'canvas-fit' {
    export default function canvasFit(
      canvas: HTMLCanvasElement,
      parent: HTMLElement | Window,
      scaleFactor?: number
    ): () => void;
  }