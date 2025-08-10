import { useEffect, useRef } from "react";

const WebCam = () => {
  const camElement = useRef<HTMLVideoElement | null>(null);
  const streamWebCam = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    if (camElement.current) {
      camElement.current.srcObject = stream;
      await camElement.current?.play();
    }
  };

  useEffect(() => {
    streamWebCam();
  }, []);

  return (
    <video
      ref={camElement}
      className="w-32 h-32 draggable object-cover rounded-full aspect-video border-2 relative border-white"
    >
      WebCam
    </video>
  );
};

export default WebCam;
