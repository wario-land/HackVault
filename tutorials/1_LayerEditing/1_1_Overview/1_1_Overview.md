# An Overview on WL4Editor Ingame Layer Editing

#### Tools:
[NO\$GBA debug version](https://problemkaputt.de/gba.htm): We use this only to understand how GBA games work. Don't get the gaming version. you only need to debugger and all kinds of viewers to understand things. If you want an emulator for gaming, go to install mGBA or Emuhack by yourself from official sites. ***Beware, the NO\$GBA debugger is free from the official website. you don't need to grind through the internet looking for old pirated NO$GBA debugger.***

  
## Part 1: GBA mechanism on Layer
  
**crap**: I always like to dig into the botton parts of different things, in both daily life things or for researches. This help a lot to understand how a specified thing work. We know there will be always new questions, new ideas or new demonds coming out. so, only when we grasp the essence of something, we can always find the way to the solution.

`Layer` is a useful concecpt people created for 2D games. You can put graphics on different layers to make them move in different speed, or do affine transformation, shake it, fade in or fade out, etc. That's how `Layer` works in 2D games. in GBA, the hardware provides us 4 layers (the NO\$GBA names it `BG`) to do all kinds of graphic works. We are not going to talk a lot on how to use GBA I/O registers to control them, also, we won't show you the different modes the GBA layers can work on. We will only pay attention to the only one mode used in WL4 ingame period. Everything we will do is based on it.

Now, we launch our NO\$GBA debugger, configure the controller simulation stuff by yourself, load the WL4 rom into it and run the game and let wario goes into the first Level. After Wario coming out from the vortex (that's how we define the `ingame period`), we click the disassembler panel to pause the game. then use the menu bar: `Window -> BG Maps -> BG1 Map` to open the `VRAM Viewer`.

![Image](tutorials/1_LayerEditing/1_1_Overview/images/VRAMViewerBG1.png)

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

![Image](tutorials/1_LayerEditing/1_1_Overview/images/VRAMViewerTileData.png)

By comparing the Tile Address. We can find, every `Tile8x8` uses `0x20` bytes in the VRAM. Basically, this is how the `Tile8x8` be constructed:

![Image](tutorials/1_LayerEditing/1_1_Overview/images/Tile8x8DataFormat.png)

**The Tile8x8 data is exactly the same thing used in WL4Editor, C patch files, also what Usenti will give you in the bin file when you use the 'GBA Exporter' to export the Gfx data. And you can even find it in the runtime VRAM of any GBA games.**
This is an example of only change the palette, but use the same `Tile8x8` data as resource:

![Image](tutorials/1_LayerEditing/1_1_Overview/images/Tile8x8ChangePalette.png)

**The mapping data uses one byte for each Tile8x8 to save the info to render a Tile8x8 on BG. it contains Tile8x8 id, palette id, x flip and y flip info. The GBA feature can let your BG use much less VRAM when rendering.**

  
## Part 2: Layer mechanism in WL4 and WL4Editor
#### TODOs
  