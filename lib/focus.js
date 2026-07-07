// One-shot camera-pan requests: anything in the scene (or the OS) can ask
// the CameraRig to glide over and frame a clue. The rig polls takeFocus()
// every frame and runs the in -> hold -> out choreography itself.
//
//   panTo({ pos: [x,y,z], look: [x,y,z], hold: seconds })

let pending = null;

export function panTo(request) {
  pending = { hold: 1.6, ...request };
}

export function takeFocus() {
  const p = pending;
  pending = null;
  return p;
}
