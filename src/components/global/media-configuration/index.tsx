import { SourceDeviceStateProps } from "@/hooks/useMediaResources";
import useStudioSettings from "@/hooks/useStudioSettings";
import { Headphones, Loader, Monitor, Settings2 } from "lucide-react";

type Props = {
  state: SourceDeviceStateProps;
  user:
    | ({
        subscription: {
          plan: "PRO" | "FREE";
        } | null;
        studio: {
          id: string;
          screen: string | null;
          mic: string | null;
          preset: "HD" | "SD";
          camera: string | null;
          userId: string | null;
        } | null;
      } & {
        id: string;
        email: string;
        firstname: string | null;
        lastname: string | null;
        createdAt: Date;
        clerkId: string;
      })
    | null;
};

const MediaConfiguration = ({ state, user }: Props) => {
  const activeScreen = state.displays?.find(
    (screen) => screen.id === user?.studio?.screen
  );

  const activeAudio = state.audioInputs?.find(
    (device) => device.deviceId === user?.studio?.mic
  );

  const { isPending, onPreset, register, onScreen, onAudio } =
    useStudioSettings(
      user!.id,
      user?.studio?.screen || state.displays?.[0]?.id,
      user?.studio?.mic || state.audioInputs?.[0]?.deviceId,
      user?.studio?.preset || "SD",
      user?.subscription?.plan
    );

  console.log("✅CLient side Studio Settings: ", {
    onScreen,
    onAudio,
    onPreset,
  });

  return (
    <>
      <form className="flex h-full relative w-full flex-col gap-y-5 text-white ">
        {isPending && (
          <div className="fixed z-50 w-full top-0 left-0 right-0 bottom-0 rounded-2xl h-full bg-black/80 flex justify-center items-center">
            <Loader />
          </div>
        )}
        <div className="flex gap-x-5 justify-center items-center">
          <Monitor fill="#575655" color="#575655" size={36} />
          <select
            {...register("screen")}
            value={
              onScreen ||
              (activeScreen ? activeScreen.id : state.displays?.[0]?.id)
            }
            className="outline-none cursor-pointer px-5 py-2 rounded-xl border-2 text-white border-[#575655] bg-transparent w-full"
          >
            {state.displays?.map((display, key) => (
              <option
                value={display.id}
                className="bg-[#171717] cursor-pointer"
                key={key}
              >
                {display.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-x-5 justify-center items-center">
          <Headphones color="#575655" size={36} />
          <select
            {...register("audio")}
            value={
              onAudio ||
              (activeAudio
                ? activeAudio.deviceId
                : state.audioInputs?.[0]?.deviceId)
            }
            className="outline-none cursor-pointer px-5 py-2 rounded-xl border-2 text-white border-[#575655] bg-transparent w-full"
          >
            {state.audioInputs?.map((device, key) => (
              <option
                value={device.deviceId}
                className="bg-[#171717] cursor-pointer"
                key={key}
              >
                {device.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-x-5 justify-center items-center">
          <Settings2 color="#575655" size={36} />
          <select
            {...register("preset")}
            value={onPreset || user?.studio?.preset || "SD"}
            className="outline-none cursor-pointer px-5 py-2 rounded-xl border-2 text-white border-[#575655] bg-transparent w-full"
          >
            <option
              disabled={user?.subscription?.plan === "FREE"}
              value={"HD"}
              className="bg-[#171717] cursor-pointer"
            >
              1080p{" "}
              {user?.subscription?.plan === "FREE" && "(Upgrade to PRO Plan)"}
            </option>
            <option value={"SD"} className="bg-[#171717] cursor-pointer">
              720p
            </option>
          </select>
        </div>
      </form>
    </>
  );
};

export default MediaConfiguration;
