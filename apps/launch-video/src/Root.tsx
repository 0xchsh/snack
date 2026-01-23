import { Composition } from "remotion";
import { LaunchVideo } from "./LaunchVideo";

export const RemotionRoot = () => {
  return (
    <Composition
      id="LaunchVideo"
      component={LaunchVideo}
      durationInFrames={500}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
