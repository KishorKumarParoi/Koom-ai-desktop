import { useMediaSources } from "@/hooks/useMediaResources";
import { fetchUserProfile } from "@/lib/utils";
import { ClerkLoading, SignedIn, useUser } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import Loader from "../loader";
import MediaConfiguration from "../media-configuration";

const Widget = () => {
  const [profile, setProfile] = useState<{
    status: number;
    user: {
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
    };
  } | null>(null);

  const { user } = useUser();
  const { state, fetchMediaResources } = useMediaSources();

  // console.log("state", state);
  // console.log("fetchMediaResources: ", fetchMediaResources);

  useEffect(() => {
    if (user && user.id) {
      fetchUserProfile(user.id).then((p) => setProfile(p));
    }
  }, [user]);

  return (
    <div className="p-5">
      <ClerkLoading>
        <div className="h-full flex justify-center items-center">
          <Loader state={false} color="#000" />
        </div>
      </ClerkLoading>
      <SignedIn>
        {profile ? (
          <MediaConfiguration state={state} user={profile?.user} />
        ) : (
          <div className="w-full h-full flex justify-center items-center">
            <Loader state={false} color="#fff" />
          </div>
        )}
      </SignedIn>
    </div>
  );
};

export default Widget;
