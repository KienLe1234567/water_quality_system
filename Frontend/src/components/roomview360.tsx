import { useEffect, useRef } from 'react';
import create360Viewer from '360-image-viewer';

interface Room360ViewerProps {
  imageSrc: string;
}

const Room360Viewer: React.FC<Room360ViewerProps> = ({ imageSrc }) => {
  const viewerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const image = new Image();
    image.crossOrigin = "anonymous";  // Set cross-origin attribute
    image.src = imageSrc;

    image.onload = () => {
      const viewer = create360Viewer({ image });
      if (viewerRef.current) {
        viewerRef.current.appendChild(viewer.canvas);
        canvasRef.current = viewer.canvas;
      }

      const resizeCanvas = () => {
        if (canvasRef.current) {
          canvasRef.current.width = window.innerWidth * window.devicePixelRatio;
          canvasRef.current.height = window.innerHeight * window.devicePixelRatio;
        }
      };

      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);

      viewer.start();

      return () => {
        viewer.stop();
        window.removeEventListener('resize', resizeCanvas);
      };
    };

    image.onerror = () => {
      console.error("Failed to load image. Please check CORS settings on the image server.");
    };
  }, [imageSrc]);

  return <div ref={viewerRef} className="aspect-video w-full rounded-lg overflow-hidden"></div>;
};

export default Room360Viewer;
