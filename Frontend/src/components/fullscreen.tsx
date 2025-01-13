import Image from "next/image";
import React from "react";

import Room360Viewer from "./roomview360";

interface FullscreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  imgSrc: string;
  imgSrcBackup: string;
}

const FullscreenModal: React.FC<FullscreenModalProps> = ({
  isOpen,
  onClose,
  imgSrc,
  imgSrcBackup,
}) => {
  if (!isOpen) return null;

  const handleDoubleClick = () => {
    //onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80"
      onDoubleClick={handleDoubleClick}
    >
      <div className="relative h-full w-full">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-50 rounded-full bg-white p-2 hover:bg-gray-200"
        >
          ✖️
        </button>
        {imgSrc.length > 0 ? (
          <Room360Viewer imageSrc={imgSrc} />
        ) : (
          <Image
            src={imgSrcBackup}
            alt="room"
            layout="fill"
            objectFit="contain"
          />
        )}
        <Room360Viewer imageSrc={imgSrc} />
      </div>
    </div>
  );
};

export default FullscreenModal;
