declare module '360-image-viewer' {
    export default function create360Viewer(options: { image: HTMLImageElement }): {
      canvas: HTMLCanvasElement;
      start: () => void;
      stop: () => void;
    };
  }