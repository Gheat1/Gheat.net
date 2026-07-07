// The retro OS renders into a fixed 4:3 DOM surface that gets projected
// onto the CRT's glass (0.78 x 0.585 world units — also 4:3). Window
// centering, drag clamping and the matrix rain all use this space.
export const OS_W = 1024;
export const OS_H = 768;
