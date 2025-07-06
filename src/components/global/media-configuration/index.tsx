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
  const studio = user?.studio;
  const subscription = user?.subscription;
  const id = studio?.id ?? "";
  const screen = studio?.screen ?? null;
  const audio = studio?.mic ?? null;
  const preset = studio?.preset ?? "SD";
  const plan = subscription?.plan ?? "FREE";

  const {} = useStudioSettings(id, screen, audio, preset, plan);

  return (
    <form className="flex h-full relative w-full flex-col gap-y-5 ">
      MediaConfiguration
    </form>
  );
};

export default MediaConfiguration;
