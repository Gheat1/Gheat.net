'use client';

import Room from './Room';
import Cables from './Cables';
import ServerRack from './ServerRack';
import PCRig from './PCRig';
import CRTMonitor from './CRTMonitor';
import CameraRig from './CameraRig';
import WarpTunnel from './WarpTunnel';
import RoomProps from './RoomProps';
import SurveillanceCamera from './SurveillanceCamera';
import CorkBoard, { WallClock } from './CorkBoard';

// The full set. Layout: CRT front and center on its crate, the rack and the
// custom rig lurking in the back corners, cables everywhere. In phase 'os'
// the CRT hosts the retro OS on its glass; 'overview' pulls back so the
// room's clues (red LED, rig power light, TV knobs) can be hunted.

export default function Scene({
  phase,
  storyPhase,
  glitch,
  onIntroComplete,
  onZoomComplete,
  onReboot,
  onWarp,
  onLook,
  onNoclip,
}) {
  return (
    <>
      <CameraRig phase={phase} glitch={glitch} onZoomComplete={onZoomComplete} />
      <Room storyPhase={storyPhase} />
      <Cables />
      <RoomProps />
      <ServerRack storyPhase={storyPhase} />
      <PCRig />

      {/* interactive story props — clickable when you can see the room */}
      {(() => {
        const roomEyes = phase === 'room' || phase === 'overview';
        return (
          <>
            <SurveillanceCamera active={roomEyes} />
            <CorkBoard active={roomEyes} />
            <WallClock active={roomEyes} />
          </>
        );
      })()}
      <CRTMonitor
        phase={phase}
        storyPhase={storyPhase}
        onIntroComplete={onIntroComplete}
        onReboot={onReboot}
        onWarp={onWarp}
        onLook={onLook}
        onNoclip={onNoclip}
      />
      {phase === 'warp' && <WarpTunnel />}

      {/* scattered clutter: a couple of tape boxes by the TV */}
      <mesh position={[0.85, 0.045, 0.7]} rotation={[0, 0.4, 0]}>
        <boxGeometry args={[0.2, 0.09, 0.32]} />
        <meshStandardMaterial color="#1c1a20" roughness={0.8} />
      </mesh>
      <mesh position={[-0.9, 0.03, 0.9]} rotation={[0, -0.7, 0]}>
        <boxGeometry args={[0.2, 0.06, 0.32]} />
        <meshStandardMaterial color="#241f1a" roughness={0.8} />
      </mesh>
    </>
  );
}
