
import { File, OpenFile, PreopenDirectory, Directory, WASI, Inode } from "@bjorn3/browser_wasi_shim";
import { RemoteFile } from "./remote_file";
import * as wasi from "@bjorn3/browser_wasi_shim/dist/wasi_defs.js";

export const vfsDirMap = new PreopenDirectory(
  "/", new Map<string, File | Directory>([
    ["app", new Directory(new Map<string, Inode>([
      ["lib", new Directory(new Map<string, Inode>([
        ["main.rb", new RemoteFile("assets/vfs/app/lib/main.rb")],
      ]))],
    ]))],
    ["vfs-files.txt", new RemoteFile("assets/vfs/vfs-files.txt")],
  ])
);
