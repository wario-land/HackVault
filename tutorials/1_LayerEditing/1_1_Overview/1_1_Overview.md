# An Overview on WL4Editor Ingame Layer Editing

#### Tools:
[NO$GBA debug version](https://problemkaputt.de/gba.htm): We use this only to understand how GBA games work. Don't get the gaming version. you only need to debugger and all kinds of viewers to understand things. If you want an emulator for gaming, go to install mGBA or Emuhack by yourself from official sites. ***Beware, the NO$GBA debugger is free from the official website. you don't need to grind through the internet looking for old pirated NO$GBA debugger.***

  
## Part 1: GBA mechanism and data format on Layer
  
**crap**: I always like to dig into the botton parts of different things, in both daily life things or for researches. This help a lot to understand how a specified thing work. We know there will be always new questions, new ideas or new demonds coming out. so, only when we grasp the essence of something, we can always find the way to the solution.

#### Tile8x8 data format

`Layer` is a useful concecpt people created for 2D games. You can put graphics on different layers to make them move in different speed, or do affine transformation, shake it, fade in or fade out, etc. That's how `Layer` works in 2D games. in GBA, the hardware provides us 4 layers (the NO$GBA names it `BG`) to do all kinds of graphic works. We are not going to talk a lot on how to use GBA I/O registers to control them, also, we won't show you the different modes the GBA layers can work on. We will only pay attention to the only one mode used in WL4 ingame period. Everything we will do is based on it.

Now, we launch our NO$GBA debugger, configure the controller simulation stuff by yourself, load the WL4 rom into it and run the game and let wario goes into the first Level. After Wario coming out from the vortex (that's how we define the `ingame period`), we click the disassembler panel to pause the game. then use the menu bar: `Window -> BG Maps -> BG1 Map` to open the `VRAM Viewer`.

![Image](tutorials/1_LayerEditing/1_1_Overview/images/VramViewerBG1.png)

Let me talk about the graphic things on the `Layer` first. Then I will talk about functionalities of different layers later.

We see a whole grid in the graphicview on `BG1` tab. There are several things worth a mention: 
- about Ingame mode Layer, all of the 4 BGs are constructed by `Tile8x8` using 16-color palettes.
- The red box in the graphicview is the runtime camera on the current frame. inside the box is the area will be rendered on the screen.
- You will sometimes notice the line density of the grid in some BGs change in other WL4 ingame period `Rooms`. That's caused by GBA's BG configuration changes. We won't look into it here.

Now, we get 2 questions:
- How the `Tile8x8` data is like?
- How the `Tile8x8` be rendered in Layer?

GBA BG render logic for WL4 ingame period: Load `Tile8x8` data into the Tile VRAM using DMA3 (Direct Memory Access) IO registers. The Tile VRAM can works for the 4 different BGs as `Tile8x8` resource. Then the game loads the `mapping data` (the GBATEK documentation calls it `text`) into `BG` VRAM which not only contains the index of `Tile8x8` used in every slot in the grid, but also contains `x flip`, `y flip` and `palette id` in the `mapping data`.
**The Tile8x8 data only includes the color id for each pixel, but does not have the color info in it! While, it is the 'mapping data' which provide enough info to render Tile8x8s into BGs.**
Okay, in the `VRAM Viewer`, we click the `Tile 1` tab and hover our mouse over the first blue shiny `Tile8x8`, then compare it with the second `Tile8x8` right after it:

![Image](tutorials/1_LayerEditing/1_1_Overview/images/VramViewerTileData.png)

By comparing the Tile Address. We can find, every `Tile8x8` uses `0x20` bytes in the VRAM. Basically, this is how the `Tile8x8` be constructed:

![Image](tutorials/1_LayerEditing/1_1_Overview/images/Tile8x8DataFormat.png)

**The Tile8x8 data is exactly the same thing used in WL4Editor, C patch files, also what Usenti will give you in the bin file when you use the 'GBA Exporter' to export the Gfx data. And you can even find it in the runtime VRAM of any GBA games.** 
This is an example of only change the palette, but use the same `Tile8x8` data as resource:

![Image](tutorials/1_LayerEditing/1_1_Overview/images/Tile8x8ChangePalette.png)

**The mapping data uses one byte for each Tile8x8 to save the info to render a Tile8x8 on BG. it contains Tile8x8 id, palette id, x flip and y flip info. The GBA feature can let your BG use much less VRAM when rendering.** 

#### Color and Palette format

in Computer science. One of the methods to represent a color is using RGB value. Since a lot of visiable colors con be created using red, green and blue light. You can change the light intensity of the 3 types of light to modify the color. The way we represent color in GBA is `RGB555`, which uses 2 bytes to represent a color and each of the red, green or blue channel uses 5 bits to represent its "strength". The format can be easily written down like this:

```
RGB555 format: 0bbbbbgggggrrrrr
b for blue, g for green, r for red, every color channel use 5 bits;
```

Since 2 bytes have 16 bits, but we only uses 15 bits in `RGB555`, so the highest bit is always set to 0. In some tools like Usenti, you can adjust color in `RGB555` format, so the "strength" of each channel ranges from 0 to 31. If you are faimilar with some programming languages, the modern tradition is to represent color using `RGB888`. If you want to write some tools to convert the data between these 2 formats, you can google it by yourself, or read the source code of WL4Editor. it is not hard.

To represent a 16-color palette. Since GBA game code compiled into `arm7 Little Endian` machine code. For data types which uses more than 1 byte, the highest bytes will always appear first in the ROM and all kinds of RAM. 

If a blue color can be represented by `0x7C00`, then you will see the data becomes `0x007C` as long as it is not in the runtime registers. Also, in most of the regular 16-color palettes, the first color will be used to represent transparent color in Tile8x8 data, it can be any value but they just usually set it to some green color like `0x03E0` (`0xE003` when not in registers). So when they draw the Tile8x8 manually in Usenti or some other tool, they can only use 15 colors in a Tile8x8. The palette data looks like this when you save them into the ROM or Exported the data from Usenti:
```
              low byte of blue, the second color
              |     high byte of blue, the second color
             \|/   \|/
0xE0, 0x03, 0x7C, 0x00, ... (16 * 2 = 32 bytes in total)
 ^     ^
 |     high byte of the first transparent color
 low byte of the first transparent color
```
Btw, Usenti and other tools will always change the order of colors in a palette, so when we import palette data into WL4Editor, we always need a dialog to let people select a transparency representing color, to provide enough info for WL4Editor.

#### mapping data format

I have talked it above that, when rendering Tile8x8, it always needs Tile8x8 id, a palette id, x flp and y flip as info to do the rendering. It needs 2 bytes (an unsigned short, u16) to draw a Tile8x8 onto the Layer. Here is the mapping data format for one Tile8x8:
```
format: pppp xytt tttt tttt
p for palette bits, 4 bits can represent value in range [0, 15];
x for x flip, one bit flag to flip the Tile8x8 horizontally;
y for y flip, one bit flag to flip the Tile8x8 vertically;
t for tile id, 10 bits can represent value in range [0, 0x3FF];
```
in the VRAM, for every `BG`, the `Tile8x8` data and mapping data saved in different places, usually, when loading graphics into VRAM, most of the `Tile8x8` data be loaded one time, while the mapping data will update runtime if the image on the `BG` cannot be shown in one screen, especially when you want to scroll a WL4 ingame Room around, the mapping data on the edge of the camera box will keep changing. you can use the NO$GBA debugger to see how the runtime loading feels like in the `VRAM viewer`.
  
## Part 2: Layer mechanism in WL4 and WL4Editor
#### Layer type 0x10 and 0x20, Tile8x8 and Tile16, and RLE
According to the previous section, we know the GBA needs mapping data to render BGs which saves a lot of space in the ROM and VRAM. But Nintendo developers thought this is not enough. they want some better abstract concepts of things to make the game design easier, also use even less space to encode the data. So we have this section.
First of all, they thought `Tile8x8` is too small as a element to construct the Layer in Wario Land 4 ingame mechanism. So we got `Tile16`, which is made of 4 `Tile8x8` like this:
```
_____________
|     |     |
| T 0 | T 1 |
|_____|_____|
|     |     |
| T 2 | T 3 |
|_____|_____|
```
T n represents for `Tile8x8` with id in this `Tile16`. to represent it, since we already have `Tile8x8` graphic data in the VRAM, we only need to use mapping data to represent the Tile16. So `Tile16` data is really just an array of 4 `Tile8x8` mapping data which takes 8 bytes to record. Now, it is big enough to use them in game.
`RLE` is `Run-Length Encoding` in short. It is an algorithm or method to compress the layer mapping data whose speed to decompress and extract the mapping data to the RAM is acceptably fast. They use `RLE8` and `RLE16` to decrease the space usages of every Layer's mapping data in the ROM.
Layer type 0x10 and 0x20 is defined based on the `Tile8x8` and `Tile16`. The developers in Nintendo believed that, in some in-game `Layers`, it takes less ROM space to save the decompressed data by using `Tile8x8`. So those `Layers` are represented in `Tile8x8` instead of `Tile16`. So, they defined:
```
The Layers which are constructed by Tile8x8 have mapping type 0x20
The Layers which are constructed by Tile16 have mapping type 0x10
```
Usually. tile graphic data which constructed the `Tile16` encoded `Layers` (can be Layer 0, 1, 2) can be called `foreground (fg) Tile8x8`. Tile graphic data which constructed the `Tile8x8` encoded `Layers` (can be Layer 0, 3) can be called `background (bg) Tile8x8`. Only the `Tile16` encoded `Layers` have the `event id` and `terrain id` features. All the Tile relative data is maintained in the `Tileset`, only the mapping data is maintained by `Layers` under `RoomHeader` strcture. We will dig into this next time.

#### Terrain type and event id in Tile16
To make the game development more convenient, the developers assigned `terrain type` and `event` roles for every Tile16. It is just how i named it. they used some more abstract romaji to name those things in the Gigaleak source code. most of the time, the `terrain types` do the Wario's and enemies' hitbox work with the `Tile16`, the `event id` more likely to do something that, when Wario hit into a `Tile16`, then some stats of the game, or some global variables change. They always work together to support a lot of game mechanism.
Here is a translated list of enumeration on the vanilla event id used or unused in game. these features should work without changing the game's mechanism. Also, since they are saved as unsigned short array, you can always create your own event id which is bigger than `0xFF` to do someting in all kinds of patches:
```
    nothing,                                         //00
    damage_wario,                                    //01
    door,                                            //02
    warp_door,                                       //03
    pipe_up_left,                                    //04
    pipe_up_right,                                   //05
    pipe_down_left,                                  //06
    pipe_down_right,                                 //07
    go_to_map,                                       //08
    game_warp,                                       //09: for hidden game
    boss_floor_breakable,                            //0A: normal breakable block
    normal_breakable_block_1x1,                      //0B: reset the current Tile16 to id 0
    normal_breakable_block_1x1_coin,                 //0C: reset the current Tile16 to id 0, pop a coin
    normal_breakable_block_2x2_up_left,              //0D: similar to above, same below
    normal_breakable_block_2x2_coin,                 //0E
    normal_breakable_block_2x2_others,               //0F
    normal_grass_breakable_block_1x1,                //10: normal breakable grass block, with gfx and sfx when break
    normal_grass_breakable_block_1x1_coin,           //11: similar to above, same below
    normal_grass_breakable_block_2x2_up_left,        //12
    normal_grass_breakable_block_2x2_coin,           //13
    normal_grass_breakable_block_2x2_others,         //14
    normal_type3_breakable_block_1x1,                //15: normal breakable block, type 3
    normal_type3_breakable_block_1x1_coin,           //16: similar to above, same below
    normal_type3_breakable_block_2x2_up_left,        //17
    normal_type3_breakable_block_2x2_coin,           //18
    normal_type3_breakable_block_2x2_others,         //19
    normal_type4_breakable_block_1x1,                //1A: normal breakable block, type 4
    normal_type4_breakable_block_1x1_coin,           //1B: similar to above, same below
    normal_type4_breakable_block_2x2_up_left,        //1C
    normal_type4_breakable_block_2x2_coin,           //1D
    normal_type4_breakable_block_2x2_others,         //1E
    hard_breakable_block_2x2_up_left,                //1F: hard breakable block
    hard_breakable_block_2x2_up_left_coin,           //20
    hard_breakable_block_2x2_others,                 //21
    hard_grass_breakable_block_2x2_up_left,          //22: hard breakable grass block
    hard_grass_breakable_block_2x2_up_left_coin,     //23
    hard_grass_breakable_block_2x2_others,           //24
    hard_steel_breakable_block_2x2_up_left,          //25: hard breakable steel block
    hard_steel_breakable_block_2x2_up_left_coin,     //26
    hard_steel_breakable_block_2x2_others,           //27
    hard_wooden_breakable_block_2x2_up_left,         //28: hard breakable wooden block
    hard_wooden_breakable_block_2x2_up_left_coin,    //29
    hard_wooden_breakable_block_2x2_others,          //2A
    fire_breakable_block_1x1,                        //2B: block breakable by fire
    fire_breakable_block_1x1_coin,                   //2C
    fire_breakable_block_2x2_up_left,                //2D
    fire_breakable_block_2x2_coin,                   //2E
    fire_breakable_block_2x2_others,                 //2F
    snow_type1_breakable_block_2x2_up_left,          //30: block breakable by snow ball wario
    snow_type1_breakable_block_2x2_others,           //31
    snow_type2_breakable_block_2x2_up_left,          //32: block breakable by snow ball wario
    snow_type2_breakable_block_2x2_others,           //33
    revivable_breakable_block_2x2_up_left,           //34: revivable breakable block
    revivable_breakable_block_2x2_others,            //35
    enemy_breakable_block_1x1,                       //36: only throwing enemy on it can break the block
    ____EventID_37_unused,                               //37
    door_available_when_switch_1_off,                //38: door works when switch is off
    door_available_when_switch_2_off,                //39
    door_available_when_switch_3_off,                //3A
    door_available_when_switch_4_off,                //3B
    door_available_when_switch_1_on,                 //3C: door works when switch is on
    door_available_when_switch_2_on,                 //3D
    door_available_when_switch_3_on,                 //3E
    door_available_when_switch_4_on,                 //3F
    switch_1_trigger,                                //40: the trigger of global switch
    switch_2_trigger,                                //41: all start by 'off' state
    switch_3_trigger,                                //42: you can use the switch 1, 2, 3 in game, reserve switch 0
    switch_4_trigger,                                //43: switch 4 is used by frog switch to control vortex by default
    ____EventID_44_unused,                               //44
    ____EventID_45_unused,                               //45
    ____EventID_46_unused,                               //46
    ____EventID_47_unused,                               //47
    blue_shiny_works_when_switch_1_on,               //48: switch 1 shinies
    red_shiny_works_when_switch_1_on,                //49
    blue_shiny_works_when_switch_4_on,               //4A: switch 4 shinies
    red_shiny_works_when_switch_4_on,                //4B
    water_current_right_when_switch_4_on,            //4C: switch 4 water current
    water_current_left_when_switch_4_on,             //4D
    water_current_up_when_switch_4_on,               //4E
    water_current_down_when_switch_4_on,             //4F
    water,                                           //50: regular water
    water_current_right,                             //51: water current
    water_current_left,                              //52
    water_current_up,                                //53
    water_current_down,                              //54
    water_current_right_fast,                        //55: fast water current
    water_current_left_fast,                         //56
    water_current_up_fast,                           //57
    water_current_down_fast,                         //58
    slippery_breakable_block_1x1,                    //59: slippery breakable block
    slippery_breakable_block_1x1_coin,               //5A
    slippery_breakable_block_2x2_up_left,            //5B
    slippery_breakable_block_2x2_coin,               //5C
    slippery_breakable_block_2x2_others,             //5D
    ____EventID_5E_unused,                               //5E
    ____EventID_5F_unused,                               //5F
    rotate_platform_track_right_stop,                //60: rotate platform tracks
    rotate_platform_track_left_stop,                 //61
    rotate_platform_track_right_half_up,             //62
    rotate_platform_track_right_half_down,           //63
    rotate_platform_track_left_half_up,              //64
    rotate_platform_track_left_half_down,            //65
    rotate_platform_track_high_right_stop,           //66
    rotate_platform_track_high_left_stop,            //67
    slippery_solid,                                  //68
    burn_wario,                                      //69
    belt_left,                                       //6A
    belt_right,                                      //6B
    ____EventID_6C_unused,                               //6C
    ____EventID_6D_unused,                               //6D
    ____EventID_6E_unused,                               //6E
    ____EventID_6F_unused,                               //6F
    blue_shiny,                                      //70
    ____EventID_71_unused,                               //71
    red_shiny,                                       //72
    ____EventID_73_unused,                               //73
    heart_1,                                         //74: wario's hearts plus 1
    heart_3,                                         //75: wario's hearts plus 3
    heart_5,                                         //76: wario's hearts plus 5
    ____EventID_77_unused,                               //77
    ____EventID_78_unused,                               //78
    ladder_middle,                                   //79
    ladder_top,                                      //7A
    net,                                             //7B
    light,                                           //7C
    recover_from_flat_wario,                         //7D
    damage_wario_on_left_4_pixels,                   //7E
    damage_wario_on_right_4_pixels,                  //7F
    damage_wario_on_up_4_pixels,                     //80
    damage_wario_on_down_4_pixels,                   //81
    ____EventID_82_unused,                               //82
    ____EventID_83_unused,                               //83
    domino_R4,                                       //84: dominoes
    domino_L4,                                       //85
    domino_R5D1,                                     //86
    domino_L5D1,                                     //87
    domino_R5U1,                                     //88
    domino_L5U1,                                     //89
    domino_R3D3,                                     //8A
    domino_L3D3,                                     //8B
    domino_R3U3,                                     //8C
    domino_L3U3,                                     //8D
    domino_STP ,                                     //8E
    ____EventID_8F_unused,                               //8F
    damage_wario_when_switch_1_off,                  //90
    damage_wario_when_switch_2_off,                  //91
    damage_wario_when_switch_3_off,                  //92
    damage_wario_when_switch_4_off,                  //93
    damage_wario_when_switch_1_on,                   //94
    damage_wario_when_switch_2_on,                   //95
    damage_wario_when_switch_3_on,                   //96
    damage_wario_when_switch_4_on,                   //97
    available_ladder_middle_when_switch_1_off,       //98: switch ladder
    available_ladder_top_when_switch_1_off,          //99
    available_ladder_middle_when_switch_1_on,        //9A
    available_ladder_top_when_switch_1_on,           //9B
    damage_wario_on_low_4_pixels_when_switch_2_off,  //9C
    ____EventID_9D_unused,                               //9D
    ____EventID_9E_unused,                               //9E
    ____EventID_9F_unused,                               //9F
    keyzer_sprites_priority_set_top                  //A0
```
Here is another translated list of enumeration on the vanilla terrain type used or unused in game. these features should work without changing the game's mechanism. Since they are saved as unsigned char array in the ROM, you are not supposed to add a lot of terrain type id to change the game mechanism:
```
    air,                                                          //00
    solid,                                                        //01
    left_wall_slope,                                              //02
    right_wall_slop,                                              //03
    left_wall_gentle_slope_left,                                  //04
    left_wall_gentle_slope_right,                                 //05
    right_wall_gentle_slope_left,                                 //06
    right_wall_gentle_slope_right,                                //07
    solid_when_damage_wario,                                      //08
    solid_to_wario_only_when_damage_wario,                        //09: enemy can pass it
    hollow_when_damage_wario,                                     //0A: both wario and enemy can pass it
    ____TerrainType_0B_unused,                                    //0B
    platform,                                                     //0C: wario cannot go down
    ____TerrainType_0D_unused,                                    //0D
    ____TerrainType_0E_unused,                                    //0E
    ____TerrainType_0F_unused,                                    //0F
    ____TerrainType_10_unused,                                    //10
    ____TerrainType_11_unused,                                    //11
    ____TerrainType_12_unused,                                    //12
    ____TerrainType_13_unused,                                    //13
    solid_when_switch_1_on,                                       //14
    solid_when_switch_2_on,                                       //15
    solid_when_switch_3_on,                                       //16
    solid_when_switch_4_on,                                       //17
    solid_when_switch_1_off,                                      //18
    solid_when_switch_2_off,                                      //19
    solid_when_switch_3_off,                                      //1A
    solid_when_switch_4_off,                                      //1B
    ____TerrainType_1C_unused,                                    //1C
    solid_damage_wario_when_switch_1_on,                          //1D
    solid_damage_wario_when_switch_2_on,                          //1E
    solid_damage_wario_when_switch_3_on,                          //1F
    solid_damage_wario_when_switch_4_on,                          //20
    solid_damage_wario_when_switch_1_off,                         //21
    solid_damage_wario_when_switch_2_off,                         //22
    solid_damage_wario_when_switch_3_off,                         //23
    solid_damage_wario_when_switch_4_off,                         //24
    ____TerrainType_25_unused,                                    //25
    platform_when_switch_1_on,                                    //26
    platform_when_switch_2_on,                                    //27
    platform_when_switch_3_on,                                    //28
    platform_when_switch_4_on,                                    //29
    platform_when_switch_1_off,                                   //2A
    platform_when_switch_2_off,                                   //2B
    platform_when_switch_3_off,                                   //2C
    platform_when_switch_4_off,                                   //2D
    ____TerrainType_2E_unused,                                    //2E
    solid_when_switch_1_off_left_wall_slope_when_switch_1_on,     //2F
    solid_when_switch_2_off_left_wall_slope_when_switch_2_on,     //30
    solid_when_switch_3_off_left_wall_slope_when_switch_3_on,     //31
    solid_when_switch_4_off_left_wall_slope_when_switch_4_on,     //32
    solid_when_switch_1_on_left_wall_slope_when_switch_1_off,     //33
    solid_when_switch_2_on_left_wall_slope_when_switch_2_off,     //34
    solid_when_switch_3_on_left_wall_slope_when_switch_3_off,     //35
    solid_when_switch_4_on_left_wall_slope_when_switch_4_off,     //36
    ____TerrainType_37_unused,                                    //37
    solid_when_switch_1_off_right_wall_slope_when_switch_1_on,    //38
    solid_when_switch_2_off_right_wall_slope_when_switch_2_on,    //39
    solid_when_switch_3_off_right_wall_slope_when_switch_3_on,    //3A
    solid_when_switch_4_off_right_wall_slope_when_switch_4_on,    //3B
    solid_when_switch_1_on_right_wall_slope_when_switch_1_off,    //3C
    solid_when_switch_2_on_right_wall_slope_when_switch_2_off,    //3D
    solid_when_switch_3_on_right_wall_slope_when_switch_3_off,    //3E
    solid_when_switch_4_on_right_wall_slope_when_switch_4_off,    //3F
    (a lot of unused terrain types here, but you need to modify the vanilla mechanism to free those unused terrain type first, then you can use them)
    ABLD_EVB16,                                                   //80: alpha blending, eva 1, evb 16
    ABLD_EVB14,                                                   //81: eva 3, evb 14
    ABLD_EVB12,                                                   //82: eva 5, evb 12
    ABLD_EVB10,                                                   //83: eva 7, evb 10
    ABLD_EVB07,                                                   //84: eva 10, evb 7
    ABLD_EVB04,                                                   //85: eva 13, evb 4
    ABLD_EVB01,                                                   //86: eva 16, evb 1
```
Basically, in vanilla game mechanism, a lot of `events` only work on `Layer 1`. water events and things like "light event" can only works on `Layer 0` with `layer 0 alpha blending attributes` toggled on in `Room Config Dialog`.

on the `terrain type` part, most things only work in `Layer 1`. But If you read the terrain type enumeration list carefully, yuu will find there is some alpha blending setter in it. which will only works when you turn on the `layer 0 alpha blending attributes` in `Room Config Dialog`. 

The enumeration lists will be a good reference when you want to edit the `Tileset` in `WL4Editor`. 

That's all the things on `Layers` and `Tiles`. I put a parts of the fundamental things from `Tileset` into this overview too. Here is a brief conclusion on the tutorials:
```
P1: Tile8x8 data format, color and palette format, mapping data format;
P2: Tile16 data format, Layer type and RLE, event id and terrain type of Tile16;
``` 
  