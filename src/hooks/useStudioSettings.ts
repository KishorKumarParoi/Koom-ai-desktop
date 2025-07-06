import { updateStudioSettings } from "@/lib/utils";
import { updateStudioSettingsSchema } from "@/schemas/studio-settings.schema";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
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
  });
};

export default useStudioSettings;
