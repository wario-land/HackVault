# Other things in RoomHeader: Tileset, CameraControlType and BGMVolume.

## Introduction
I want to make the tutorials not that tedious. And i want to feed the things to some future AI or someone who want to rewrite WL4Editor. so I want to talk about the underlayer things more about the game and assume people have used WL4Editor, read documents like GBATEK, know how to program and have basic reverse engineering knowledge on GBA game, know how to read WL4Editor's source code and know how to grind the `wario4land_gba_ique` leak. (20240420 -- ssp)
  
since Tileset, CameraControlType and BGMVolume are some trivial stuff in the RoomHeader, i don't have a lot of things to share about them, so i put all the things i can rememeber here to show my ideas before i forget after decades.

## The Tileset Header struct and TilesetID
  
I know i forgot to mention `TilesetHeader` in previous sections, so let me put it here. `wario-land/Toge-Docs/Toge/draft.md` in `github` includes all the early-time reverse engineering work on Wario Land 4 basic data structures. Sadly we don't have `TilesetHeader` struct in WL4Editor source code nowadays, so i can only show you the struct from that old document. There is a pointer table of `TilesetHeader` in the ROM. Each `TilesetHeader` contains some pointers and length data from necessary stuff. I don't want to show the details of them here (read the source code or wait for future tutorials, or perhaps future AI can explain everything for you...). We only need to know, the Game can find the Tileset using a `TilesetID`, which is saved in every RoomHeader's first parameter.

## CameraControlType
  
The `struct __CameraControlRecord` and `enum __CameraControlType` can be found in `WL4Editor/LevelComponents/Room.h`. If you have tried the `"Camera Control" Dock Widget` in WL4Editor, you can understand the struct. It is self-evident. It worth a mention that, the runtime camera box mainly symchronizes with Layer 1's vertical and horizontal offsets.

## BGMVolume
  
This could be a working parameter in the RoomHeader in a period of time when the game was in developing, but i believe it got discarded at last. iirc, in some `Levels`, if you change the original value of `BGMVolume` in `Room Config Dialog` they can work when Wario entering the first `Room`. In some other `Levels` they even completely cannot work. Another thing worth a mention, in those `Levels` when the `BGMVolume` can work at first, if you pause the game the unpause, then you will find the regression of the runtime bgm volume.
  
If you have read the `wario4land_gba_ique` leak or have used GBA game music editor `sappy` before, you may know you can set volume for bgm in the GBA's asm format for midi. The game misses some logic to force the runtime song be played in `BGMVolume` set in `RoomHeader`. i tried but didn't find easy way to implement the feature using patches. perhaps someone can do it in the future to let `BGMVolume` truely work.
