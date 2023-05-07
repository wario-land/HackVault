# An Overview on WL4Editor Ingame Layer Editing

#### Tools:
[NO\$GBA debug version](https://problemkaputt.de/gba.htm): We use this only to understand how GBA games work. Don't get the gaming version. you only need to debugger and all kinds of viewers to understand things. If you want an emulator for gaming, go to install mGBA or Emuhack by yourself from official sites. ***Beware, the NO\$GBA debugger is free from the official website. you don't need to grind through the internet looking for old pirated NO$GBA debugger.***

  
## Part 1: GBA mechanism and data format on Layer
  
**crap**: I always like to dig into the botton parts of different things, in both daily life things or for researches. This help a lot to understand how a specified thing work. We know there will be always new questions, new ideas or new demonds coming out. so, only when we grasp the essence of something, we can always find the way to the solution.

#### Tile8x8 data format

`Layer` is a useful concecpt people created for 2D games. You can put graphics on different layers to make them move in different speed, or do affine transformation, shake it, fade in or fade out, etc. That's how `Layer` works in 2D games. in GBA, the hardware provides us 4 layers (the NO\$GBA names it `BG`) to do all kinds of graphic works. We are not going to talk a lot on how to use GBA I/O registers to control them, also, we won't show you the different modes the GBA layers can work on. We will only pay attention to the only one mode used in WL4 ingame period. Everything we will do is based on it.

Now, we launch our NO\$GBA debugger, configure the controller simulation stuff by yourself, load the WL4 rom into it and run the game and let wario goes into the first Level. After Wario coming out from the vortex (that's how we define the `ingame period`), we click the disassembler panel to pause the game. then use the menu bar: `Window -> BG Maps -> BG1 Map` to open the `VRAM Viewer`.

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

#### Palette format

in Computer science. One of the methods to represent a color is using RGB value. Since a lot of visiable colors con be created using red, green and blue light. You can change the light intensity of the 3 types of light to modify the color. The way we represent color in GBA is `RGB555`, which uses 2 bytes to represent a color and each of the red, green or blue channel uses 5 bits to represent its "strength". The format can be easily written down like this:

```
RGB555 format: 0bbbbbgggggrrrrr
b for blue, g for green, r for red, every color channel use 5 bits;
```

Since 2 bytes have 16 bits, but we only uses 15 bits in `RGB555`, so the highest bit is always set to 0. In some tools like Usenti, you can adjust color in `RGB555` format, so the "strength" of each channel ranges from 0 to 31. If you are faimilar with some programming languages, the modern tradition is to represent color using `RGB888`. If you want to write some tools to convert the data between these 2 formats, you can google it by yourself, or read the source code of WL4Editor. it is not hard.

To represent a 16-color palette. Since GBA game code compiled into `arm7 Little Endian` machine code. For data types which uses more than 1 byte, the highest bytes will always appear first in the ROM and all kinds of RAM. 

If a blue color can be represented by `0x7C00`, then you will see the data becomes `0x007C` as long as it is not in the runtime registers. Also, in most of the regular 16-color palettes, the first color will be used to represent transparent color in Tile8x8 data, it can be any value but they just usually set it to some green color like `0x03E0` (`0xE003` when not in registers). So when they draw the Tile8x8 manually in Usenti or some other tool, they can only use 15 colors in a Tile8x8. The palette data looks like this when you save them into the ROM or Exported the data from Usenti:
```
              high byte of blue, the second color
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
in the VRAM, for every `BG`, the `Tile8x8` data and mapping data saved in different places, usually, when loading graphics into VRAM, most of the `Tile8x8` data be loaded one time, while the mapping data will update runtime if the image on the `BG` cannot be shown in one screen, especially when you want to scroll a WL4 ingame Room around, the mapping data on the edge of the camera box will keep changing. you can use the NO\$GBA debugger to see how the runtime loading feels like in the `VRAM viewer`.
  
## Part 2: Layer mechanism in WL4 and WL4Editor
#### TODOs
#### Explain Layer type 0x10 and 0x20, and the difference between them, which Layer can use type 0x20
#### Explain Terrain type and event id, copy and translate all the enum from the leak
#### Explain Layer 1 is the main layer for most of those event Tile16 mechanism
#### Explain those door relative stuff and Layer Effect relative stuff in some other tutorials. or this file will become too big.
  