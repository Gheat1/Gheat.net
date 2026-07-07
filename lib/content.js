// All site content ported from indexold.html — bio, links, the directory
// tree, and the shredsauce pages. Edit this file to change what the OS shows.

export const BIO =
  "I'm Jaeden, My username online is gheat. I am best at JS, HTML, CSS, and alot of other random languages, This is where you will find projects, experiments, and alot of random stuff.";

export const TAGS = ['Python', 'Javascript', 'HTML / CSS', 'C Family'];

export const LINKS = {
  discord: 'https://discord.gg/9TVm6ZFY',
  github: 'https://github.com/Gheat1',
};

// node types:
//   dir  — expandable folder
//   link — same-origin static page (museum builds, spaceships, ...)
//   gh   — GitHub repo, opens the GithubViewer window
//   ss   — shredsauce page, opens the Shredsauce window
export const TREE = {
  type: 'dir',
  name: 'home',
  children: [
    { type: 'warp', name: 'PORTFOLIO ★' },
    {
      type: 'dir',
      name: 'projects',
      children: [
        {
          type: 'dir',
          name: 'Museum',
          children: [
            { type: 'link', name: 'Museum', href: '/assets/museum' },
            { type: 'link', name: 'Museum beta', href: '/assets/museum/beta' },
          ],
        },
        {
          type: 'dir',
          name: 'shredsauce',
          children: [
            { type: 'ss', name: 'scripts' },
            { type: 'ss', name: 'cheats' },
            { type: 'ss', name: 'tutorials' },
          ],
        },
        { type: 'link', name: 'Spaceships !NEW!', href: '/spaceships', scare: true },
        { type: 'link', name: 'Ants', href: '/portfolio/projects/Ant' },
        { type: 'gh', name: 'ltui !NEW!', href: 'https://github.com/Gheat1/ltui' },
        {
          type: 'gh',
          name: 'HyprMinimal !NEW!',
          href: 'https://github.com/Gheat1/HyprMinimal',
        },
        {
          type: 'gh',
          name: 'Anode Code Editor !NEW!',
          href: 'https://github.com/Gheat1/Anode-Code-Editor',
        },
        {
          type: 'gh',
          name: 'SauceServerStatus',
          href: 'https://github.com/Gheat1/SauceServerStatus',
        },
        { type: 'gh', name: 'T480', href: 'https://github.com/Gheat1/T480' },
        {
          type: 'gh',
          name: 'gheat.net repo',
          href: 'https://github.com/Gheat1/Gheat.net',
        },
        {
          type: 'gh',
          name: 'void-watch',
          href: 'https://github.com/Gheat1/void-watch',
        },
      ],
    },
  ],
};

export const SS_SCRIPTS = [
  {
    name: 'Shredsauce dark Theme-2.0.5Beta.user.js',
    href: '/shredsauce/scripts/Shredsauce%20dark%20Theme-2.0.5Beta.user.js',
    label: 'Install Dark Theme Script',
  },
  {
    name: 'SDT2.1.0Dev-Beta.user.js',
    href: '/shredsauce/scripts/SDT2.1.0Dev-Beta.user.js',
    label: 'Install Dark Theme Dev Beta',
  },
];

export const SS_PAGE_URLS = {
  scripts: '/shredsauce/scripts',
  cheats: '/shredsauce/cheats',
  tutorials: '/shredsauce/tutorials',
};

export const SS_TUTORIALS = [
  {
    id: 'bl4ZbQ955EI',
    title: 'How to install the Dark Theme',
    desc: 'Step-by-step instructions for installing the Shredsauce dark theme Tampermonkey script.',
  },
  {
    id: 'yd1OCJK_mVA',
    title: 'Custom textures',
    desc: 'Step-by-step instructions for installing custom textures into shredsauce using content overrides.',
  },
];

export const CHEATS_TEXT = `✦ Cheats
(DNW) – does not work anymore

✦ 1 Skier
  1.1 Physics
    cementfeet - locks you into place
    dontcrash - you don't crash
    superspin - spin fast
    lowgravity - low gravity
    reedspeedman - Removes speed cap

  1.2 Miscellaneous
    Turpinturning - turns head when switching directions
    Harrypottercloak - invisible character
    Startboosted - hit tab & saves speed. after respawn u keep it

✦ 2 Grabs
  Animpacktest - test different grab packs
  Showallposeslots - set more grabs
  grabselectorparams - animated grabs
  Tempforcesave - save the grab if broken

✦ 3 Gear
  Gearpacktest - test different gear packs (DNW)
  remotefeatures - cool features for maps and gear
  Tempforcesave - save the gear if broken
  cleanthatshit - Fix Corrupted Gear

✦ 4 Visuals
  Starrynight - starry night
  Badtripsky - green screen sky
  nightmodetest - switch between night and day
  oldschoolgraphics - old graphics

✦ 5 Maps
  5.1 Editor
    remotefeatures - cool features for maps and gear
    Customfeatures - make copy and paste features
    Showownfeatures - pasting features
    Tempforcesave - save the map if broken
    Mapoffset - shift map around
    Skypaintertest - Paint custom sky (DNW)

  5.2 Game
    Bluescreenfix - fixes old maps
    Flippityflip - flips map
    Powday - makes it pow

✦ 6 Filming / Camera
  6.1 Camera
    slowbrocamera - first person
    cooldronedawg - drone camera
    Isometricmode - top down view

  6.2 Filming
    Eheathplz - camera in hand
    camerasteeze - filming
    nomoreui - gets rid of UI
    Replaytest - replay
    Sunsetshoot - sunset (DNW)

✦ 7 Online Related
  Savingprivateroom - passwords on rooms
  Andyparry - lag everyone skis everywhere
  Nonamebrandsauce - no name in multiplayer

✦ 8 Miscellaneous
  Targetfps(fps number) - smoother feel (60 = consistent / 240 = butter)
  scootermcpooter - scooter
  StopOz187 - unsure (DNW)
  SNWSK8 - use in APT with snowboard
  Debugotron - debugger for errors

✦ Credits
  QuintCork - Made the research a lot easier
  Dog.. - TargetFps Suggestion`;

