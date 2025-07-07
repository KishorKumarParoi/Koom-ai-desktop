import { SourceDeviceStateProps } from "@/hooks/useMediaResources";
import useStudioSettings from "@/hooks/useStudioSettings";

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
  if (!user) return null;

  const studio = user?.studio;
  const subscription = user?.subscription;
  const id = user!.id;
  const screen = studio?.screen || state.displays?.[0]?.id;
  const audio = studio?.mic || state.audioInputs?.[0]?.deviceId;
  const preset = studio?.preset ?? "SD";
  const plan = subscription?.plan ?? "FREE";

  const activeScreen = state.displays?.find(
    (screen) => screen.id === user?.studio?.screen
  );

  const activeAudio = state.audioInputs?.find(
    (device) => device.deviceId === user?.studio?.mic
  );

  const { isPending, onPreset, register } = useStudioSettings(
    id,
    screen,
    audio,
    preset,
    plan
  );

  return (
    <form className="flex h-full relative w-full flex-col gap-y-5 text-white ">
      MediaConfiguration
    </form>
  );
};

export default MediaConfiguration;
