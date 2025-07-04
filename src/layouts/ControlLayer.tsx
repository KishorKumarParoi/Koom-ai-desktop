import { cn, onCloseApp } from "@/lib/utils";
import { UserButton } from "@clerk/clerk-react";
import { X } from "lucide-react";
import { useState } from "react";

type Props = {
  children: React.ReactNode;
  className?: string;
};

const ControlLayer = ({ children, className }: Props) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);

  window.ipcRenderer.on("hide-plugin", (event, payload) => {
    console.log(event);
    setIsVisible(payload.state);
  });
  
  return (
    <div
      className={cn(
        className,
        isVisible && "invisible",
        "bg-[#171717] flex px-1 flex-col rounded-3xl overflow-hidden"
      )}
    >
      <div className="flex justify-between items-center p-5 draggable">
        <UserButton />
        <span className="non-draggable"></span>
        <X
          size={20}
          className="text-gray-500 non-draggable hover:text-white cursor-pointer"
          onClick={onCloseApp}
        />
      </div>

      <div className="flex-1 h-0 overflow-auto">{children}</div>
      <div className="p-5 flex w-full">
        <div className="flex items-center gap-x-2">
          <img src="/logo.png" alt="app logo" width={100} height={100} />
        </div>
      </div>
    </div>
  );
};

export default ControlLayer;
