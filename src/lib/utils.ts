"use server";

import axios from "axios";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const onCloseApp = () => {
  if (window.ipcRenderer) {
    window.ipcRenderer.send("closeApp");
  } else {
    window.close();
  }
};

const httpsClient = axios.create({
  baseURL: import.meta.env.VITE_HOST_URL,
});

export const fetchUserProfile = async (clerkId: string) => {
  const response = await httpsClient.get(`/auth/${clerkId}`, {
    headers: {
      "Content-Type": "application/json",
    },
  });
  // console.log("Response: ", response);
  return response.data;
};

export const getMediaSources = async () => {
  // 1. Get display sources from main process (make sure main process handles "getResources")
  const displays = await window.ipcRenderer.invoke("getResources");

  // 2. Request audio permission before enumerateDevices
  try {
    await navigator.mediaDevices.getUserMedia({ audio: true });
    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioInputs = devices.filter((d) => d.kind === "audioinput");

    console.log("Getting Sources...", { displays, audioInputs });
    return { displays, audioInputs };
  } catch (err) {
    console.log("Microphone permission denied or error:", err);
  }
};

export const updateStudioSettings = async (
  id: string,
  screen: string,
  audio: string,
  preset: "HD" | "SD"
) => {
  const response = httpsClient.post(
    `/studio/${id}`,
    {
      screen,
      audio,
      preset,
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  return (await response).data;
};

export const hidePluginWindow = (state: boolean) => {
  window.ipcRenderer.send("hide-plugin", { state });
};

export const videoRecordingTime = (ms: number) => {
  const second = Math.floor((ms / 1000) % 60)
    .toString()
    .padStart(2, "0");
  const minute = Math.floor((ms / 1000 / 60) % 60)
    .toString()
    .padStart(2, "0");
  const hour = Math.floor((ms / 1000 / 60 / 60) % 60)
    .toString()
    .padStart(2, "0");

  return {
    length: `${hour}:${minute}:${second}`,
    minute,
  };
};
