import { updateStudioSettings } from "@/lib/utils";
import { updateStudioSettingsSchema } from "@/schemas/studio-settings.schema";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useZodForm } from "./useZodForm";

const useStudioSettings = (
  id: string,
  screen?: string | null,
  audio?: string | null,
  preset?: "HD" | "SD",
  plan?: "PRO" | "FREE"
) => {
  const [onPreset, setPreset] = useState<"HD" | "SD" | "undefined">();

  const { register, watch, errors, handleSubmit, watch, reset } = useZodForm(
    updateStudioSettingsSchema,
    {
      screen: screen!,
      audio: audio!,
      preset: preset!,
    }
  );

  const { mutate, isPending } = useMutation({
    mutationKey: ["update-studio"],
    mutationFn: (data: {
      screen: string;
      id: string;
      audio: string;
      preset: "HD" | "SD";
    }) => updateStudioSettings(data.id, data.screen, data.audio, data.preset),
    onSuccess: (data) => {
      return toast(data.status === 200 ? "Success" : "Error", {
        description: data.message,
      });
    },
  });

  useEffect(() => {
    if (screen && audio && preset) {
      window.ipcRenderer.send("media-sources", {
        screen,
        id,
        audio,
        preset,
        plan,
      });
    }
  }, [audio, plan, id, preset, screen]);

  useEffect(() => {
    const subscribe = watch((values) => {
      setPreset(values.preset);
      mutate({
        screen: values.screen!,
        id,
        audio: values.audio!,
        preset: values.preset!,
      });

      window.ipcRenderer.send("media-sources", {
        screen: values.screen,
        id,
        audio: values.audio,
        preset: values.preset,
        plan,
      });
    });

    return () => {
      subscribe.unsubscribe();
    };
  }, [id, mutate, plan, watch]);

  return { register, isPending, onPreset };
};

export default useStudioSettings;
