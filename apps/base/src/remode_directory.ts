import { Fd, Inode, File, OpenFile, PreopenDirectory, Directory, WASI } from "@bjorn3/browser_wasi_shim";
import * as wasi from "@bjorn3/browser_wasi_shim/dist/wasi_defs.js";

export class RemoteDirectory extends Inode {
  data: Uint8Array;
  baseurl: string;
  readonly: boolean;
  file_cache: ArrayBuffer | undefined;

  constructor(
    // data: ArrayBuffer | SharedArrayBuffer | Uint8Array | Array<number>,
    baseurl: string,
    options?: Partial<{
      readonly: boolean;
    }>,
  ) {
    super();
    this.data = new Uint8Array();
    this.readonly = !!options?.readonly;
    this.baseurl = baseurl;
    this.file_cache = undefined;
  }

  fetch_file(): ArrayBuffer {
    if (this.file_cache === undefined) {
      fetch(this.baseurl).then((response) => response.arrayBuffer()).then((buffer) => {
        this.file_cache = buffer;
        return buffer;
      });
    } else {
      return this.file_cache;
    }
  }

  // TODO: RESTに対応する仕組みにする
  path_open(oflags: number, fs_rights_base: bigint, fd_flags: number) {
    this.data = new Uint8Array(this.fetch_file());
    if (
      this.readonly &&
      (fs_rights_base & BigInt(wasi.RIGHTS_FD_WRITE)) ==
        BigInt(wasi.RIGHTS_FD_WRITE)
    ) {
      // no write permission to file
      return { ret: wasi.ERRNO_PERM, fd_obj: null };
    }

    if ((oflags & wasi.OFLAGS_TRUNC) == wasi.OFLAGS_TRUNC) {
      if (this.readonly) return { ret: wasi.ERRNO_PERM, fd_obj: null };
      this.data = new Uint8Array([]);
    }

    const file = new OpenFile(this);
    if (fd_flags & wasi.FDFLAGS_APPEND) file.fd_seek(0n, wasi.WHENCE_END);
    return { ret: wasi.ERRNO_SUCCESS, fd_obj: file };
  }

  get size(): bigint {
    this.data = new Uint8Array(this.fetch_file());
    return BigInt(this.data.byteLength);
  }

  stat(): wasi.Filestat {
    return new wasi.Filestat(wasi.FILETYPE_REGULAR_FILE, this.size);
  }
}