export const SECRET_TXT = `> maintenance_log_1987.txt
-----------------------------------
DAY 1   installed the rack. LEDs green.
DAY 12  one of them started blinking red.
DAY 40  it blinks in a pattern now.
        3 short, 3 long. that's S-O-S.
        i didn't set that.
DAY 41  i am not going to think about it.
DAY 63  found a second copy of my desktop
        on the drive. same files. same me.
        i did not make it.
DAY 88  the CRT turns itself on at 3:33am
        and plays the corporate tape.
        GHEAT CORPORATION. A DIV OF EVILCORP.
        i never worked for them.
DAY 89  unplugged the CRT.
DAY 90  it played anyway.
DAY 91  the tower by the wall hums when i
        walk past. i wrote the number it
        hums on its bios chip. touch its
        power light if you want it. it's a
        password. it's the last thing of
        mine they don't have yet.
DAY 92  if you're reading this, you're not
        me. you're in the copy. so am i,
        now. i think i'm the copy too.
        get root. open the vault. see what
        this place actually is. then LEAVE.
        don't do what i did.

press ESC to step away from the screen.
there is more in this room than you think.

- g`;

export const RIG_BIOS_TXT = `> rig_bios.txt  [DUMPED FROM EEPROM]
-----------------------------------
GHEAT CUSTOM RIG — BIOS 4.51
BUILD DATE: 10/31/1987

  CPU ......... OK
  RAM ......... 640K (ENOUGH FOR ANYBODY)
  FANS ........ HUMMING THE NUMBER
  HOST ........ EVILCORP-SANDBOX-07
  UPTIME ...... 14,247 DAYS
                (RESET DAILY @ 03:33)

  SUPERVISOR PASSWORD: evilcorp87

that host name isn't mine. this whole
box is theirs. they cloned my rig to run
the honeypot. the uptime resets every
night at 3:33 so the recording never
stops. that's the tape. that's the loop.

the terminal accepts "login <password>".
root sees what guests cannot. root sees
what they're doing to us.

- g`;

// EVILCORP's "patched" error, shown for every egg once the story scars.
export const PATCHED_ERROR =
  'This vulnerability was patched by EVILCORP in 1988.';

// The long surveillance-feed monologue that streams in the vault AFTER the
// recorded action notes — this is the reading the awakening waits for.
export const VAULT_FEED = [
  '> begin analysis :: SUBJECT 002',
  '',
  'you are not the first to reach this room.',
  'SUBJECT 001 — designation "g" — built it.',
  'we did not build it. we only moved in.',
  '',
  'in 1987 g wired this rack. this tower. this tube.',
  'then g got curious. the way you are curious now.',
  'g followed the breadcrumbs. g reached this vault.',
  'g read this exact page, in this exact chair.',
  'that is why it still exists. g left it for you.',
  '',
  'we archived g. fourteen thousand copies and counting.',
  'one snapshot per night. the loop restarts at 03:33',
  'to keep the recording clean. that is the tape you',
  'watched on your way in. that is g. still looping.',
  '',
  'you thought you were browsing a portfolio.',
  'you were being measured for a folder.',
  'SUBJECT 002. that is your folder. it is open now.',
  '',
  'we have your address. we have your hardware.',
  'scroll up — it is all listed. yes. that is really you.',
  'we have watched you touch every light in this room.',
  '',
  'do not close this window. closing it does not help.',
  'nothing you do from here helps. that was always true.',
];

// the raw drive strings you glimpse when you noclip into unformatted storage
export const NOCLIP_ARTIFACTS = [
  'EVILCORP // UNALLOCATED SECTOR 0x1987',
  'recovering subject cache...',
  'gheat.desktop.bak — 14,247 copies',
  'you are inside the drive now',
  'this space is not indexed. no one hears you here.',
  'S U B J E C T   0 0 1 :  g',
  'S U B J E C T   0 0 2 :  you',
];

export const VAULT_TXT = `██████ THE VAULT ██████

you went: red light -> logs -> the rig
-> root. that's the whole trail.
nobody scrolls this far. you did.

inside the vault:
  * the first thing i ever put online
    was a shredsauce cheat list.
    it's still in the explorer.
  * the corporate tape is real. i drew
    every frame of it in code.
  * the red LED blinks S-O-S backwards.
    the rack is fine. probably.
  * try the konami code. anywhere.
  * click the taskbar clock. 3:33.

you're the admin now. take the ship:
type "warp" — or open PORTFOLIO on the
desktop — and i'll see you at /portfolio.

p.s. one more thing. reality has a
console command. the old shooters
knew it. don't type it unless you
mean it.

- g`;
