(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global["poc-remotefs"] = {}));
})(this, (function (exports) { 'use strict';

    const CLOCKID_REALTIME=0;const CLOCKID_MONOTONIC=1;const ERRNO_SUCCESS=0;const ERRNO_BADF=8;const ERRNO_EXIST=20;const ERRNO_INVAL=28;const ERRNO_ISDIR=31;const ERRNO_NAMETOOLONG=37;const ERRNO_NOENT=44;const ERRNO_NOSYS=52;const ERRNO_NOTDIR=54;const ERRNO_NOTEMPTY=55;const ERRNO_NOTSUP=58;const ERRNO_PERM=63;const ERRNO_NOTCAPABLE=76;const RIGHTS_FD_WRITE=1<<6;class Iovec{static read_bytes(view,ptr){const iovec=new Iovec;iovec.buf=view.getUint32(ptr,true);iovec.buf_len=view.getUint32(ptr+4,true);return iovec}static read_bytes_array(view,ptr,len){const iovecs=[];for(let i=0;i<len;i++){iovecs.push(Iovec.read_bytes(view,ptr+8*i));}return iovecs}}class Ciovec{static read_bytes(view,ptr){const iovec=new Ciovec;iovec.buf=view.getUint32(ptr,true);iovec.buf_len=view.getUint32(ptr+4,true);return iovec}static read_bytes_array(view,ptr,len){const iovecs=[];for(let i=0;i<len;i++){iovecs.push(Ciovec.read_bytes(view,ptr+8*i));}return iovecs}}const WHENCE_SET=0;const WHENCE_CUR=1;const WHENCE_END=2;const FILETYPE_DIRECTORY=3;const FILETYPE_REGULAR_FILE=4;class Dirent{head_length(){return 24}name_length(){return this.dir_name.byteLength}write_head_bytes(view,ptr){view.setBigUint64(ptr,this.d_next,true);view.setBigUint64(ptr+8,this.d_ino,true);view.setUint32(ptr+16,this.dir_name.length,true);view.setUint8(ptr+20,this.d_type);}write_name_bytes(view8,ptr,buf_len){view8.set(this.dir_name.slice(0,Math.min(this.dir_name.byteLength,buf_len)),ptr);}constructor(next_cookie,name,type){this.d_ino=0n;const encoded_name=new TextEncoder().encode(name);this.d_next=next_cookie;this.d_namlen=encoded_name.byteLength;this.d_type=type;this.dir_name=encoded_name;}}const FDFLAGS_APPEND=1<<0;class Fdstat{write_bytes(view,ptr){view.setUint8(ptr,this.fs_filetype);view.setUint16(ptr+2,this.fs_flags,true);view.setBigUint64(ptr+8,this.fs_rights_base,true);view.setBigUint64(ptr+16,this.fs_rights_inherited,true);}constructor(filetype,flags){this.fs_rights_base=0n;this.fs_rights_inherited=0n;this.fs_filetype=filetype;this.fs_flags=flags;}}const OFLAGS_CREAT=1<<0;const OFLAGS_DIRECTORY=1<<1;const OFLAGS_EXCL=1<<2;const OFLAGS_TRUNC=1<<3;class Filestat{write_bytes(view,ptr){view.setBigUint64(ptr,this.dev,true);view.setBigUint64(ptr+8,this.ino,true);view.setUint8(ptr+16,this.filetype);view.setBigUint64(ptr+24,this.nlink,true);view.setBigUint64(ptr+32,this.size,true);view.setBigUint64(ptr+38,this.atim,true);view.setBigUint64(ptr+46,this.mtim,true);view.setBigUint64(ptr+52,this.ctim,true);}constructor(filetype,size){this.dev=0n;this.ino=0n;this.nlink=0n;this.atim=0n;this.mtim=0n;this.ctim=0n;this.filetype=filetype;this.size=size;}}const PREOPENTYPE_DIR=0;class PrestatDir{write_bytes(view,ptr){view.setUint32(ptr,this.pr_name.byteLength,true);}constructor(name){this.pr_name=new TextEncoder().encode(name);}}class Prestat{static dir(name){const prestat=new Prestat;prestat.tag=PREOPENTYPE_DIR;prestat.inner=new PrestatDir(name);return prestat}write_bytes(view,ptr){view.setUint32(ptr,this.tag,true);this.inner.write_bytes(view,ptr+4);}}

    let Debug=class Debug{enable(enabled){this.log=createLogger(enabled===undefined?true:enabled,this.prefix);}get enabled(){return this.isEnabled}constructor(isEnabled){this.isEnabled=isEnabled;this.prefix="wasi:";this.enable(isEnabled);}};function createLogger(enabled,prefix){if(enabled){const a=console.log.bind(console,"%c%s","color: #265BA0",prefix);return a}else {return ()=>{}}}const debug=new Debug(false);

    class WASIProcExit extends Error{constructor(code){super("exit with exit code "+code);this.code=code;}}let WASI=class WASI{start(instance){this.inst=instance;try{instance.exports._start();return 0}catch(e){if(e instanceof WASIProcExit){return e.code}else {throw e}}}initialize(instance){this.inst=instance;if(instance.exports._initialize){instance.exports._initialize();}}constructor(args,env,fds,options={}){this.args=[];this.env=[];this.fds=[];debug.enable(options.debug);this.args=args;this.env=env;this.fds=fds;const self=this;this.wasiImport={args_sizes_get(argc,argv_buf_size){const buffer=new DataView(self.inst.exports.memory.buffer);buffer.setUint32(argc,self.args.length,true);let buf_size=0;for(const arg of self.args){buf_size+=arg.length+1;}buffer.setUint32(argv_buf_size,buf_size,true);debug.log(buffer.getUint32(argc,true),buffer.getUint32(argv_buf_size,true));return 0},args_get(argv,argv_buf){const buffer=new DataView(self.inst.exports.memory.buffer);const buffer8=new Uint8Array(self.inst.exports.memory.buffer);const orig_argv_buf=argv_buf;for(let i=0;i<self.args.length;i++){buffer.setUint32(argv,argv_buf,true);argv+=4;const arg=new TextEncoder().encode(self.args[i]);buffer8.set(arg,argv_buf);buffer.setUint8(argv_buf+arg.length,0);argv_buf+=arg.length+1;}if(debug.enabled){debug.log(new TextDecoder("utf-8").decode(buffer8.slice(orig_argv_buf,argv_buf)));}return 0},environ_sizes_get(environ_count,environ_size){const buffer=new DataView(self.inst.exports.memory.buffer);buffer.setUint32(environ_count,self.env.length,true);let buf_size=0;for(const environ of self.env){buf_size+=environ.length+1;}buffer.setUint32(environ_size,buf_size,true);debug.log(buffer.getUint32(environ_count,true),buffer.getUint32(environ_size,true));return 0},environ_get(environ,environ_buf){const buffer=new DataView(self.inst.exports.memory.buffer);const buffer8=new Uint8Array(self.inst.exports.memory.buffer);const orig_environ_buf=environ_buf;for(let i=0;i<self.env.length;i++){buffer.setUint32(environ,environ_buf,true);environ+=4;const e=new TextEncoder().encode(self.env[i]);buffer8.set(e,environ_buf);buffer.setUint8(environ_buf+e.length,0);environ_buf+=e.length+1;}if(debug.enabled){debug.log(new TextDecoder("utf-8").decode(buffer8.slice(orig_environ_buf,environ_buf)));}return 0},clock_res_get(id,res_ptr){let resolutionValue;switch(id){case CLOCKID_MONOTONIC:{resolutionValue=5000n;break}case CLOCKID_REALTIME:{resolutionValue=1000000n;break}default:return ERRNO_NOSYS}const view=new DataView(self.inst.exports.memory.buffer);view.setBigUint64(res_ptr,resolutionValue,true);return ERRNO_SUCCESS},clock_time_get(id,precision,time){const buffer=new DataView(self.inst.exports.memory.buffer);if(id===CLOCKID_REALTIME){buffer.setBigUint64(time,BigInt(new Date().getTime())*1000000n,true);}else if(id==CLOCKID_MONOTONIC){let monotonic_time;try{monotonic_time=BigInt(Math.round(performance.now()*1e6));}catch(e){monotonic_time=0n;}buffer.setBigUint64(time,monotonic_time,true);}else {buffer.setBigUint64(time,0n,true);}return 0},fd_advise(fd,offset,len,advice){if(self.fds[fd]!=undefined){return ERRNO_SUCCESS}else {return ERRNO_BADF}},fd_allocate(fd,offset,len){if(self.fds[fd]!=undefined){return self.fds[fd].fd_allocate(offset,len)}else {return ERRNO_BADF}},fd_close(fd){if(self.fds[fd]!=undefined){const ret=self.fds[fd].fd_close();self.fds[fd]=undefined;return ret}else {return ERRNO_BADF}},fd_datasync(fd){if(self.fds[fd]!=undefined){return self.fds[fd].fd_sync()}else {return ERRNO_BADF}},fd_fdstat_get(fd,fdstat_ptr){if(self.fds[fd]!=undefined){const{ret,fdstat}=self.fds[fd].fd_fdstat_get();if(fdstat!=null){fdstat.write_bytes(new DataView(self.inst.exports.memory.buffer),fdstat_ptr);}return ret}else {return ERRNO_BADF}},fd_fdstat_set_flags(fd,flags){if(self.fds[fd]!=undefined){return self.fds[fd].fd_fdstat_set_flags(flags)}else {return ERRNO_BADF}},fd_fdstat_set_rights(fd,fs_rights_base,fs_rights_inheriting){if(self.fds[fd]!=undefined){return self.fds[fd].fd_fdstat_set_rights(fs_rights_base,fs_rights_inheriting)}else {return ERRNO_BADF}},fd_filestat_get(fd,filestat_ptr){if(self.fds[fd]!=undefined){const{ret,filestat}=self.fds[fd].fd_filestat_get();if(filestat!=null){filestat.write_bytes(new DataView(self.inst.exports.memory.buffer),filestat_ptr);}return ret}else {return ERRNO_BADF}},fd_filestat_set_size(fd,size){if(self.fds[fd]!=undefined){return self.fds[fd].fd_filestat_set_size(size)}else {return ERRNO_BADF}},fd_filestat_set_times(fd,atim,mtim,fst_flags){if(self.fds[fd]!=undefined){return self.fds[fd].fd_filestat_set_times(atim,mtim,fst_flags)}else {return ERRNO_BADF}},fd_pread(fd,iovs_ptr,iovs_len,offset,nread_ptr){const buffer=new DataView(self.inst.exports.memory.buffer);const buffer8=new Uint8Array(self.inst.exports.memory.buffer);if(self.fds[fd]!=undefined){const iovecs=Iovec.read_bytes_array(buffer,iovs_ptr,iovs_len);let nread=0;for(const iovec of iovecs){const{ret,data}=self.fds[fd].fd_pread(iovec.buf_len,offset);if(ret!=ERRNO_SUCCESS){buffer.setUint32(nread_ptr,nread,true);return ret}buffer8.set(data,iovec.buf);nread+=data.length;offset+=BigInt(data.length);if(data.length!=iovec.buf_len){break}}buffer.setUint32(nread_ptr,nread,true);return ERRNO_SUCCESS}else {return ERRNO_BADF}},fd_prestat_get(fd,buf_ptr){const buffer=new DataView(self.inst.exports.memory.buffer);if(self.fds[fd]!=undefined){const{ret,prestat}=self.fds[fd].fd_prestat_get();if(prestat!=null){prestat.write_bytes(buffer,buf_ptr);}return ret}else {return ERRNO_BADF}},fd_prestat_dir_name(fd,path_ptr,path_len){if(self.fds[fd]!=undefined){const{ret,prestat}=self.fds[fd].fd_prestat_get();if(prestat==null){return ret}const prestat_dir_name=prestat.inner.pr_name;const buffer8=new Uint8Array(self.inst.exports.memory.buffer);buffer8.set(prestat_dir_name.slice(0,path_len),path_ptr);return prestat_dir_name.byteLength>path_len?ERRNO_NAMETOOLONG:ERRNO_SUCCESS}else {return ERRNO_BADF}},fd_pwrite(fd,iovs_ptr,iovs_len,offset,nwritten_ptr){const buffer=new DataView(self.inst.exports.memory.buffer);const buffer8=new Uint8Array(self.inst.exports.memory.buffer);if(self.fds[fd]!=undefined){const iovecs=Ciovec.read_bytes_array(buffer,iovs_ptr,iovs_len);let nwritten=0;for(const iovec of iovecs){const data=buffer8.slice(iovec.buf,iovec.buf+iovec.buf_len);const{ret,nwritten:nwritten_part}=self.fds[fd].fd_pwrite(data,offset);if(ret!=ERRNO_SUCCESS){buffer.setUint32(nwritten_ptr,nwritten,true);return ret}nwritten+=nwritten_part;offset+=BigInt(nwritten_part);if(nwritten_part!=data.byteLength){break}}buffer.setUint32(nwritten_ptr,nwritten,true);return ERRNO_SUCCESS}else {return ERRNO_BADF}},fd_read(fd,iovs_ptr,iovs_len,nread_ptr){const buffer=new DataView(self.inst.exports.memory.buffer);const buffer8=new Uint8Array(self.inst.exports.memory.buffer);if(self.fds[fd]!=undefined){const iovecs=Iovec.read_bytes_array(buffer,iovs_ptr,iovs_len);let nread=0;for(const iovec of iovecs){const{ret,data}=self.fds[fd].fd_read(iovec.buf_len);if(ret!=ERRNO_SUCCESS){buffer.setUint32(nread_ptr,nread,true);return ret}buffer8.set(data,iovec.buf);nread+=data.length;if(data.length!=iovec.buf_len){break}}buffer.setUint32(nread_ptr,nread,true);return ERRNO_SUCCESS}else {return ERRNO_BADF}},fd_readdir(fd,buf,buf_len,cookie,bufused_ptr){const buffer=new DataView(self.inst.exports.memory.buffer);const buffer8=new Uint8Array(self.inst.exports.memory.buffer);if(self.fds[fd]!=undefined){let bufused=0;while(true){const{ret,dirent}=self.fds[fd].fd_readdir_single(cookie);if(ret!=0){buffer.setUint32(bufused_ptr,bufused,true);return ret}if(dirent==null){break}if(buf_len-bufused<dirent.head_length()){bufused=buf_len;break}const head_bytes=new ArrayBuffer(dirent.head_length());dirent.write_head_bytes(new DataView(head_bytes),0);buffer8.set(new Uint8Array(head_bytes).slice(0,Math.min(head_bytes.byteLength,buf_len-bufused)),buf);buf+=dirent.head_length();bufused+=dirent.head_length();if(buf_len-bufused<dirent.name_length()){bufused=buf_len;break}dirent.write_name_bytes(buffer8,buf,buf_len-bufused);buf+=dirent.name_length();bufused+=dirent.name_length();cookie=dirent.d_next;}buffer.setUint32(bufused_ptr,bufused,true);return 0}else {return ERRNO_BADF}},fd_renumber(fd,to){if(self.fds[fd]!=undefined&&self.fds[to]!=undefined){const ret=self.fds[to].fd_close();if(ret!=0){return ret}self.fds[to]=self.fds[fd];self.fds[fd]=undefined;return 0}else {return ERRNO_BADF}},fd_seek(fd,offset,whence,offset_out_ptr){const buffer=new DataView(self.inst.exports.memory.buffer);if(self.fds[fd]!=undefined){const{ret,offset:offset_out}=self.fds[fd].fd_seek(offset,whence);buffer.setBigInt64(offset_out_ptr,offset_out,true);return ret}else {return ERRNO_BADF}},fd_sync(fd){if(self.fds[fd]!=undefined){return self.fds[fd].fd_sync()}else {return ERRNO_BADF}},fd_tell(fd,offset_ptr){const buffer=new DataView(self.inst.exports.memory.buffer);if(self.fds[fd]!=undefined){const{ret,offset}=self.fds[fd].fd_tell();buffer.setBigUint64(offset_ptr,offset,true);return ret}else {return ERRNO_BADF}},fd_write(fd,iovs_ptr,iovs_len,nwritten_ptr){const buffer=new DataView(self.inst.exports.memory.buffer);const buffer8=new Uint8Array(self.inst.exports.memory.buffer);if(self.fds[fd]!=undefined){const iovecs=Ciovec.read_bytes_array(buffer,iovs_ptr,iovs_len);let nwritten=0;for(const iovec of iovecs){const data=buffer8.slice(iovec.buf,iovec.buf+iovec.buf_len);const{ret,nwritten:nwritten_part}=self.fds[fd].fd_write(data);if(ret!=ERRNO_SUCCESS){buffer.setUint32(nwritten_ptr,nwritten,true);return ret}nwritten+=nwritten_part;if(nwritten_part!=data.byteLength){break}}buffer.setUint32(nwritten_ptr,nwritten,true);return ERRNO_SUCCESS}else {return ERRNO_BADF}},path_create_directory(fd,path_ptr,path_len){const buffer8=new Uint8Array(self.inst.exports.memory.buffer);if(self.fds[fd]!=undefined){const path=new TextDecoder("utf-8").decode(buffer8.slice(path_ptr,path_ptr+path_len));return self.fds[fd].path_create_directory(path)}else {return ERRNO_BADF}},path_filestat_get(fd,flags,path_ptr,path_len,filestat_ptr){const buffer=new DataView(self.inst.exports.memory.buffer);const buffer8=new Uint8Array(self.inst.exports.memory.buffer);if(self.fds[fd]!=undefined){const path=new TextDecoder("utf-8").decode(buffer8.slice(path_ptr,path_ptr+path_len));const{ret,filestat}=self.fds[fd].path_filestat_get(flags,path);if(filestat!=null){filestat.write_bytes(buffer,filestat_ptr);}return ret}else {return ERRNO_BADF}},path_filestat_set_times(fd,flags,path_ptr,path_len,atim,mtim,fst_flags){const buffer8=new Uint8Array(self.inst.exports.memory.buffer);if(self.fds[fd]!=undefined){const path=new TextDecoder("utf-8").decode(buffer8.slice(path_ptr,path_ptr+path_len));return self.fds[fd].path_filestat_set_times(flags,path,atim,mtim,fst_flags)}else {return ERRNO_BADF}},path_link(old_fd,old_flags,old_path_ptr,old_path_len,new_fd,new_path_ptr,new_path_len){const buffer8=new Uint8Array(self.inst.exports.memory.buffer);if(self.fds[old_fd]!=undefined&&self.fds[new_fd]!=undefined){const old_path=new TextDecoder("utf-8").decode(buffer8.slice(old_path_ptr,old_path_ptr+old_path_len));const new_path=new TextDecoder("utf-8").decode(buffer8.slice(new_path_ptr,new_path_ptr+new_path_len));const{ret,inode_obj}=self.fds[old_fd].path_lookup(old_path,old_flags);if(inode_obj==null){return ret}return self.fds[new_fd].path_link(new_path,inode_obj,false)}else {return ERRNO_BADF}},path_open(fd,dirflags,path_ptr,path_len,oflags,fs_rights_base,fs_rights_inheriting,fd_flags,opened_fd_ptr){const buffer=new DataView(self.inst.exports.memory.buffer);const buffer8=new Uint8Array(self.inst.exports.memory.buffer);if(self.fds[fd]!=undefined){const path=new TextDecoder("utf-8").decode(buffer8.slice(path_ptr,path_ptr+path_len));debug.log(path);const{ret,fd_obj}=self.fds[fd].path_open(dirflags,path,oflags,fs_rights_base,fs_rights_inheriting,fd_flags);if(ret!=0){return ret}self.fds.push(fd_obj);const opened_fd=self.fds.length-1;buffer.setUint32(opened_fd_ptr,opened_fd,true);return 0}else {return ERRNO_BADF}},path_readlink(fd,path_ptr,path_len,buf_ptr,buf_len,nread_ptr){const buffer=new DataView(self.inst.exports.memory.buffer);const buffer8=new Uint8Array(self.inst.exports.memory.buffer);if(self.fds[fd]!=undefined){const path=new TextDecoder("utf-8").decode(buffer8.slice(path_ptr,path_ptr+path_len));debug.log(path);const{ret,data}=self.fds[fd].path_readlink(path);if(data!=null){const data_buf=new TextEncoder().encode(data);if(data_buf.length>buf_len){buffer.setUint32(nread_ptr,0,true);return ERRNO_BADF}buffer8.set(data_buf,buf_ptr);buffer.setUint32(nread_ptr,data_buf.length,true);}return ret}else {return ERRNO_BADF}},path_remove_directory(fd,path_ptr,path_len){const buffer8=new Uint8Array(self.inst.exports.memory.buffer);if(self.fds[fd]!=undefined){const path=new TextDecoder("utf-8").decode(buffer8.slice(path_ptr,path_ptr+path_len));return self.fds[fd].path_remove_directory(path)}else {return ERRNO_BADF}},path_rename(fd,old_path_ptr,old_path_len,new_fd,new_path_ptr,new_path_len){const buffer8=new Uint8Array(self.inst.exports.memory.buffer);if(self.fds[fd]!=undefined&&self.fds[new_fd]!=undefined){const old_path=new TextDecoder("utf-8").decode(buffer8.slice(old_path_ptr,old_path_ptr+old_path_len));const new_path=new TextDecoder("utf-8").decode(buffer8.slice(new_path_ptr,new_path_ptr+new_path_len));let{ret,inode_obj}=self.fds[fd].path_unlink(old_path);if(inode_obj==null){return ret}ret=self.fds[new_fd].path_link(new_path,inode_obj,true);if(ret!=ERRNO_SUCCESS){if(self.fds[fd].path_link(old_path,inode_obj,true)!=ERRNO_SUCCESS){throw "path_link should always return success when relinking an inode back to the original place"}}return ret}else {return ERRNO_BADF}},path_symlink(old_path_ptr,old_path_len,fd,new_path_ptr,new_path_len){const buffer8=new Uint8Array(self.inst.exports.memory.buffer);if(self.fds[fd]!=undefined){new TextDecoder("utf-8").decode(buffer8.slice(old_path_ptr,old_path_ptr+old_path_len));new TextDecoder("utf-8").decode(buffer8.slice(new_path_ptr,new_path_ptr+new_path_len));return ERRNO_NOTSUP}else {return ERRNO_BADF}},path_unlink_file(fd,path_ptr,path_len){const buffer8=new Uint8Array(self.inst.exports.memory.buffer);if(self.fds[fd]!=undefined){const path=new TextDecoder("utf-8").decode(buffer8.slice(path_ptr,path_ptr+path_len));return self.fds[fd].path_unlink_file(path)}else {return ERRNO_BADF}},poll_oneoff(in_,out,nsubscriptions){throw "async io not supported"},proc_exit(exit_code){throw new WASIProcExit(exit_code)},proc_raise(sig){throw "raised signal "+sig},sched_yield(){},random_get(buf,buf_len){const buffer8=new Uint8Array(self.inst.exports.memory.buffer);for(let i=0;i<buf_len;i++){buffer8[buf+i]=Math.random()*256|0;}},sock_recv(fd,ri_data,ri_flags){throw "sockets not supported"},sock_send(fd,si_data,si_flags){throw "sockets not supported"},sock_shutdown(fd,how){throw "sockets not supported"},sock_accept(fd,flags){throw "sockets not supported"}};}};

    class Fd{fd_allocate(offset,len){return ERRNO_NOTSUP}fd_close(){return 0}fd_fdstat_get(){return {ret:ERRNO_NOTSUP,fdstat:null}}fd_fdstat_set_flags(flags){return ERRNO_NOTSUP}fd_fdstat_set_rights(fs_rights_base,fs_rights_inheriting){return ERRNO_NOTSUP}fd_filestat_get(){return {ret:ERRNO_NOTSUP,filestat:null}}fd_filestat_set_size(size){return ERRNO_NOTSUP}fd_filestat_set_times(atim,mtim,fst_flags){return ERRNO_NOTSUP}fd_pread(size,offset){return {ret:ERRNO_NOTSUP,data:new Uint8Array}}fd_prestat_get(){return {ret:ERRNO_NOTSUP,prestat:null}}fd_pwrite(data,offset){return {ret:ERRNO_NOTSUP,nwritten:0}}fd_read(size){return {ret:ERRNO_NOTSUP,data:new Uint8Array}}fd_readdir_single(cookie){return {ret:ERRNO_NOTSUP,dirent:null}}fd_seek(offset,whence){return {ret:ERRNO_NOTSUP,offset:0n}}fd_sync(){return 0}fd_tell(){return {ret:ERRNO_NOTSUP,offset:0n}}fd_write(data){return {ret:ERRNO_NOTSUP,nwritten:0}}path_create_directory(path){return ERRNO_NOTSUP}path_filestat_get(flags,path){return {ret:ERRNO_NOTSUP,filestat:null}}path_filestat_set_times(flags,path,atim,mtim,fst_flags){return ERRNO_NOTSUP}path_link(path,inode,allow_dir){return ERRNO_NOTSUP}path_unlink(path){return {ret:ERRNO_NOTSUP,inode_obj:null}}path_lookup(path,dirflags){return {ret:ERRNO_NOTSUP,inode_obj:null}}path_open(dirflags,path,oflags,fs_rights_base,fs_rights_inheriting,fd_flags){return {ret:ERRNO_NOTDIR,fd_obj:null}}path_readlink(path){return {ret:ERRNO_NOTSUP,data:null}}path_remove_directory(path){return ERRNO_NOTSUP}path_rename(old_path,new_fd,new_path){return ERRNO_NOTSUP}path_unlink_file(path){return ERRNO_NOTSUP}}class Inode{}

    class OpenFile extends Fd{fd_allocate(offset,len){if(this.file.size>offset+len);else {const new_data=new Uint8Array(Number(offset+len));new_data.set(this.file.data,0);this.file.data=new_data;}return ERRNO_SUCCESS}fd_fdstat_get(){return {ret:0,fdstat:new Fdstat(FILETYPE_REGULAR_FILE,0)}}fd_filestat_set_size(size){if(this.file.size>size){this.file.data=new Uint8Array(this.file.data.buffer.slice(0,Number(size)));}else {const new_data=new Uint8Array(Number(size));new_data.set(this.file.data,0);this.file.data=new_data;}return ERRNO_SUCCESS}fd_read(size){const slice=this.file.data.slice(Number(this.file_pos),Number(this.file_pos+BigInt(size)));this.file_pos+=BigInt(slice.length);return {ret:0,data:slice}}fd_pread(size,offset){const slice=this.file.data.slice(Number(offset),Number(offset+BigInt(size)));return {ret:0,data:slice}}fd_seek(offset,whence){let calculated_offset;switch(whence){case WHENCE_SET:calculated_offset=offset;break;case WHENCE_CUR:calculated_offset=this.file_pos+offset;break;case WHENCE_END:calculated_offset=BigInt(this.file.data.byteLength)+offset;break;default:return {ret:ERRNO_INVAL,offset:0n}}if(calculated_offset<0){return {ret:ERRNO_INVAL,offset:0n}}this.file_pos=calculated_offset;return {ret:0,offset:this.file_pos}}fd_tell(){return {ret:0,offset:this.file_pos}}fd_write(data){if(this.file.readonly)return {ret:ERRNO_BADF,nwritten:0};if(this.file_pos+BigInt(data.byteLength)>this.file.size){const old=this.file.data;this.file.data=new Uint8Array(Number(this.file_pos+BigInt(data.byteLength)));this.file.data.set(old);}this.file.data.set(data,Number(this.file_pos));this.file_pos+=BigInt(data.byteLength);return {ret:0,nwritten:data.byteLength}}fd_pwrite(data,offset){if(this.file.readonly)return {ret:ERRNO_BADF,nwritten:0};if(offset+BigInt(data.byteLength)>this.file.size){const old=this.file.data;this.file.data=new Uint8Array(Number(offset+BigInt(data.byteLength)));this.file.data.set(old);}this.file.data.set(data,Number(offset));return {ret:0,nwritten:data.byteLength}}fd_filestat_get(){return {ret:0,filestat:this.file.stat()}}constructor(file){super();this.file_pos=0n;this.file=file;}}class OpenDirectory extends Fd{fd_seek(offset,whence){return {ret:ERRNO_BADF,offset:0n}}fd_tell(){return {ret:ERRNO_BADF,offset:0n}}fd_allocate(offset,len){return ERRNO_BADF}fd_fdstat_get(){return {ret:0,fdstat:new Fdstat(FILETYPE_DIRECTORY,0)}}fd_readdir_single(cookie){if(debug.enabled){debug.log("readdir_single",cookie);debug.log(cookie,this.dir.contents.keys());}if(cookie==0n){return {ret:ERRNO_SUCCESS,dirent:new Dirent(1n,".",FILETYPE_DIRECTORY)}}else if(cookie==1n){return {ret:ERRNO_SUCCESS,dirent:new Dirent(2n,"..",FILETYPE_DIRECTORY)}}if(cookie>=BigInt(this.dir.contents.size)+2n){return {ret:0,dirent:null}}const[name,entry]=Array.from(this.dir.contents.entries())[Number(cookie-2n)];return {ret:0,dirent:new Dirent(cookie+1n,name,entry.stat().filetype)}}path_filestat_get(flags,path_str){const{ret:path_err,path}=Path.from(path_str);if(path==null){return {ret:path_err,filestat:null}}const{ret,entry}=this.dir.get_entry_for_path(path);if(entry==null){return {ret,filestat:null}}return {ret:0,filestat:entry.stat()}}path_lookup(path_str,dirflags){const{ret:path_ret,path}=Path.from(path_str);if(path==null){return {ret:path_ret,inode_obj:null}}const{ret,entry}=this.dir.get_entry_for_path(path);if(entry==null){return {ret,inode_obj:null}}return {ret:ERRNO_SUCCESS,inode_obj:entry}}path_open(dirflags,path_str,oflags,fs_rights_base,fs_rights_inheriting,fd_flags){const{ret:path_ret,path}=Path.from(path_str);if(path==null){return {ret:path_ret,fd_obj:null}}let{ret,entry}=this.dir.get_entry_for_path(path);if(entry==null){if(ret!=ERRNO_NOENT){return {ret,fd_obj:null}}if((oflags&OFLAGS_CREAT)==OFLAGS_CREAT){const{ret,entry:new_entry}=this.dir.create_entry_for_path(path_str,(oflags&OFLAGS_DIRECTORY)==OFLAGS_DIRECTORY);if(new_entry==null){return {ret,fd_obj:null}}entry=new_entry;}else {return {ret:ERRNO_NOENT,fd_obj:null}}}else if((oflags&OFLAGS_EXCL)==OFLAGS_EXCL){return {ret:ERRNO_EXIST,fd_obj:null}}if((oflags&OFLAGS_DIRECTORY)==OFLAGS_DIRECTORY&&entry.stat().filetype!==FILETYPE_DIRECTORY){return {ret:ERRNO_NOTDIR,fd_obj:null}}return entry.path_open(oflags,fs_rights_base,fd_flags)}path_create_directory(path){return this.path_open(0,path,OFLAGS_CREAT|OFLAGS_DIRECTORY,0n,0n,0).ret}path_link(path_str,inode,allow_dir){const{ret:path_ret,path}=Path.from(path_str);if(path==null){return path_ret}if(path.is_dir){return ERRNO_NOENT}const{ret:parent_ret,parent_entry,filename,entry}=this.dir.get_parent_dir_and_entry_for_path(path,true);if(parent_entry==null||filename==null){return parent_ret}if(entry!=null){const source_is_dir=inode.stat().filetype==FILETYPE_DIRECTORY;const target_is_dir=entry.stat().filetype==FILETYPE_DIRECTORY;if(source_is_dir&&target_is_dir){if(allow_dir&&entry instanceof Directory){if(entry.contents.size==0);else {return ERRNO_NOTEMPTY}}else {return ERRNO_EXIST}}else if(source_is_dir&&!target_is_dir){return ERRNO_NOTDIR}else if(!source_is_dir&&target_is_dir){return ERRNO_ISDIR}else if(inode.stat().filetype==FILETYPE_REGULAR_FILE&&entry.stat().filetype==FILETYPE_REGULAR_FILE);else {return ERRNO_EXIST}}if(!allow_dir&&inode.stat().filetype==FILETYPE_DIRECTORY){return ERRNO_PERM}parent_entry.contents.set(filename,inode);return ERRNO_SUCCESS}path_unlink(path_str){const{ret:path_ret,path}=Path.from(path_str);if(path==null){return {ret:path_ret,inode_obj:null}}const{ret:parent_ret,parent_entry,filename,entry}=this.dir.get_parent_dir_and_entry_for_path(path,true);if(parent_entry==null||filename==null){return {ret:parent_ret,inode_obj:null}}if(entry==null){return {ret:ERRNO_NOENT,inode_obj:null}}parent_entry.contents.delete(filename);return {ret:ERRNO_SUCCESS,inode_obj:entry}}path_unlink_file(path_str){const{ret:path_ret,path}=Path.from(path_str);if(path==null){return path_ret}const{ret:parent_ret,parent_entry,filename,entry}=this.dir.get_parent_dir_and_entry_for_path(path,false);if(parent_entry==null||filename==null||entry==null){return parent_ret}if(entry.stat().filetype===FILETYPE_DIRECTORY){return ERRNO_ISDIR}parent_entry.contents.delete(filename);return ERRNO_SUCCESS}path_remove_directory(path_str){const{ret:path_ret,path}=Path.from(path_str);if(path==null){return path_ret}const{ret:parent_ret,parent_entry,filename,entry}=this.dir.get_parent_dir_and_entry_for_path(path,false);if(parent_entry==null||filename==null||entry==null){return parent_ret}if(!(entry instanceof Directory)||entry.stat().filetype!==FILETYPE_DIRECTORY){return ERRNO_NOTDIR}if(entry.contents.size!==0){return ERRNO_NOTEMPTY}if(!parent_entry.contents.delete(filename)){return ERRNO_NOENT}return ERRNO_SUCCESS}fd_filestat_get(){return {ret:0,filestat:this.dir.stat()}}fd_filestat_set_size(size){return ERRNO_BADF}fd_read(size){return {ret:ERRNO_BADF,data:new Uint8Array}}fd_pread(size,offset){return {ret:ERRNO_BADF,data:new Uint8Array}}fd_write(data){return {ret:ERRNO_BADF,nwritten:0}}fd_pwrite(data,offset){return {ret:ERRNO_BADF,nwritten:0}}constructor(dir){super();this.dir=dir;}}class PreopenDirectory extends OpenDirectory{fd_prestat_get(){return {ret:0,prestat:Prestat.dir(this.prestat_name)}}constructor(name,contents){super(new Directory(contents));this.prestat_name=name;}}class File extends Inode{path_open(oflags,fs_rights_base,fd_flags){if(this.readonly&&(fs_rights_base&BigInt(RIGHTS_FD_WRITE))==BigInt(RIGHTS_FD_WRITE)){return {ret:ERRNO_PERM,fd_obj:null}}if((oflags&OFLAGS_TRUNC)==OFLAGS_TRUNC){if(this.readonly)return {ret:ERRNO_PERM,fd_obj:null};this.data=new Uint8Array([]);}const file=new OpenFile(this);if(fd_flags&FDFLAGS_APPEND)file.fd_seek(0n,WHENCE_END);return {ret:ERRNO_SUCCESS,fd_obj:file}}get size(){return BigInt(this.data.byteLength)}stat(){return new Filestat(FILETYPE_REGULAR_FILE,this.size)}constructor(data,options){super();this.data=new Uint8Array(data);this.readonly=!!options?.readonly;}}let Path=class Path{static from(path){const self=new Path;self.is_dir=path.endsWith("/");if(path.startsWith("/")){return {ret:ERRNO_NOTCAPABLE,path:null}}if(path.includes("\x00")){return {ret:ERRNO_INVAL,path:null}}for(const component of path.split("/")){if(component===""||component==="."){continue}if(component===".."){if(self.parts.pop()==undefined){return {ret:ERRNO_NOTCAPABLE,path:null}}continue}self.parts.push(component);}return {ret:ERRNO_SUCCESS,path:self}}to_path_string(){let s=this.parts.join("/");if(this.is_dir){s+="/";}return s}constructor(){this.parts=[];this.is_dir=false;}};class Directory extends Inode{path_open(oflags,fs_rights_base,fd_flags){return {ret:ERRNO_SUCCESS,fd_obj:new OpenDirectory(this)}}stat(){return new Filestat(FILETYPE_DIRECTORY,0n)}get_entry_for_path(path){let entry=this;for(const component of path.parts){if(!(entry instanceof Directory)){return {ret:ERRNO_NOTDIR,entry:null}}const child=entry.contents.get(component);if(child!==undefined){entry=child;}else {debug.log(component);return {ret:ERRNO_NOENT,entry:null}}}if(path.is_dir){if(entry.stat().filetype!=FILETYPE_DIRECTORY){return {ret:ERRNO_NOTDIR,entry:null}}}return {ret:ERRNO_SUCCESS,entry}}get_parent_dir_and_entry_for_path(path,allow_undefined){const filename=path.parts.pop();if(filename===undefined){return {ret:ERRNO_INVAL,parent_entry:null,filename:null,entry:null}}const{ret:entry_ret,entry:parent_entry}=this.get_entry_for_path(path);if(parent_entry==null){return {ret:entry_ret,parent_entry:null,filename:null,entry:null}}if(!(parent_entry instanceof Directory)){return {ret:ERRNO_NOTDIR,parent_entry:null,filename:null,entry:null}}const entry=parent_entry.contents.get(filename);if(entry===undefined){if(!allow_undefined){return {ret:ERRNO_NOENT,parent_entry:null,filename:null,entry:null}}else {return {ret:ERRNO_SUCCESS,parent_entry,filename,entry:null}}}if(path.is_dir){if(entry.stat().filetype!=FILETYPE_DIRECTORY){return {ret:ERRNO_NOTDIR,parent_entry:null,filename:null,entry:null}}}return {ret:ERRNO_SUCCESS,parent_entry,filename,entry}}create_entry_for_path(path_str,is_dir){const{ret:path_ret,path}=Path.from(path_str);if(path==null){return {ret:path_ret,entry:null}}let{ret:parent_ret,parent_entry,filename,entry}=this.get_parent_dir_and_entry_for_path(path,true);if(parent_entry==null||filename==null){return {ret:parent_ret,entry:null}}if(entry!=null){return {ret:ERRNO_EXIST,entry:null}}debug.log("create",path);let new_child;if(!is_dir){new_child=new File(new ArrayBuffer(0));}else {new_child=new Directory(new Map);}parent_entry.contents.set(filename,new_child);entry=new_child;return {ret:ERRNO_SUCCESS,entry}}constructor(contents){super();if(contents instanceof Array){this.contents=new Map(contents);}else {this.contents=contents;}}}

    let DATA_VIEW = new DataView(new ArrayBuffer());
    function data_view(mem) {
        if (DATA_VIEW.buffer !== mem.buffer)
            DATA_VIEW = new DataView(mem.buffer);
        return DATA_VIEW;
    }
    function to_uint32(val) {
        return val >>> 0;
    }
    const UTF8_DECODER = new TextDecoder('utf-8');
    const UTF8_ENCODER = new TextEncoder('utf-8');
    function utf8_encode(s, realloc, memory) {
        if (typeof s !== 'string')
            throw new TypeError('expected a string');
        if (s.length === 0) {
            UTF8_ENCODED_LEN = 0;
            return 1;
        }
        let alloc_len = 0;
        let ptr = 0;
        let writtenTotal = 0;
        while (s.length > 0) {
            ptr = realloc(ptr, alloc_len, 1, alloc_len + s.length);
            alloc_len += s.length;
            const { read, written } = UTF8_ENCODER.encodeInto(s, new Uint8Array(memory.buffer, ptr + writtenTotal, alloc_len - writtenTotal));
            writtenTotal += written;
            s = s.slice(read);
        }
        if (alloc_len > writtenTotal)
            ptr = realloc(ptr, alloc_len, 1, writtenTotal);
        UTF8_ENCODED_LEN = writtenTotal;
        return ptr;
    }
    let UTF8_ENCODED_LEN = 0;
    class Slab {
        constructor() {
            this.list = [];
            this.head = 0;
        }
        insert(val) {
            if (this.head >= this.list.length) {
                this.list.push({
                    next: this.list.length + 1,
                    val: undefined,
                });
            }
            const ret = this.head;
            const slot = this.list[ret];
            this.head = slot.next;
            slot.next = -1;
            slot.val = val;
            return ret;
        }
        get(idx) {
            if (idx >= this.list.length)
                throw new RangeError('handle index not valid');
            const slot = this.list[idx];
            if (slot.next === -1)
                return slot.val;
            throw new RangeError('handle index not valid');
        }
        remove(idx) {
            const ret = this.get(idx); // validate the slot
            const slot = this.list[idx];
            slot.val = undefined;
            slot.next = this.head;
            this.head = idx;
            return ret;
        }
    }
    function throw_invalid_bool() {
        throw new RangeError("invalid variant discriminant for bool");
    }

    class RbAbiGuest {
        constructor() {
            this._resource0_slab = new Slab();
        }
        addToImports(imports) {
            if (!("canonical_abi" in imports))
                imports["canonical_abi"] = {};
            imports.canonical_abi['resource_drop_rb-abi-value'] = i => {
                this._resource0_slab.remove(i).drop();
            };
            imports.canonical_abi['resource_clone_rb-abi-value'] = i => {
                const obj = this._resource0_slab.get(i);
                return this._resource0_slab.insert(obj.clone());
            };
            imports.canonical_abi['resource_get_rb-abi-value'] = i => {
                return this._resource0_slab.get(i)._wasm_val;
            };
            imports.canonical_abi['resource_new_rb-abi-value'] = i => {
                this._registry0;
                return this._resource0_slab.insert(new RbAbiValue(i, this));
            };
        }
        async instantiate(module, imports) {
            imports = imports || {};
            this.addToImports(imports);
            if (module instanceof WebAssembly.Instance) {
                this.instance = module;
            }
            else if (module instanceof WebAssembly.Module) {
                this.instance = await WebAssembly.instantiate(module, imports);
            }
            else if (module instanceof ArrayBuffer || module instanceof Uint8Array) {
                const { instance } = await WebAssembly.instantiate(module, imports);
                this.instance = instance;
            }
            else {
                const { instance } = await WebAssembly.instantiateStreaming(module, imports);
                this.instance = instance;
            }
            this._exports = this.instance.exports;
            this._registry0 = new FinalizationRegistry(this._exports['canonical_abi_drop_rb-abi-value']);
        }
        rubyShowVersion() {
            this._exports['ruby-show-version: func() -> ()']();
        }
        rubyInit(arg0) {
            const memory = this._exports.memory;
            const realloc = this._exports["cabi_realloc"];
            const vec1 = arg0;
            const len1 = vec1.length;
            const result1 = realloc(0, 0, 4, len1 * 8);
            for (let i = 0; i < vec1.length; i++) {
                const e = vec1[i];
                const base = result1 + i * 8;
                const ptr0 = utf8_encode(e, realloc, memory);
                const len0 = UTF8_ENCODED_LEN;
                data_view(memory).setInt32(base + 4, len0, true);
                data_view(memory).setInt32(base + 0, ptr0, true);
            }
            this._exports['ruby-init: func(args: list<string>) -> ()'](result1, len1);
        }
        rubyInitLoadpath() {
            this._exports['ruby-init-loadpath: func() -> ()']();
        }
        rbEvalStringProtect(arg0) {
            const memory = this._exports.memory;
            const realloc = this._exports["cabi_realloc"];
            const ptr0 = utf8_encode(arg0, realloc, memory);
            const len0 = UTF8_ENCODED_LEN;
            const ret = this._exports['rb-eval-string-protect: func(str: string) -> tuple<handle<rb-abi-value>, s32>'](ptr0, len0);
            return [this._resource0_slab.remove(data_view(memory).getInt32(ret + 0, true)), data_view(memory).getInt32(ret + 4, true)];
        }
        rbFuncallvProtect(arg0, arg1, arg2) {
            const memory = this._exports.memory;
            const realloc = this._exports["cabi_realloc"];
            const obj0 = arg0;
            if (!(obj0 instanceof RbAbiValue))
                throw new TypeError('expected instance of RbAbiValue');
            const vec2 = arg2;
            const len2 = vec2.length;
            const result2 = realloc(0, 0, 4, len2 * 4);
            for (let i = 0; i < vec2.length; i++) {
                const e = vec2[i];
                const base = result2 + i * 4;
                const obj1 = e;
                if (!(obj1 instanceof RbAbiValue))
                    throw new TypeError('expected instance of RbAbiValue');
                data_view(memory).setInt32(base + 0, this._resource0_slab.insert(obj1.clone()), true);
            }
            const ret = this._exports['rb-funcallv-protect: func(recv: handle<rb-abi-value>, mid: u32, args: list<handle<rb-abi-value>>) -> tuple<handle<rb-abi-value>, s32>'](this._resource0_slab.insert(obj0.clone()), to_uint32(arg1), result2, len2);
            return [this._resource0_slab.remove(data_view(memory).getInt32(ret + 0, true)), data_view(memory).getInt32(ret + 4, true)];
        }
        rbIntern(arg0) {
            const memory = this._exports.memory;
            const realloc = this._exports["cabi_realloc"];
            const ptr0 = utf8_encode(arg0, realloc, memory);
            const len0 = UTF8_ENCODED_LEN;
            const ret = this._exports['rb-intern: func(name: string) -> u32'](ptr0, len0);
            return ret >>> 0;
        }
        rbErrinfo() {
            const ret = this._exports['rb-errinfo: func() -> handle<rb-abi-value>']();
            return this._resource0_slab.remove(ret);
        }
        rbClearErrinfo() {
            this._exports['rb-clear-errinfo: func() -> ()']();
        }
        rstringPtr(arg0) {
            const memory = this._exports.memory;
            const obj0 = arg0;
            if (!(obj0 instanceof RbAbiValue))
                throw new TypeError('expected instance of RbAbiValue');
            const ret = this._exports['rstring-ptr: func(value: handle<rb-abi-value>) -> string'](this._resource0_slab.insert(obj0.clone()));
            const ptr1 = data_view(memory).getInt32(ret + 0, true);
            const len1 = data_view(memory).getInt32(ret + 4, true);
            const result1 = UTF8_DECODER.decode(new Uint8Array(memory.buffer, ptr1, len1));
            this._exports["cabi_post_rstring-ptr"](ret);
            return result1;
        }
        rbVmBugreport() {
            this._exports['rb-vm-bugreport: func() -> ()']();
        }
        rbGcEnable() {
            const ret = this._exports['rb-gc-enable: func() -> bool']();
            const bool0 = ret;
            return bool0 == 0 ? false : (bool0 == 1 ? true : throw_invalid_bool());
        }
        rbGcDisable() {
            const ret = this._exports['rb-gc-disable: func() -> bool']();
            const bool0 = ret;
            return bool0 == 0 ? false : (bool0 == 1 ? true : throw_invalid_bool());
        }
        rbSetShouldProhibitRewind(arg0) {
            const ret = this._exports['rb-set-should-prohibit-rewind: func(new-value: bool) -> bool'](arg0 ? 1 : 0);
            const bool0 = ret;
            return bool0 == 0 ? false : (bool0 == 1 ? true : throw_invalid_bool());
        }
    }
    class RbAbiValue {
        constructor(wasm_val, obj) {
            this._wasm_val = wasm_val;
            this._obj = obj;
            this._refcnt = 1;
            obj._registry0.register(this, wasm_val, this);
        }
        clone() {
            this._refcnt += 1;
            return this;
        }
        drop() {
            this._refcnt -= 1;
            if (this._refcnt !== 0)
                return;
            this._obj._registry0.unregister(this);
            const dtor = this._obj._exports['canonical_abi_drop_rb-abi-value'];
            const wasm_val = this._wasm_val;
            delete this._obj;
            delete this._refcnt;
            delete this._wasm_val;
            dtor(wasm_val);
        }
    }

    function addRbJsAbiHostToImports(imports, obj, get_export) {
        if (!("rb-js-abi-host" in imports))
            imports["rb-js-abi-host"] = {};
        imports["rb-js-abi-host"]["eval-js: func(code: string) -> variant { success(handle<js-abi-value>), failure(handle<js-abi-value>) }"] = function (arg0, arg1, arg2) {
            const memory = get_export("memory");
            const ptr0 = arg0;
            const len0 = arg1;
            const result0 = UTF8_DECODER.decode(new Uint8Array(memory.buffer, ptr0, len0));
            const ret0 = obj.evalJs(result0);
            const variant1 = ret0;
            switch (variant1.tag) {
                case "success": {
                    const e = variant1.val;
                    data_view(memory).setInt8(arg2 + 0, 0, true);
                    data_view(memory).setInt32(arg2 + 4, resources0.insert(e), true);
                    break;
                }
                case "failure": {
                    const e = variant1.val;
                    data_view(memory).setInt8(arg2 + 0, 1, true);
                    data_view(memory).setInt32(arg2 + 4, resources0.insert(e), true);
                    break;
                }
                default:
                    throw new RangeError("invalid variant specified for JsAbiResult");
            }
        };
        imports["rb-js-abi-host"]["is-js: func(value: handle<js-abi-value>) -> bool"] = function (arg0) {
            const ret0 = obj.isJs(resources0.get(arg0));
            return ret0 ? 1 : 0;
        };
        imports["rb-js-abi-host"]["instance-of: func(value: handle<js-abi-value>, klass: handle<js-abi-value>) -> bool"] = function (arg0, arg1) {
            const ret0 = obj.instanceOf(resources0.get(arg0), resources0.get(arg1));
            return ret0 ? 1 : 0;
        };
        imports["rb-js-abi-host"]["global-this: func() -> handle<js-abi-value>"] = function () {
            const ret0 = obj.globalThis();
            return resources0.insert(ret0);
        };
        imports["rb-js-abi-host"]["int-to-js-number: func(value: s32) -> handle<js-abi-value>"] = function (arg0) {
            const ret0 = obj.intToJsNumber(arg0);
            return resources0.insert(ret0);
        };
        imports["rb-js-abi-host"]["float-to-js-number: func(value: float64) -> handle<js-abi-value>"] = function (arg0) {
            const ret0 = obj.floatToJsNumber(arg0);
            return resources0.insert(ret0);
        };
        imports["rb-js-abi-host"]["string-to-js-string: func(value: string) -> handle<js-abi-value>"] = function (arg0, arg1) {
            const memory = get_export("memory");
            const ptr0 = arg0;
            const len0 = arg1;
            const result0 = UTF8_DECODER.decode(new Uint8Array(memory.buffer, ptr0, len0));
            const ret0 = obj.stringToJsString(result0);
            return resources0.insert(ret0);
        };
        imports["rb-js-abi-host"]["bool-to-js-bool: func(value: bool) -> handle<js-abi-value>"] = function (arg0) {
            const bool0 = arg0;
            const ret0 = obj.boolToJsBool(bool0 == 0 ? false : (bool0 == 1 ? true : throw_invalid_bool()));
            return resources0.insert(ret0);
        };
        imports["rb-js-abi-host"]["proc-to-js-function: func(value: u32) -> handle<js-abi-value>"] = function (arg0) {
            const ret0 = obj.procToJsFunction(arg0 >>> 0);
            return resources0.insert(ret0);
        };
        imports["rb-js-abi-host"]["rb-object-to-js-rb-value: func(raw-rb-abi-value: u32) -> handle<js-abi-value>"] = function (arg0) {
            const ret0 = obj.rbObjectToJsRbValue(arg0 >>> 0);
            return resources0.insert(ret0);
        };
        imports["rb-js-abi-host"]["js-value-to-string: func(value: handle<js-abi-value>) -> string"] = function (arg0, arg1) {
            const memory = get_export("memory");
            const realloc = get_export("cabi_realloc");
            const ret0 = obj.jsValueToString(resources0.get(arg0));
            const ptr0 = utf8_encode(ret0, realloc, memory);
            const len0 = UTF8_ENCODED_LEN;
            data_view(memory).setInt32(arg1 + 4, len0, true);
            data_view(memory).setInt32(arg1 + 0, ptr0, true);
        };
        imports["rb-js-abi-host"]["js-value-to-integer: func(value: handle<js-abi-value>) -> variant { as-float(float64), bignum(string) }"] = function (arg0, arg1) {
            const memory = get_export("memory");
            const realloc = get_export("cabi_realloc");
            const ret0 = obj.jsValueToInteger(resources0.get(arg0));
            const variant1 = ret0;
            switch (variant1.tag) {
                case "as-float": {
                    const e = variant1.val;
                    data_view(memory).setInt8(arg1 + 0, 0, true);
                    data_view(memory).setFloat64(arg1 + 8, +e, true);
                    break;
                }
                case "bignum": {
                    const e = variant1.val;
                    data_view(memory).setInt8(arg1 + 0, 1, true);
                    const ptr0 = utf8_encode(e, realloc, memory);
                    const len0 = UTF8_ENCODED_LEN;
                    data_view(memory).setInt32(arg1 + 12, len0, true);
                    data_view(memory).setInt32(arg1 + 8, ptr0, true);
                    break;
                }
                default:
                    throw new RangeError("invalid variant specified for RawInteger");
            }
        };
        imports["rb-js-abi-host"]["export-js-value-to-host: func(value: handle<js-abi-value>) -> ()"] = function (arg0) {
            obj.exportJsValueToHost(resources0.get(arg0));
        };
        imports["rb-js-abi-host"]["import-js-value-from-host: func() -> handle<js-abi-value>"] = function () {
            const ret0 = obj.importJsValueFromHost();
            return resources0.insert(ret0);
        };
        imports["rb-js-abi-host"]["js-value-typeof: func(value: handle<js-abi-value>) -> string"] = function (arg0, arg1) {
            const memory = get_export("memory");
            const realloc = get_export("cabi_realloc");
            const ret0 = obj.jsValueTypeof(resources0.get(arg0));
            const ptr0 = utf8_encode(ret0, realloc, memory);
            const len0 = UTF8_ENCODED_LEN;
            data_view(memory).setInt32(arg1 + 4, len0, true);
            data_view(memory).setInt32(arg1 + 0, ptr0, true);
        };
        imports["rb-js-abi-host"]["js-value-equal: func(lhs: handle<js-abi-value>, rhs: handle<js-abi-value>) -> bool"] = function (arg0, arg1) {
            const ret0 = obj.jsValueEqual(resources0.get(arg0), resources0.get(arg1));
            return ret0 ? 1 : 0;
        };
        imports["rb-js-abi-host"]["js-value-strictly-equal: func(lhs: handle<js-abi-value>, rhs: handle<js-abi-value>) -> bool"] = function (arg0, arg1) {
            const ret0 = obj.jsValueStrictlyEqual(resources0.get(arg0), resources0.get(arg1));
            return ret0 ? 1 : 0;
        };
        imports["rb-js-abi-host"]["reflect-apply: func(target: handle<js-abi-value>, this-argument: handle<js-abi-value>, arguments: list<handle<js-abi-value>>) -> variant { success(handle<js-abi-value>), failure(handle<js-abi-value>) }"] = function (arg0, arg1, arg2, arg3, arg4) {
            const memory = get_export("memory");
            const len0 = arg3;
            const base0 = arg2;
            const result0 = [];
            for (let i = 0; i < len0; i++) {
                const base = base0 + i * 4;
                result0.push(resources0.get(data_view(memory).getInt32(base + 0, true)));
            }
            const ret0 = obj.reflectApply(resources0.get(arg0), resources0.get(arg1), result0);
            const variant1 = ret0;
            switch (variant1.tag) {
                case "success": {
                    const e = variant1.val;
                    data_view(memory).setInt8(arg4 + 0, 0, true);
                    data_view(memory).setInt32(arg4 + 4, resources0.insert(e), true);
                    break;
                }
                case "failure": {
                    const e = variant1.val;
                    data_view(memory).setInt8(arg4 + 0, 1, true);
                    data_view(memory).setInt32(arg4 + 4, resources0.insert(e), true);
                    break;
                }
                default:
                    throw new RangeError("invalid variant specified for JsAbiResult");
            }
        };
        imports["rb-js-abi-host"]["reflect-construct: func(target: handle<js-abi-value>, arguments: list<handle<js-abi-value>>) -> handle<js-abi-value>"] = function (arg0, arg1, arg2) {
            const memory = get_export("memory");
            const len0 = arg2;
            const base0 = arg1;
            const result0 = [];
            for (let i = 0; i < len0; i++) {
                const base = base0 + i * 4;
                result0.push(resources0.get(data_view(memory).getInt32(base + 0, true)));
            }
            const ret0 = obj.reflectConstruct(resources0.get(arg0), result0);
            return resources0.insert(ret0);
        };
        imports["rb-js-abi-host"]["reflect-delete-property: func(target: handle<js-abi-value>, property-key: string) -> bool"] = function (arg0, arg1, arg2) {
            const memory = get_export("memory");
            const ptr0 = arg1;
            const len0 = arg2;
            const result0 = UTF8_DECODER.decode(new Uint8Array(memory.buffer, ptr0, len0));
            const ret0 = obj.reflectDeleteProperty(resources0.get(arg0), result0);
            return ret0 ? 1 : 0;
        };
        imports["rb-js-abi-host"]["reflect-get: func(target: handle<js-abi-value>, property-key: string) -> variant { success(handle<js-abi-value>), failure(handle<js-abi-value>) }"] = function (arg0, arg1, arg2, arg3) {
            const memory = get_export("memory");
            const ptr0 = arg1;
            const len0 = arg2;
            const result0 = UTF8_DECODER.decode(new Uint8Array(memory.buffer, ptr0, len0));
            const ret0 = obj.reflectGet(resources0.get(arg0), result0);
            const variant1 = ret0;
            switch (variant1.tag) {
                case "success": {
                    const e = variant1.val;
                    data_view(memory).setInt8(arg3 + 0, 0, true);
                    data_view(memory).setInt32(arg3 + 4, resources0.insert(e), true);
                    break;
                }
                case "failure": {
                    const e = variant1.val;
                    data_view(memory).setInt8(arg3 + 0, 1, true);
                    data_view(memory).setInt32(arg3 + 4, resources0.insert(e), true);
                    break;
                }
                default:
                    throw new RangeError("invalid variant specified for JsAbiResult");
            }
        };
        imports["rb-js-abi-host"]["reflect-get-own-property-descriptor: func(target: handle<js-abi-value>, property-key: string) -> handle<js-abi-value>"] = function (arg0, arg1, arg2) {
            const memory = get_export("memory");
            const ptr0 = arg1;
            const len0 = arg2;
            const result0 = UTF8_DECODER.decode(new Uint8Array(memory.buffer, ptr0, len0));
            const ret0 = obj.reflectGetOwnPropertyDescriptor(resources0.get(arg0), result0);
            return resources0.insert(ret0);
        };
        imports["rb-js-abi-host"]["reflect-get-prototype-of: func(target: handle<js-abi-value>) -> handle<js-abi-value>"] = function (arg0) {
            const ret0 = obj.reflectGetPrototypeOf(resources0.get(arg0));
            return resources0.insert(ret0);
        };
        imports["rb-js-abi-host"]["reflect-has: func(target: handle<js-abi-value>, property-key: string) -> bool"] = function (arg0, arg1, arg2) {
            const memory = get_export("memory");
            const ptr0 = arg1;
            const len0 = arg2;
            const result0 = UTF8_DECODER.decode(new Uint8Array(memory.buffer, ptr0, len0));
            const ret0 = obj.reflectHas(resources0.get(arg0), result0);
            return ret0 ? 1 : 0;
        };
        imports["rb-js-abi-host"]["reflect-is-extensible: func(target: handle<js-abi-value>) -> bool"] = function (arg0) {
            const ret0 = obj.reflectIsExtensible(resources0.get(arg0));
            return ret0 ? 1 : 0;
        };
        imports["rb-js-abi-host"]["reflect-own-keys: func(target: handle<js-abi-value>) -> list<handle<js-abi-value>>"] = function (arg0, arg1) {
            const memory = get_export("memory");
            const realloc = get_export("cabi_realloc");
            const ret0 = obj.reflectOwnKeys(resources0.get(arg0));
            const vec0 = ret0;
            const len0 = vec0.length;
            const result0 = realloc(0, 0, 4, len0 * 4);
            for (let i = 0; i < vec0.length; i++) {
                const e = vec0[i];
                const base = result0 + i * 4;
                data_view(memory).setInt32(base + 0, resources0.insert(e), true);
            }
            data_view(memory).setInt32(arg1 + 4, len0, true);
            data_view(memory).setInt32(arg1 + 0, result0, true);
        };
        imports["rb-js-abi-host"]["reflect-prevent-extensions: func(target: handle<js-abi-value>) -> bool"] = function (arg0) {
            const ret0 = obj.reflectPreventExtensions(resources0.get(arg0));
            return ret0 ? 1 : 0;
        };
        imports["rb-js-abi-host"]["reflect-set: func(target: handle<js-abi-value>, property-key: string, value: handle<js-abi-value>) -> variant { success(handle<js-abi-value>), failure(handle<js-abi-value>) }"] = function (arg0, arg1, arg2, arg3, arg4) {
            const memory = get_export("memory");
            const ptr0 = arg1;
            const len0 = arg2;
            const result0 = UTF8_DECODER.decode(new Uint8Array(memory.buffer, ptr0, len0));
            const ret0 = obj.reflectSet(resources0.get(arg0), result0, resources0.get(arg3));
            const variant1 = ret0;
            switch (variant1.tag) {
                case "success": {
                    const e = variant1.val;
                    data_view(memory).setInt8(arg4 + 0, 0, true);
                    data_view(memory).setInt32(arg4 + 4, resources0.insert(e), true);
                    break;
                }
                case "failure": {
                    const e = variant1.val;
                    data_view(memory).setInt8(arg4 + 0, 1, true);
                    data_view(memory).setInt32(arg4 + 4, resources0.insert(e), true);
                    break;
                }
                default:
                    throw new RangeError("invalid variant specified for JsAbiResult");
            }
        };
        imports["rb-js-abi-host"]["reflect-set-prototype-of: func(target: handle<js-abi-value>, prototype: handle<js-abi-value>) -> bool"] = function (arg0, arg1) {
            const ret0 = obj.reflectSetPrototypeOf(resources0.get(arg0), resources0.get(arg1));
            return ret0 ? 1 : 0;
        };
        if (!("canonical_abi" in imports))
            imports["canonical_abi"] = {};
        const resources0 = new Slab();
        imports.canonical_abi["resource_drop_js-abi-value"] = (i) => {
            const val = resources0.remove(i);
            if (obj.dropJsAbiValue)
                obj.dropJsAbiValue(val);
        };
    }

    class LegacyBinding extends RbAbiGuest {
        async setInstance(instance) {
            await this.instantiate(instance);
        }
    }
    class ComponentBinding {
        constructor() { }
        setUnderlying(underlying) {
            this.underlying = underlying;
        }
        rubyShowVersion() {
            this.underlying.rubyShowVersion();
        }
        rubyInit(args) {
            this.underlying.rubyInit(args);
        }
        rubyInitLoadpath() {
            this.underlying.rubyInitLoadpath();
        }
        rbEvalStringProtect(str) {
            return this.underlying.rbEvalStringProtect(str);
        }
        rbFuncallvProtect(recv, mid, args) {
            return this.underlying.rbFuncallvProtect(recv, mid, args);
        }
        rbIntern(name) {
            return this.underlying.rbIntern(name);
        }
        rbErrinfo() {
            return this.underlying.rbErrinfo();
        }
        rbClearErrinfo() {
            return this.underlying.rbClearErrinfo();
        }
        rstringPtr(value) {
            return this.underlying.rstringPtr(value);
        }
        rbVmBugreport() {
            this.underlying.rbVmBugreport();
        }
        rbGcEnable() {
            return this.underlying.rbGcEnable();
        }
        rbGcDisable() {
            return this.underlying.rbGcDisable();
        }
        rbSetShouldProhibitRewind(newValue) {
            return this.underlying.rbSetShouldProhibitRewind(newValue);
        }
        async setInstance(instance) {
            // No-op
        }
        addToImports(imports) {
            // No-op
        }
    }

    /**
     * A Ruby VM instance
     * @see {@link RubyVM.instantiateComponent} and {@link RubyVM.instantiateModule} to create a new instance
     * @category Essentials
     */
    class RubyVM {
        /**
         * Instantiate a Ruby VM with the given WebAssembly Core module with WASI Preview 1 implementation.
         *
         * @param options The options to instantiate the Ruby VM
         * @returns A promise that resolves to the Ruby VM instance and the WebAssembly instance
         * @category Essentials
         *
         * @example
         *
         * import { WASI } from "@bjorn3/browser_wasi_shim";
         * const wasip1 = new WASI([], [], []);
         * const module = await WebAssembly.compile("./path/to/ruby.wasm");
         * const { vm } = await RubyVM.instantiateModule({ module, wasip1 });
         *
         */
        static async instantiateModule(options) {
            var _a, _b;
            const { module, wasip1 } = options;
            const vm = new RubyVM();
            const imports = {
                wasi_snapshot_preview1: wasip1.wasiImport,
            };
            vm.addToImports(imports);
            (_a = options.addToImports) === null || _a === void 0 ? void 0 : _a.call(options, imports);
            const instance = await WebAssembly.instantiate(module, imports);
            await vm.setInstance(instance);
            (_b = options.setMemory) === null || _b === void 0 ? void 0 : _b.call(options, instance.exports.memory);
            wasip1.initialize(instance);
            vm.initialize(options.args);
            return { vm, instance };
        }
        /**
         * Instantiate a Ruby VM with the given WebAssembly component with WASI Preview 2 implementation.
         *
         * @param options The options to instantiate the Ruby VM
         * @returns A promise that resolves to the Ruby VM instance
         * @category Essentials
         *
         * @example
         *
         * // First, you need to transpile the Ruby component to a JavaScript module using jco.
         * // $ jco transpile --no-wasi-shim --instantiation --valid-lifting-optimization ./ruby.component.wasm -o ./component
         * // Then, you can instantiate the Ruby VM with the component:
         *
         * import * as wasip2 from "@bytecodealliance/preview2-shim"
         * import fs from "fs/promises";
         * import path from "path";
         *
         * const { instantiate } = await import("./component/ruby.component.js");
         * const getCoreModule = async (relativePath) => {
         *   const buffer = await fs.readFile(path.join("./component", relativePath));
         *   return WebAssembly.compile(buffer);
         * }
         *
         * const { vm } = await RubyVM.instantiateComponent({
         *   instantiate, getCoreModule, wasip2,
         * });
         *
         */
        static async instantiateComponent(options) {
            let initComponent;
            if ("getCoreModule" in options) {
                // A convenience overload to instantiate with "instantiate" function generated by jco
                initComponent = async (jsRuntime) => {
                    const { instantiate, getCoreModule, wasip2 } = options;
                    const { cli, clocks, filesystem, io, random, sockets, http } = wasip2;
                    const importObject = {
                        "ruby:js/js-runtime": jsRuntime,
                        "wasi:cli/environment": cli.environment,
                        "wasi:cli/exit": cli.exit,
                        "wasi:cli/stderr": cli.stderr,
                        "wasi:cli/stdin": cli.stdin,
                        "wasi:cli/stdout": cli.stdout,
                        "wasi:cli/terminal-input": cli.terminalInput,
                        "wasi:cli/terminal-output": cli.terminalOutput,
                        "wasi:cli/terminal-stderr": cli.terminalStderr,
                        "wasi:cli/terminal-stdin": cli.terminalStdin,
                        "wasi:cli/terminal-stdout": cli.terminalStdout,
                        "wasi:clocks/monotonic-clock": clocks.monotonicClock,
                        "wasi:clocks/wall-clock": clocks.wallClock,
                        "wasi:filesystem/preopens": filesystem.preopens,
                        "wasi:filesystem/types": filesystem.types,
                        "wasi:io/error": io.error,
                        "wasi:io/poll": io.poll,
                        "wasi:io/streams": io.streams,
                        "wasi:random/random": random.random,
                        "wasi:sockets/tcp": sockets.tcp,
                        "wasi:http/types": http.types,
                        "wasi:http/incoming-handler": http.incomingHandler,
                        "wasi:http/outgoing-handler": http.outgoingHandler,
                    };
                    const component = await instantiate(getCoreModule, importObject, options.instantiateCore);
                    return component.rubyRuntime;
                };
            }
            else {
                initComponent = options.instantiate;
            }
            const vm = await this._instantiate({}, initComponent);
            return { vm };
        }
        constructor(binding) {
            this.instance = null;
            this.interfaceState = {
                hasJSFrameAfterRbFrame: false,
            };
            // Wrap exported functions from Ruby VM to prohibit nested VM operation
            // if the call stack has sandwitched JS frames like JS -> Ruby -> JS -> Ruby.
            const proxyExports = (exports) => {
                const excludedMethods = [
                    "setInstance",
                    "addToImports",
                    "instantiate",
                    "rbSetShouldProhibitRewind",
                    "rbGcDisable",
                    "rbGcEnable",
                ];
                const excluded = ["constructor"].concat(excludedMethods);
                // wrap all methods in RbAbi.RbAbiGuest class
                for (const key of Object.getOwnPropertyNames(RbAbiGuest.prototype)) {
                    if (excluded.includes(key)) {
                        continue;
                    }
                    const value = exports[key];
                    if (typeof value === "function") {
                        exports[key] = (...args) => {
                            const isNestedVMCall = this.interfaceState.hasJSFrameAfterRbFrame;
                            if (isNestedVMCall) {
                                const oldShouldProhibitRewind = this.guest.rbSetShouldProhibitRewind(true);
                                const oldIsDisabledGc = this.guest.rbGcDisable();
                                const result = Reflect.apply(value, exports, args);
                                this.guest.rbSetShouldProhibitRewind(oldShouldProhibitRewind);
                                if (!oldIsDisabledGc) {
                                    this.guest.rbGcEnable();
                                }
                                return result;
                            }
                            else {
                                return Reflect.apply(value, exports, args);
                            }
                        };
                    }
                }
                return exports;
            };
            this.guest = proxyExports(binding !== null && binding !== void 0 ? binding : new LegacyBinding());
            this.transport = new JsValueTransport();
            this.exceptionFormatter = new RbExceptionFormatter();
        }
        static async _instantiate(options, initComponent) {
            const binding = new ComponentBinding();
            const vm = new RubyVM(binding);
            class JsAbiValue {
                constructor(underlying) {
                    this.underlying = underlying;
                }
            }
            const imports = vm.getImports((from) => new JsAbiValue(from), (to) => to.underlying);
            const component = await initComponent(Object.assign(Object.assign({}, imports), { throwProhibitRewindException: (message) => {
                    vm.throwProhibitRewindException(message);
                }, procToJsFunction: () => {
                    const rbValue = new RbValue(component.exportRbValueToJs(), vm, vm.privateObject());
                    return new JsAbiValue((...args) => {
                        return rbValue.call("call", ...args.map((arg) => vm.wrap(arg))).toJS();
                    });
                }, rbObjectToJsRbValue: () => {
                    const rbValue = new RbValue(component.exportRbValueToJs(), vm, vm.privateObject());
                    return new JsAbiValue(rbValue);
                }, JsAbiValue: JsAbiValue }));
            binding.setUnderlying(component);
            vm.initialize(options.args);
            return vm;
        }
        /**
         * Initialize the Ruby VM with the given command line arguments
         * @param args The command line arguments to pass to Ruby. Must be
         * an array of strings starting with the Ruby program name.
         * @category Low-level initialization
         */
        initialize(args = ["ruby.wasm", "-EUTF-8", "-e_=0"]) {
            const c_args = args.map((arg) => arg + "\0");
            this.guest.rubyInit(c_args);
            try {
                this.eval(`
        # Require Bundler standalone setup
        if File.exist?("/bundle/bundler/setup.rb")
          require "/bundle/bundler/setup.rb"
        elsif File.exist?("/bundle/setup.rb")
          # For non-CM builds, which doesn't use Bundler's standalone mode
          require "/bundle/setup.rb"
        end
      `);
            }
            catch (e) {
                console.warn("Failed to load /bundle/setup", e);
            }
        }
        /**
         * Set a given instance to interact JavaScript and Ruby's
         * WebAssembly instance. This method must be called before calling
         * Ruby API.
         *
         * @param instance The WebAssembly instance to interact with. Must
         * be instantiated from a Ruby built with JS extension, and built
         * with Reactor ABI instead of command line.
         * @category Low-level initialization
         */
        async setInstance(instance) {
            this.instance = instance;
            await this.guest.setInstance(instance);
        }
        /**
         * Add intrinsic import entries, which is necessary to interact JavaScript
         * and Ruby's WebAssembly instance.
         * @param imports The import object to add to the WebAssembly instance
         * @category Low-level initialization
         */
        addToImports(imports) {
            this.guest.addToImports(imports);
            imports["rb-js-abi-host"] = {
                rb_wasm_throw_prohibit_rewind_exception: (messagePtr, messageLen) => {
                    const memory = this.instance.exports.memory;
                    const str = new TextDecoder().decode(new Uint8Array(memory.buffer, messagePtr, messageLen));
                    this.throwProhibitRewindException(str);
                },
            };
            addRbJsAbiHostToImports(imports, this.getImports((value) => value, (value) => value), (name) => {
                return this.instance.exports[name];
            });
        }
        throwProhibitRewindException(str) {
            let message = "Ruby APIs that may rewind the VM stack are prohibited under nested VM operation " +
                `(${str})\n` +
                "Nested VM operation means that the call stack has sandwitched JS frames like JS -> Ruby -> JS -> Ruby " +
                "caused by something like `window.rubyVM.eval(\"JS.global[:rubyVM].eval('Fiber.yield')\")`\n" +
                "\n" +
                "Please check your call stack and make sure that you are **not** doing any of the following inside the nested Ruby frame:\n" +
                "  1. Switching fibers (e.g. Fiber#resume, Fiber.yield, and Fiber#transfer)\n" +
                "     Note that `evalAsync` JS API switches fibers internally\n" +
                "  2. Raising uncaught exceptions\n" +
                "     Please catch all exceptions inside the nested operation\n" +
                "  3. Calling Continuation APIs\n";
            const error = new RbValue(this.guest.rbErrinfo(), this, this.privateObject());
            if (error.call("nil?").toString() === "false") {
                message += "\n" + this.exceptionFormatter.format(error, this, this.privateObject());
            }
            throw new RbFatalError(message);
        }
        getImports(toJSAbiValue, fromJSAbiValue) {
            // NOTE: The GC may collect objects that are still referenced by Wasm
            // locals because Asyncify cannot scan the Wasm stack above the JS frame.
            // So we need to keep track whether the JS frame is sandwitched by Ruby
            // frames or not, and prohibit nested VM operation if it is.
            const proxyImports = (imports) => {
                for (const [key, value] of Object.entries(imports)) {
                    if (typeof value === "function") {
                        imports[key] = (...args) => {
                            const oldValue = this.interfaceState.hasJSFrameAfterRbFrame;
                            this.interfaceState.hasJSFrameAfterRbFrame = true;
                            const result = Reflect.apply(value, imports, args);
                            this.interfaceState.hasJSFrameAfterRbFrame = oldValue;
                            return result;
                        };
                    }
                }
                return imports;
            };
            function wrapTry(f) {
                return (...args) => {
                    try {
                        return { tag: "success", val: f(...args) };
                    }
                    catch (e) {
                        if (e instanceof RbFatalError) {
                            // RbFatalError should not be caught by Ruby because it Ruby VM
                            // can be already in an inconsistent state.
                            throw e;
                        }
                        return { tag: "failure", val: toJSAbiValue(e) };
                    }
                };
            }
            return proxyImports({
                evalJs: wrapTry((code) => {
                    return toJSAbiValue(Function(code)());
                }),
                isJs: (value) => {
                    // Just for compatibility with the old JS API
                    return true;
                },
                globalThis: () => {
                    if (typeof globalThis !== "undefined") {
                        return toJSAbiValue(globalThis);
                    }
                    else if (typeof global !== "undefined") {
                        return toJSAbiValue(global);
                    }
                    else if (typeof window !== "undefined") {
                        return toJSAbiValue(window);
                    }
                    throw new Error("unable to locate global object");
                },
                intToJsNumber: (value) => {
                    return toJSAbiValue(value);
                },
                floatToJsNumber: (value) => {
                    return toJSAbiValue(value);
                },
                stringToJsString: (value) => {
                    return toJSAbiValue(value);
                },
                boolToJsBool: (value) => {
                    return toJSAbiValue(value);
                },
                procToJsFunction: (rawRbAbiValue) => {
                    const rbValue = this.rbValueOfPointer(rawRbAbiValue);
                    return toJSAbiValue((...args) => {
                        return rbValue.call("call", ...args.map((arg) => this.wrap(arg))).toJS();
                    });
                },
                rbObjectToJsRbValue: (rawRbAbiValue) => {
                    return toJSAbiValue(this.rbValueOfPointer(rawRbAbiValue));
                },
                jsValueToString: (value) => {
                    value = fromJSAbiValue(value);
                    // According to the [spec](https://tc39.es/ecma262/multipage/text-processing.html#sec-string-constructor-string-value)
                    // `String(value)` always returns a string.
                    return String(value);
                },
                jsValueToInteger(value) {
                    value = fromJSAbiValue(value);
                    if (typeof value === "number") {
                        return { tag: "as-float", val: value };
                    }
                    else if (typeof value === "bigint") {
                        return { tag: "bignum", val: BigInt(value).toString(10) + "\0" };
                    }
                    else if (typeof value === "string") {
                        return { tag: "bignum", val: value + "\0" };
                    }
                    else if (typeof value === "undefined") {
                        return { tag: "as-float", val: 0 };
                    }
                    else {
                        return { tag: "as-float", val: Number(value) };
                    }
                },
                exportJsValueToHost: (value) => {
                    // See `JsValueExporter` for the reason why we need to do this
                    this.transport.takeJsValue(fromJSAbiValue(value));
                },
                importJsValueFromHost: () => {
                    return toJSAbiValue(this.transport.consumeJsValue());
                },
                instanceOf: (value, klass) => {
                    klass = fromJSAbiValue(klass);
                    if (typeof klass === "function") {
                        return fromJSAbiValue(value) instanceof klass;
                    }
                    else {
                        return false;
                    }
                },
                jsValueTypeof(value) {
                    return typeof fromJSAbiValue(value);
                },
                jsValueEqual(lhs, rhs) {
                    return fromJSAbiValue(lhs) == fromJSAbiValue(rhs);
                },
                jsValueStrictlyEqual(lhs, rhs) {
                    return fromJSAbiValue(lhs) === fromJSAbiValue(rhs);
                },
                reflectApply: wrapTry((target, thisArgument, args) => {
                    const jsArgs = args.map((arg) => fromJSAbiValue(arg));
                    return toJSAbiValue(Reflect.apply(fromJSAbiValue(target), fromJSAbiValue(thisArgument), jsArgs));
                }),
                reflectConstruct: function (target, args) {
                    throw new Error("Function not implemented.");
                },
                reflectDeleteProperty: function (target, propertyKey) {
                    throw new Error("Function not implemented.");
                },
                reflectGet: wrapTry((target, propertyKey) => {
                    return toJSAbiValue(fromJSAbiValue(target)[propertyKey]);
                }),
                reflectGetOwnPropertyDescriptor: function (target, propertyKey) {
                    throw new Error("Function not implemented.");
                },
                reflectGetPrototypeOf: function (target) {
                    throw new Error("Function not implemented.");
                },
                reflectHas: function (target, propertyKey) {
                    throw new Error("Function not implemented.");
                },
                reflectIsExtensible: function (target) {
                    throw new Error("Function not implemented.");
                },
                reflectOwnKeys: function (target) {
                    throw new Error("Function not implemented.");
                },
                reflectPreventExtensions: function (target) {
                    throw new Error("Function not implemented.");
                },
                reflectSet: wrapTry((target, propertyKey, value) => {
                    return toJSAbiValue(Reflect.set(fromJSAbiValue(target), propertyKey, fromJSAbiValue(value)));
                }),
                reflectSetPrototypeOf: function (target, prototype) {
                    throw new Error("Function not implemented.");
                },
            });
        }
        /**
         * Print the Ruby version to stdout
         */
        printVersion() {
            this.guest.rubyShowVersion();
        }
        /**
         * Runs a string of Ruby code from JavaScript
         * @param code The Ruby code to run
         * @returns the result of the last expression
         * @category Essentials
         *
         * @example
         * vm.eval("puts 'hello world'");
         * const result = vm.eval("1 + 2");
         * console.log(result.toString()); // 3
         *
         */
        eval(code) {
            return evalRbCode(this, this.privateObject(), code);
        }
        /**
         * Runs a string of Ruby code with top-level `JS::Object#await`
         * Returns a promise that resolves when execution completes.
         * @param code The Ruby code to run
         * @returns a promise that resolves to the result of the last expression
         * @category Essentials
         *
         * @example
         * const text = await vm.evalAsync(`
         *   require 'js'
         *   response = JS.global.fetch('https://example.com').await
         *   response.text.await
         * `);
         * console.log(text.toString()); // <html>...</html>
         */
        evalAsync(code) {
            const JS = this.eval("require 'js'; JS");
            return newRbPromise(this, this.privateObject(), (future) => {
                JS.call("__eval_async_rb", this.wrap(code), future);
            });
        }
        /**
         * Wrap a JavaScript value into a Ruby JS::Object
         * @param value The value to convert to RbValue
         * @returns the RbValue object representing the given JS value
         *
         * @example
         * const hash = vm.eval(`Hash.new`)
         * hash.call("store", vm.eval(`"key1"`), vm.wrap(new Object()));
         */
        wrap(value) {
            return this.transport.importJsValue(value, this);
        }
        /** @private */
        privateObject() {
            return {
                transport: this.transport,
                exceptionFormatter: this.exceptionFormatter,
            };
        }
        /** @private */
        rbValueOfPointer(pointer) {
            const abiValue = new RbAbiValue(pointer, this.guest);
            return new RbValue(abiValue, this, this.privateObject());
        }
    }
    /**
     * Export a JS value held by the Ruby VM to the JS environment.
     * This is implemented in a dirty way since wit cannot reference resources
     * defined in other interfaces.
     * In our case, we can't express `function(v: rb-abi-value) -> js-abi-value`
     * because `rb-js-abi-host.wit`, that defines `js-abi-value`, is implemented
     * by embedder side (JS) but `rb-abi-guest.wit`, that defines `rb-abi-value`
     * is implemented by guest side (Wasm).
     *
     * This class is a helper to export by:
     * 1. Call `function __export_to_js(v: rb-abi-value)` defined in guest from embedder side.
     * 2. Call `function takeJsValue(v: js-abi-value)` defined in embedder from guest side with
     *    underlying JS value of given `rb-abi-value`.
     * 3. Then `takeJsValue` implementation escapes the given JS value to the `_takenJsValues`
     *    stored in embedder side.
     * 4. Finally, embedder side can take `_takenJsValues`.
     *
     * Note that `exportJsValue` is not reentrant.
     *
     * @private
     */
    class JsValueTransport {
        constructor() {
            this._takenJsValue = null;
        }
        takeJsValue(value) {
            this._takenJsValue = value;
        }
        consumeJsValue() {
            return this._takenJsValue;
        }
        exportJsValue(value) {
            value.call("__export_to_js");
            return this._takenJsValue;
        }
        importJsValue(value, vm) {
            this._takenJsValue = value;
            return vm.eval('require "js"; JS::Object').call("__import_from_js");
        }
    }
    /**
     * A RbValue is an object that represents a value in Ruby
     * @category Essentials
     */
    class RbValue {
        /**
         * @hideconstructor
         */
        constructor(inner, vm, privateObject) {
            this.inner = inner;
            this.vm = vm;
            this.privateObject = privateObject;
        }
        /**
         * Call a given method with given arguments
         *
         * @param callee name of the Ruby method to call
         * @param args arguments to pass to the method. Must be an array of RbValue
         * @returns The result of the method call as a new RbValue.
         *
         * @example
         * const ary = vm.eval("[1, 2, 3]");
         * ary.call("push", 4);
         * console.log(ary.call("sample").toString());
         */
        call(callee, ...args) {
            const innerArgs = args.map((arg) => arg.inner);
            return new RbValue(callRbMethod(this.vm, this.privateObject, this.inner, callee, innerArgs), this.vm, this.privateObject);
        }
        /**
         * Call a given method that may call `JS::Object#await` with given arguments
         *
         * @param callee name of the Ruby method to call
         * @param args arguments to pass to the method. Must be an array of RbValue
         * @returns A Promise that resolves to the result of the method call as a new RbValue.
         *
         * @example
         * const client = vm.eval(`
         *   require 'js'
         *   class HttpClient
         *     def get(url)
         *       JS.global.fetch(url).await
         *     end
         *   end
         *   HttpClient.new
         * `);
         * const response = await client.callAsync("get", vm.eval(`"https://example.com"`));
         */
        callAsync(callee, ...args) {
            const JS = this.vm.eval("require 'js'; JS");
            return newRbPromise(this.vm, this.privateObject, (future) => {
                JS.call("__call_async_method", this, this.vm.wrap(callee), future, ...args);
            });
        }
        /**
         * @see {@link https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Symbol/toPrimitive}
         * @param hint Preferred type of the result primitive value. `"number"`, `"string"`, or `"default"`.
         */
        [Symbol.toPrimitive](hint) {
            if (hint === "string" || hint === "default") {
                return this.toString();
            }
            else if (hint === "number") {
                return null;
            }
            return null;
        }
        /**
         * Returns a string representation of the value by calling `to_s`
         */
        toString() {
            const rbString = callRbMethod(this.vm, this.privateObject, this.inner, "to_s", []);
            return this.vm.guest.rstringPtr(rbString);
        }
        /**
         * Returns a JavaScript object representation of the value
         * by calling `to_js`.
         *
         * Returns null if the value is not convertible to a JavaScript object.
         */
        toJS() {
            const JS = this.vm.eval("JS");
            const jsValue = JS.call("try_convert", this);
            if (jsValue.call("nil?").toString() === "true") {
                return null;
            }
            return this.privateObject.transport.exportJsValue(jsValue);
        }
    }
    var ruby_tag_type;
    (function (ruby_tag_type) {
        ruby_tag_type[ruby_tag_type["None"] = 0] = "None";
        ruby_tag_type[ruby_tag_type["Return"] = 1] = "Return";
        ruby_tag_type[ruby_tag_type["Break"] = 2] = "Break";
        ruby_tag_type[ruby_tag_type["Next"] = 3] = "Next";
        ruby_tag_type[ruby_tag_type["Retry"] = 4] = "Retry";
        ruby_tag_type[ruby_tag_type["Redo"] = 5] = "Redo";
        ruby_tag_type[ruby_tag_type["Raise"] = 6] = "Raise";
        ruby_tag_type[ruby_tag_type["Throw"] = 7] = "Throw";
        ruby_tag_type[ruby_tag_type["Fatal"] = 8] = "Fatal";
        ruby_tag_type[ruby_tag_type["Mask"] = 15] = "Mask";
    })(ruby_tag_type || (ruby_tag_type = {}));
    class RbExceptionFormatter {
        constructor() {
            this.literalsCache = null;
            this.isFormmatting = false;
        }
        format(error, vm, privateObject) {
            // All Ruby exceptions raised during formatting exception message should
            // be caught and return a fallback message.
            // Therefore, we don't need to worry about infinite recursion here ideally
            // but checking re-entrancy just in case.
            class RbExceptionFormatterError extends Error {
            }
            if (this.isFormmatting) {
                throw new RbExceptionFormatterError("Unexpected exception occurred during formatting exception message");
            }
            this.isFormmatting = true;
            try {
                return this._format(error, vm, privateObject);
            }
            finally {
                this.isFormmatting = false;
            }
        }
        _format(error, vm, privateObject) {
            const [zeroLiteral, oneLiteral, newLineLiteral] = (() => {
                if (this.literalsCache == null) {
                    const zeroOneNewLine = [
                        evalRbCode(vm, privateObject, "0"),
                        evalRbCode(vm, privateObject, "1"),
                        evalRbCode(vm, privateObject, `"\n"`),
                    ];
                    this.literalsCache = zeroOneNewLine;
                    return zeroOneNewLine;
                }
                else {
                    return this.literalsCache;
                }
            })();
            let className;
            let backtrace;
            let message;
            try {
                className = error.call("class").toString();
            }
            catch (e) {
                className = "unknown";
            }
            try {
                message = error.call("message").toString();
            }
            catch (e) {
                message = "unknown";
            }
            try {
                backtrace = error.call("backtrace");
            }
            catch (e) {
                return this.formatString(className, message);
            }
            if (backtrace.call("nil?").toString() === "true") {
                return this.formatString(className, message);
            }
            try {
                const firstLine = backtrace.call("at", zeroLiteral);
                const restLines = backtrace
                    .call("drop", oneLiteral)
                    .call("join", newLineLiteral);
                return this.formatString(className, message, [
                    firstLine.toString(),
                    restLines.toString(),
                ]);
            }
            catch (e) {
                return this.formatString(className, message);
            }
        }
        formatString(klass, message, backtrace) {
            if (backtrace) {
                return `${backtrace[0]}: ${message} (${klass})\n${backtrace[1]}`;
            }
            else {
                return `${klass}: ${message}`;
            }
        }
    }
    const checkStatusTag = (rawTag, vm, privateObject) => {
        switch (rawTag & ruby_tag_type.Mask) {
            case ruby_tag_type.None:
                break;
            case ruby_tag_type.Return:
                throw new RbError("unexpected return");
            case ruby_tag_type.Next:
                throw new RbError("unexpected next");
            case ruby_tag_type.Break:
                throw new RbError("unexpected break");
            case ruby_tag_type.Redo:
                throw new RbError("unexpected redo");
            case ruby_tag_type.Retry:
                throw new RbError("retry outside of rescue clause");
            case ruby_tag_type.Throw:
                throw new RbError("unexpected throw");
            case ruby_tag_type.Raise:
            case ruby_tag_type.Fatal:
                const error = new RbValue(vm.guest.rbErrinfo(), vm, privateObject);
                if (error.call("nil?").toString() === "true") {
                    throw new RbError("no exception object");
                }
                // clear errinfo if got exception due to no rb_jump_tag
                vm.guest.rbClearErrinfo();
                throw new RbError(privateObject.exceptionFormatter.format(error, vm, privateObject));
            default:
                throw new RbError(`unknown error tag: ${rawTag}`);
        }
    };
    function wrapRbOperation(vm, body) {
        try {
            return body();
        }
        catch (e) {
            if (e instanceof RbError) {
                throw e;
            }
            // All JS exceptions triggered by Ruby code are translated to Ruby exceptions,
            // so non-RbError exceptions are unexpected.
            try {
                vm.guest.rbVmBugreport();
            }
            catch (e) {
                console.error("Tried to report internal Ruby VM state but failed: ", e);
            }
            if (e instanceof WebAssembly.RuntimeError && e.message === "unreachable") {
                const error = new RbError(`Something went wrong in Ruby VM: ${e}`);
                error.stack = e.stack;
                throw error;
            }
            else {
                throw e;
            }
        }
    }
    const callRbMethod = (vm, privateObject, recv, callee, args) => {
        const mid = vm.guest.rbIntern(callee + "\0");
        return wrapRbOperation(vm, () => {
            const [value, status] = vm.guest.rbFuncallvProtect(recv, mid, args);
            checkStatusTag(status, vm, privateObject);
            return value;
        });
    };
    const evalRbCode = (vm, privateObject, code) => {
        return wrapRbOperation(vm, () => {
            const [value, status] = vm.guest.rbEvalStringProtect(code + "\0");
            checkStatusTag(status, vm, privateObject);
            return new RbValue(value, vm, privateObject);
        });
    };
    function newRbPromise(vm, privateObject, body) {
        return new Promise((resolve, reject) => {
            const future = vm.wrap({
                resolve,
                reject: (error) => {
                    const rbError = new RbError(privateObject.exceptionFormatter.format(error, vm, privateObject));
                    reject(rbError);
                },
            });
            body(future);
        });
    }
    /**
     * Error class thrown by Ruby execution
     */
    class RbError extends Error {
        /**
         * @hideconstructor
         */
        constructor(message) {
            super(message);
        }
    }
    /**
     * Error class thrown by Ruby execution when it is not possible to recover.
     * This is usually caused when Ruby VM is in an inconsistent state.
     */
    class RbFatalError extends RbError {
        /**
         * @hideconstructor
         */
        constructor(message) {
            super("Ruby Fatal Error: " + message);
        }
    }

    /**
     * Create a console printer that can be used as an overlay of WASI imports.
     * See the example below for how to use it.
     *
     * ```javascript
     * const imports = {
     *  "wasi_snapshot_preview1": wasi.wasiImport,
     * }
     * const printer = consolePrinter();
     * printer.addToImports(imports);
     *
     * const instance = await WebAssembly.instantiate(module, imports);
     * printer.setMemory(instance.exports.memory);
     * ```
     *
     * Note that the `stdout` and `stderr` functions are called with text, not
     * bytes. This means that bytes written to stdout/stderr will be decoded as
     * UTF-8 and then passed to the `stdout`/`stderr` functions every time a write
     * occurs without buffering.
     *
     * @param stdout A function that will be called when stdout is written to.
     *               Defaults to `console.log`.
     * @param stderr A function that will be called when stderr is written to.
     *               Defaults to `console.warn`.
     * @returns An object that can be used as an overlay of WASI imports.
     */
    function consolePrinter({ stdout, stderr, } = {
        stdout: console.log,
        stderr: console.warn,
    }) {
        let memory = undefined;
        let _view = undefined;
        function getMemoryView() {
            if (typeof memory === "undefined") {
                throw new Error("Memory is not set");
            }
            if (_view === undefined || _view.buffer.byteLength === 0) {
                _view = new DataView(memory.buffer);
            }
            return _view;
        }
        const decoder = new TextDecoder();
        return {
            addToImports(imports) {
                const wasiImport = imports.wasi_snapshot_preview1;
                const original_fd_write = wasiImport.fd_write;
                wasiImport.fd_write = (fd, iovs, iovsLen, nwritten) => {
                    if (fd !== 1 && fd !== 2) {
                        return original_fd_write(fd, iovs, iovsLen, nwritten);
                    }
                    const view = getMemoryView();
                    const buffers = Array.from({ length: iovsLen }, (_, i) => {
                        const ptr = iovs + i * 8;
                        const buf = view.getUint32(ptr, true);
                        const bufLen = view.getUint32(ptr + 4, true);
                        return new Uint8Array(memory.buffer, buf, bufLen);
                    });
                    let written = 0;
                    let str = "";
                    for (const buffer of buffers) {
                        str += decoder.decode(buffer);
                        written += buffer.byteLength;
                    }
                    view.setUint32(nwritten, written, true);
                    const log = fd === 1 ? stdout : stderr;
                    log(str);
                    return 0;
                };
                const original_fd_filestat_get = wasiImport.fd_filestat_get;
                wasiImport.fd_filestat_get = (fd, filestat) => {
                    if (fd !== 1 && fd !== 2) {
                        return original_fd_filestat_get(fd, filestat);
                    }
                    const view = getMemoryView();
                    const result = original_fd_filestat_get(fd, filestat);
                    if (result !== 0) {
                        return result;
                    }
                    const filetypePtr = filestat + 0;
                    view.setUint8(filetypePtr, 2); // FILETYPE_CHARACTER_DEVICE
                    return 0;
                };
                const original_fd_fdstat_get = wasiImport.fd_fdstat_get;
                wasiImport.fd_fdstat_get = (fd, fdstat) => {
                    if (fd !== 1 && fd !== 2) {
                        return original_fd_fdstat_get(fd, fdstat);
                    }
                    const view = getMemoryView();
                    const fs_filetypePtr = fdstat + 0;
                    view.setUint8(fs_filetypePtr, 2); // FILETYPE_CHARACTER_DEVICE
                    const fs_rights_basePtr = fdstat + 8;
                    // See https://github.com/WebAssembly/WASI/blob/v0.2.0/legacy/preview1/docs.md#record-members
                    const RIGHTS_FD_WRITE = 1 << 6;
                    view.setBigUint64(fs_rights_basePtr, BigInt(RIGHTS_FD_WRITE), true);
                    return 0;
                };
            },
            setMemory(m) {
                memory = m;
            },
        };
    }

    class RemoteFile extends Inode {
        constructor(
        // data: ArrayBuffer | SharedArrayBuffer | Uint8Array | Array<number>,
        url, options) {
            super();
            this.data = new Uint8Array();
            this.readonly = !!options?.readonly;
            this.url = url;
            this.file_cache = undefined;
        }
        fetch_file() {
            if (this.file_cache === undefined) {
                fetch(this.url).then((response) => response.arrayBuffer()).then((buffer) => {
                    this.file_cache = buffer;
                    return buffer;
                });
            }
            else {
                return this.file_cache;
            }
        }
        // TODO: RESTに対応する仕組みにする
        path_open(oflags, fs_rights_base, fd_flags) {
            this.data = new Uint8Array(this.fetch_file());
            if (this.readonly &&
                (fs_rights_base & BigInt(RIGHTS_FD_WRITE)) ==
                    BigInt(RIGHTS_FD_WRITE)) {
                // no write permission to file
                return { ret: ERRNO_PERM, fd_obj: null };
            }
            if ((oflags & OFLAGS_TRUNC) == OFLAGS_TRUNC) {
                if (this.readonly)
                    return { ret: ERRNO_PERM, fd_obj: null };
                this.data = new Uint8Array([]);
            }
            const file = new OpenFile(this);
            if (fd_flags & FDFLAGS_APPEND)
                file.fd_seek(0n, WHENCE_END);
            return { ret: ERRNO_SUCCESS, fd_obj: file };
        }
        get size() {
            this.data = new Uint8Array(this.fetch_file());
            return BigInt(this.data.byteLength);
        }
        stat() {
            return new Filestat(FILETYPE_REGULAR_FILE, this.size);
        }
    }

    const vfsDirMap = new PreopenDirectory("/", new Map([
        ["app", new Directory(new Map([
                ["lib", new Directory(new Map([
                        ["main.rb", new RemoteFile("assets/vfs/app/lib/main.rb")],
                    ]))],
            ]))],
        ["bundle", new Directory(new Map([
                ["gems", new Directory(new Map([
                        ["js-2.7.1.dev", new Directory(new Map([
                                ["ext", new Directory(new Map([
                                        ["js", new Directory(new Map([
                                                ["bindgen", new Directory(new Map([
                                                        [".clang-format", new RemoteFile("assets/vfs/bundle/gems/js-2.7.1.dev/ext/js/bindgen/.clang-format")],
                                                        ["ext.c", new RemoteFile("assets/vfs/bundle/gems/js-2.7.1.dev/ext/js/bindgen/ext.c")],
                                                        ["ext.h", new RemoteFile("assets/vfs/bundle/gems/js-2.7.1.dev/ext/js/bindgen/ext.h")],
                                                        ["ext_component_type.o", new RemoteFile("assets/vfs/bundle/gems/js-2.7.1.dev/ext/js/bindgen/ext_component_type.o")],
                                                        ["legacy", new Directory(new Map([
                                                                ["rb-abi-guest.c", new RemoteFile("assets/vfs/bundle/gems/js-2.7.1.dev/ext/js/bindgen/legacy/rb-abi-guest.c")],
                                                                ["rb-abi-guest.h", new RemoteFile("assets/vfs/bundle/gems/js-2.7.1.dev/ext/js/bindgen/legacy/rb-abi-guest.h")],
                                                                ["rb-abi-guest.wit", new RemoteFile("assets/vfs/bundle/gems/js-2.7.1.dev/ext/js/bindgen/legacy/rb-abi-guest.wit")],
                                                                ["rb-js-abi-host.c", new RemoteFile("assets/vfs/bundle/gems/js-2.7.1.dev/ext/js/bindgen/legacy/rb-js-abi-host.c")],
                                                                ["rb-js-abi-host.h", new RemoteFile("assets/vfs/bundle/gems/js-2.7.1.dev/ext/js/bindgen/legacy/rb-js-abi-host.h")],
                                                                ["rb-js-abi-host.wit", new RemoteFile("assets/vfs/bundle/gems/js-2.7.1.dev/ext/js/bindgen/legacy/rb-js-abi-host.wit")],
                                                            ]))],
                                                    ]))],
                                                ["depend", new RemoteFile("assets/vfs/bundle/gems/js-2.7.1.dev/ext/js/depend")],
                                                ["extconf.rb", new RemoteFile("assets/vfs/bundle/gems/js-2.7.1.dev/ext/js/extconf.rb")],
                                                ["js-core.c", new RemoteFile("assets/vfs/bundle/gems/js-2.7.1.dev/ext/js/js-core.c")],
                                                ["types.h", new RemoteFile("assets/vfs/bundle/gems/js-2.7.1.dev/ext/js/types.h")],
                                                ["witapi-core.c", new RemoteFile("assets/vfs/bundle/gems/js-2.7.1.dev/ext/js/witapi-core.c")],
                                            ]))],
                                    ]))],
                                ["lib", new Directory(new Map([
                                        ["js", new Directory(new Map([
                                                ["array.rb", new RemoteFile("assets/vfs/bundle/gems/js-2.7.1.dev/lib/js/array.rb")],
                                                ["hash.rb", new RemoteFile("assets/vfs/bundle/gems/js-2.7.1.dev/lib/js/hash.rb")],
                                                ["nil_class.rb", new RemoteFile("assets/vfs/bundle/gems/js-2.7.1.dev/lib/js/nil_class.rb")],
                                                ["require_remote", new Directory(new Map([
                                                        ["evaluator.rb", new RemoteFile("assets/vfs/bundle/gems/js-2.7.1.dev/lib/js/require_remote/evaluator.rb")],
                                                        ["url_resolver.rb", new RemoteFile("assets/vfs/bundle/gems/js-2.7.1.dev/lib/js/require_remote/url_resolver.rb")],
                                                    ]))],
                                                ["require_remote.rb", new RemoteFile("assets/vfs/bundle/gems/js-2.7.1.dev/lib/js/require_remote.rb")],
                                                ["version.rb", new RemoteFile("assets/vfs/bundle/gems/js-2.7.1.dev/lib/js/version.rb")],
                                            ]))],
                                        ["js.rb", new RemoteFile("assets/vfs/bundle/gems/js-2.7.1.dev/lib/js.rb")],
                                    ]))],
                                ["README.md", new RemoteFile("assets/vfs/bundle/gems/js-2.7.1.dev/README.md")],
                                ["wit", new Directory(new Map([
                                        ["js-runtime.wit", new RemoteFile("assets/vfs/bundle/gems/js-2.7.1.dev/wit/js-runtime.wit")],
                                        ["ruby-runtime.wit", new RemoteFile("assets/vfs/bundle/gems/js-2.7.1.dev/wit/ruby-runtime.wit")],
                                        ["world.wit", new RemoteFile("assets/vfs/bundle/gems/js-2.7.1.dev/wit/world.wit")],
                                    ]))],
                            ]))],
                    ]))],
                ["setup.rb", new RemoteFile("assets/vfs/bundle/setup.rb")],
            ]))],
        ["usr", new Directory(new Map([
                ["local", new Directory(new Map([
                        ["bin", new Directory(new Map([
                                ["bundle", new RemoteFile("assets/vfs/usr/local/bin/bundle")],
                                ["bundler", new RemoteFile("assets/vfs/usr/local/bin/bundler")],
                                ["erb", new RemoteFile("assets/vfs/usr/local/bin/erb")],
                                ["gem", new RemoteFile("assets/vfs/usr/local/bin/gem")],
                                ["irb", new RemoteFile("assets/vfs/usr/local/bin/irb")],
                                ["racc", new RemoteFile("assets/vfs/usr/local/bin/racc")],
                                ["rake", new RemoteFile("assets/vfs/usr/local/bin/rake")],
                                ["rbs", new RemoteFile("assets/vfs/usr/local/bin/rbs")],
                                ["rdbg", new RemoteFile("assets/vfs/usr/local/bin/rdbg")],
                                ["rdoc", new RemoteFile("assets/vfs/usr/local/bin/rdoc")],
                                ["ri", new RemoteFile("assets/vfs/usr/local/bin/ri")],
                                ["syntax_suggest", new RemoteFile("assets/vfs/usr/local/bin/syntax_suggest")],
                                ["typeprof", new RemoteFile("assets/vfs/usr/local/bin/typeprof")],
                            ]))],
                        ["lib", new Directory(new Map([
                                ["pkgconfig", new Directory(new Map([
                                        ["ruby-3.3.pc", new RemoteFile("assets/vfs/usr/local/lib/pkgconfig/ruby-3.3.pc")],
                                    ]))],
                                ["ruby", new Directory(new Map([
                                        ["3.3.0", new Directory(new Map([
                                                ["abbrev.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/abbrev.rb")],
                                                ["base64.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/base64.rb")],
                                                ["benchmark.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/benchmark.rb")],
                                                ["bundled_gems.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundled_gems.rb")],
                                                ["bundler", new Directory(new Map([
                                                        ["build_metadata.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/build_metadata.rb")],
                                                        ["capistrano.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/capistrano.rb")],
                                                        ["checksum.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/checksum.rb")],
                                                        ["ci_detector.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/ci_detector.rb")],
                                                        ["cli", new Directory(new Map([
                                                                ["add.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/cli/add.rb")],
                                                                ["binstubs.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/cli/binstubs.rb")],
                                                                ["cache.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/cli/cache.rb")],
                                                                ["check.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/cli/check.rb")],
                                                                ["clean.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/cli/clean.rb")],
                                                                ["common.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/cli/common.rb")],
                                                                ["config.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/cli/config.rb")],
                                                                ["console.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/cli/console.rb")],
                                                                ["doctor.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/cli/doctor.rb")],
                                                                ["exec.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/cli/exec.rb")],
                                                                ["fund.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/cli/fund.rb")],
                                                                ["gem.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/cli/gem.rb")],
                                                                ["info.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/cli/info.rb")],
                                                                ["init.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/cli/init.rb")],
                                                                ["inject.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/cli/inject.rb")],
                                                                ["install.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/cli/install.rb")],
                                                                ["issue.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/cli/issue.rb")],
                                                                ["list.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/cli/list.rb")],
                                                                ["lock.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/cli/lock.rb")],
                                                                ["open.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/cli/open.rb")],
                                                                ["outdated.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/cli/outdated.rb")],
                                                                ["platform.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/cli/platform.rb")],
                                                                ["plugin.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/cli/plugin.rb")],
                                                                ["pristine.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/cli/pristine.rb")],
                                                                ["remove.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/cli/remove.rb")],
                                                                ["show.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/cli/show.rb")],
                                                                ["update.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/cli/update.rb")],
                                                                ["viz.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/cli/viz.rb")],
                                                            ]))],
                                                        ["cli.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/cli.rb")],
                                                        ["compact_index_client", new Directory(new Map([
                                                                ["cache.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/compact_index_client/cache.rb")],
                                                                ["cache_file.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/compact_index_client/cache_file.rb")],
                                                                ["gem_parser.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/compact_index_client/gem_parser.rb")],
                                                                ["updater.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/compact_index_client/updater.rb")],
                                                            ]))],
                                                        ["compact_index_client.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/compact_index_client.rb")],
                                                        ["constants.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/constants.rb")],
                                                        ["current_ruby.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/current_ruby.rb")],
                                                        ["definition.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/definition.rb")],
                                                        ["dependency.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/dependency.rb")],
                                                        ["deployment.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/deployment.rb")],
                                                        ["deprecate.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/deprecate.rb")],
                                                        ["digest.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/digest.rb")],
                                                        ["dsl.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/dsl.rb")],
                                                        ["endpoint_specification.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/endpoint_specification.rb")],
                                                        ["env.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/env.rb")],
                                                        ["environment_preserver.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/environment_preserver.rb")],
                                                        ["errors.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/errors.rb")],
                                                        ["feature_flag.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/feature_flag.rb")],
                                                        ["fetcher", new Directory(new Map([
                                                                ["base.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/fetcher/base.rb")],
                                                                ["compact_index.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/fetcher/compact_index.rb")],
                                                                ["dependency.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/fetcher/dependency.rb")],
                                                                ["downloader.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/fetcher/downloader.rb")],
                                                                ["gem_remote_fetcher.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/fetcher/gem_remote_fetcher.rb")],
                                                                ["index.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/fetcher/index.rb")],
                                                            ]))],
                                                        ["fetcher.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/fetcher.rb")],
                                                        ["force_platform.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/force_platform.rb")],
                                                        ["friendly_errors.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/friendly_errors.rb")],
                                                        ["gem_helper.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/gem_helper.rb")],
                                                        ["gem_helpers.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/gem_helpers.rb")],
                                                        ["gem_tasks.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/gem_tasks.rb")],
                                                        ["gem_version_promoter.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/gem_version_promoter.rb")],
                                                        ["graph.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/graph.rb")],
                                                        ["index.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/index.rb")],
                                                        ["injector.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/injector.rb")],
                                                        ["inline.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/inline.rb")],
                                                        ["installer", new Directory(new Map([
                                                                ["gem_installer.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/installer/gem_installer.rb")],
                                                                ["parallel_installer.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/installer/parallel_installer.rb")],
                                                                ["standalone.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/installer/standalone.rb")],
                                                            ]))],
                                                        ["installer.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/installer.rb")],
                                                        ["lazy_specification.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/lazy_specification.rb")],
                                                        ["lockfile_generator.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/lockfile_generator.rb")],
                                                        ["lockfile_parser.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/lockfile_parser.rb")],
                                                        ["man", new Directory(new Map([
                                                                ["bundle-add.1", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/man/bundle-add.1")],
                                                                ["bundle-add.1.ronn", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/man/bundle-add.1.ronn")],
                                                                ["bundle-binstubs.1", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/man/bundle-binstubs.1")],
                                                                ["bundle-binstubs.1.ronn", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/man/bundle-binstubs.1.ronn")],
                                                                ["bundle-cache.1", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/man/bundle-cache.1")],
                                                                ["bundle-cache.1.ronn", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/man/bundle-cache.1.ronn")],
                                                                ["bundle-check.1", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/man/bundle-check.1")],
                                                                ["bundle-check.1.ronn", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/man/bundle-check.1.ronn")],
                                                                ["bundle-clean.1", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/man/bundle-clean.1")],
                                                                ["bundle-clean.1.ronn", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/man/bundle-clean.1.ronn")],
                                                                ["bundle-config.1", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/man/bundle-config.1")],
                                                                ["bundle-config.1.ronn", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/man/bundle-config.1.ronn")],
                                                                ["bundle-console.1", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/man/bundle-console.1")],
                                                                ["bundle-console.1.ronn", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/man/bundle-console.1.ronn")],
                                                                ["bundle-doctor.1", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/man/bundle-doctor.1")],
                                                                ["bundle-doctor.1.ronn", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/man/bundle-doctor.1.ronn")],
                                                                ["bundle-exec.1", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/man/bundle-exec.1")],
                                                                ["bundle-exec.1.ronn", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/man/bundle-exec.1.ronn")],
                                                                ["bundle-gem.1", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/man/bundle-gem.1")],
                                                                ["bundle-gem.1.ronn", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/man/bundle-gem.1.ronn")],
                                                                ["bundle-help.1", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/man/bundle-help.1")],
                                                                ["bundle-help.1.ronn", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/man/bundle-help.1.ronn")],
                                                                ["bundle-info.1", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/man/bundle-info.1")],
                                                                ["bundle-info.1.ronn", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/man/bundle-info.1.ronn")],
                                                                ["bundle-init.1", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/man/bundle-init.1")],
                                                                ["bundle-init.1.ronn", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/man/bundle-init.1.ronn")],
                                                                ["bundle-inject.1", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/man/bundle-inject.1")],
                                                                ["bundle-inject.1.ronn", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/man/bundle-inject.1.ronn")],
                                                                ["bundle-install.1", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/man/bundle-install.1")],
                                                                ["bundle-install.1.ronn", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/man/bundle-install.1.ronn")],
                                                                ["bundle-list.1", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/man/bundle-list.1")],
                                                                ["bundle-list.1.ronn", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/man/bundle-list.1.ronn")],
                                                                ["bundle-lock.1", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/man/bundle-lock.1")],
                                                                ["bundle-lock.1.ronn", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/man/bundle-lock.1.ronn")],
                                                                ["bundle-open.1", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/man/bundle-open.1")],
                                                                ["bundle-open.1.ronn", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/man/bundle-open.1.ronn")],
                                                                ["bundle-outdated.1", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/man/bundle-outdated.1")],
                                                                ["bundle-outdated.1.ronn", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/man/bundle-outdated.1.ronn")],
                                                                ["bundle-platform.1", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/man/bundle-platform.1")],
                                                                ["bundle-platform.1.ronn", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/man/bundle-platform.1.ronn")],
                                                                ["bundle-plugin.1", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/man/bundle-plugin.1")],
                                                                ["bundle-plugin.1.ronn", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/man/bundle-plugin.1.ronn")],
                                                                ["bundle-pristine.1", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/man/bundle-pristine.1")],
                                                                ["bundle-pristine.1.ronn", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/man/bundle-pristine.1.ronn")],
                                                                ["bundle-remove.1", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/man/bundle-remove.1")],
                                                                ["bundle-remove.1.ronn", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/man/bundle-remove.1.ronn")],
                                                                ["bundle-show.1", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/man/bundle-show.1")],
                                                                ["bundle-show.1.ronn", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/man/bundle-show.1.ronn")],
                                                                ["bundle-update.1", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/man/bundle-update.1")],
                                                                ["bundle-update.1.ronn", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/man/bundle-update.1.ronn")],
                                                                ["bundle-version.1", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/man/bundle-version.1")],
                                                                ["bundle-version.1.ronn", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/man/bundle-version.1.ronn")],
                                                                ["bundle-viz.1", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/man/bundle-viz.1")],
                                                                ["bundle-viz.1.ronn", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/man/bundle-viz.1.ronn")],
                                                                ["bundle.1", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/man/bundle.1")],
                                                                ["bundle.1.ronn", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/man/bundle.1.ronn")],
                                                                ["gemfile.5", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/man/gemfile.5")],
                                                                ["gemfile.5.ronn", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/man/gemfile.5.ronn")],
                                                            ]))],
                                                        ["match_metadata.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/match_metadata.rb")],
                                                        ["match_platform.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/match_platform.rb")],
                                                        ["match_remote_metadata.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/match_remote_metadata.rb")],
                                                        ["mirror.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/mirror.rb")],
                                                        ["plugin", new Directory(new Map([
                                                                ["api", new Directory(new Map([
                                                                        ["source.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/plugin/api/source.rb")],
                                                                    ]))],
                                                                ["api.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/plugin/api.rb")],
                                                                ["dsl.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/plugin/dsl.rb")],
                                                                ["events.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/plugin/events.rb")],
                                                                ["index.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/plugin/index.rb")],
                                                                ["installer", new Directory(new Map([
                                                                        ["git.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/plugin/installer/git.rb")],
                                                                        ["path.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/plugin/installer/path.rb")],
                                                                        ["rubygems.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/plugin/installer/rubygems.rb")],
                                                                    ]))],
                                                                ["installer.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/plugin/installer.rb")],
                                                                ["source_list.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/plugin/source_list.rb")],
                                                            ]))],
                                                        ["plugin.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/plugin.rb")],
                                                        ["process_lock.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/process_lock.rb")],
                                                        ["remote_specification.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/remote_specification.rb")],
                                                        ["resolver", new Directory(new Map([
                                                                ["base.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/resolver/base.rb")],
                                                                ["candidate.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/resolver/candidate.rb")],
                                                                ["incompatibility.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/resolver/incompatibility.rb")],
                                                                ["package.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/resolver/package.rb")],
                                                                ["root.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/resolver/root.rb")],
                                                                ["spec_group.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/resolver/spec_group.rb")],
                                                            ]))],
                                                        ["resolver.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/resolver.rb")],
                                                        ["retry.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/retry.rb")],
                                                        ["rubygems_ext.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/rubygems_ext.rb")],
                                                        ["rubygems_gem_installer.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/rubygems_gem_installer.rb")],
                                                        ["rubygems_integration.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/rubygems_integration.rb")],
                                                        ["ruby_dsl.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/ruby_dsl.rb")],
                                                        ["ruby_version.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/ruby_version.rb")],
                                                        ["runtime.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/runtime.rb")],
                                                        ["safe_marshal.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/safe_marshal.rb")],
                                                        ["self_manager.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/self_manager.rb")],
                                                        ["settings", new Directory(new Map([
                                                                ["validator.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/settings/validator.rb")],
                                                            ]))],
                                                        ["settings.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/settings.rb")],
                                                        ["setup.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/setup.rb")],
                                                        ["shared_helpers.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/shared_helpers.rb")],
                                                        ["similarity_detector.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/similarity_detector.rb")],
                                                        ["source", new Directory(new Map([
                                                                ["gemspec.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/source/gemspec.rb")],
                                                                ["git", new Directory(new Map([
                                                                        ["git_proxy.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/source/git/git_proxy.rb")],
                                                                    ]))],
                                                                ["git.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/source/git.rb")],
                                                                ["metadata.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/source/metadata.rb")],
                                                                ["path", new Directory(new Map([
                                                                        ["installer.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/source/path/installer.rb")],
                                                                    ]))],
                                                                ["path.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/source/path.rb")],
                                                                ["rubygems", new Directory(new Map([
                                                                        ["remote.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/source/rubygems/remote.rb")],
                                                                    ]))],
                                                                ["rubygems.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/source/rubygems.rb")],
                                                                ["rubygems_aggregate.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/source/rubygems_aggregate.rb")],
                                                            ]))],
                                                        ["source.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/source.rb")],
                                                        ["source_list.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/source_list.rb")],
                                                        ["source_map.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/source_map.rb")],
                                                        ["spec_set.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/spec_set.rb")],
                                                        ["stub_specification.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/stub_specification.rb")],
                                                        ["templates", new Directory(new Map([
                                                                ["Executable", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/templates/Executable")],
                                                                ["Executable.bundler", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/templates/Executable.bundler")],
                                                                ["Executable.standalone", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/templates/Executable.standalone")],
                                                                ["Gemfile", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/templates/Gemfile")],
                                                                ["newgem", new Directory(new Map([
                                                                        ["bin", new Directory(new Map([
                                                                                ["console.tt", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/templates/newgem/bin/console.tt")],
                                                                                ["setup.tt", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/templates/newgem/bin/setup.tt")],
                                                                            ]))],
                                                                        ["Cargo.toml.tt", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/templates/newgem/Cargo.toml.tt")],
                                                                        ["CHANGELOG.md.tt", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/templates/newgem/CHANGELOG.md.tt")],
                                                                        ["circleci", new Directory(new Map([
                                                                                ["config.yml.tt", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/templates/newgem/circleci/config.yml.tt")],
                                                                            ]))],
                                                                        ["CODE_OF_CONDUCT.md.tt", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/templates/newgem/CODE_OF_CONDUCT.md.tt")],
                                                                        ["exe", new Directory(new Map([
                                                                                ["newgem.tt", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/templates/newgem/exe/newgem.tt")],
                                                                            ]))],
                                                                        ["ext", new Directory(new Map([
                                                                                ["newgem", new Directory(new Map([
                                                                                        ["Cargo.toml.tt", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/templates/newgem/ext/newgem/Cargo.toml.tt")],
                                                                                        ["extconf-c.rb.tt", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/templates/newgem/ext/newgem/extconf-c.rb.tt")],
                                                                                        ["extconf-rust.rb.tt", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/templates/newgem/ext/newgem/extconf-rust.rb.tt")],
                                                                                        ["newgem.c.tt", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/templates/newgem/ext/newgem/newgem.c.tt")],
                                                                                        ["newgem.h.tt", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/templates/newgem/ext/newgem/newgem.h.tt")],
                                                                                        ["src", new Directory(new Map([
                                                                                                ["lib.rs.tt", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/templates/newgem/ext/newgem/src/lib.rs.tt")],
                                                                                            ]))],
                                                                                    ]))],
                                                                            ]))],
                                                                        ["Gemfile.tt", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/templates/newgem/Gemfile.tt")],
                                                                        ["github", new Directory(new Map([
                                                                                ["workflows", new Directory(new Map([
                                                                                        ["main.yml.tt", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/templates/newgem/github/workflows/main.yml.tt")],
                                                                                    ]))],
                                                                            ]))],
                                                                        ["gitignore.tt", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/templates/newgem/gitignore.tt")],
                                                                        ["gitlab-ci.yml.tt", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/templates/newgem/gitlab-ci.yml.tt")],
                                                                        ["lib", new Directory(new Map([
                                                                                ["newgem", new Directory(new Map([
                                                                                        ["version.rb.tt", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/templates/newgem/lib/newgem/version.rb.tt")],
                                                                                    ]))],
                                                                                ["newgem.rb.tt", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/templates/newgem/lib/newgem.rb.tt")],
                                                                            ]))],
                                                                        ["LICENSE.txt.tt", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/templates/newgem/LICENSE.txt.tt")],
                                                                        ["newgem.gemspec.tt", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/templates/newgem/newgem.gemspec.tt")],
                                                                        ["Rakefile.tt", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/templates/newgem/Rakefile.tt")],
                                                                        ["README.md.tt", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/templates/newgem/README.md.tt")],
                                                                        ["rspec.tt", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/templates/newgem/rspec.tt")],
                                                                        ["rubocop.yml.tt", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/templates/newgem/rubocop.yml.tt")],
                                                                        ["sig", new Directory(new Map([
                                                                                ["newgem.rbs.tt", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/templates/newgem/sig/newgem.rbs.tt")],
                                                                            ]))],
                                                                        ["spec", new Directory(new Map([
                                                                                ["newgem_spec.rb.tt", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/templates/newgem/spec/newgem_spec.rb.tt")],
                                                                                ["spec_helper.rb.tt", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/templates/newgem/spec/spec_helper.rb.tt")],
                                                                            ]))],
                                                                        ["standard.yml.tt", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/templates/newgem/standard.yml.tt")],
                                                                        ["test", new Directory(new Map([
                                                                                ["minitest", new Directory(new Map([
                                                                                        ["test_helper.rb.tt", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/templates/newgem/test/minitest/test_helper.rb.tt")],
                                                                                        ["test_newgem.rb.tt", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/templates/newgem/test/minitest/test_newgem.rb.tt")],
                                                                                    ]))],
                                                                                ["test-unit", new Directory(new Map([
                                                                                        ["newgem_test.rb.tt", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/templates/newgem/test/test-unit/newgem_test.rb.tt")],
                                                                                        ["test_helper.rb.tt", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/templates/newgem/test/test-unit/test_helper.rb.tt")],
                                                                                    ]))],
                                                                            ]))],
                                                                    ]))],
                                                            ]))],
                                                        ["ui", new Directory(new Map([
                                                                ["rg_proxy.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/ui/rg_proxy.rb")],
                                                                ["shell.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/ui/shell.rb")],
                                                                ["silent.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/ui/silent.rb")],
                                                            ]))],
                                                        ["ui.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/ui.rb")],
                                                        ["uri_credentials_filter.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/uri_credentials_filter.rb")],
                                                        ["uri_normalizer.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/uri_normalizer.rb")],
                                                        ["vendor", new Directory(new Map([
                                                                ["connection_pool", new Directory(new Map([
                                                                        ["lib", new Directory(new Map([
                                                                                ["connection_pool", new Directory(new Map([
                                                                                        ["timed_stack.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/connection_pool/lib/connection_pool/timed_stack.rb")],
                                                                                        ["version.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/connection_pool/lib/connection_pool/version.rb")],
                                                                                        ["wrapper.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/connection_pool/lib/connection_pool/wrapper.rb")],
                                                                                    ]))],
                                                                                ["connection_pool.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/connection_pool/lib/connection_pool.rb")],
                                                                            ]))],
                                                                    ]))],
                                                                ["fileutils", new Directory(new Map([
                                                                        ["lib", new Directory(new Map([
                                                                                ["fileutils.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/fileutils/lib/fileutils.rb")],
                                                                            ]))],
                                                                    ]))],
                                                                ["net-http-persistent", new Directory(new Map([
                                                                        ["lib", new Directory(new Map([
                                                                                ["net", new Directory(new Map([
                                                                                        ["http", new Directory(new Map([
                                                                                                ["persistent", new Directory(new Map([
                                                                                                        ["connection.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/net-http-persistent/lib/net/http/persistent/connection.rb")],
                                                                                                        ["pool.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/net-http-persistent/lib/net/http/persistent/pool.rb")],
                                                                                                        ["timed_stack_multi.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/net-http-persistent/lib/net/http/persistent/timed_stack_multi.rb")],
                                                                                                    ]))],
                                                                                                ["persistent.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/net-http-persistent/lib/net/http/persistent.rb")],
                                                                                            ]))],
                                                                                    ]))],
                                                                            ]))],
                                                                    ]))],
                                                                ["pub_grub", new Directory(new Map([
                                                                        ["lib", new Directory(new Map([
                                                                                ["pub_grub", new Directory(new Map([
                                                                                        ["assignment.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/pub_grub/lib/pub_grub/assignment.rb")],
                                                                                        ["basic_package_source.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/pub_grub/lib/pub_grub/basic_package_source.rb")],
                                                                                        ["failure_writer.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/pub_grub/lib/pub_grub/failure_writer.rb")],
                                                                                        ["incompatibility.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/pub_grub/lib/pub_grub/incompatibility.rb")],
                                                                                        ["package.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/pub_grub/lib/pub_grub/package.rb")],
                                                                                        ["partial_solution.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/pub_grub/lib/pub_grub/partial_solution.rb")],
                                                                                        ["rubygems.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/pub_grub/lib/pub_grub/rubygems.rb")],
                                                                                        ["solve_failure.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/pub_grub/lib/pub_grub/solve_failure.rb")],
                                                                                        ["static_package_source.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/pub_grub/lib/pub_grub/static_package_source.rb")],
                                                                                        ["term.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/pub_grub/lib/pub_grub/term.rb")],
                                                                                        ["version.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/pub_grub/lib/pub_grub/version.rb")],
                                                                                        ["version_constraint.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/pub_grub/lib/pub_grub/version_constraint.rb")],
                                                                                        ["version_range.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/pub_grub/lib/pub_grub/version_range.rb")],
                                                                                        ["version_solver.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/pub_grub/lib/pub_grub/version_solver.rb")],
                                                                                        ["version_union.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/pub_grub/lib/pub_grub/version_union.rb")],
                                                                                    ]))],
                                                                                ["pub_grub.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/pub_grub/lib/pub_grub.rb")],
                                                                            ]))],
                                                                    ]))],
                                                                ["thor", new Directory(new Map([
                                                                        ["lib", new Directory(new Map([
                                                                                ["thor", new Directory(new Map([
                                                                                        ["actions", new Directory(new Map([
                                                                                                ["create_file.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/thor/lib/thor/actions/create_file.rb")],
                                                                                                ["create_link.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/thor/lib/thor/actions/create_link.rb")],
                                                                                                ["directory.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/thor/lib/thor/actions/directory.rb")],
                                                                                                ["empty_directory.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/thor/lib/thor/actions/empty_directory.rb")],
                                                                                                ["file_manipulation.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/thor/lib/thor/actions/file_manipulation.rb")],
                                                                                                ["inject_into_file.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/thor/lib/thor/actions/inject_into_file.rb")],
                                                                                            ]))],
                                                                                        ["actions.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/thor/lib/thor/actions.rb")],
                                                                                        ["base.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/thor/lib/thor/base.rb")],
                                                                                        ["command.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/thor/lib/thor/command.rb")],
                                                                                        ["core_ext", new Directory(new Map([
                                                                                                ["hash_with_indifferent_access.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/thor/lib/thor/core_ext/hash_with_indifferent_access.rb")],
                                                                                            ]))],
                                                                                        ["error.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/thor/lib/thor/error.rb")],
                                                                                        ["group.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/thor/lib/thor/group.rb")],
                                                                                        ["invocation.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/thor/lib/thor/invocation.rb")],
                                                                                        ["line_editor", new Directory(new Map([
                                                                                                ["basic.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/thor/lib/thor/line_editor/basic.rb")],
                                                                                                ["readline.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/thor/lib/thor/line_editor/readline.rb")],
                                                                                            ]))],
                                                                                        ["line_editor.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/thor/lib/thor/line_editor.rb")],
                                                                                        ["nested_context.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/thor/lib/thor/nested_context.rb")],
                                                                                        ["parser", new Directory(new Map([
                                                                                                ["argument.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/thor/lib/thor/parser/argument.rb")],
                                                                                                ["arguments.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/thor/lib/thor/parser/arguments.rb")],
                                                                                                ["option.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/thor/lib/thor/parser/option.rb")],
                                                                                                ["options.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/thor/lib/thor/parser/options.rb")],
                                                                                            ]))],
                                                                                        ["parser.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/thor/lib/thor/parser.rb")],
                                                                                        ["rake_compat.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/thor/lib/thor/rake_compat.rb")],
                                                                                        ["runner.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/thor/lib/thor/runner.rb")],
                                                                                        ["shell", new Directory(new Map([
                                                                                                ["basic.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/thor/lib/thor/shell/basic.rb")],
                                                                                                ["color.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/thor/lib/thor/shell/color.rb")],
                                                                                                ["column_printer.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/thor/lib/thor/shell/column_printer.rb")],
                                                                                                ["html.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/thor/lib/thor/shell/html.rb")],
                                                                                                ["table_printer.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/thor/lib/thor/shell/table_printer.rb")],
                                                                                                ["terminal.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/thor/lib/thor/shell/terminal.rb")],
                                                                                                ["wrapped_printer.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/thor/lib/thor/shell/wrapped_printer.rb")],
                                                                                            ]))],
                                                                                        ["shell.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/thor/lib/thor/shell.rb")],
                                                                                        ["util.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/thor/lib/thor/util.rb")],
                                                                                        ["version.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/thor/lib/thor/version.rb")],
                                                                                    ]))],
                                                                                ["thor.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/thor/lib/thor.rb")],
                                                                            ]))],
                                                                    ]))],
                                                                ["tsort", new Directory(new Map([
                                                                        ["lib", new Directory(new Map([
                                                                                ["tsort.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/tsort/lib/tsort.rb")],
                                                                            ]))],
                                                                    ]))],
                                                                ["uri", new Directory(new Map([
                                                                        ["lib", new Directory(new Map([
                                                                                ["uri", new Directory(new Map([
                                                                                        ["common.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/uri/lib/uri/common.rb")],
                                                                                        ["file.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/uri/lib/uri/file.rb")],
                                                                                        ["ftp.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/uri/lib/uri/ftp.rb")],
                                                                                        ["generic.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/uri/lib/uri/generic.rb")],
                                                                                        ["http.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/uri/lib/uri/http.rb")],
                                                                                        ["https.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/uri/lib/uri/https.rb")],
                                                                                        ["ldap.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/uri/lib/uri/ldap.rb")],
                                                                                        ["ldaps.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/uri/lib/uri/ldaps.rb")],
                                                                                        ["mailto.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/uri/lib/uri/mailto.rb")],
                                                                                        ["rfc2396_parser.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/uri/lib/uri/rfc2396_parser.rb")],
                                                                                        ["rfc3986_parser.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/uri/lib/uri/rfc3986_parser.rb")],
                                                                                        ["version.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/uri/lib/uri/version.rb")],
                                                                                        ["ws.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/uri/lib/uri/ws.rb")],
                                                                                        ["wss.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/uri/lib/uri/wss.rb")],
                                                                                    ]))],
                                                                                ["uri.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendor/uri/lib/uri.rb")],
                                                                            ]))],
                                                                    ]))],
                                                            ]))],
                                                        ["vendored_fileutils.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendored_fileutils.rb")],
                                                        ["vendored_net_http.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendored_net_http.rb")],
                                                        ["vendored_persistent.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendored_persistent.rb")],
                                                        ["vendored_pub_grub.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendored_pub_grub.rb")],
                                                        ["vendored_thor.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendored_thor.rb")],
                                                        ["vendored_timeout.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendored_timeout.rb")],
                                                        ["vendored_tsort.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendored_tsort.rb")],
                                                        ["vendored_uri.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vendored_uri.rb")],
                                                        ["version.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/version.rb")],
                                                        ["vlad.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/vlad.rb")],
                                                        ["worker.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/worker.rb")],
                                                        ["yaml_serializer.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler/yaml_serializer.rb")],
                                                    ]))],
                                                ["bundler.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/bundler.rb")],
                                                ["cgi", new Directory(new Map([
                                                        ["cookie.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/cgi/cookie.rb")],
                                                        ["core.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/cgi/core.rb")],
                                                        ["html.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/cgi/html.rb")],
                                                        ["session", new Directory(new Map([
                                                                ["pstore.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/cgi/session/pstore.rb")],
                                                            ]))],
                                                        ["session.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/cgi/session.rb")],
                                                        ["util.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/cgi/util.rb")],
                                                    ]))],
                                                ["cgi.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/cgi.rb")],
                                                ["csv", new Directory(new Map([
                                                        ["core_ext", new Directory(new Map([
                                                                ["array.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/csv/core_ext/array.rb")],
                                                                ["string.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/csv/core_ext/string.rb")],
                                                            ]))],
                                                        ["fields_converter.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/csv/fields_converter.rb")],
                                                        ["input_record_separator.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/csv/input_record_separator.rb")],
                                                        ["parser.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/csv/parser.rb")],
                                                        ["row.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/csv/row.rb")],
                                                        ["table.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/csv/table.rb")],
                                                        ["version.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/csv/version.rb")],
                                                        ["writer.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/csv/writer.rb")],
                                                    ]))],
                                                ["csv.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/csv.rb")],
                                                ["delegate.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/delegate.rb")],
                                                ["did_you_mean", new Directory(new Map([
                                                        ["core_ext", new Directory(new Map([
                                                                ["name_error.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/did_you_mean/core_ext/name_error.rb")],
                                                            ]))],
                                                        ["experimental.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/did_you_mean/experimental.rb")],
                                                        ["formatter.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/did_you_mean/formatter.rb")],
                                                        ["formatters", new Directory(new Map([
                                                                ["plain_formatter.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/did_you_mean/formatters/plain_formatter.rb")],
                                                                ["verbose_formatter.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/did_you_mean/formatters/verbose_formatter.rb")],
                                                            ]))],
                                                        ["jaro_winkler.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/did_you_mean/jaro_winkler.rb")],
                                                        ["levenshtein.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/did_you_mean/levenshtein.rb")],
                                                        ["spell_checker.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/did_you_mean/spell_checker.rb")],
                                                        ["spell_checkers", new Directory(new Map([
                                                                ["key_error_checker.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/did_you_mean/spell_checkers/key_error_checker.rb")],
                                                                ["method_name_checker.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/did_you_mean/spell_checkers/method_name_checker.rb")],
                                                                ["name_error_checkers", new Directory(new Map([
                                                                        ["class_name_checker.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/did_you_mean/spell_checkers/name_error_checkers/class_name_checker.rb")],
                                                                        ["variable_name_checker.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/did_you_mean/spell_checkers/name_error_checkers/variable_name_checker.rb")],
                                                                    ]))],
                                                                ["name_error_checkers.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/did_you_mean/spell_checkers/name_error_checkers.rb")],
                                                                ["null_checker.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/did_you_mean/spell_checkers/null_checker.rb")],
                                                                ["pattern_key_name_checker.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/did_you_mean/spell_checkers/pattern_key_name_checker.rb")],
                                                                ["require_path_checker.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/did_you_mean/spell_checkers/require_path_checker.rb")],
                                                            ]))],
                                                        ["tree_spell_checker.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/did_you_mean/tree_spell_checker.rb")],
                                                        ["verbose.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/did_you_mean/verbose.rb")],
                                                        ["version.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/did_you_mean/version.rb")],
                                                    ]))],
                                                ["did_you_mean.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/did_you_mean.rb")],
                                                ["drb", new Directory(new Map([
                                                        ["acl.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/drb/acl.rb")],
                                                        ["drb.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/drb/drb.rb")],
                                                        ["eq.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/drb/eq.rb")],
                                                        ["extserv.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/drb/extserv.rb")],
                                                        ["extservm.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/drb/extservm.rb")],
                                                        ["gw.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/drb/gw.rb")],
                                                        ["invokemethod.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/drb/invokemethod.rb")],
                                                        ["observer.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/drb/observer.rb")],
                                                        ["ssl.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/drb/ssl.rb")],
                                                        ["timeridconv.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/drb/timeridconv.rb")],
                                                        ["unix.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/drb/unix.rb")],
                                                        ["version.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/drb/version.rb")],
                                                        ["weakidconv.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/drb/weakidconv.rb")],
                                                    ]))],
                                                ["drb.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/drb.rb")],
                                                ["English.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/English.rb")],
                                                ["erb", new Directory(new Map([
                                                        ["compiler.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/erb/compiler.rb")],
                                                        ["def_method.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/erb/def_method.rb")],
                                                        ["util.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/erb/util.rb")],
                                                        ["version.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/erb/version.rb")],
                                                    ]))],
                                                ["erb.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/erb.rb")],
                                                ["error_highlight", new Directory(new Map([
                                                        ["base.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/error_highlight/base.rb")],
                                                        ["core_ext.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/error_highlight/core_ext.rb")],
                                                        ["formatter.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/error_highlight/formatter.rb")],
                                                        ["version.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/error_highlight/version.rb")],
                                                    ]))],
                                                ["error_highlight.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/error_highlight.rb")],
                                                ["fileutils.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/fileutils.rb")],
                                                ["find.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/find.rb")],
                                                ["forwardable", new Directory(new Map([
                                                        ["impl.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/forwardable/impl.rb")],
                                                    ]))],
                                                ["forwardable.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/forwardable.rb")],
                                                ["getoptlong.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/getoptlong.rb")],
                                                ["ipaddr.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/ipaddr.rb")],
                                                ["irb", new Directory(new Map([
                                                        ["cmd", new Directory(new Map([
                                                                ["nop.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/cmd/nop.rb")],
                                                            ]))],
                                                        ["color.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/color.rb")],
                                                        ["color_printer.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/color_printer.rb")],
                                                        ["command", new Directory(new Map([
                                                                ["backtrace.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/command/backtrace.rb")],
                                                                ["base.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/command/base.rb")],
                                                                ["break.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/command/break.rb")],
                                                                ["catch.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/command/catch.rb")],
                                                                ["chws.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/command/chws.rb")],
                                                                ["context.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/command/context.rb")],
                                                                ["continue.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/command/continue.rb")],
                                                                ["debug.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/command/debug.rb")],
                                                                ["delete.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/command/delete.rb")],
                                                                ["disable_irb.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/command/disable_irb.rb")],
                                                                ["edit.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/command/edit.rb")],
                                                                ["exit.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/command/exit.rb")],
                                                                ["finish.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/command/finish.rb")],
                                                                ["force_exit.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/command/force_exit.rb")],
                                                                ["help.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/command/help.rb")],
                                                                ["history.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/command/history.rb")],
                                                                ["info.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/command/info.rb")],
                                                                ["internal_helpers.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/command/internal_helpers.rb")],
                                                                ["irb_info.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/command/irb_info.rb")],
                                                                ["load.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/command/load.rb")],
                                                                ["ls.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/command/ls.rb")],
                                                                ["measure.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/command/measure.rb")],
                                                                ["next.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/command/next.rb")],
                                                                ["pushws.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/command/pushws.rb")],
                                                                ["show_doc.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/command/show_doc.rb")],
                                                                ["show_source.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/command/show_source.rb")],
                                                                ["step.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/command/step.rb")],
                                                                ["subirb.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/command/subirb.rb")],
                                                                ["whereami.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/command/whereami.rb")],
                                                            ]))],
                                                        ["command.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/command.rb")],
                                                        ["completion.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/completion.rb")],
                                                        ["context.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/context.rb")],
                                                        ["debug", new Directory(new Map([
                                                                ["ui.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/debug/ui.rb")],
                                                            ]))],
                                                        ["debug.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/debug.rb")],
                                                        ["default_commands.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/default_commands.rb")],
                                                        ["easter-egg.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/easter-egg.rb")],
                                                        ["ext", new Directory(new Map([
                                                                ["change-ws.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/ext/change-ws.rb")],
                                                                ["eval_history.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/ext/eval_history.rb")],
                                                                ["loader.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/ext/loader.rb")],
                                                                ["multi-irb.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/ext/multi-irb.rb")],
                                                                ["tracer.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/ext/tracer.rb")],
                                                                ["use-loader.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/ext/use-loader.rb")],
                                                                ["workspaces.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/ext/workspaces.rb")],
                                                            ]))],
                                                        ["frame.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/frame.rb")],
                                                        ["help.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/help.rb")],
                                                        ["helper_method", new Directory(new Map([
                                                                ["base.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/helper_method/base.rb")],
                                                                ["conf.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/helper_method/conf.rb")],
                                                            ]))],
                                                        ["helper_method.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/helper_method.rb")],
                                                        ["history.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/history.rb")],
                                                        ["init.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/init.rb")],
                                                        ["input-method.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/input-method.rb")],
                                                        ["inspector.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/inspector.rb")],
                                                        ["lc", new Directory(new Map([
                                                                ["error.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/lc/error.rb")],
                                                                ["help-message", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/lc/help-message")],
                                                                ["ja", new Directory(new Map([
                                                                        ["error.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/lc/ja/error.rb")],
                                                                        ["help-message", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/lc/ja/help-message")],
                                                                    ]))],
                                                            ]))],
                                                        ["locale.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/locale.rb")],
                                                        ["nesting_parser.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/nesting_parser.rb")],
                                                        ["notifier.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/notifier.rb")],
                                                        ["output-method.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/output-method.rb")],
                                                        ["pager.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/pager.rb")],
                                                        ["ruby-lex.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/ruby-lex.rb")],
                                                        ["ruby_logo.aa", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/ruby_logo.aa")],
                                                        ["source_finder.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/source_finder.rb")],
                                                        ["statement.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/statement.rb")],
                                                        ["version.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/version.rb")],
                                                        ["workspace.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/workspace.rb")],
                                                        ["ws-for-case-2.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/ws-for-case-2.rb")],
                                                        ["xmp.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb/xmp.rb")],
                                                    ]))],
                                                ["irb.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/irb.rb")],
                                                ["logger", new Directory(new Map([
                                                        ["errors.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/logger/errors.rb")],
                                                        ["formatter.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/logger/formatter.rb")],
                                                        ["log_device.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/logger/log_device.rb")],
                                                        ["period.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/logger/period.rb")],
                                                        ["severity.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/logger/severity.rb")],
                                                        ["version.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/logger/version.rb")],
                                                    ]))],
                                                ["logger.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/logger.rb")],
                                                ["mkmf.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/mkmf.rb")],
                                                ["mutex_m.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/mutex_m.rb")],
                                                ["net", new Directory(new Map([
                                                        ["http", new Directory(new Map([
                                                                ["backward.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/net/http/backward.rb")],
                                                                ["exceptions.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/net/http/exceptions.rb")],
                                                                ["generic_request.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/net/http/generic_request.rb")],
                                                                ["header.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/net/http/header.rb")],
                                                                ["proxy_delta.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/net/http/proxy_delta.rb")],
                                                                ["request.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/net/http/request.rb")],
                                                                ["requests.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/net/http/requests.rb")],
                                                                ["response.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/net/http/response.rb")],
                                                                ["responses.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/net/http/responses.rb")],
                                                                ["status.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/net/http/status.rb")],
                                                            ]))],
                                                        ["http.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/net/http.rb")],
                                                        ["https.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/net/https.rb")],
                                                        ["protocol.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/net/protocol.rb")],
                                                    ]))],
                                                ["observer.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/observer.rb")],
                                                ["open-uri.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/open-uri.rb")],
                                                ["open3", new Directory(new Map([
                                                        ["version.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/open3/version.rb")],
                                                    ]))],
                                                ["open3.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/open3.rb")],
                                                ["optionparser.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/optionparser.rb")],
                                                ["optparse", new Directory(new Map([
                                                        ["ac.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/optparse/ac.rb")],
                                                        ["date.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/optparse/date.rb")],
                                                        ["kwargs.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/optparse/kwargs.rb")],
                                                        ["shellwords.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/optparse/shellwords.rb")],
                                                        ["time.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/optparse/time.rb")],
                                                        ["uri.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/optparse/uri.rb")],
                                                        ["version.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/optparse/version.rb")],
                                                    ]))],
                                                ["optparse.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/optparse.rb")],
                                                ["ostruct.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/ostruct.rb")],
                                                ["pp.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/pp.rb")],
                                                ["prettyprint.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/prettyprint.rb")],
                                                ["prism", new Directory(new Map([
                                                        ["compiler.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/prism/compiler.rb")],
                                                        ["debug.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/prism/debug.rb")],
                                                        ["desugar_compiler.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/prism/desugar_compiler.rb")],
                                                        ["dispatcher.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/prism/dispatcher.rb")],
                                                        ["dsl.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/prism/dsl.rb")],
                                                        ["ffi.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/prism/ffi.rb")],
                                                        ["lex_compat.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/prism/lex_compat.rb")],
                                                        ["mutation_compiler.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/prism/mutation_compiler.rb")],
                                                        ["node.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/prism/node.rb")],
                                                        ["node_ext.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/prism/node_ext.rb")],
                                                        ["node_inspector.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/prism/node_inspector.rb")],
                                                        ["pack.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/prism/pack.rb")],
                                                        ["parse_result", new Directory(new Map([
                                                                ["comments.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/prism/parse_result/comments.rb")],
                                                                ["newlines.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/prism/parse_result/newlines.rb")],
                                                            ]))],
                                                        ["parse_result.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/prism/parse_result.rb")],
                                                        ["pattern.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/prism/pattern.rb")],
                                                        ["ripper_compat.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/prism/ripper_compat.rb")],
                                                        ["serialize.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/prism/serialize.rb")],
                                                        ["visitor.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/prism/visitor.rb")],
                                                    ]))],
                                                ["prism.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/prism.rb")],
                                                ["pstore.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/pstore.rb")],
                                                ["random", new Directory(new Map([
                                                        ["formatter.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/random/formatter.rb")],
                                                    ]))],
                                                ["rdoc", new Directory(new Map([
                                                        ["alias.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/alias.rb")],
                                                        ["anon_class.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/anon_class.rb")],
                                                        ["any_method.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/any_method.rb")],
                                                        ["attr.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/attr.rb")],
                                                        ["class_module.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/class_module.rb")],
                                                        ["code_object.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/code_object.rb")],
                                                        ["code_objects.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/code_objects.rb")],
                                                        ["comment.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/comment.rb")],
                                                        ["constant.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/constant.rb")],
                                                        ["context", new Directory(new Map([
                                                                ["section.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/context/section.rb")],
                                                            ]))],
                                                        ["context.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/context.rb")],
                                                        ["cross_reference.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/cross_reference.rb")],
                                                        ["encoding.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/encoding.rb")],
                                                        ["erbio.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/erbio.rb")],
                                                        ["erb_partial.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/erb_partial.rb")],
                                                        ["extend.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/extend.rb")],
                                                        ["generator", new Directory(new Map([
                                                                ["darkfish.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/generator/darkfish.rb")],
                                                                ["json_index.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/generator/json_index.rb")],
                                                                ["markup.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/generator/markup.rb")],
                                                                ["pot", new Directory(new Map([
                                                                        ["message_extractor.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/generator/pot/message_extractor.rb")],
                                                                        ["po.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/generator/pot/po.rb")],
                                                                        ["po_entry.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/generator/pot/po_entry.rb")],
                                                                    ]))],
                                                                ["pot.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/generator/pot.rb")],
                                                                ["ri.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/generator/ri.rb")],
                                                                ["template", new Directory(new Map([
                                                                        ["darkfish", new Directory(new Map([
                                                                                ["class.rhtml", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/generator/template/darkfish/class.rhtml")],
                                                                                ["css", new Directory(new Map([
                                                                                        ["fonts.css", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/generator/template/darkfish/css/fonts.css")],
                                                                                        ["rdoc.css", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/generator/template/darkfish/css/rdoc.css")],
                                                                                    ]))],
                                                                                ["fonts", new Directory(new Map([
                                                                                        ["Lato-Light.ttf", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/generator/template/darkfish/fonts/Lato-Light.ttf")],
                                                                                        ["Lato-LightItalic.ttf", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/generator/template/darkfish/fonts/Lato-LightItalic.ttf")],
                                                                                        ["Lato-Regular.ttf", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/generator/template/darkfish/fonts/Lato-Regular.ttf")],
                                                                                        ["Lato-RegularItalic.ttf", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/generator/template/darkfish/fonts/Lato-RegularItalic.ttf")],
                                                                                        ["SourceCodePro-Bold.ttf", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/generator/template/darkfish/fonts/SourceCodePro-Bold.ttf")],
                                                                                        ["SourceCodePro-Regular.ttf", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/generator/template/darkfish/fonts/SourceCodePro-Regular.ttf")],
                                                                                    ]))],
                                                                                ["images", new Directory(new Map([
                                                                                        ["add.png", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/generator/template/darkfish/images/add.png")],
                                                                                        ["arrow_up.png", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/generator/template/darkfish/images/arrow_up.png")],
                                                                                        ["brick.png", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/generator/template/darkfish/images/brick.png")],
                                                                                        ["brick_link.png", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/generator/template/darkfish/images/brick_link.png")],
                                                                                        ["bug.png", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/generator/template/darkfish/images/bug.png")],
                                                                                        ["bullet_black.png", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/generator/template/darkfish/images/bullet_black.png")],
                                                                                        ["bullet_toggle_minus.png", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/generator/template/darkfish/images/bullet_toggle_minus.png")],
                                                                                        ["bullet_toggle_plus.png", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/generator/template/darkfish/images/bullet_toggle_plus.png")],
                                                                                        ["date.png", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/generator/template/darkfish/images/date.png")],
                                                                                        ["delete.png", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/generator/template/darkfish/images/delete.png")],
                                                                                        ["find.png", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/generator/template/darkfish/images/find.png")],
                                                                                        ["loadingAnimation.gif", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/generator/template/darkfish/images/loadingAnimation.gif")],
                                                                                        ["macFFBgHack.png", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/generator/template/darkfish/images/macFFBgHack.png")],
                                                                                        ["package.png", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/generator/template/darkfish/images/package.png")],
                                                                                        ["page_green.png", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/generator/template/darkfish/images/page_green.png")],
                                                                                        ["page_white_text.png", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/generator/template/darkfish/images/page_white_text.png")],
                                                                                        ["page_white_width.png", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/generator/template/darkfish/images/page_white_width.png")],
                                                                                        ["plugin.png", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/generator/template/darkfish/images/plugin.png")],
                                                                                        ["ruby.png", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/generator/template/darkfish/images/ruby.png")],
                                                                                        ["tag_blue.png", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/generator/template/darkfish/images/tag_blue.png")],
                                                                                        ["tag_green.png", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/generator/template/darkfish/images/tag_green.png")],
                                                                                        ["transparent.png", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/generator/template/darkfish/images/transparent.png")],
                                                                                        ["wrench.png", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/generator/template/darkfish/images/wrench.png")],
                                                                                        ["wrench_orange.png", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/generator/template/darkfish/images/wrench_orange.png")],
                                                                                        ["zoom.png", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/generator/template/darkfish/images/zoom.png")],
                                                                                    ]))],
                                                                                ["index.rhtml", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/generator/template/darkfish/index.rhtml")],
                                                                                ["js", new Directory(new Map([
                                                                                        ["darkfish.js", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/generator/template/darkfish/js/darkfish.js")],
                                                                                        ["search.js", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/generator/template/darkfish/js/search.js")],
                                                                                    ]))],
                                                                                ["page.rhtml", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/generator/template/darkfish/page.rhtml")],
                                                                                ["servlet_not_found.rhtml", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/generator/template/darkfish/servlet_not_found.rhtml")],
                                                                                ["servlet_root.rhtml", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/generator/template/darkfish/servlet_root.rhtml")],
                                                                                ["table_of_contents.rhtml", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/generator/template/darkfish/table_of_contents.rhtml")],
                                                                                ["_footer.rhtml", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/generator/template/darkfish/_footer.rhtml")],
                                                                                ["_head.rhtml", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/generator/template/darkfish/_head.rhtml")],
                                                                                ["_sidebar_classes.rhtml", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/generator/template/darkfish/_sidebar_classes.rhtml")],
                                                                                ["_sidebar_extends.rhtml", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/generator/template/darkfish/_sidebar_extends.rhtml")],
                                                                                ["_sidebar_includes.rhtml", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/generator/template/darkfish/_sidebar_includes.rhtml")],
                                                                                ["_sidebar_installed.rhtml", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/generator/template/darkfish/_sidebar_installed.rhtml")],
                                                                                ["_sidebar_in_files.rhtml", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/generator/template/darkfish/_sidebar_in_files.rhtml")],
                                                                                ["_sidebar_methods.rhtml", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/generator/template/darkfish/_sidebar_methods.rhtml")],
                                                                                ["_sidebar_navigation.rhtml", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/generator/template/darkfish/_sidebar_navigation.rhtml")],
                                                                                ["_sidebar_pages.rhtml", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/generator/template/darkfish/_sidebar_pages.rhtml")],
                                                                                ["_sidebar_parent.rhtml", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/generator/template/darkfish/_sidebar_parent.rhtml")],
                                                                                ["_sidebar_search.rhtml", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/generator/template/darkfish/_sidebar_search.rhtml")],
                                                                                ["_sidebar_sections.rhtml", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/generator/template/darkfish/_sidebar_sections.rhtml")],
                                                                                ["_sidebar_table_of_contents.rhtml", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/generator/template/darkfish/_sidebar_table_of_contents.rhtml")],
                                                                                ["_sidebar_VCS_info.rhtml", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/generator/template/darkfish/_sidebar_VCS_info.rhtml")],
                                                                            ]))],
                                                                        ["json_index", new Directory(new Map([
                                                                                ["js", new Directory(new Map([
                                                                                        ["navigation.js", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/generator/template/json_index/js/navigation.js")],
                                                                                        ["searcher.js", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/generator/template/json_index/js/searcher.js")],
                                                                                    ]))],
                                                                            ]))],
                                                                    ]))],
                                                            ]))],
                                                        ["generator.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/generator.rb")],
                                                        ["ghost_method.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/ghost_method.rb")],
                                                        ["i18n", new Directory(new Map([
                                                                ["locale.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/i18n/locale.rb")],
                                                                ["text.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/i18n/text.rb")],
                                                            ]))],
                                                        ["i18n.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/i18n.rb")],
                                                        ["include.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/include.rb")],
                                                        ["known_classes.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/known_classes.rb")],
                                                        ["markdown", new Directory(new Map([
                                                                ["entities.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/markdown/entities.rb")],
                                                                ["literals.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/markdown/literals.rb")],
                                                            ]))],
                                                        ["markdown.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/markdown.rb")],
                                                        ["markup", new Directory(new Map([
                                                                ["attributes.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/markup/attributes.rb")],
                                                                ["attribute_manager.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/markup/attribute_manager.rb")],
                                                                ["attr_changer.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/markup/attr_changer.rb")],
                                                                ["attr_span.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/markup/attr_span.rb")],
                                                                ["blank_line.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/markup/blank_line.rb")],
                                                                ["block_quote.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/markup/block_quote.rb")],
                                                                ["document.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/markup/document.rb")],
                                                                ["formatter.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/markup/formatter.rb")],
                                                                ["hard_break.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/markup/hard_break.rb")],
                                                                ["heading.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/markup/heading.rb")],
                                                                ["include.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/markup/include.rb")],
                                                                ["indented_paragraph.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/markup/indented_paragraph.rb")],
                                                                ["list.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/markup/list.rb")],
                                                                ["list_item.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/markup/list_item.rb")],
                                                                ["paragraph.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/markup/paragraph.rb")],
                                                                ["parser.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/markup/parser.rb")],
                                                                ["pre_process.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/markup/pre_process.rb")],
                                                                ["raw.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/markup/raw.rb")],
                                                                ["regexp_handling.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/markup/regexp_handling.rb")],
                                                                ["rule.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/markup/rule.rb")],
                                                                ["table.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/markup/table.rb")],
                                                                ["to_ansi.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/markup/to_ansi.rb")],
                                                                ["to_bs.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/markup/to_bs.rb")],
                                                                ["to_html.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/markup/to_html.rb")],
                                                                ["to_html_crossref.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/markup/to_html_crossref.rb")],
                                                                ["to_html_snippet.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/markup/to_html_snippet.rb")],
                                                                ["to_joined_paragraph.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/markup/to_joined_paragraph.rb")],
                                                                ["to_label.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/markup/to_label.rb")],
                                                                ["to_markdown.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/markup/to_markdown.rb")],
                                                                ["to_rdoc.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/markup/to_rdoc.rb")],
                                                                ["to_table_of_contents.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/markup/to_table_of_contents.rb")],
                                                                ["to_test.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/markup/to_test.rb")],
                                                                ["to_tt_only.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/markup/to_tt_only.rb")],
                                                                ["verbatim.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/markup/verbatim.rb")],
                                                            ]))],
                                                        ["markup.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/markup.rb")],
                                                        ["meta_method.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/meta_method.rb")],
                                                        ["method_attr.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/method_attr.rb")],
                                                        ["mixin.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/mixin.rb")],
                                                        ["normal_class.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/normal_class.rb")],
                                                        ["normal_module.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/normal_module.rb")],
                                                        ["options.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/options.rb")],
                                                        ["parser", new Directory(new Map([
                                                                ["c.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/parser/c.rb")],
                                                                ["changelog.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/parser/changelog.rb")],
                                                                ["markdown.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/parser/markdown.rb")],
                                                                ["rd.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/parser/rd.rb")],
                                                                ["ripper_state_lex.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/parser/ripper_state_lex.rb")],
                                                                ["ruby.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/parser/ruby.rb")],
                                                                ["ruby_tools.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/parser/ruby_tools.rb")],
                                                                ["simple.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/parser/simple.rb")],
                                                                ["text.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/parser/text.rb")],
                                                            ]))],
                                                        ["parser.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/parser.rb")],
                                                        ["rd", new Directory(new Map([
                                                                ["block_parser.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/rd/block_parser.rb")],
                                                                ["inline.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/rd/inline.rb")],
                                                                ["inline_parser.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/rd/inline_parser.rb")],
                                                            ]))],
                                                        ["rd.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/rd.rb")],
                                                        ["rdoc.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/rdoc.rb")],
                                                        ["require.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/require.rb")],
                                                        ["ri", new Directory(new Map([
                                                                ["driver.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/ri/driver.rb")],
                                                                ["formatter.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/ri/formatter.rb")],
                                                                ["paths.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/ri/paths.rb")],
                                                                ["store.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/ri/store.rb")],
                                                                ["task.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/ri/task.rb")],
                                                            ]))],
                                                        ["ri.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/ri.rb")],
                                                        ["rubygems_hook.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/rubygems_hook.rb")],
                                                        ["servlet.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/servlet.rb")],
                                                        ["single_class.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/single_class.rb")],
                                                        ["stats", new Directory(new Map([
                                                                ["normal.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/stats/normal.rb")],
                                                                ["quiet.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/stats/quiet.rb")],
                                                                ["verbose.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/stats/verbose.rb")],
                                                            ]))],
                                                        ["stats.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/stats.rb")],
                                                        ["store.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/store.rb")],
                                                        ["task.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/task.rb")],
                                                        ["text.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/text.rb")],
                                                        ["token_stream.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/token_stream.rb")],
                                                        ["tom_doc.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/tom_doc.rb")],
                                                        ["top_level.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/top_level.rb")],
                                                        ["version.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc/version.rb")],
                                                    ]))],
                                                ["rdoc.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rdoc.rb")],
                                                ["readline.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/readline.rb")],
                                                ["reline", new Directory(new Map([
                                                        ["ansi.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/reline/ansi.rb")],
                                                        ["config.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/reline/config.rb")],
                                                        ["face.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/reline/face.rb")],
                                                        ["general_io.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/reline/general_io.rb")],
                                                        ["history.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/reline/history.rb")],
                                                        ["key_actor", new Directory(new Map([
                                                                ["base.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/reline/key_actor/base.rb")],
                                                                ["emacs.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/reline/key_actor/emacs.rb")],
                                                                ["vi_command.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/reline/key_actor/vi_command.rb")],
                                                                ["vi_insert.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/reline/key_actor/vi_insert.rb")],
                                                            ]))],
                                                        ["key_actor.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/reline/key_actor.rb")],
                                                        ["key_stroke.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/reline/key_stroke.rb")],
                                                        ["kill_ring.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/reline/kill_ring.rb")],
                                                        ["line_editor.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/reline/line_editor.rb")],
                                                        ["terminfo.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/reline/terminfo.rb")],
                                                        ["unicode", new Directory(new Map([
                                                                ["east_asian_width.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/reline/unicode/east_asian_width.rb")],
                                                            ]))],
                                                        ["unicode.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/reline/unicode.rb")],
                                                        ["version.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/reline/version.rb")],
                                                        ["windows.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/reline/windows.rb")],
                                                    ]))],
                                                ["reline.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/reline.rb")],
                                                ["resolv-replace.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/resolv-replace.rb")],
                                                ["resolv.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/resolv.rb")],
                                                ["rinda", new Directory(new Map([
                                                        ["rinda.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rinda/rinda.rb")],
                                                        ["ring.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rinda/ring.rb")],
                                                        ["tuplespace.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rinda/tuplespace.rb")],
                                                    ]))],
                                                ["rubygems", new Directory(new Map([
                                                        ["available_set.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/available_set.rb")],
                                                        ["basic_specification.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/basic_specification.rb")],
                                                        ["bundler_version_finder.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/bundler_version_finder.rb")],
                                                        ["ci_detector.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/ci_detector.rb")],
                                                        ["command.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/command.rb")],
                                                        ["commands", new Directory(new Map([
                                                                ["build_command.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/commands/build_command.rb")],
                                                                ["cert_command.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/commands/cert_command.rb")],
                                                                ["check_command.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/commands/check_command.rb")],
                                                                ["cleanup_command.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/commands/cleanup_command.rb")],
                                                                ["contents_command.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/commands/contents_command.rb")],
                                                                ["dependency_command.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/commands/dependency_command.rb")],
                                                                ["environment_command.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/commands/environment_command.rb")],
                                                                ["exec_command.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/commands/exec_command.rb")],
                                                                ["fetch_command.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/commands/fetch_command.rb")],
                                                                ["generate_index_command.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/commands/generate_index_command.rb")],
                                                                ["help_command.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/commands/help_command.rb")],
                                                                ["info_command.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/commands/info_command.rb")],
                                                                ["install_command.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/commands/install_command.rb")],
                                                                ["list_command.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/commands/list_command.rb")],
                                                                ["lock_command.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/commands/lock_command.rb")],
                                                                ["mirror_command.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/commands/mirror_command.rb")],
                                                                ["open_command.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/commands/open_command.rb")],
                                                                ["outdated_command.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/commands/outdated_command.rb")],
                                                                ["owner_command.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/commands/owner_command.rb")],
                                                                ["pristine_command.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/commands/pristine_command.rb")],
                                                                ["push_command.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/commands/push_command.rb")],
                                                                ["query_command.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/commands/query_command.rb")],
                                                                ["rdoc_command.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/commands/rdoc_command.rb")],
                                                                ["rebuild_command.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/commands/rebuild_command.rb")],
                                                                ["search_command.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/commands/search_command.rb")],
                                                                ["server_command.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/commands/server_command.rb")],
                                                                ["setup_command.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/commands/setup_command.rb")],
                                                                ["signin_command.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/commands/signin_command.rb")],
                                                                ["signout_command.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/commands/signout_command.rb")],
                                                                ["sources_command.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/commands/sources_command.rb")],
                                                                ["specification_command.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/commands/specification_command.rb")],
                                                                ["stale_command.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/commands/stale_command.rb")],
                                                                ["uninstall_command.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/commands/uninstall_command.rb")],
                                                                ["unpack_command.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/commands/unpack_command.rb")],
                                                                ["update_command.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/commands/update_command.rb")],
                                                                ["which_command.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/commands/which_command.rb")],
                                                                ["yank_command.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/commands/yank_command.rb")],
                                                            ]))],
                                                        ["command_manager.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/command_manager.rb")],
                                                        ["compatibility.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/compatibility.rb")],
                                                        ["config_file.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/config_file.rb")],
                                                        ["core_ext", new Directory(new Map([
                                                                ["kernel_gem.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/core_ext/kernel_gem.rb")],
                                                                ["kernel_require.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/core_ext/kernel_require.rb")],
                                                                ["kernel_warn.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/core_ext/kernel_warn.rb")],
                                                                ["tcpsocket_init.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/core_ext/tcpsocket_init.rb")],
                                                            ]))],
                                                        ["defaults.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/defaults.rb")],
                                                        ["dependency.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/dependency.rb")],
                                                        ["dependency_installer.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/dependency_installer.rb")],
                                                        ["dependency_list.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/dependency_list.rb")],
                                                        ["deprecate.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/deprecate.rb")],
                                                        ["doctor.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/doctor.rb")],
                                                        ["errors.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/errors.rb")],
                                                        ["exceptions.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/exceptions.rb")],
                                                        ["ext", new Directory(new Map([
                                                                ["builder.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/ext/builder.rb")],
                                                                ["build_error.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/ext/build_error.rb")],
                                                                ["cargo_builder", new Directory(new Map([
                                                                        ["link_flag_converter.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/ext/cargo_builder/link_flag_converter.rb")],
                                                                    ]))],
                                                                ["cargo_builder.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/ext/cargo_builder.rb")],
                                                                ["cmake_builder.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/ext/cmake_builder.rb")],
                                                                ["configure_builder.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/ext/configure_builder.rb")],
                                                                ["ext_conf_builder.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/ext/ext_conf_builder.rb")],
                                                                ["rake_builder.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/ext/rake_builder.rb")],
                                                            ]))],
                                                        ["ext.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/ext.rb")],
                                                        ["gemcutter_utilities", new Directory(new Map([
                                                                ["webauthn_listener", new Directory(new Map([
                                                                        ["response.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/gemcutter_utilities/webauthn_listener/response.rb")],
                                                                    ]))],
                                                                ["webauthn_listener.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/gemcutter_utilities/webauthn_listener.rb")],
                                                                ["webauthn_poller.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/gemcutter_utilities/webauthn_poller.rb")],
                                                            ]))],
                                                        ["gemcutter_utilities.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/gemcutter_utilities.rb")],
                                                        ["gemspec_helpers.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/gemspec_helpers.rb")],
                                                        ["gem_runner.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/gem_runner.rb")],
                                                        ["installer.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/installer.rb")],
                                                        ["installer_uninstaller_utils.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/installer_uninstaller_utils.rb")],
                                                        ["install_default_message.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/install_default_message.rb")],
                                                        ["install_message.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/install_message.rb")],
                                                        ["install_update_options.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/install_update_options.rb")],
                                                        ["local_remote_options.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/local_remote_options.rb")],
                                                        ["name_tuple.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/name_tuple.rb")],
                                                        ["openssl.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/openssl.rb")],
                                                        ["package", new Directory(new Map([
                                                                ["digest_io.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/package/digest_io.rb")],
                                                                ["file_source.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/package/file_source.rb")],
                                                                ["io_source.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/package/io_source.rb")],
                                                                ["old.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/package/old.rb")],
                                                                ["source.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/package/source.rb")],
                                                                ["tar_header.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/package/tar_header.rb")],
                                                                ["tar_reader", new Directory(new Map([
                                                                        ["entry.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/package/tar_reader/entry.rb")],
                                                                    ]))],
                                                                ["tar_reader.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/package/tar_reader.rb")],
                                                                ["tar_writer.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/package/tar_writer.rb")],
                                                            ]))],
                                                        ["package.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/package.rb")],
                                                        ["package_task.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/package_task.rb")],
                                                        ["path_support.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/path_support.rb")],
                                                        ["platform.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/platform.rb")],
                                                        ["psych_tree.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/psych_tree.rb")],
                                                        ["query_utils.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/query_utils.rb")],
                                                        ["rdoc.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/rdoc.rb")],
                                                        ["remote_fetcher.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/remote_fetcher.rb")],
                                                        ["request", new Directory(new Map([
                                                                ["connection_pools.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/request/connection_pools.rb")],
                                                                ["https_pool.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/request/https_pool.rb")],
                                                                ["http_pool.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/request/http_pool.rb")],
                                                            ]))],
                                                        ["request.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/request.rb")],
                                                        ["request_set", new Directory(new Map([
                                                                ["gem_dependency_api.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/request_set/gem_dependency_api.rb")],
                                                                ["lockfile", new Directory(new Map([
                                                                        ["parser.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/request_set/lockfile/parser.rb")],
                                                                        ["tokenizer.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/request_set/lockfile/tokenizer.rb")],
                                                                    ]))],
                                                                ["lockfile.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/request_set/lockfile.rb")],
                                                            ]))],
                                                        ["request_set.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/request_set.rb")],
                                                        ["requirement.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/requirement.rb")],
                                                        ["resolver", new Directory(new Map([
                                                                ["activation_request.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/resolver/activation_request.rb")],
                                                                ["api_set", new Directory(new Map([
                                                                        ["gem_parser.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/resolver/api_set/gem_parser.rb")],
                                                                    ]))],
                                                                ["api_set.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/resolver/api_set.rb")],
                                                                ["api_specification.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/resolver/api_specification.rb")],
                                                                ["best_set.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/resolver/best_set.rb")],
                                                                ["composed_set.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/resolver/composed_set.rb")],
                                                                ["conflict.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/resolver/conflict.rb")],
                                                                ["current_set.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/resolver/current_set.rb")],
                                                                ["dependency_request.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/resolver/dependency_request.rb")],
                                                                ["git_set.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/resolver/git_set.rb")],
                                                                ["git_specification.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/resolver/git_specification.rb")],
                                                                ["index_set.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/resolver/index_set.rb")],
                                                                ["index_specification.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/resolver/index_specification.rb")],
                                                                ["installed_specification.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/resolver/installed_specification.rb")],
                                                                ["installer_set.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/resolver/installer_set.rb")],
                                                                ["local_specification.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/resolver/local_specification.rb")],
                                                                ["lock_set.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/resolver/lock_set.rb")],
                                                                ["lock_specification.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/resolver/lock_specification.rb")],
                                                                ["requirement_list.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/resolver/requirement_list.rb")],
                                                                ["set.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/resolver/set.rb")],
                                                                ["source_set.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/resolver/source_set.rb")],
                                                                ["specification.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/resolver/specification.rb")],
                                                                ["spec_specification.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/resolver/spec_specification.rb")],
                                                                ["stats.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/resolver/stats.rb")],
                                                                ["vendor_set.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/resolver/vendor_set.rb")],
                                                                ["vendor_specification.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/resolver/vendor_specification.rb")],
                                                            ]))],
                                                        ["resolver.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/resolver.rb")],
                                                        ["s3_uri_signer.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/s3_uri_signer.rb")],
                                                        ["safe_marshal", new Directory(new Map([
                                                                ["elements.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/safe_marshal/elements.rb")],
                                                                ["reader.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/safe_marshal/reader.rb")],
                                                                ["visitors", new Directory(new Map([
                                                                        ["stream_printer.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/safe_marshal/visitors/stream_printer.rb")],
                                                                        ["to_ruby.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/safe_marshal/visitors/to_ruby.rb")],
                                                                        ["visitor.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/safe_marshal/visitors/visitor.rb")],
                                                                    ]))],
                                                            ]))],
                                                        ["safe_marshal.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/safe_marshal.rb")],
                                                        ["safe_yaml.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/safe_yaml.rb")],
                                                        ["security", new Directory(new Map([
                                                                ["policies.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/security/policies.rb")],
                                                                ["policy.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/security/policy.rb")],
                                                                ["signer.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/security/signer.rb")],
                                                                ["trust_dir.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/security/trust_dir.rb")],
                                                            ]))],
                                                        ["security.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/security.rb")],
                                                        ["security_option.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/security_option.rb")],
                                                        ["shellwords.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/shellwords.rb")],
                                                        ["source", new Directory(new Map([
                                                                ["git.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/source/git.rb")],
                                                                ["installed.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/source/installed.rb")],
                                                                ["local.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/source/local.rb")],
                                                                ["lock.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/source/lock.rb")],
                                                                ["specific_file.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/source/specific_file.rb")],
                                                                ["vendor.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/source/vendor.rb")],
                                                            ]))],
                                                        ["source.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/source.rb")],
                                                        ["source_list.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/source_list.rb")],
                                                        ["specification.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/specification.rb")],
                                                        ["specification_policy.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/specification_policy.rb")],
                                                        ["specification_record.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/specification_record.rb")],
                                                        ["spec_fetcher.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/spec_fetcher.rb")],
                                                        ["ssl_certs", new Directory(new Map([
                                                                ["rubygems.org", new Directory(new Map([
                                                                        ["GlobalSignRootCA.pem", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/ssl_certs/rubygems.org/GlobalSignRootCA.pem")],
                                                                        ["GlobalSignRootCA_R3.pem", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/ssl_certs/rubygems.org/GlobalSignRootCA_R3.pem")],
                                                                    ]))],
                                                            ]))],
                                                        ["stub_specification.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/stub_specification.rb")],
                                                        ["text.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/text.rb")],
                                                        ["uninstaller.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/uninstaller.rb")],
                                                        ["unknown_command_spell_checker.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/unknown_command_spell_checker.rb")],
                                                        ["update_suggestion.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/update_suggestion.rb")],
                                                        ["uri.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/uri.rb")],
                                                        ["uri_formatter.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/uri_formatter.rb")],
                                                        ["user_interaction.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/user_interaction.rb")],
                                                        ["util", new Directory(new Map([
                                                                ["licenses.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/util/licenses.rb")],
                                                                ["list.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/util/list.rb")],
                                                            ]))],
                                                        ["util.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/util.rb")],
                                                        ["validator.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/validator.rb")],
                                                        ["vendor", new Directory(new Map([
                                                                ["molinillo", new Directory(new Map([
                                                                        ["lib", new Directory(new Map([
                                                                                ["molinillo", new Directory(new Map([
                                                                                        ["delegates", new Directory(new Map([
                                                                                                ["resolution_state.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/vendor/molinillo/lib/molinillo/delegates/resolution_state.rb")],
                                                                                                ["specification_provider.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/vendor/molinillo/lib/molinillo/delegates/specification_provider.rb")],
                                                                                            ]))],
                                                                                        ["dependency_graph", new Directory(new Map([
                                                                                                ["action.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/vendor/molinillo/lib/molinillo/dependency_graph/action.rb")],
                                                                                                ["add_edge_no_circular.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/vendor/molinillo/lib/molinillo/dependency_graph/add_edge_no_circular.rb")],
                                                                                                ["add_vertex.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/vendor/molinillo/lib/molinillo/dependency_graph/add_vertex.rb")],
                                                                                                ["delete_edge.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/vendor/molinillo/lib/molinillo/dependency_graph/delete_edge.rb")],
                                                                                                ["detach_vertex_named.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/vendor/molinillo/lib/molinillo/dependency_graph/detach_vertex_named.rb")],
                                                                                                ["log.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/vendor/molinillo/lib/molinillo/dependency_graph/log.rb")],
                                                                                                ["set_payload.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/vendor/molinillo/lib/molinillo/dependency_graph/set_payload.rb")],
                                                                                                ["tag.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/vendor/molinillo/lib/molinillo/dependency_graph/tag.rb")],
                                                                                                ["vertex.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/vendor/molinillo/lib/molinillo/dependency_graph/vertex.rb")],
                                                                                            ]))],
                                                                                        ["dependency_graph.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/vendor/molinillo/lib/molinillo/dependency_graph.rb")],
                                                                                        ["errors.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/vendor/molinillo/lib/molinillo/errors.rb")],
                                                                                        ["gem_metadata.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/vendor/molinillo/lib/molinillo/gem_metadata.rb")],
                                                                                        ["modules", new Directory(new Map([
                                                                                                ["specification_provider.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/vendor/molinillo/lib/molinillo/modules/specification_provider.rb")],
                                                                                                ["ui.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/vendor/molinillo/lib/molinillo/modules/ui.rb")],
                                                                                            ]))],
                                                                                        ["resolution.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/vendor/molinillo/lib/molinillo/resolution.rb")],
                                                                                        ["resolver.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/vendor/molinillo/lib/molinillo/resolver.rb")],
                                                                                        ["state.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/vendor/molinillo/lib/molinillo/state.rb")],
                                                                                    ]))],
                                                                                ["molinillo.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/vendor/molinillo/lib/molinillo.rb")],
                                                                            ]))],
                                                                    ]))],
                                                                ["net-http", new Directory(new Map([
                                                                        ["lib", new Directory(new Map([
                                                                                ["net", new Directory(new Map([
                                                                                        ["http", new Directory(new Map([
                                                                                                ["backward.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/vendor/net-http/lib/net/http/backward.rb")],
                                                                                                ["exceptions.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/vendor/net-http/lib/net/http/exceptions.rb")],
                                                                                                ["generic_request.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/vendor/net-http/lib/net/http/generic_request.rb")],
                                                                                                ["header.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/vendor/net-http/lib/net/http/header.rb")],
                                                                                                ["proxy_delta.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/vendor/net-http/lib/net/http/proxy_delta.rb")],
                                                                                                ["request.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/vendor/net-http/lib/net/http/request.rb")],
                                                                                                ["requests.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/vendor/net-http/lib/net/http/requests.rb")],
                                                                                                ["response.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/vendor/net-http/lib/net/http/response.rb")],
                                                                                                ["responses.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/vendor/net-http/lib/net/http/responses.rb")],
                                                                                                ["status.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/vendor/net-http/lib/net/http/status.rb")],
                                                                                            ]))],
                                                                                        ["http.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/vendor/net-http/lib/net/http.rb")],
                                                                                        ["https.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/vendor/net-http/lib/net/https.rb")],
                                                                                    ]))],
                                                                            ]))],
                                                                    ]))],
                                                                ["net-protocol", new Directory(new Map([
                                                                        ["lib", new Directory(new Map([
                                                                                ["net", new Directory(new Map([
                                                                                        ["protocol.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/vendor/net-protocol/lib/net/protocol.rb")],
                                                                                    ]))],
                                                                            ]))],
                                                                    ]))],
                                                                ["optparse", new Directory(new Map([
                                                                        ["lib", new Directory(new Map([
                                                                                ["optionparser.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/vendor/optparse/lib/optionparser.rb")],
                                                                                ["optparse", new Directory(new Map([
                                                                                        ["ac.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/vendor/optparse/lib/optparse/ac.rb")],
                                                                                        ["date.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/vendor/optparse/lib/optparse/date.rb")],
                                                                                        ["kwargs.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/vendor/optparse/lib/optparse/kwargs.rb")],
                                                                                        ["shellwords.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/vendor/optparse/lib/optparse/shellwords.rb")],
                                                                                        ["time.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/vendor/optparse/lib/optparse/time.rb")],
                                                                                        ["uri.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/vendor/optparse/lib/optparse/uri.rb")],
                                                                                        ["version.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/vendor/optparse/lib/optparse/version.rb")],
                                                                                    ]))],
                                                                                ["optparse.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/vendor/optparse/lib/optparse.rb")],
                                                                            ]))],
                                                                    ]))],
                                                                ["resolv", new Directory(new Map([
                                                                        ["lib", new Directory(new Map([
                                                                                ["resolv.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/vendor/resolv/lib/resolv.rb")],
                                                                            ]))],
                                                                    ]))],
                                                                ["timeout", new Directory(new Map([
                                                                        ["lib", new Directory(new Map([
                                                                                ["timeout.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/vendor/timeout/lib/timeout.rb")],
                                                                            ]))],
                                                                    ]))],
                                                                ["tsort", new Directory(new Map([
                                                                        ["lib", new Directory(new Map([
                                                                                ["tsort.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/vendor/tsort/lib/tsort.rb")],
                                                                            ]))],
                                                                    ]))],
                                                                ["uri", new Directory(new Map([
                                                                        ["lib", new Directory(new Map([
                                                                                ["uri", new Directory(new Map([
                                                                                        ["common.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/vendor/uri/lib/uri/common.rb")],
                                                                                        ["file.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/vendor/uri/lib/uri/file.rb")],
                                                                                        ["ftp.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/vendor/uri/lib/uri/ftp.rb")],
                                                                                        ["generic.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/vendor/uri/lib/uri/generic.rb")],
                                                                                        ["http.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/vendor/uri/lib/uri/http.rb")],
                                                                                        ["https.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/vendor/uri/lib/uri/https.rb")],
                                                                                        ["ldap.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/vendor/uri/lib/uri/ldap.rb")],
                                                                                        ["ldaps.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/vendor/uri/lib/uri/ldaps.rb")],
                                                                                        ["mailto.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/vendor/uri/lib/uri/mailto.rb")],
                                                                                        ["rfc2396_parser.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/vendor/uri/lib/uri/rfc2396_parser.rb")],
                                                                                        ["rfc3986_parser.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/vendor/uri/lib/uri/rfc3986_parser.rb")],
                                                                                        ["version.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/vendor/uri/lib/uri/version.rb")],
                                                                                        ["ws.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/vendor/uri/lib/uri/ws.rb")],
                                                                                        ["wss.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/vendor/uri/lib/uri/wss.rb")],
                                                                                    ]))],
                                                                                ["uri.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/vendor/uri/lib/uri.rb")],
                                                                            ]))],
                                                                    ]))],
                                                            ]))],
                                                        ["vendored_molinillo.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/vendored_molinillo.rb")],
                                                        ["vendored_net_http.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/vendored_net_http.rb")],
                                                        ["vendored_optparse.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/vendored_optparse.rb")],
                                                        ["vendored_timeout.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/vendored_timeout.rb")],
                                                        ["vendored_tsort.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/vendored_tsort.rb")],
                                                        ["version.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/version.rb")],
                                                        ["version_option.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/version_option.rb")],
                                                        ["yaml_serializer.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems/yaml_serializer.rb")],
                                                    ]))],
                                                ["rubygems.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/rubygems.rb")],
                                                ["ruby_vm", new Directory(new Map([
                                                        ["rjit", new Directory(new Map([
                                                                ["assembler.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/ruby_vm/rjit/assembler.rb")],
                                                                ["block.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/ruby_vm/rjit/block.rb")],
                                                                ["branch_stub.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/ruby_vm/rjit/branch_stub.rb")],
                                                                ["code_block.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/ruby_vm/rjit/code_block.rb")],
                                                                ["compiler.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/ruby_vm/rjit/compiler.rb")],
                                                                ["context.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/ruby_vm/rjit/context.rb")],
                                                                ["c_pointer.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/ruby_vm/rjit/c_pointer.rb")],
                                                                ["c_type.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/ruby_vm/rjit/c_type.rb")],
                                                                ["entry_stub.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/ruby_vm/rjit/entry_stub.rb")],
                                                                ["exit_compiler.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/ruby_vm/rjit/exit_compiler.rb")],
                                                                ["hooks.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/ruby_vm/rjit/hooks.rb")],
                                                                ["insn_compiler.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/ruby_vm/rjit/insn_compiler.rb")],
                                                                ["instruction.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/ruby_vm/rjit/instruction.rb")],
                                                                ["invariants.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/ruby_vm/rjit/invariants.rb")],
                                                                ["jit_state.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/ruby_vm/rjit/jit_state.rb")],
                                                                ["stats.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/ruby_vm/rjit/stats.rb")],
                                                                ["type.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/ruby_vm/rjit/type.rb")],
                                                            ]))],
                                                    ]))],
                                                ["securerandom.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/securerandom.rb")],
                                                ["set", new Directory(new Map([
                                                        ["sorted_set.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/set/sorted_set.rb")],
                                                    ]))],
                                                ["set.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/set.rb")],
                                                ["shellwords.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/shellwords.rb")],
                                                ["singleton.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/singleton.rb")],
                                                ["syntax_suggest", new Directory(new Map([
                                                        ["api.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/syntax_suggest/api.rb")],
                                                        ["around_block_scan.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/syntax_suggest/around_block_scan.rb")],
                                                        ["block_expand.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/syntax_suggest/block_expand.rb")],
                                                        ["capture", new Directory(new Map([
                                                                ["before_after_keyword_ends.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/syntax_suggest/capture/before_after_keyword_ends.rb")],
                                                                ["falling_indent_lines.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/syntax_suggest/capture/falling_indent_lines.rb")],
                                                            ]))],
                                                        ["capture_code_context.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/syntax_suggest/capture_code_context.rb")],
                                                        ["clean_document.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/syntax_suggest/clean_document.rb")],
                                                        ["cli.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/syntax_suggest/cli.rb")],
                                                        ["code_block.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/syntax_suggest/code_block.rb")],
                                                        ["code_frontier.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/syntax_suggest/code_frontier.rb")],
                                                        ["code_line.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/syntax_suggest/code_line.rb")],
                                                        ["code_search.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/syntax_suggest/code_search.rb")],
                                                        ["core_ext.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/syntax_suggest/core_ext.rb")],
                                                        ["display_code_with_line_numbers.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/syntax_suggest/display_code_with_line_numbers.rb")],
                                                        ["display_invalid_blocks.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/syntax_suggest/display_invalid_blocks.rb")],
                                                        ["explain_syntax.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/syntax_suggest/explain_syntax.rb")],
                                                        ["left_right_lex_count.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/syntax_suggest/left_right_lex_count.rb")],
                                                        ["lex_all.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/syntax_suggest/lex_all.rb")],
                                                        ["lex_value.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/syntax_suggest/lex_value.rb")],
                                                        ["parse_blocks_from_indent_line.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/syntax_suggest/parse_blocks_from_indent_line.rb")],
                                                        ["pathname_from_message.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/syntax_suggest/pathname_from_message.rb")],
                                                        ["priority_engulf_queue.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/syntax_suggest/priority_engulf_queue.rb")],
                                                        ["priority_queue.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/syntax_suggest/priority_queue.rb")],
                                                        ["ripper_errors.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/syntax_suggest/ripper_errors.rb")],
                                                        ["scan_history.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/syntax_suggest/scan_history.rb")],
                                                        ["unvisited_lines.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/syntax_suggest/unvisited_lines.rb")],
                                                        ["version.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/syntax_suggest/version.rb")],
                                                    ]))],
                                                ["syntax_suggest.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/syntax_suggest.rb")],
                                                ["tempfile.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/tempfile.rb")],
                                                ["time.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/time.rb")],
                                                ["timeout.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/timeout.rb")],
                                                ["tmpdir.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/tmpdir.rb")],
                                                ["tsort.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/tsort.rb")],
                                                ["un.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/un.rb")],
                                                ["unicode_normalize", new Directory(new Map([
                                                        ["normalize.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/unicode_normalize/normalize.rb")],
                                                        ["tables.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/unicode_normalize/tables.rb")],
                                                    ]))],
                                                ["uri", new Directory(new Map([
                                                        ["common.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/uri/common.rb")],
                                                        ["file.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/uri/file.rb")],
                                                        ["ftp.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/uri/ftp.rb")],
                                                        ["generic.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/uri/generic.rb")],
                                                        ["http.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/uri/http.rb")],
                                                        ["https.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/uri/https.rb")],
                                                        ["ldap.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/uri/ldap.rb")],
                                                        ["ldaps.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/uri/ldaps.rb")],
                                                        ["mailto.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/uri/mailto.rb")],
                                                        ["rfc2396_parser.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/uri/rfc2396_parser.rb")],
                                                        ["rfc3986_parser.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/uri/rfc3986_parser.rb")],
                                                        ["version.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/uri/version.rb")],
                                                        ["ws.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/uri/ws.rb")],
                                                        ["wss.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/uri/wss.rb")],
                                                    ]))],
                                                ["uri.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/uri.rb")],
                                                ["wasm32-wasi", new Directory(new Map([
                                                        ["rbconfig.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/wasm32-wasi/rbconfig.rb")],
                                                    ]))],
                                                ["weakref.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/weakref.rb")],
                                                ["yaml", new Directory(new Map([
                                                        ["dbm.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/yaml/dbm.rb")],
                                                        ["store.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/yaml/store.rb")],
                                                    ]))],
                                                ["yaml.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/3.3.0/yaml.rb")],
                                            ]))],
                                        ["gems", new Directory(new Map([
                                                ["3.3.0", new Directory(new Map([
                                                        ["build_info", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/build_info")],
                                                        ["cache", new Directory(new Map([
                                                                ["debug-1.9.1.gem", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/cache/debug-1.9.1.gem")],
                                                                ["matrix-0.4.2.gem", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/cache/matrix-0.4.2.gem")],
                                                                ["minitest-5.20.0.gem", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/cache/minitest-5.20.0.gem")],
                                                                ["net-ftp-0.3.4.gem", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/cache/net-ftp-0.3.4.gem")],
                                                                ["net-imap-0.4.9.1.gem", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/cache/net-imap-0.4.9.1.gem")],
                                                                ["net-pop-0.1.2.gem", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/cache/net-pop-0.1.2.gem")],
                                                                ["net-smtp-0.4.0.1.gem", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/cache/net-smtp-0.4.0.1.gem")],
                                                                ["power_assert-2.0.3.gem", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/cache/power_assert-2.0.3.gem")],
                                                                ["prime-0.1.2.gem", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/cache/prime-0.1.2.gem")],
                                                                ["racc-1.7.3.gem", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/cache/racc-1.7.3.gem")],
                                                                ["rake-13.1.0.gem", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/cache/rake-13.1.0.gem")],
                                                                ["rbs-3.4.0.gem", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/cache/rbs-3.4.0.gem")],
                                                                ["rexml-3.2.8.gem", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/cache/rexml-3.2.8.gem")],
                                                                ["rss-0.3.0.gem", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/cache/rss-0.3.0.gem")],
                                                                ["test-unit-3.6.1.gem", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/cache/test-unit-3.6.1.gem")],
                                                                ["typeprof-0.21.9.gem", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/cache/typeprof-0.21.9.gem")],
                                                            ]))],
                                                        ["doc", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/doc")],
                                                        ["extensions", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/extensions")],
                                                        ["gems", new Directory(new Map([
                                                                ["abbrev-0.1.2", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/abbrev-0.1.2")],
                                                                ["base64-0.2.0", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/base64-0.2.0")],
                                                                ["benchmark-0.3.0", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/benchmark-0.3.0")],
                                                                ["bundler-2.5.11", new Directory(new Map([
                                                                        ["exe", new Directory(new Map([
                                                                                ["bundle", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/bundler-2.5.11/exe/bundle")],
                                                                                ["bundler", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/bundler-2.5.11/exe/bundler")],
                                                                            ]))],
                                                                    ]))],
                                                                ["cgi-0.4.1", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/cgi-0.4.1")],
                                                                ["csv-3.2.8", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/csv-3.2.8")],
                                                                ["debug-1.9.1", new Directory(new Map([
                                                                        ["CONTRIBUTING.md", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/debug-1.9.1/CONTRIBUTING.md")],
                                                                        ["exe", new Directory(new Map([
                                                                                ["rdbg", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/debug-1.9.1/exe/rdbg")],
                                                                            ]))],
                                                                        ["ext", new Directory(new Map([
                                                                                ["debug", new Directory(new Map([
                                                                                        ["debug.c", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/debug-1.9.1/ext/debug/debug.c")],
                                                                                        ["extconf.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/debug-1.9.1/ext/debug/extconf.rb")],
                                                                                        ["iseq_collector.c", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/debug-1.9.1/ext/debug/iseq_collector.c")],
                                                                                    ]))],
                                                                            ]))],
                                                                        ["Gemfile", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/debug-1.9.1/Gemfile")],
                                                                        ["lib", new Directory(new Map([
                                                                                ["debug", new Directory(new Map([
                                                                                        ["abbrev_command.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/debug-1.9.1/lib/debug/abbrev_command.rb")],
                                                                                        ["breakpoint.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/debug-1.9.1/lib/debug/breakpoint.rb")],
                                                                                        ["client.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/debug-1.9.1/lib/debug/client.rb")],
                                                                                        ["color.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/debug-1.9.1/lib/debug/color.rb")],
                                                                                        ["config.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/debug-1.9.1/lib/debug/config.rb")],
                                                                                        ["console.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/debug-1.9.1/lib/debug/console.rb")],
                                                                                        ["dap_custom", new Directory(new Map([
                                                                                                ["traceInspector.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/debug-1.9.1/lib/debug/dap_custom/traceInspector.rb")],
                                                                                            ]))],
                                                                                        ["frame_info.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/debug-1.9.1/lib/debug/frame_info.rb")],
                                                                                        ["irb_integration.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/debug-1.9.1/lib/debug/irb_integration.rb")],
                                                                                        ["local.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/debug-1.9.1/lib/debug/local.rb")],
                                                                                        ["open.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/debug-1.9.1/lib/debug/open.rb")],
                                                                                        ["open_nonstop.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/debug-1.9.1/lib/debug/open_nonstop.rb")],
                                                                                        ["prelude.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/debug-1.9.1/lib/debug/prelude.rb")],
                                                                                        ["server.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/debug-1.9.1/lib/debug/server.rb")],
                                                                                        ["server_cdp.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/debug-1.9.1/lib/debug/server_cdp.rb")],
                                                                                        ["server_dap.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/debug-1.9.1/lib/debug/server_dap.rb")],
                                                                                        ["session.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/debug-1.9.1/lib/debug/session.rb")],
                                                                                        ["source_repository.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/debug-1.9.1/lib/debug/source_repository.rb")],
                                                                                        ["start.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/debug-1.9.1/lib/debug/start.rb")],
                                                                                        ["thread_client.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/debug-1.9.1/lib/debug/thread_client.rb")],
                                                                                        ["tracer.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/debug-1.9.1/lib/debug/tracer.rb")],
                                                                                        ["version.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/debug-1.9.1/lib/debug/version.rb")],
                                                                                    ]))],
                                                                                ["debug.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/debug-1.9.1/lib/debug.rb")],
                                                                            ]))],
                                                                        ["LICENSE.txt", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/debug-1.9.1/LICENSE.txt")],
                                                                        ["misc", new Directory(new Map([
                                                                                ["README.md.erb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/debug-1.9.1/misc/README.md.erb")],
                                                                            ]))],
                                                                        ["Rakefile", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/debug-1.9.1/Rakefile")],
                                                                        ["README.md", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/debug-1.9.1/README.md")],
                                                                        ["TODO.md", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/debug-1.9.1/TODO.md")],
                                                                    ]))],
                                                                ["delegate-0.3.1", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/delegate-0.3.1")],
                                                                ["did_you_mean-1.6.3", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/did_you_mean-1.6.3")],
                                                                ["drb-2.2.0", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/drb-2.2.0")],
                                                                ["english-0.8.0", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/english-0.8.0")],
                                                                ["erb-4.0.3", new Directory(new Map([
                                                                        ["libexec", new Directory(new Map([
                                                                                ["erb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/erb-4.0.3/libexec/erb")],
                                                                            ]))],
                                                                    ]))],
                                                                ["error_highlight-0.6.0", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/error_highlight-0.6.0")],
                                                                ["fileutils-1.7.2", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/fileutils-1.7.2")],
                                                                ["find-0.2.0", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/find-0.2.0")],
                                                                ["forwardable-1.3.3", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/forwardable-1.3.3")],
                                                                ["getoptlong-0.2.1", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/getoptlong-0.2.1")],
                                                                ["ipaddr-1.2.6", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/ipaddr-1.2.6")],
                                                                ["irb-1.13.1", new Directory(new Map([
                                                                        ["exe", new Directory(new Map([
                                                                                ["irb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/irb-1.13.1/exe/irb")],
                                                                            ]))],
                                                                    ]))],
                                                                ["logger-1.6.0", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/logger-1.6.0")],
                                                                ["matrix-0.4.2", new Directory(new Map([
                                                                        ["lib", new Directory(new Map([
                                                                                ["matrix", new Directory(new Map([
                                                                                        ["eigenvalue_decomposition.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/matrix-0.4.2/lib/matrix/eigenvalue_decomposition.rb")],
                                                                                        ["lup_decomposition.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/matrix-0.4.2/lib/matrix/lup_decomposition.rb")],
                                                                                        ["version.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/matrix-0.4.2/lib/matrix/version.rb")],
                                                                                    ]))],
                                                                                ["matrix.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/matrix-0.4.2/lib/matrix.rb")],
                                                                            ]))],
                                                                        ["LICENSE.txt", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/matrix-0.4.2/LICENSE.txt")],
                                                                    ]))],
                                                                ["minitest-5.20.0", new Directory(new Map([
                                                                        ["design_rationale.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/minitest-5.20.0/design_rationale.rb")],
                                                                        ["History.rdoc", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/minitest-5.20.0/History.rdoc")],
                                                                        ["lib", new Directory(new Map([
                                                                                ["hoe", new Directory(new Map([
                                                                                        ["minitest.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/minitest-5.20.0/lib/hoe/minitest.rb")],
                                                                                    ]))],
                                                                                ["minitest", new Directory(new Map([
                                                                                        ["assertions.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/minitest-5.20.0/lib/minitest/assertions.rb")],
                                                                                        ["autorun.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/minitest-5.20.0/lib/minitest/autorun.rb")],
                                                                                        ["benchmark.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/minitest-5.20.0/lib/minitest/benchmark.rb")],
                                                                                        ["expectations.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/minitest-5.20.0/lib/minitest/expectations.rb")],
                                                                                        ["hell.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/minitest-5.20.0/lib/minitest/hell.rb")],
                                                                                        ["mock.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/minitest-5.20.0/lib/minitest/mock.rb")],
                                                                                        ["parallel.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/minitest-5.20.0/lib/minitest/parallel.rb")],
                                                                                        ["pride.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/minitest-5.20.0/lib/minitest/pride.rb")],
                                                                                        ["pride_plugin.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/minitest-5.20.0/lib/minitest/pride_plugin.rb")],
                                                                                        ["spec.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/minitest-5.20.0/lib/minitest/spec.rb")],
                                                                                        ["test.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/minitest-5.20.0/lib/minitest/test.rb")],
                                                                                        ["test_task.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/minitest-5.20.0/lib/minitest/test_task.rb")],
                                                                                        ["unit.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/minitest-5.20.0/lib/minitest/unit.rb")],
                                                                                    ]))],
                                                                                ["minitest.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/minitest-5.20.0/lib/minitest.rb")],
                                                                            ]))],
                                                                        ["Manifest.txt", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/minitest-5.20.0/Manifest.txt")],
                                                                        ["Rakefile", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/minitest-5.20.0/Rakefile")],
                                                                        ["README.rdoc", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/minitest-5.20.0/README.rdoc")],
                                                                        ["test", new Directory(new Map([
                                                                                ["minitest", new Directory(new Map([
                                                                                        ["metametameta.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/minitest-5.20.0/test/minitest/metametameta.rb")],
                                                                                        ["test_minitest_assertions.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/minitest-5.20.0/test/minitest/test_minitest_assertions.rb")],
                                                                                        ["test_minitest_benchmark.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/minitest-5.20.0/test/minitest/test_minitest_benchmark.rb")],
                                                                                        ["test_minitest_mock.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/minitest-5.20.0/test/minitest/test_minitest_mock.rb")],
                                                                                        ["test_minitest_reporter.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/minitest-5.20.0/test/minitest/test_minitest_reporter.rb")],
                                                                                        ["test_minitest_spec.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/minitest-5.20.0/test/minitest/test_minitest_spec.rb")],
                                                                                        ["test_minitest_test.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/minitest-5.20.0/test/minitest/test_minitest_test.rb")],
                                                                                        ["test_minitest_test_task.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/minitest-5.20.0/test/minitest/test_minitest_test_task.rb")],
                                                                                    ]))],
                                                                            ]))],
                                                                    ]))],
                                                                ["mutex_m-0.2.0", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/mutex_m-0.2.0")],
                                                                ["net-ftp-0.3.4", new Directory(new Map([
                                                                        ["Gemfile", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/net-ftp-0.3.4/Gemfile")],
                                                                        ["lib", new Directory(new Map([
                                                                                ["net", new Directory(new Map([
                                                                                        ["ftp.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/net-ftp-0.3.4/lib/net/ftp.rb")],
                                                                                    ]))],
                                                                            ]))],
                                                                        ["LICENSE.txt", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/net-ftp-0.3.4/LICENSE.txt")],
                                                                        ["Rakefile", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/net-ftp-0.3.4/Rakefile")],
                                                                        ["README.md", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/net-ftp-0.3.4/README.md")],
                                                                    ]))],
                                                                ["net-http-0.4.1", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/net-http-0.4.1")],
                                                                ["net-imap-0.4.9.1", new Directory(new Map([
                                                                        ["docs", new Directory(new Map([
                                                                                ["styles.css", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/net-imap-0.4.9.1/docs/styles.css")],
                                                                            ]))],
                                                                        ["Gemfile", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/net-imap-0.4.9.1/Gemfile")],
                                                                        ["lib", new Directory(new Map([
                                                                                ["net", new Directory(new Map([
                                                                                        ["imap", new Directory(new Map([
                                                                                                ["authenticators.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/net-imap-0.4.9.1/lib/net/imap/authenticators.rb")],
                                                                                                ["command_data.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/net-imap-0.4.9.1/lib/net/imap/command_data.rb")],
                                                                                                ["data_encoding.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/net-imap-0.4.9.1/lib/net/imap/data_encoding.rb")],
                                                                                                ["deprecated_client_options.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/net-imap-0.4.9.1/lib/net/imap/deprecated_client_options.rb")],
                                                                                                ["errors.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/net-imap-0.4.9.1/lib/net/imap/errors.rb")],
                                                                                                ["fetch_data.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/net-imap-0.4.9.1/lib/net/imap/fetch_data.rb")],
                                                                                                ["flags.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/net-imap-0.4.9.1/lib/net/imap/flags.rb")],
                                                                                                ["response_data.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/net-imap-0.4.9.1/lib/net/imap/response_data.rb")],
                                                                                                ["response_parser", new Directory(new Map([
                                                                                                        ["parser_utils.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/net-imap-0.4.9.1/lib/net/imap/response_parser/parser_utils.rb")],
                                                                                                    ]))],
                                                                                                ["response_parser.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/net-imap-0.4.9.1/lib/net/imap/response_parser.rb")],
                                                                                                ["sasl", new Directory(new Map([
                                                                                                        ["anonymous_authenticator.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/net-imap-0.4.9.1/lib/net/imap/sasl/anonymous_authenticator.rb")],
                                                                                                        ["authentication_exchange.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/net-imap-0.4.9.1/lib/net/imap/sasl/authentication_exchange.rb")],
                                                                                                        ["authenticators.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/net-imap-0.4.9.1/lib/net/imap/sasl/authenticators.rb")],
                                                                                                        ["client_adapter.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/net-imap-0.4.9.1/lib/net/imap/sasl/client_adapter.rb")],
                                                                                                        ["cram_md5_authenticator.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/net-imap-0.4.9.1/lib/net/imap/sasl/cram_md5_authenticator.rb")],
                                                                                                        ["digest_md5_authenticator.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/net-imap-0.4.9.1/lib/net/imap/sasl/digest_md5_authenticator.rb")],
                                                                                                        ["external_authenticator.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/net-imap-0.4.9.1/lib/net/imap/sasl/external_authenticator.rb")],
                                                                                                        ["gs2_header.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/net-imap-0.4.9.1/lib/net/imap/sasl/gs2_header.rb")],
                                                                                                        ["login_authenticator.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/net-imap-0.4.9.1/lib/net/imap/sasl/login_authenticator.rb")],
                                                                                                        ["oauthbearer_authenticator.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/net-imap-0.4.9.1/lib/net/imap/sasl/oauthbearer_authenticator.rb")],
                                                                                                        ["plain_authenticator.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/net-imap-0.4.9.1/lib/net/imap/sasl/plain_authenticator.rb")],
                                                                                                        ["protocol_adapters.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/net-imap-0.4.9.1/lib/net/imap/sasl/protocol_adapters.rb")],
                                                                                                        ["scram_algorithm.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/net-imap-0.4.9.1/lib/net/imap/sasl/scram_algorithm.rb")],
                                                                                                        ["scram_authenticator.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/net-imap-0.4.9.1/lib/net/imap/sasl/scram_authenticator.rb")],
                                                                                                        ["stringprep.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/net-imap-0.4.9.1/lib/net/imap/sasl/stringprep.rb")],
                                                                                                        ["xoauth2_authenticator.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/net-imap-0.4.9.1/lib/net/imap/sasl/xoauth2_authenticator.rb")],
                                                                                                    ]))],
                                                                                                ["sasl.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/net-imap-0.4.9.1/lib/net/imap/sasl.rb")],
                                                                                                ["sasl_adapter.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/net-imap-0.4.9.1/lib/net/imap/sasl_adapter.rb")],
                                                                                                ["search_result.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/net-imap-0.4.9.1/lib/net/imap/search_result.rb")],
                                                                                                ["sequence_set.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/net-imap-0.4.9.1/lib/net/imap/sequence_set.rb")],
                                                                                                ["stringprep", new Directory(new Map([
                                                                                                        ["nameprep.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/net-imap-0.4.9.1/lib/net/imap/stringprep/nameprep.rb")],
                                                                                                        ["saslprep.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/net-imap-0.4.9.1/lib/net/imap/stringprep/saslprep.rb")],
                                                                                                        ["saslprep_tables.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/net-imap-0.4.9.1/lib/net/imap/stringprep/saslprep_tables.rb")],
                                                                                                        ["tables.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/net-imap-0.4.9.1/lib/net/imap/stringprep/tables.rb")],
                                                                                                        ["trace.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/net-imap-0.4.9.1/lib/net/imap/stringprep/trace.rb")],
                                                                                                    ]))],
                                                                                                ["stringprep.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/net-imap-0.4.9.1/lib/net/imap/stringprep.rb")],
                                                                                            ]))],
                                                                                        ["imap.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/net-imap-0.4.9.1/lib/net/imap.rb")],
                                                                                    ]))],
                                                                            ]))],
                                                                        ["LICENSE.txt", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/net-imap-0.4.9.1/LICENSE.txt")],
                                                                        ["Rakefile", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/net-imap-0.4.9.1/Rakefile")],
                                                                        ["rakelib", new Directory(new Map([
                                                                                ["benchmarks.rake", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/net-imap-0.4.9.1/rakelib/benchmarks.rake")],
                                                                                ["rdoc.rake", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/net-imap-0.4.9.1/rakelib/rdoc.rake")],
                                                                                ["rfcs.rake", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/net-imap-0.4.9.1/rakelib/rfcs.rake")],
                                                                                ["saslprep.rake", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/net-imap-0.4.9.1/rakelib/saslprep.rake")],
                                                                                ["string_prep_tables_generator.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/net-imap-0.4.9.1/rakelib/string_prep_tables_generator.rb")],
                                                                            ]))],
                                                                        ["README.md", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/net-imap-0.4.9.1/README.md")],
                                                                    ]))],
                                                                ["net-pop-0.1.2", new Directory(new Map([
                                                                        ["Gemfile", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/net-pop-0.1.2/Gemfile")],
                                                                        ["lib", new Directory(new Map([
                                                                                ["net", new Directory(new Map([
                                                                                        ["pop.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/net-pop-0.1.2/lib/net/pop.rb")],
                                                                                    ]))],
                                                                            ]))],
                                                                        ["LICENSE.txt", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/net-pop-0.1.2/LICENSE.txt")],
                                                                        ["Rakefile", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/net-pop-0.1.2/Rakefile")],
                                                                        ["README.md", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/net-pop-0.1.2/README.md")],
                                                                    ]))],
                                                                ["net-protocol-0.2.2", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/net-protocol-0.2.2")],
                                                                ["net-smtp-0.4.0.1", new Directory(new Map([
                                                                        ["lib", new Directory(new Map([
                                                                                ["net", new Directory(new Map([
                                                                                        ["smtp", new Directory(new Map([
                                                                                                ["authenticator.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/net-smtp-0.4.0.1/lib/net/smtp/authenticator.rb")],
                                                                                                ["auth_cram_md5.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/net-smtp-0.4.0.1/lib/net/smtp/auth_cram_md5.rb")],
                                                                                                ["auth_login.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/net-smtp-0.4.0.1/lib/net/smtp/auth_login.rb")],
                                                                                                ["auth_plain.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/net-smtp-0.4.0.1/lib/net/smtp/auth_plain.rb")],
                                                                                            ]))],
                                                                                        ["smtp.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/net-smtp-0.4.0.1/lib/net/smtp.rb")],
                                                                                    ]))],
                                                                            ]))],
                                                                        ["LICENSE.txt", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/net-smtp-0.4.0.1/LICENSE.txt")],
                                                                        ["NEWS.md", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/net-smtp-0.4.0.1/NEWS.md")],
                                                                        ["README.md", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/net-smtp-0.4.0.1/README.md")],
                                                                    ]))],
                                                                ["observer-0.1.2", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/observer-0.1.2")],
                                                                ["open-uri-0.4.1", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/open-uri-0.4.1")],
                                                                ["open3-0.2.1", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/open3-0.2.1")],
                                                                ["optparse-0.4.0", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/optparse-0.4.0")],
                                                                ["ostruct-0.6.0", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/ostruct-0.6.0")],
                                                                ["power_assert-2.0.3", new Directory(new Map([
                                                                        ["BSDL", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/power_assert-2.0.3/BSDL")],
                                                                        ["COPYING", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/power_assert-2.0.3/COPYING")],
                                                                        ["Gemfile", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/power_assert-2.0.3/Gemfile")],
                                                                        ["LEGAL", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/power_assert-2.0.3/LEGAL")],
                                                                        ["lib", new Directory(new Map([
                                                                                ["power_assert", new Directory(new Map([
                                                                                        ["colorize.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/power_assert-2.0.3/lib/power_assert/colorize.rb")],
                                                                                        ["configuration.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/power_assert-2.0.3/lib/power_assert/configuration.rb")],
                                                                                        ["context.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/power_assert-2.0.3/lib/power_assert/context.rb")],
                                                                                        ["enable_tracepoint_events.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/power_assert-2.0.3/lib/power_assert/enable_tracepoint_events.rb")],
                                                                                        ["inspector.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/power_assert-2.0.3/lib/power_assert/inspector.rb")],
                                                                                        ["parser.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/power_assert-2.0.3/lib/power_assert/parser.rb")],
                                                                                        ["version.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/power_assert-2.0.3/lib/power_assert/version.rb")],
                                                                                    ]))],
                                                                                ["power_assert.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/power_assert-2.0.3/lib/power_assert.rb")],
                                                                            ]))],
                                                                        ["Rakefile", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/power_assert-2.0.3/Rakefile")],
                                                                        ["README.md", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/power_assert-2.0.3/README.md")],
                                                                    ]))],
                                                                ["pp-0.5.0", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/pp-0.5.0")],
                                                                ["prettyprint-0.2.0", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/prettyprint-0.2.0")],
                                                                ["prime-0.1.2", new Directory(new Map([
                                                                        ["bin", new Directory(new Map([
                                                                                ["console", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/prime-0.1.2/bin/console")],
                                                                                ["setup", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/prime-0.1.2/bin/setup")],
                                                                            ]))],
                                                                        ["Gemfile", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/prime-0.1.2/Gemfile")],
                                                                        ["lib", new Directory(new Map([
                                                                                ["prime.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/prime-0.1.2/lib/prime.rb")],
                                                                            ]))],
                                                                        ["LICENSE.txt", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/prime-0.1.2/LICENSE.txt")],
                                                                        ["Rakefile", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/prime-0.1.2/Rakefile")],
                                                                        ["README.md", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/prime-0.1.2/README.md")],
                                                                    ]))],
                                                                ["prism-0.19.0", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/prism-0.19.0")],
                                                                ["pstore-0.1.3", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/pstore-0.1.3")],
                                                                ["racc-1.7.3", new Directory(new Map([
                                                                        ["bin", new Directory(new Map([
                                                                                ["racc", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/racc-1.7.3/bin/racc")],
                                                                            ]))],
                                                                        ["ChangeLog", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/racc-1.7.3/ChangeLog")],
                                                                        ["COPYING", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/racc-1.7.3/COPYING")],
                                                                        ["doc", new Directory(new Map([
                                                                                ["en", new Directory(new Map([
                                                                                        ["grammar.en.rdoc", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/racc-1.7.3/doc/en/grammar.en.rdoc")],
                                                                                        ["grammar2.en.rdoc", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/racc-1.7.3/doc/en/grammar2.en.rdoc")],
                                                                                    ]))],
                                                                                ["ja", new Directory(new Map([
                                                                                        ["command.ja.html", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/racc-1.7.3/doc/ja/command.ja.html")],
                                                                                        ["debug.ja.rdoc", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/racc-1.7.3/doc/ja/debug.ja.rdoc")],
                                                                                        ["grammar.ja.rdoc", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/racc-1.7.3/doc/ja/grammar.ja.rdoc")],
                                                                                        ["index.ja.html", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/racc-1.7.3/doc/ja/index.ja.html")],
                                                                                        ["parser.ja.rdoc", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/racc-1.7.3/doc/ja/parser.ja.rdoc")],
                                                                                        ["usage.ja.html", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/racc-1.7.3/doc/ja/usage.ja.html")],
                                                                                    ]))],
                                                                            ]))],
                                                                        ["ext", new Directory(new Map([
                                                                                ["racc", new Directory(new Map([
                                                                                        ["cparse", new Directory(new Map([
                                                                                                ["cparse.c", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/racc-1.7.3/ext/racc/cparse/cparse.c")],
                                                                                                ["extconf.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/racc-1.7.3/ext/racc/cparse/extconf.rb")],
                                                                                            ]))],
                                                                                    ]))],
                                                                            ]))],
                                                                        ["lib", new Directory(new Map([
                                                                                ["racc", new Directory(new Map([
                                                                                        ["compat.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/racc-1.7.3/lib/racc/compat.rb")],
                                                                                        ["debugflags.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/racc-1.7.3/lib/racc/debugflags.rb")],
                                                                                        ["exception.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/racc-1.7.3/lib/racc/exception.rb")],
                                                                                        ["grammar.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/racc-1.7.3/lib/racc/grammar.rb")],
                                                                                        ["grammarfileparser.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/racc-1.7.3/lib/racc/grammarfileparser.rb")],
                                                                                        ["info.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/racc-1.7.3/lib/racc/info.rb")],
                                                                                        ["iset.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/racc-1.7.3/lib/racc/iset.rb")],
                                                                                        ["logfilegenerator.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/racc-1.7.3/lib/racc/logfilegenerator.rb")],
                                                                                        ["parser-text.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/racc-1.7.3/lib/racc/parser-text.rb")],
                                                                                        ["parser.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/racc-1.7.3/lib/racc/parser.rb")],
                                                                                        ["parserfilegenerator.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/racc-1.7.3/lib/racc/parserfilegenerator.rb")],
                                                                                        ["sourcetext.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/racc-1.7.3/lib/racc/sourcetext.rb")],
                                                                                        ["state.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/racc-1.7.3/lib/racc/state.rb")],
                                                                                        ["statetransitiontable.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/racc-1.7.3/lib/racc/statetransitiontable.rb")],
                                                                                        ["static.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/racc-1.7.3/lib/racc/static.rb")],
                                                                                    ]))],
                                                                                ["racc.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/racc-1.7.3/lib/racc.rb")],
                                                                            ]))],
                                                                        ["README.ja.rdoc", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/racc-1.7.3/README.ja.rdoc")],
                                                                        ["README.rdoc", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/racc-1.7.3/README.rdoc")],
                                                                        ["TODO", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/racc-1.7.3/TODO")],
                                                                    ]))],
                                                                ["rake-13.1.0", new Directory(new Map([
                                                                        ["doc", new Directory(new Map([
                                                                                ["command_line_usage.rdoc", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rake-13.1.0/doc/command_line_usage.rdoc")],
                                                                                ["example", new Directory(new Map([
                                                                                        ["a.c", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rake-13.1.0/doc/example/a.c")],
                                                                                        ["b.c", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rake-13.1.0/doc/example/b.c")],
                                                                                        ["main.c", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rake-13.1.0/doc/example/main.c")],
                                                                                        ["Rakefile1", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rake-13.1.0/doc/example/Rakefile1")],
                                                                                        ["Rakefile2", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rake-13.1.0/doc/example/Rakefile2")],
                                                                                    ]))],
                                                                                ["glossary.rdoc", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rake-13.1.0/doc/glossary.rdoc")],
                                                                                ["jamis.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rake-13.1.0/doc/jamis.rb")],
                                                                                ["proto_rake.rdoc", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rake-13.1.0/doc/proto_rake.rdoc")],
                                                                                ["rake.1", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rake-13.1.0/doc/rake.1")],
                                                                                ["rakefile.rdoc", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rake-13.1.0/doc/rakefile.rdoc")],
                                                                                ["rational.rdoc", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rake-13.1.0/doc/rational.rdoc")],
                                                                            ]))],
                                                                        ["exe", new Directory(new Map([
                                                                                ["rake", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rake-13.1.0/exe/rake")],
                                                                            ]))],
                                                                        ["History.rdoc", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rake-13.1.0/History.rdoc")],
                                                                        ["lib", new Directory(new Map([
                                                                                ["rake", new Directory(new Map([
                                                                                        ["application.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rake-13.1.0/lib/rake/application.rb")],
                                                                                        ["backtrace.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rake-13.1.0/lib/rake/backtrace.rb")],
                                                                                        ["clean.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rake-13.1.0/lib/rake/clean.rb")],
                                                                                        ["cloneable.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rake-13.1.0/lib/rake/cloneable.rb")],
                                                                                        ["cpu_counter.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rake-13.1.0/lib/rake/cpu_counter.rb")],
                                                                                        ["default_loader.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rake-13.1.0/lib/rake/default_loader.rb")],
                                                                                        ["dsl_definition.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rake-13.1.0/lib/rake/dsl_definition.rb")],
                                                                                        ["early_time.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rake-13.1.0/lib/rake/early_time.rb")],
                                                                                        ["ext", new Directory(new Map([
                                                                                                ["core.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rake-13.1.0/lib/rake/ext/core.rb")],
                                                                                                ["string.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rake-13.1.0/lib/rake/ext/string.rb")],
                                                                                            ]))],
                                                                                        ["file_creation_task.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rake-13.1.0/lib/rake/file_creation_task.rb")],
                                                                                        ["file_list.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rake-13.1.0/lib/rake/file_list.rb")],
                                                                                        ["file_task.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rake-13.1.0/lib/rake/file_task.rb")],
                                                                                        ["file_utils.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rake-13.1.0/lib/rake/file_utils.rb")],
                                                                                        ["file_utils_ext.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rake-13.1.0/lib/rake/file_utils_ext.rb")],
                                                                                        ["invocation_chain.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rake-13.1.0/lib/rake/invocation_chain.rb")],
                                                                                        ["invocation_exception_mixin.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rake-13.1.0/lib/rake/invocation_exception_mixin.rb")],
                                                                                        ["late_time.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rake-13.1.0/lib/rake/late_time.rb")],
                                                                                        ["linked_list.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rake-13.1.0/lib/rake/linked_list.rb")],
                                                                                        ["loaders", new Directory(new Map([
                                                                                                ["makefile.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rake-13.1.0/lib/rake/loaders/makefile.rb")],
                                                                                            ]))],
                                                                                        ["multi_task.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rake-13.1.0/lib/rake/multi_task.rb")],
                                                                                        ["name_space.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rake-13.1.0/lib/rake/name_space.rb")],
                                                                                        ["packagetask.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rake-13.1.0/lib/rake/packagetask.rb")],
                                                                                        ["phony.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rake-13.1.0/lib/rake/phony.rb")],
                                                                                        ["private_reader.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rake-13.1.0/lib/rake/private_reader.rb")],
                                                                                        ["promise.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rake-13.1.0/lib/rake/promise.rb")],
                                                                                        ["pseudo_status.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rake-13.1.0/lib/rake/pseudo_status.rb")],
                                                                                        ["rake_module.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rake-13.1.0/lib/rake/rake_module.rb")],
                                                                                        ["rake_test_loader.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rake-13.1.0/lib/rake/rake_test_loader.rb")],
                                                                                        ["rule_recursion_overflow_error.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rake-13.1.0/lib/rake/rule_recursion_overflow_error.rb")],
                                                                                        ["scope.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rake-13.1.0/lib/rake/scope.rb")],
                                                                                        ["task.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rake-13.1.0/lib/rake/task.rb")],
                                                                                        ["tasklib.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rake-13.1.0/lib/rake/tasklib.rb")],
                                                                                        ["task_arguments.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rake-13.1.0/lib/rake/task_arguments.rb")],
                                                                                        ["task_argument_error.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rake-13.1.0/lib/rake/task_argument_error.rb")],
                                                                                        ["task_manager.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rake-13.1.0/lib/rake/task_manager.rb")],
                                                                                        ["testtask.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rake-13.1.0/lib/rake/testtask.rb")],
                                                                                        ["thread_history_display.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rake-13.1.0/lib/rake/thread_history_display.rb")],
                                                                                        ["thread_pool.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rake-13.1.0/lib/rake/thread_pool.rb")],
                                                                                        ["trace_output.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rake-13.1.0/lib/rake/trace_output.rb")],
                                                                                        ["version.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rake-13.1.0/lib/rake/version.rb")],
                                                                                        ["win32.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rake-13.1.0/lib/rake/win32.rb")],
                                                                                    ]))],
                                                                                ["rake.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rake-13.1.0/lib/rake.rb")],
                                                                            ]))],
                                                                        ["MIT-LICENSE", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rake-13.1.0/MIT-LICENSE")],
                                                                        ["README.rdoc", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rake-13.1.0/README.rdoc")],
                                                                    ]))],
                                                                ["rbs-3.4.0", new Directory(new Map([
                                                                        ["BSDL", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/BSDL")],
                                                                        ["CHANGELOG.md", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/CHANGELOG.md")],
                                                                        ["COPYING", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/COPYING")],
                                                                        ["core", new Directory(new Map([
                                                                                ["array.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/array.rbs")],
                                                                                ["basic_object.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/basic_object.rbs")],
                                                                                ["binding.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/binding.rbs")],
                                                                                ["builtin.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/builtin.rbs")],
                                                                                ["class.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/class.rbs")],
                                                                                ["comparable.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/comparable.rbs")],
                                                                                ["complex.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/complex.rbs")],
                                                                                ["constants.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/constants.rbs")],
                                                                                ["data.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/data.rbs")],
                                                                                ["dir.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/dir.rbs")],
                                                                                ["encoding.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/encoding.rbs")],
                                                                                ["enumerable.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/enumerable.rbs")],
                                                                                ["enumerator", new Directory(new Map([
                                                                                        ["product.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/enumerator/product.rbs")],
                                                                                    ]))],
                                                                                ["enumerator.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/enumerator.rbs")],
                                                                                ["env.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/env.rbs")],
                                                                                ["errno.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/errno.rbs")],
                                                                                ["errors.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/errors.rbs")],
                                                                                ["exception.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/exception.rbs")],
                                                                                ["false_class.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/false_class.rbs")],
                                                                                ["fiber.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/fiber.rbs")],
                                                                                ["fiber_error.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/fiber_error.rbs")],
                                                                                ["file.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/file.rbs")],
                                                                                ["file_test.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/file_test.rbs")],
                                                                                ["float.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/float.rbs")],
                                                                                ["gc.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/gc.rbs")],
                                                                                ["global_variables.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/global_variables.rbs")],
                                                                                ["hash.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/hash.rbs")],
                                                                                ["integer.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/integer.rbs")],
                                                                                ["io", new Directory(new Map([
                                                                                        ["buffer.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/io/buffer.rbs")],
                                                                                        ["wait.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/io/wait.rbs")],
                                                                                    ]))],
                                                                                ["io.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/io.rbs")],
                                                                                ["kernel.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/kernel.rbs")],
                                                                                ["marshal.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/marshal.rbs")],
                                                                                ["match_data.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/match_data.rbs")],
                                                                                ["math.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/math.rbs")],
                                                                                ["method.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/method.rbs")],
                                                                                ["module.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/module.rbs")],
                                                                                ["nil_class.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/nil_class.rbs")],
                                                                                ["numeric.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/numeric.rbs")],
                                                                                ["object.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/object.rbs")],
                                                                                ["object_space", new Directory(new Map([
                                                                                        ["weak_key_map.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/object_space/weak_key_map.rbs")],
                                                                                    ]))],
                                                                                ["object_space.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/object_space.rbs")],
                                                                                ["proc.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/proc.rbs")],
                                                                                ["process.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/process.rbs")],
                                                                                ["ractor.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/ractor.rbs")],
                                                                                ["random.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/random.rbs")],
                                                                                ["range.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/range.rbs")],
                                                                                ["rational.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/rational.rbs")],
                                                                                ["rbs", new Directory(new Map([
                                                                                        ["unnamed", new Directory(new Map([
                                                                                                ["argf.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/rbs/unnamed/argf.rbs")],
                                                                                                ["env_class.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/rbs/unnamed/env_class.rbs")],
                                                                                                ["random.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/rbs/unnamed/random.rbs")],
                                                                                            ]))],
                                                                                    ]))],
                                                                                ["rb_config.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/rb_config.rbs")],
                                                                                ["refinement.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/refinement.rbs")],
                                                                                ["regexp.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/regexp.rbs")],
                                                                                ["rubygems", new Directory(new Map([
                                                                                        ["basic_specification.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/rubygems/basic_specification.rbs")],
                                                                                        ["config_file.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/rubygems/config_file.rbs")],
                                                                                        ["dependency_installer.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/rubygems/dependency_installer.rbs")],
                                                                                        ["errors.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/rubygems/errors.rbs")],
                                                                                        ["installer.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/rubygems/installer.rbs")],
                                                                                        ["path_support.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/rubygems/path_support.rbs")],
                                                                                        ["platform.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/rubygems/platform.rbs")],
                                                                                        ["request_set.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/rubygems/request_set.rbs")],
                                                                                        ["requirement.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/rubygems/requirement.rbs")],
                                                                                        ["rubygems.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/rubygems/rubygems.rbs")],
                                                                                        ["source_list.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/rubygems/source_list.rbs")],
                                                                                        ["specification.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/rubygems/specification.rbs")],
                                                                                        ["stream_ui.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/rubygems/stream_ui.rbs")],
                                                                                        ["uninstaller.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/rubygems/uninstaller.rbs")],
                                                                                        ["version.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/rubygems/version.rbs")],
                                                                                    ]))],
                                                                                ["ruby_vm.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/ruby_vm.rbs")],
                                                                                ["set.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/set.rbs")],
                                                                                ["signal.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/signal.rbs")],
                                                                                ["string.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/string.rbs")],
                                                                                ["string_io.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/string_io.rbs")],
                                                                                ["struct.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/struct.rbs")],
                                                                                ["symbol.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/symbol.rbs")],
                                                                                ["thread.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/thread.rbs")],
                                                                                ["thread_group.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/thread_group.rbs")],
                                                                                ["time.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/time.rbs")],
                                                                                ["trace_point.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/trace_point.rbs")],
                                                                                ["true_class.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/true_class.rbs")],
                                                                                ["unbound_method.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/unbound_method.rbs")],
                                                                                ["warning.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/core/warning.rbs")],
                                                                            ]))],
                                                                        ["docs", new Directory(new Map([
                                                                                ["collection.md", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/docs/collection.md")],
                                                                                ["CONTRIBUTING.md", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/docs/CONTRIBUTING.md")],
                                                                                ["data_and_struct.md", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/docs/data_and_struct.md")],
                                                                                ["gem.md", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/docs/gem.md")],
                                                                                ["rbs_by_example.md", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/docs/rbs_by_example.md")],
                                                                                ["repo.md", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/docs/repo.md")],
                                                                                ["sigs.md", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/docs/sigs.md")],
                                                                                ["stdlib.md", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/docs/stdlib.md")],
                                                                                ["syntax.md", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/docs/syntax.md")],
                                                                                ["tools.md", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/docs/tools.md")],
                                                                            ]))],
                                                                        ["exe", new Directory(new Map([
                                                                                ["rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/exe/rbs")],
                                                                            ]))],
                                                                        ["ext", new Directory(new Map([
                                                                                ["rbs_extension", new Directory(new Map([
                                                                                        ["constants.c", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/ext/rbs_extension/constants.c")],
                                                                                        ["constants.h", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/ext/rbs_extension/constants.h")],
                                                                                        ["extconf.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/ext/rbs_extension/extconf.rb")],
                                                                                        ["lexer.c", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/ext/rbs_extension/lexer.c")],
                                                                                        ["lexer.h", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/ext/rbs_extension/lexer.h")],
                                                                                        ["lexer.re", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/ext/rbs_extension/lexer.re")],
                                                                                        ["lexstate.c", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/ext/rbs_extension/lexstate.c")],
                                                                                        ["location.c", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/ext/rbs_extension/location.c")],
                                                                                        ["location.h", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/ext/rbs_extension/location.h")],
                                                                                        ["main.c", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/ext/rbs_extension/main.c")],
                                                                                        ["parser.c", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/ext/rbs_extension/parser.c")],
                                                                                        ["parser.h", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/ext/rbs_extension/parser.h")],
                                                                                        ["parserstate.c", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/ext/rbs_extension/parserstate.c")],
                                                                                        ["parserstate.h", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/ext/rbs_extension/parserstate.h")],
                                                                                        ["rbs_extension.h", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/ext/rbs_extension/rbs_extension.h")],
                                                                                        ["ruby_objs.c", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/ext/rbs_extension/ruby_objs.c")],
                                                                                        ["ruby_objs.h", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/ext/rbs_extension/ruby_objs.h")],
                                                                                        ["unescape.c", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/ext/rbs_extension/unescape.c")],
                                                                                    ]))],
                                                                            ]))],
                                                                        ["Gemfile", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/Gemfile")],
                                                                        ["Gemfile.lock", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/Gemfile.lock")],
                                                                        ["goodcheck.yml", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/goodcheck.yml")],
                                                                        ["lib", new Directory(new Map([
                                                                                ["rbs", new Directory(new Map([
                                                                                        ["ancestor_graph.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/ancestor_graph.rb")],
                                                                                        ["annotate", new Directory(new Map([
                                                                                                ["annotations.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/annotate/annotations.rb")],
                                                                                                ["formatter.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/annotate/formatter.rb")],
                                                                                                ["rdoc_annotator.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/annotate/rdoc_annotator.rb")],
                                                                                                ["rdoc_source.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/annotate/rdoc_source.rb")],
                                                                                            ]))],
                                                                                        ["annotate.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/annotate.rb")],
                                                                                        ["ast", new Directory(new Map([
                                                                                                ["annotation.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/ast/annotation.rb")],
                                                                                                ["comment.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/ast/comment.rb")],
                                                                                                ["declarations.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/ast/declarations.rb")],
                                                                                                ["directives.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/ast/directives.rb")],
                                                                                                ["members.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/ast/members.rb")],
                                                                                                ["type_param.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/ast/type_param.rb")],
                                                                                            ]))],
                                                                                        ["buffer.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/buffer.rb")],
                                                                                        ["builtin_names.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/builtin_names.rb")],
                                                                                        ["cli", new Directory(new Map([
                                                                                                ["colored_io.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/cli/colored_io.rb")],
                                                                                                ["diff.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/cli/diff.rb")],
                                                                                                ["validate.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/cli/validate.rb")],
                                                                                            ]))],
                                                                                        ["cli.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/cli.rb")],
                                                                                        ["collection", new Directory(new Map([
                                                                                                ["cleaner.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/collection/cleaner.rb")],
                                                                                                ["config", new Directory(new Map([
                                                                                                        ["lockfile.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/collection/config/lockfile.rb")],
                                                                                                        ["lockfile_generator.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/collection/config/lockfile_generator.rb")],
                                                                                                    ]))],
                                                                                                ["config.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/collection/config.rb")],
                                                                                                ["installer.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/collection/installer.rb")],
                                                                                                ["sources", new Directory(new Map([
                                                                                                        ["base.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/collection/sources/base.rb")],
                                                                                                        ["git.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/collection/sources/git.rb")],
                                                                                                        ["local.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/collection/sources/local.rb")],
                                                                                                        ["rubygems.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/collection/sources/rubygems.rb")],
                                                                                                        ["stdlib.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/collection/sources/stdlib.rb")],
                                                                                                    ]))],
                                                                                                ["sources.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/collection/sources.rb")],
                                                                                            ]))],
                                                                                        ["collection.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/collection.rb")],
                                                                                        ["constant.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/constant.rb")],
                                                                                        ["definition.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/definition.rb")],
                                                                                        ["definition_builder", new Directory(new Map([
                                                                                                ["ancestor_builder.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/definition_builder/ancestor_builder.rb")],
                                                                                                ["method_builder.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/definition_builder/method_builder.rb")],
                                                                                            ]))],
                                                                                        ["definition_builder.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/definition_builder.rb")],
                                                                                        ["diff.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/diff.rb")],
                                                                                        ["environment", new Directory(new Map([
                                                                                                ["use_map.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/environment/use_map.rb")],
                                                                                            ]))],
                                                                                        ["environment.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/environment.rb")],
                                                                                        ["environment_loader.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/environment_loader.rb")],
                                                                                        ["environment_walker.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/environment_walker.rb")],
                                                                                        ["errors.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/errors.rb")],
                                                                                        ["factory.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/factory.rb")],
                                                                                        ["file_finder.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/file_finder.rb")],
                                                                                        ["location_aux.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/location_aux.rb")],
                                                                                        ["locator.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/locator.rb")],
                                                                                        ["method_type.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/method_type.rb")],
                                                                                        ["namespace.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/namespace.rb")],
                                                                                        ["parser_aux.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/parser_aux.rb")],
                                                                                        ["parser_compat", new Directory(new Map([
                                                                                                ["lexer_error.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/parser_compat/lexer_error.rb")],
                                                                                                ["located_value.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/parser_compat/located_value.rb")],
                                                                                                ["semantics_error.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/parser_compat/semantics_error.rb")],
                                                                                                ["syntax_error.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/parser_compat/syntax_error.rb")],
                                                                                            ]))],
                                                                                        ["prototype", new Directory(new Map([
                                                                                                ["helpers.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/prototype/helpers.rb")],
                                                                                                ["node_usage.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/prototype/node_usage.rb")],
                                                                                                ["rb.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/prototype/rb.rb")],
                                                                                                ["rbi.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/prototype/rbi.rb")],
                                                                                                ["runtime", new Directory(new Map([
                                                                                                        ["helpers.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/prototype/runtime/helpers.rb")],
                                                                                                        ["reflection.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/prototype/runtime/reflection.rb")],
                                                                                                        ["value_object_generator.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/prototype/runtime/value_object_generator.rb")],
                                                                                                    ]))],
                                                                                                ["runtime.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/prototype/runtime.rb")],
                                                                                            ]))],
                                                                                        ["repository.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/repository.rb")],
                                                                                        ["resolver", new Directory(new Map([
                                                                                                ["constant_resolver.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/resolver/constant_resolver.rb")],
                                                                                                ["type_name_resolver.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/resolver/type_name_resolver.rb")],
                                                                                            ]))],
                                                                                        ["sorter.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/sorter.rb")],
                                                                                        ["substitution.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/substitution.rb")],
                                                                                        ["subtractor.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/subtractor.rb")],
                                                                                        ["test", new Directory(new Map([
                                                                                                ["errors.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/test/errors.rb")],
                                                                                                ["guaranteed.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/test/guaranteed.rb")],
                                                                                                ["hook.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/test/hook.rb")],
                                                                                                ["observer.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/test/observer.rb")],
                                                                                                ["setup.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/test/setup.rb")],
                                                                                                ["setup_helper.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/test/setup_helper.rb")],
                                                                                                ["tester.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/test/tester.rb")],
                                                                                                ["type_check.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/test/type_check.rb")],
                                                                                            ]))],
                                                                                        ["test.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/test.rb")],
                                                                                        ["types.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/types.rb")],
                                                                                        ["type_alias_dependency.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/type_alias_dependency.rb")],
                                                                                        ["type_alias_regularity.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/type_alias_regularity.rb")],
                                                                                        ["type_name.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/type_name.rb")],
                                                                                        ["unit_test", new Directory(new Map([
                                                                                                ["convertibles.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/unit_test/convertibles.rb")],
                                                                                                ["spy.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/unit_test/spy.rb")],
                                                                                                ["type_assertions.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/unit_test/type_assertions.rb")],
                                                                                                ["with_aliases.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/unit_test/with_aliases.rb")],
                                                                                            ]))],
                                                                                        ["unit_test.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/unit_test.rb")],
                                                                                        ["validator.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/validator.rb")],
                                                                                        ["variance_calculator.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/variance_calculator.rb")],
                                                                                        ["vendorer.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/vendorer.rb")],
                                                                                        ["version.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/version.rb")],
                                                                                        ["writer.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs/writer.rb")],
                                                                                    ]))],
                                                                                ["rbs.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rbs.rb")],
                                                                                ["rdoc", new Directory(new Map([
                                                                                        ["discover.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rdoc/discover.rb")],
                                                                                    ]))],
                                                                                ["rdoc_plugin", new Directory(new Map([
                                                                                        ["parser.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/lib/rdoc_plugin/parser.rb")],
                                                                                    ]))],
                                                                            ]))],
                                                                        ["Rakefile", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/Rakefile")],
                                                                        ["README.md", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/README.md")],
                                                                        ["schema", new Directory(new Map([
                                                                                ["annotation.json", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/schema/annotation.json")],
                                                                                ["comment.json", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/schema/comment.json")],
                                                                                ["decls.json", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/schema/decls.json")],
                                                                                ["function.json", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/schema/function.json")],
                                                                                ["location.json", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/schema/location.json")],
                                                                                ["members.json", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/schema/members.json")],
                                                                                ["methodType.json", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/schema/methodType.json")],
                                                                                ["typeParam.json", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/schema/typeParam.json")],
                                                                                ["types.json", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/schema/types.json")],
                                                                            ]))],
                                                                        ["sig", new Directory(new Map([
                                                                                ["ancestor_builder.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/ancestor_builder.rbs")],
                                                                                ["ancestor_graph.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/ancestor_graph.rbs")],
                                                                                ["annotate", new Directory(new Map([
                                                                                        ["annotations.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/annotate/annotations.rbs")],
                                                                                        ["formatter.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/annotate/formatter.rbs")],
                                                                                        ["rdoc_annotater.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/annotate/rdoc_annotater.rbs")],
                                                                                        ["rdoc_source.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/annotate/rdoc_source.rbs")],
                                                                                    ]))],
                                                                                ["annotation.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/annotation.rbs")],
                                                                                ["buffer.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/buffer.rbs")],
                                                                                ["builtin_names.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/builtin_names.rbs")],
                                                                                ["cli", new Directory(new Map([
                                                                                        ["colored_io.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/cli/colored_io.rbs")],
                                                                                        ["diff.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/cli/diff.rbs")],
                                                                                        ["validate.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/cli/validate.rbs")],
                                                                                    ]))],
                                                                                ["cli.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/cli.rbs")],
                                                                                ["collection", new Directory(new Map([
                                                                                        ["cleaner.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/collection/cleaner.rbs")],
                                                                                        ["config", new Directory(new Map([
                                                                                                ["lockfile.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/collection/config/lockfile.rbs")],
                                                                                                ["lockfile_generator.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/collection/config/lockfile_generator.rbs")],
                                                                                            ]))],
                                                                                        ["config.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/collection/config.rbs")],
                                                                                        ["installer.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/collection/installer.rbs")],
                                                                                        ["sources.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/collection/sources.rbs")],
                                                                                    ]))],
                                                                                ["collection.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/collection.rbs")],
                                                                                ["comment.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/comment.rbs")],
                                                                                ["constant.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/constant.rbs")],
                                                                                ["declarations.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/declarations.rbs")],
                                                                                ["definition.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/definition.rbs")],
                                                                                ["definition_builder.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/definition_builder.rbs")],
                                                                                ["diff.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/diff.rbs")],
                                                                                ["directives.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/directives.rbs")],
                                                                                ["environment.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/environment.rbs")],
                                                                                ["environment_loader.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/environment_loader.rbs")],
                                                                                ["environment_walker.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/environment_walker.rbs")],
                                                                                ["errors.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/errors.rbs")],
                                                                                ["factory.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/factory.rbs")],
                                                                                ["file_finder.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/file_finder.rbs")],
                                                                                ["location.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/location.rbs")],
                                                                                ["locator.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/locator.rbs")],
                                                                                ["manifest.yaml", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/manifest.yaml")],
                                                                                ["members.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/members.rbs")],
                                                                                ["method_builder.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/method_builder.rbs")],
                                                                                ["method_types.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/method_types.rbs")],
                                                                                ["namespace.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/namespace.rbs")],
                                                                                ["parser.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/parser.rbs")],
                                                                                ["prototype", new Directory(new Map([
                                                                                        ["helpers.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/prototype/helpers.rbs")],
                                                                                        ["node_usage.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/prototype/node_usage.rbs")],
                                                                                        ["rb.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/prototype/rb.rbs")],
                                                                                        ["rbi.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/prototype/rbi.rbs")],
                                                                                        ["runtime.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/prototype/runtime.rbs")],
                                                                                    ]))],
                                                                                ["rbs.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/rbs.rbs")],
                                                                                ["rdoc", new Directory(new Map([
                                                                                        ["rbs.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/rdoc/rbs.rbs")],
                                                                                    ]))],
                                                                                ["repository.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/repository.rbs")],
                                                                                ["resolver", new Directory(new Map([
                                                                                        ["constant_resolver.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/resolver/constant_resolver.rbs")],
                                                                                        ["context.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/resolver/context.rbs")],
                                                                                        ["type_name_resolver.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/resolver/type_name_resolver.rbs")],
                                                                                    ]))],
                                                                                ["shims", new Directory(new Map([
                                                                                        ["bundler.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/shims/bundler.rbs")],
                                                                                        ["enumerable.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/shims/enumerable.rbs")],
                                                                                        ["rubygems.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/shims/rubygems.rbs")],
                                                                                    ]))],
                                                                                ["sorter.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/sorter.rbs")],
                                                                                ["substitution.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/substitution.rbs")],
                                                                                ["subtractor.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/subtractor.rbs")],
                                                                                ["test", new Directory(new Map([
                                                                                        ["errors.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/test/errors.rbs")],
                                                                                        ["guranteed.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/test/guranteed.rbs")],
                                                                                        ["type_check.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/test/type_check.rbs")],
                                                                                    ]))],
                                                                                ["test.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/test.rbs")],
                                                                                ["typename.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/typename.rbs")],
                                                                                ["types.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/types.rbs")],
                                                                                ["type_alias_dependency.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/type_alias_dependency.rbs")],
                                                                                ["type_alias_regularity.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/type_alias_regularity.rbs")],
                                                                                ["type_param.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/type_param.rbs")],
                                                                                ["unit_test", new Directory(new Map([
                                                                                        ["convertibles.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/unit_test/convertibles.rbs")],
                                                                                        ["spy.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/unit_test/spy.rbs")],
                                                                                        ["type_assertions.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/unit_test/type_assertions.rbs")],
                                                                                        ["with_aliases.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/unit_test/with_aliases.rbs")],
                                                                                    ]))],
                                                                                ["use_map.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/use_map.rbs")],
                                                                                ["util.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/util.rbs")],
                                                                                ["validator.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/validator.rbs")],
                                                                                ["variance_calculator.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/variance_calculator.rbs")],
                                                                                ["vendorer.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/vendorer.rbs")],
                                                                                ["version.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/version.rbs")],
                                                                                ["writer.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/sig/writer.rbs")],
                                                                            ]))],
                                                                        ["stdlib", new Directory(new Map([
                                                                                ["abbrev", new Directory(new Map([
                                                                                        ["0", new Directory(new Map([
                                                                                                ["abbrev.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/abbrev/0/abbrev.rbs")],
                                                                                                ["array.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/abbrev/0/array.rbs")],
                                                                                            ]))],
                                                                                    ]))],
                                                                                ["base64", new Directory(new Map([
                                                                                        ["0", new Directory(new Map([
                                                                                                ["base64.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/base64/0/base64.rbs")],
                                                                                            ]))],
                                                                                    ]))],
                                                                                ["benchmark", new Directory(new Map([
                                                                                        ["0", new Directory(new Map([
                                                                                                ["benchmark.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/benchmark/0/benchmark.rbs")],
                                                                                            ]))],
                                                                                    ]))],
                                                                                ["bigdecimal", new Directory(new Map([
                                                                                        ["0", new Directory(new Map([
                                                                                                ["big_decimal.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/bigdecimal/0/big_decimal.rbs")],
                                                                                            ]))],
                                                                                    ]))],
                                                                                ["bigdecimal-math", new Directory(new Map([
                                                                                        ["0", new Directory(new Map([
                                                                                                ["big_math.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/bigdecimal-math/0/big_math.rbs")],
                                                                                                ["manifest.yaml", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/bigdecimal-math/0/manifest.yaml")],
                                                                                            ]))],
                                                                                    ]))],
                                                                                ["cgi", new Directory(new Map([
                                                                                        ["0", new Directory(new Map([
                                                                                                ["core.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/cgi/0/core.rbs")],
                                                                                                ["manifest.yaml", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/cgi/0/manifest.yaml")],
                                                                                            ]))],
                                                                                    ]))],
                                                                                ["coverage", new Directory(new Map([
                                                                                        ["0", new Directory(new Map([
                                                                                                ["coverage.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/coverage/0/coverage.rbs")],
                                                                                            ]))],
                                                                                    ]))],
                                                                                ["csv", new Directory(new Map([
                                                                                        ["0", new Directory(new Map([
                                                                                                ["csv.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/csv/0/csv.rbs")],
                                                                                                ["manifest.yaml", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/csv/0/manifest.yaml")],
                                                                                            ]))],
                                                                                    ]))],
                                                                                ["date", new Directory(new Map([
                                                                                        ["0", new Directory(new Map([
                                                                                                ["date.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/date/0/date.rbs")],
                                                                                                ["date_time.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/date/0/date_time.rbs")],
                                                                                                ["time.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/date/0/time.rbs")],
                                                                                            ]))],
                                                                                    ]))],
                                                                                ["dbm", new Directory(new Map([
                                                                                        ["0", new Directory(new Map([
                                                                                                ["dbm.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/dbm/0/dbm.rbs")],
                                                                                            ]))],
                                                                                    ]))],
                                                                                ["delegate", new Directory(new Map([
                                                                                        ["0", new Directory(new Map([
                                                                                                ["delegator.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/delegate/0/delegator.rbs")],
                                                                                                ["kernel.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/delegate/0/kernel.rbs")],
                                                                                                ["simple_delegator.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/delegate/0/simple_delegator.rbs")],
                                                                                            ]))],
                                                                                    ]))],
                                                                                ["did_you_mean", new Directory(new Map([
                                                                                        ["0", new Directory(new Map([
                                                                                                ["did_you_mean.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/did_you_mean/0/did_you_mean.rbs")],
                                                                                            ]))],
                                                                                    ]))],
                                                                                ["digest", new Directory(new Map([
                                                                                        ["0", new Directory(new Map([
                                                                                                ["digest.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/digest/0/digest.rbs")],
                                                                                            ]))],
                                                                                    ]))],
                                                                                ["erb", new Directory(new Map([
                                                                                        ["0", new Directory(new Map([
                                                                                                ["erb.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/erb/0/erb.rbs")],
                                                                                            ]))],
                                                                                    ]))],
                                                                                ["etc", new Directory(new Map([
                                                                                        ["0", new Directory(new Map([
                                                                                                ["etc.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/etc/0/etc.rbs")],
                                                                                            ]))],
                                                                                    ]))],
                                                                                ["fileutils", new Directory(new Map([
                                                                                        ["0", new Directory(new Map([
                                                                                                ["fileutils.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/fileutils/0/fileutils.rbs")],
                                                                                            ]))],
                                                                                    ]))],
                                                                                ["find", new Directory(new Map([
                                                                                        ["0", new Directory(new Map([
                                                                                                ["find.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/find/0/find.rbs")],
                                                                                            ]))],
                                                                                    ]))],
                                                                                ["forwardable", new Directory(new Map([
                                                                                        ["0", new Directory(new Map([
                                                                                                ["forwardable.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/forwardable/0/forwardable.rbs")],
                                                                                            ]))],
                                                                                    ]))],
                                                                                ["io-console", new Directory(new Map([
                                                                                        ["0", new Directory(new Map([
                                                                                                ["io-console.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/io-console/0/io-console.rbs")],
                                                                                            ]))],
                                                                                    ]))],
                                                                                ["ipaddr", new Directory(new Map([
                                                                                        ["0", new Directory(new Map([
                                                                                                ["ipaddr.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/ipaddr/0/ipaddr.rbs")],
                                                                                            ]))],
                                                                                    ]))],
                                                                                ["json", new Directory(new Map([
                                                                                        ["0", new Directory(new Map([
                                                                                                ["json.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/json/0/json.rbs")],
                                                                                            ]))],
                                                                                    ]))],
                                                                                ["logger", new Directory(new Map([
                                                                                        ["0", new Directory(new Map([
                                                                                                ["formatter.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/logger/0/formatter.rbs")],
                                                                                                ["logger.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/logger/0/logger.rbs")],
                                                                                                ["log_device.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/logger/0/log_device.rbs")],
                                                                                                ["manifest.yaml", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/logger/0/manifest.yaml")],
                                                                                                ["period.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/logger/0/period.rbs")],
                                                                                                ["severity.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/logger/0/severity.rbs")],
                                                                                            ]))],
                                                                                    ]))],
                                                                                ["minitest", new Directory(new Map([
                                                                                        ["0", new Directory(new Map([
                                                                                                ["kernel.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/minitest/0/kernel.rbs")],
                                                                                                ["manifest.yaml", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/minitest/0/manifest.yaml")],
                                                                                                ["minitest", new Directory(new Map([
                                                                                                        ["abstract_reporter.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/minitest/0/minitest/abstract_reporter.rbs")],
                                                                                                        ["assertion.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/minitest/0/minitest/assertion.rbs")],
                                                                                                        ["assertions.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/minitest/0/minitest/assertions.rbs")],
                                                                                                        ["backtrace_filter.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/minitest/0/minitest/backtrace_filter.rbs")],
                                                                                                        ["benchmark.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/minitest/0/minitest/benchmark.rbs")],
                                                                                                        ["bench_spec.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/minitest/0/minitest/bench_spec.rbs")],
                                                                                                        ["composite_reporter.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/minitest/0/minitest/composite_reporter.rbs")],
                                                                                                        ["expectation.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/minitest/0/minitest/expectation.rbs")],
                                                                                                        ["expectations.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/minitest/0/minitest/expectations.rbs")],
                                                                                                        ["guard.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/minitest/0/minitest/guard.rbs")],
                                                                                                        ["mock.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/minitest/0/minitest/mock.rbs")],
                                                                                                        ["parallel", new Directory(new Map([
                                                                                                                ["executor.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/minitest/0/minitest/parallel/executor.rbs")],
                                                                                                                ["test", new Directory(new Map([
                                                                                                                        ["class_methods.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/minitest/0/minitest/parallel/test/class_methods.rbs")],
                                                                                                                    ]))],
                                                                                                                ["test.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/minitest/0/minitest/parallel/test.rbs")],
                                                                                                            ]))],
                                                                                                        ["parallel.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/minitest/0/minitest/parallel.rbs")],
                                                                                                        ["pride_io.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/minitest/0/minitest/pride_io.rbs")],
                                                                                                        ["pride_lol.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/minitest/0/minitest/pride_lol.rbs")],
                                                                                                        ["progress_reporter.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/minitest/0/minitest/progress_reporter.rbs")],
                                                                                                        ["reportable.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/minitest/0/minitest/reportable.rbs")],
                                                                                                        ["reporter.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/minitest/0/minitest/reporter.rbs")],
                                                                                                        ["result.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/minitest/0/minitest/result.rbs")],
                                                                                                        ["runnable.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/minitest/0/minitest/runnable.rbs")],
                                                                                                        ["skip.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/minitest/0/minitest/skip.rbs")],
                                                                                                        ["spec", new Directory(new Map([
                                                                                                                ["dsl", new Directory(new Map([
                                                                                                                        ["instance_methods.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/minitest/0/minitest/spec/dsl/instance_methods.rbs")],
                                                                                                                    ]))],
                                                                                                                ["dsl.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/minitest/0/minitest/spec/dsl.rbs")],
                                                                                                            ]))],
                                                                                                        ["spec.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/minitest/0/minitest/spec.rbs")],
                                                                                                        ["statistics_reporter.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/minitest/0/minitest/statistics_reporter.rbs")],
                                                                                                        ["summary_reporter.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/minitest/0/minitest/summary_reporter.rbs")],
                                                                                                        ["test", new Directory(new Map([
                                                                                                                ["lifecycle_hooks.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/minitest/0/minitest/test/lifecycle_hooks.rbs")],
                                                                                                            ]))],
                                                                                                        ["test.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/minitest/0/minitest/test.rbs")],
                                                                                                        ["unexpected_error.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/minitest/0/minitest/unexpected_error.rbs")],
                                                                                                        ["unit", new Directory(new Map([
                                                                                                                ["test_case.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/minitest/0/minitest/unit/test_case.rbs")],
                                                                                                            ]))],
                                                                                                        ["unit.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/minitest/0/minitest/unit.rbs")],
                                                                                                    ]))],
                                                                                                ["minitest.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/minitest/0/minitest.rbs")],
                                                                                            ]))],
                                                                                    ]))],
                                                                                ["monitor", new Directory(new Map([
                                                                                        ["0", new Directory(new Map([
                                                                                                ["monitor.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/monitor/0/monitor.rbs")],
                                                                                            ]))],
                                                                                    ]))],
                                                                                ["mutex_m", new Directory(new Map([
                                                                                        ["0", new Directory(new Map([
                                                                                                ["mutex_m.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/mutex_m/0/mutex_m.rbs")],
                                                                                            ]))],
                                                                                    ]))],
                                                                                ["net-http", new Directory(new Map([
                                                                                        ["0", new Directory(new Map([
                                                                                                ["manifest.yaml", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/net-http/0/manifest.yaml")],
                                                                                                ["net-http.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/net-http/0/net-http.rbs")],
                                                                                            ]))],
                                                                                    ]))],
                                                                                ["net-protocol", new Directory(new Map([
                                                                                        ["0", new Directory(new Map([
                                                                                                ["manifest.yaml", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/net-protocol/0/manifest.yaml")],
                                                                                                ["net-protocol.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/net-protocol/0/net-protocol.rbs")],
                                                                                            ]))],
                                                                                    ]))],
                                                                                ["net-smtp", new Directory(new Map([
                                                                                        ["0", new Directory(new Map([
                                                                                                ["manifest.yaml", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/net-smtp/0/manifest.yaml")],
                                                                                                ["net-smtp.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/net-smtp/0/net-smtp.rbs")],
                                                                                            ]))],
                                                                                    ]))],
                                                                                ["nkf", new Directory(new Map([
                                                                                        ["0", new Directory(new Map([
                                                                                                ["nkf.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/nkf/0/nkf.rbs")],
                                                                                            ]))],
                                                                                    ]))],
                                                                                ["objspace", new Directory(new Map([
                                                                                        ["0", new Directory(new Map([
                                                                                                ["objspace.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/objspace/0/objspace.rbs")],
                                                                                            ]))],
                                                                                    ]))],
                                                                                ["observable", new Directory(new Map([
                                                                                        ["0", new Directory(new Map([
                                                                                                ["observable.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/observable/0/observable.rbs")],
                                                                                            ]))],
                                                                                    ]))],
                                                                                ["open-uri", new Directory(new Map([
                                                                                        ["0", new Directory(new Map([
                                                                                                ["manifest.yaml", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/open-uri/0/manifest.yaml")],
                                                                                                ["open-uri.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/open-uri/0/open-uri.rbs")],
                                                                                            ]))],
                                                                                    ]))],
                                                                                ["openssl", new Directory(new Map([
                                                                                        ["0", new Directory(new Map([
                                                                                                ["manifest.yaml", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/openssl/0/manifest.yaml")],
                                                                                                ["openssl.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/openssl/0/openssl.rbs")],
                                                                                            ]))],
                                                                                    ]))],
                                                                                ["optparse", new Directory(new Map([
                                                                                        ["0", new Directory(new Map([
                                                                                                ["optparse.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/optparse/0/optparse.rbs")],
                                                                                            ]))],
                                                                                    ]))],
                                                                                ["pathname", new Directory(new Map([
                                                                                        ["0", new Directory(new Map([
                                                                                                ["pathname.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/pathname/0/pathname.rbs")],
                                                                                            ]))],
                                                                                    ]))],
                                                                                ["pp", new Directory(new Map([
                                                                                        ["0", new Directory(new Map([
                                                                                                ["manifest.yaml", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/pp/0/manifest.yaml")],
                                                                                                ["pp.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/pp/0/pp.rbs")],
                                                                                            ]))],
                                                                                    ]))],
                                                                                ["prettyprint", new Directory(new Map([
                                                                                        ["0", new Directory(new Map([
                                                                                                ["prettyprint.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/prettyprint/0/prettyprint.rbs")],
                                                                                            ]))],
                                                                                    ]))],
                                                                                ["pstore", new Directory(new Map([
                                                                                        ["0", new Directory(new Map([
                                                                                                ["pstore.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/pstore/0/pstore.rbs")],
                                                                                            ]))],
                                                                                    ]))],
                                                                                ["psych", new Directory(new Map([
                                                                                        ["0", new Directory(new Map([
                                                                                                ["dbm.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/psych/0/dbm.rbs")],
                                                                                                ["manifest.yaml", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/psych/0/manifest.yaml")],
                                                                                                ["psych.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/psych/0/psych.rbs")],
                                                                                                ["store.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/psych/0/store.rbs")],
                                                                                            ]))],
                                                                                    ]))],
                                                                                ["pty", new Directory(new Map([
                                                                                        ["0", new Directory(new Map([
                                                                                                ["pty.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/pty/0/pty.rbs")],
                                                                                            ]))],
                                                                                    ]))],
                                                                                ["rdoc", new Directory(new Map([
                                                                                        ["0", new Directory(new Map([
                                                                                                ["code_object.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/rdoc/0/code_object.rbs")],
                                                                                                ["comment.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/rdoc/0/comment.rbs")],
                                                                                                ["context.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/rdoc/0/context.rbs")],
                                                                                                ["markup.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/rdoc/0/markup.rbs")],
                                                                                                ["parser.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/rdoc/0/parser.rbs")],
                                                                                                ["rdoc.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/rdoc/0/rdoc.rbs")],
                                                                                                ["ri.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/rdoc/0/ri.rbs")],
                                                                                                ["store.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/rdoc/0/store.rbs")],
                                                                                                ["top_level.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/rdoc/0/top_level.rbs")],
                                                                                            ]))],
                                                                                    ]))],
                                                                                ["resolv", new Directory(new Map([
                                                                                        ["0", new Directory(new Map([
                                                                                                ["manifest.yaml", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/resolv/0/manifest.yaml")],
                                                                                                ["resolv.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/resolv/0/resolv.rbs")],
                                                                                            ]))],
                                                                                    ]))],
                                                                                ["ripper", new Directory(new Map([
                                                                                        ["0", new Directory(new Map([
                                                                                                ["ripper.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/ripper/0/ripper.rbs")],
                                                                                            ]))],
                                                                                    ]))],
                                                                                ["securerandom", new Directory(new Map([
                                                                                        ["0", new Directory(new Map([
                                                                                                ["securerandom.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/securerandom/0/securerandom.rbs")],
                                                                                            ]))],
                                                                                    ]))],
                                                                                ["shellwords", new Directory(new Map([
                                                                                        ["0", new Directory(new Map([
                                                                                                ["shellwords.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/shellwords/0/shellwords.rbs")],
                                                                                            ]))],
                                                                                    ]))],
                                                                                ["singleton", new Directory(new Map([
                                                                                        ["0", new Directory(new Map([
                                                                                                ["singleton.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/singleton/0/singleton.rbs")],
                                                                                            ]))],
                                                                                    ]))],
                                                                                ["socket", new Directory(new Map([
                                                                                        ["0", new Directory(new Map([
                                                                                                ["addrinfo.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/socket/0/addrinfo.rbs")],
                                                                                                ["basic_socket.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/socket/0/basic_socket.rbs")],
                                                                                                ["constants.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/socket/0/constants.rbs")],
                                                                                                ["ip_socket.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/socket/0/ip_socket.rbs")],
                                                                                                ["socket.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/socket/0/socket.rbs")],
                                                                                                ["socket_error.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/socket/0/socket_error.rbs")],
                                                                                                ["tcp_server.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/socket/0/tcp_server.rbs")],
                                                                                                ["tcp_socket.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/socket/0/tcp_socket.rbs")],
                                                                                                ["udp_socket.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/socket/0/udp_socket.rbs")],
                                                                                                ["unix_server.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/socket/0/unix_server.rbs")],
                                                                                                ["unix_socket.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/socket/0/unix_socket.rbs")],
                                                                                            ]))],
                                                                                    ]))],
                                                                                ["strscan", new Directory(new Map([
                                                                                        ["0", new Directory(new Map([
                                                                                                ["string_scanner.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/strscan/0/string_scanner.rbs")],
                                                                                            ]))],
                                                                                    ]))],
                                                                                ["tempfile", new Directory(new Map([
                                                                                        ["0", new Directory(new Map([
                                                                                                ["tempfile.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/tempfile/0/tempfile.rbs")],
                                                                                            ]))],
                                                                                    ]))],
                                                                                ["time", new Directory(new Map([
                                                                                        ["0", new Directory(new Map([
                                                                                                ["time.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/time/0/time.rbs")],
                                                                                            ]))],
                                                                                    ]))],
                                                                                ["timeout", new Directory(new Map([
                                                                                        ["0", new Directory(new Map([
                                                                                                ["timeout.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/timeout/0/timeout.rbs")],
                                                                                            ]))],
                                                                                    ]))],
                                                                                ["tmpdir", new Directory(new Map([
                                                                                        ["0", new Directory(new Map([
                                                                                                ["tmpdir.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/tmpdir/0/tmpdir.rbs")],
                                                                                            ]))],
                                                                                    ]))],
                                                                                ["tsort", new Directory(new Map([
                                                                                        ["0", new Directory(new Map([
                                                                                                ["cyclic.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/tsort/0/cyclic.rbs")],
                                                                                                ["interfaces.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/tsort/0/interfaces.rbs")],
                                                                                                ["tsort.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/tsort/0/tsort.rbs")],
                                                                                            ]))],
                                                                                    ]))],
                                                                                ["uri", new Directory(new Map([
                                                                                        ["0", new Directory(new Map([
                                                                                                ["common.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/uri/0/common.rbs")],
                                                                                                ["file.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/uri/0/file.rbs")],
                                                                                                ["ftp.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/uri/0/ftp.rbs")],
                                                                                                ["generic.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/uri/0/generic.rbs")],
                                                                                                ["http.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/uri/0/http.rbs")],
                                                                                                ["https.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/uri/0/https.rbs")],
                                                                                                ["ldap.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/uri/0/ldap.rbs")],
                                                                                                ["ldaps.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/uri/0/ldaps.rbs")],
                                                                                                ["mailto.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/uri/0/mailto.rbs")],
                                                                                                ["rfc2396_parser.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/uri/0/rfc2396_parser.rbs")],
                                                                                                ["rfc3986_parser.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/uri/0/rfc3986_parser.rbs")],
                                                                                                ["ws.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/uri/0/ws.rbs")],
                                                                                                ["wss.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/uri/0/wss.rbs")],
                                                                                            ]))],
                                                                                    ]))],
                                                                                ["yaml", new Directory(new Map([
                                                                                        ["0", new Directory(new Map([
                                                                                                ["manifest.yaml", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/yaml/0/manifest.yaml")],
                                                                                                ["yaml.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/yaml/0/yaml.rbs")],
                                                                                            ]))],
                                                                                    ]))],
                                                                                ["zlib", new Directory(new Map([
                                                                                        ["0", new Directory(new Map([
                                                                                                ["buf_error.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/zlib/0/buf_error.rbs")],
                                                                                                ["data_error.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/zlib/0/data_error.rbs")],
                                                                                                ["deflate.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/zlib/0/deflate.rbs")],
                                                                                                ["error.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/zlib/0/error.rbs")],
                                                                                                ["gzip_file", new Directory(new Map([
                                                                                                        ["crc_error.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/zlib/0/gzip_file/crc_error.rbs")],
                                                                                                        ["error.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/zlib/0/gzip_file/error.rbs")],
                                                                                                        ["length_error.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/zlib/0/gzip_file/length_error.rbs")],
                                                                                                        ["no_footer.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/zlib/0/gzip_file/no_footer.rbs")],
                                                                                                    ]))],
                                                                                                ["gzip_file.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/zlib/0/gzip_file.rbs")],
                                                                                                ["gzip_reader.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/zlib/0/gzip_reader.rbs")],
                                                                                                ["gzip_writer.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/zlib/0/gzip_writer.rbs")],
                                                                                                ["inflate.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/zlib/0/inflate.rbs")],
                                                                                                ["mem_error.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/zlib/0/mem_error.rbs")],
                                                                                                ["need_dict.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/zlib/0/need_dict.rbs")],
                                                                                                ["stream_end.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/zlib/0/stream_end.rbs")],
                                                                                                ["stream_error.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/zlib/0/stream_error.rbs")],
                                                                                                ["version_error.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/zlib/0/version_error.rbs")],
                                                                                                ["zlib.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/zlib/0/zlib.rbs")],
                                                                                                ["zstream.rbs", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/stdlib/zlib/0/zstream.rbs")],
                                                                                            ]))],
                                                                                    ]))],
                                                                            ]))],
                                                                        ["Steepfile", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rbs-3.4.0/Steepfile")],
                                                                    ]))],
                                                                ["rdoc-6.6.3.1", new Directory(new Map([
                                                                        ["exe", new Directory(new Map([
                                                                                ["rdoc", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rdoc-6.6.3.1/exe/rdoc")],
                                                                                ["ri", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rdoc-6.6.3.1/exe/ri")],
                                                                            ]))],
                                                                    ]))],
                                                                ["readline-0.0.4", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/readline-0.0.4")],
                                                                ["reline-0.5.7", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/reline-0.5.7")],
                                                                ["resolv-0.3.0", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/resolv-0.3.0")],
                                                                ["resolv-replace-0.1.1", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/resolv-replace-0.1.1")],
                                                                ["rexml-3.2.8", new Directory(new Map([
                                                                        ["doc", new Directory(new Map([
                                                                                ["rexml", new Directory(new Map([
                                                                                        ["context.rdoc", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rexml-3.2.8/doc/rexml/context.rdoc")],
                                                                                        ["tasks", new Directory(new Map([
                                                                                                ["rdoc", new Directory(new Map([
                                                                                                        ["child.rdoc", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rexml-3.2.8/doc/rexml/tasks/rdoc/child.rdoc")],
                                                                                                        ["document.rdoc", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rexml-3.2.8/doc/rexml/tasks/rdoc/document.rdoc")],
                                                                                                        ["element.rdoc", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rexml-3.2.8/doc/rexml/tasks/rdoc/element.rdoc")],
                                                                                                        ["node.rdoc", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rexml-3.2.8/doc/rexml/tasks/rdoc/node.rdoc")],
                                                                                                        ["parent.rdoc", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rexml-3.2.8/doc/rexml/tasks/rdoc/parent.rdoc")],
                                                                                                    ]))],
                                                                                                ["tocs", new Directory(new Map([
                                                                                                        ["child_toc.rdoc", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rexml-3.2.8/doc/rexml/tasks/tocs/child_toc.rdoc")],
                                                                                                        ["document_toc.rdoc", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rexml-3.2.8/doc/rexml/tasks/tocs/document_toc.rdoc")],
                                                                                                        ["element_toc.rdoc", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rexml-3.2.8/doc/rexml/tasks/tocs/element_toc.rdoc")],
                                                                                                        ["master_toc.rdoc", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rexml-3.2.8/doc/rexml/tasks/tocs/master_toc.rdoc")],
                                                                                                        ["node_toc.rdoc", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rexml-3.2.8/doc/rexml/tasks/tocs/node_toc.rdoc")],
                                                                                                        ["parent_toc.rdoc", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rexml-3.2.8/doc/rexml/tasks/tocs/parent_toc.rdoc")],
                                                                                                    ]))],
                                                                                            ]))],
                                                                                        ["tutorial.rdoc", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rexml-3.2.8/doc/rexml/tutorial.rdoc")],
                                                                                    ]))],
                                                                            ]))],
                                                                        ["lib", new Directory(new Map([
                                                                                ["rexml", new Directory(new Map([
                                                                                        ["attlistdecl.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rexml-3.2.8/lib/rexml/attlistdecl.rb")],
                                                                                        ["attribute.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rexml-3.2.8/lib/rexml/attribute.rb")],
                                                                                        ["cdata.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rexml-3.2.8/lib/rexml/cdata.rb")],
                                                                                        ["child.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rexml-3.2.8/lib/rexml/child.rb")],
                                                                                        ["comment.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rexml-3.2.8/lib/rexml/comment.rb")],
                                                                                        ["doctype.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rexml-3.2.8/lib/rexml/doctype.rb")],
                                                                                        ["document.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rexml-3.2.8/lib/rexml/document.rb")],
                                                                                        ["dtd", new Directory(new Map([
                                                                                                ["attlistdecl.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rexml-3.2.8/lib/rexml/dtd/attlistdecl.rb")],
                                                                                                ["dtd.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rexml-3.2.8/lib/rexml/dtd/dtd.rb")],
                                                                                                ["elementdecl.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rexml-3.2.8/lib/rexml/dtd/elementdecl.rb")],
                                                                                                ["entitydecl.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rexml-3.2.8/lib/rexml/dtd/entitydecl.rb")],
                                                                                                ["notationdecl.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rexml-3.2.8/lib/rexml/dtd/notationdecl.rb")],
                                                                                            ]))],
                                                                                        ["element.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rexml-3.2.8/lib/rexml/element.rb")],
                                                                                        ["encoding.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rexml-3.2.8/lib/rexml/encoding.rb")],
                                                                                        ["entity.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rexml-3.2.8/lib/rexml/entity.rb")],
                                                                                        ["formatters", new Directory(new Map([
                                                                                                ["default.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rexml-3.2.8/lib/rexml/formatters/default.rb")],
                                                                                                ["pretty.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rexml-3.2.8/lib/rexml/formatters/pretty.rb")],
                                                                                                ["transitive.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rexml-3.2.8/lib/rexml/formatters/transitive.rb")],
                                                                                            ]))],
                                                                                        ["functions.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rexml-3.2.8/lib/rexml/functions.rb")],
                                                                                        ["instruction.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rexml-3.2.8/lib/rexml/instruction.rb")],
                                                                                        ["light", new Directory(new Map([
                                                                                                ["node.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rexml-3.2.8/lib/rexml/light/node.rb")],
                                                                                            ]))],
                                                                                        ["namespace.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rexml-3.2.8/lib/rexml/namespace.rb")],
                                                                                        ["node.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rexml-3.2.8/lib/rexml/node.rb")],
                                                                                        ["output.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rexml-3.2.8/lib/rexml/output.rb")],
                                                                                        ["parent.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rexml-3.2.8/lib/rexml/parent.rb")],
                                                                                        ["parseexception.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rexml-3.2.8/lib/rexml/parseexception.rb")],
                                                                                        ["parsers", new Directory(new Map([
                                                                                                ["baseparser.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rexml-3.2.8/lib/rexml/parsers/baseparser.rb")],
                                                                                                ["lightparser.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rexml-3.2.8/lib/rexml/parsers/lightparser.rb")],
                                                                                                ["pullparser.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rexml-3.2.8/lib/rexml/parsers/pullparser.rb")],
                                                                                                ["sax2parser.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rexml-3.2.8/lib/rexml/parsers/sax2parser.rb")],
                                                                                                ["streamparser.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rexml-3.2.8/lib/rexml/parsers/streamparser.rb")],
                                                                                                ["treeparser.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rexml-3.2.8/lib/rexml/parsers/treeparser.rb")],
                                                                                                ["ultralightparser.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rexml-3.2.8/lib/rexml/parsers/ultralightparser.rb")],
                                                                                                ["xpathparser.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rexml-3.2.8/lib/rexml/parsers/xpathparser.rb")],
                                                                                            ]))],
                                                                                        ["quickpath.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rexml-3.2.8/lib/rexml/quickpath.rb")],
                                                                                        ["rexml.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rexml-3.2.8/lib/rexml/rexml.rb")],
                                                                                        ["sax2listener.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rexml-3.2.8/lib/rexml/sax2listener.rb")],
                                                                                        ["security.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rexml-3.2.8/lib/rexml/security.rb")],
                                                                                        ["source.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rexml-3.2.8/lib/rexml/source.rb")],
                                                                                        ["streamlistener.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rexml-3.2.8/lib/rexml/streamlistener.rb")],
                                                                                        ["text.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rexml-3.2.8/lib/rexml/text.rb")],
                                                                                        ["undefinednamespaceexception.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rexml-3.2.8/lib/rexml/undefinednamespaceexception.rb")],
                                                                                        ["validation", new Directory(new Map([
                                                                                                ["relaxng.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rexml-3.2.8/lib/rexml/validation/relaxng.rb")],
                                                                                                ["validation.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rexml-3.2.8/lib/rexml/validation/validation.rb")],
                                                                                                ["validationexception.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rexml-3.2.8/lib/rexml/validation/validationexception.rb")],
                                                                                            ]))],
                                                                                        ["xmldecl.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rexml-3.2.8/lib/rexml/xmldecl.rb")],
                                                                                        ["xmltokens.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rexml-3.2.8/lib/rexml/xmltokens.rb")],
                                                                                        ["xpath.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rexml-3.2.8/lib/rexml/xpath.rb")],
                                                                                        ["xpath_parser.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rexml-3.2.8/lib/rexml/xpath_parser.rb")],
                                                                                    ]))],
                                                                                ["rexml.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rexml-3.2.8/lib/rexml.rb")],
                                                                            ]))],
                                                                        ["LICENSE.txt", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rexml-3.2.8/LICENSE.txt")],
                                                                        ["NEWS.md", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rexml-3.2.8/NEWS.md")],
                                                                        ["README.md", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rexml-3.2.8/README.md")],
                                                                    ]))],
                                                                ["rinda-0.2.0", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rinda-0.2.0")],
                                                                ["rss-0.3.0", new Directory(new Map([
                                                                        ["lib", new Directory(new Map([
                                                                                ["rss", new Directory(new Map([
                                                                                        ["0.9.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rss-0.3.0/lib/rss/0.9.rb")],
                                                                                        ["1.0.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rss-0.3.0/lib/rss/1.0.rb")],
                                                                                        ["2.0.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rss-0.3.0/lib/rss/2.0.rb")],
                                                                                        ["atom.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rss-0.3.0/lib/rss/atom.rb")],
                                                                                        ["content", new Directory(new Map([
                                                                                                ["1.0.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rss-0.3.0/lib/rss/content/1.0.rb")],
                                                                                                ["2.0.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rss-0.3.0/lib/rss/content/2.0.rb")],
                                                                                            ]))],
                                                                                        ["content.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rss-0.3.0/lib/rss/content.rb")],
                                                                                        ["converter.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rss-0.3.0/lib/rss/converter.rb")],
                                                                                        ["dublincore", new Directory(new Map([
                                                                                                ["1.0.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rss-0.3.0/lib/rss/dublincore/1.0.rb")],
                                                                                                ["2.0.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rss-0.3.0/lib/rss/dublincore/2.0.rb")],
                                                                                                ["atom.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rss-0.3.0/lib/rss/dublincore/atom.rb")],
                                                                                            ]))],
                                                                                        ["dublincore.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rss-0.3.0/lib/rss/dublincore.rb")],
                                                                                        ["image.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rss-0.3.0/lib/rss/image.rb")],
                                                                                        ["itunes.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rss-0.3.0/lib/rss/itunes.rb")],
                                                                                        ["maker", new Directory(new Map([
                                                                                                ["0.9.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rss-0.3.0/lib/rss/maker/0.9.rb")],
                                                                                                ["1.0.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rss-0.3.0/lib/rss/maker/1.0.rb")],
                                                                                                ["2.0.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rss-0.3.0/lib/rss/maker/2.0.rb")],
                                                                                                ["atom.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rss-0.3.0/lib/rss/maker/atom.rb")],
                                                                                                ["base.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rss-0.3.0/lib/rss/maker/base.rb")],
                                                                                                ["content.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rss-0.3.0/lib/rss/maker/content.rb")],
                                                                                                ["dublincore.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rss-0.3.0/lib/rss/maker/dublincore.rb")],
                                                                                                ["entry.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rss-0.3.0/lib/rss/maker/entry.rb")],
                                                                                                ["feed.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rss-0.3.0/lib/rss/maker/feed.rb")],
                                                                                                ["image.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rss-0.3.0/lib/rss/maker/image.rb")],
                                                                                                ["itunes.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rss-0.3.0/lib/rss/maker/itunes.rb")],
                                                                                                ["slash.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rss-0.3.0/lib/rss/maker/slash.rb")],
                                                                                                ["syndication.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rss-0.3.0/lib/rss/maker/syndication.rb")],
                                                                                                ["taxonomy.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rss-0.3.0/lib/rss/maker/taxonomy.rb")],
                                                                                                ["trackback.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rss-0.3.0/lib/rss/maker/trackback.rb")],
                                                                                            ]))],
                                                                                        ["maker.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rss-0.3.0/lib/rss/maker.rb")],
                                                                                        ["parser.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rss-0.3.0/lib/rss/parser.rb")],
                                                                                        ["rexmlparser.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rss-0.3.0/lib/rss/rexmlparser.rb")],
                                                                                        ["rss.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rss-0.3.0/lib/rss/rss.rb")],
                                                                                        ["slash.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rss-0.3.0/lib/rss/slash.rb")],
                                                                                        ["syndication.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rss-0.3.0/lib/rss/syndication.rb")],
                                                                                        ["taxonomy.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rss-0.3.0/lib/rss/taxonomy.rb")],
                                                                                        ["trackback.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rss-0.3.0/lib/rss/trackback.rb")],
                                                                                        ["utils.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rss-0.3.0/lib/rss/utils.rb")],
                                                                                        ["version.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rss-0.3.0/lib/rss/version.rb")],
                                                                                        ["xml-stylesheet.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rss-0.3.0/lib/rss/xml-stylesheet.rb")],
                                                                                        ["xml.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rss-0.3.0/lib/rss/xml.rb")],
                                                                                        ["xmlparser.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rss-0.3.0/lib/rss/xmlparser.rb")],
                                                                                        ["xmlscanner.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rss-0.3.0/lib/rss/xmlscanner.rb")],
                                                                                    ]))],
                                                                                ["rss.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rss-0.3.0/lib/rss.rb")],
                                                                            ]))],
                                                                        ["LICENSE.txt", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rss-0.3.0/LICENSE.txt")],
                                                                        ["NEWS.md", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rss-0.3.0/NEWS.md")],
                                                                        ["README.md", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/rss-0.3.0/README.md")],
                                                                    ]))],
                                                                ["ruby2_keywords-0.0.5", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/ruby2_keywords-0.0.5")],
                                                                ["securerandom-0.3.1", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/securerandom-0.3.1")],
                                                                ["set-1.1.0", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/set-1.1.0")],
                                                                ["shellwords-0.2.0", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/shellwords-0.2.0")],
                                                                ["singleton-0.2.0", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/singleton-0.2.0")],
                                                                ["syntax_suggest-2.0.0", new Directory(new Map([
                                                                        ["exe", new Directory(new Map([
                                                                                ["syntax_suggest", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/syntax_suggest-2.0.0/exe/syntax_suggest")],
                                                                            ]))],
                                                                    ]))],
                                                                ["tempfile-0.2.1", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/tempfile-0.2.1")],
                                                                ["test-unit-3.6.1", new Directory(new Map([
                                                                        ["BSDL", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/test-unit-3.6.1/BSDL")],
                                                                        ["COPYING", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/test-unit-3.6.1/COPYING")],
                                                                        ["doc", new Directory(new Map([
                                                                                ["text", new Directory(new Map([
                                                                                        ["getting-started.md", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/test-unit-3.6.1/doc/text/getting-started.md")],
                                                                                        ["how-to.md", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/test-unit-3.6.1/doc/text/how-to.md")],
                                                                                        ["news.md", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/test-unit-3.6.1/doc/text/news.md")],
                                                                                    ]))],
                                                                            ]))],
                                                                        ["lib", new Directory(new Map([
                                                                                ["test", new Directory(new Map([
                                                                                        ["unit", new Directory(new Map([
                                                                                                ["assertion-failed-error.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/test-unit-3.6.1/lib/test/unit/assertion-failed-error.rb")],
                                                                                                ["assertions.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/test-unit-3.6.1/lib/test/unit/assertions.rb")],
                                                                                                ["attribute-matcher.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/test-unit-3.6.1/lib/test/unit/attribute-matcher.rb")],
                                                                                                ["attribute.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/test-unit-3.6.1/lib/test/unit/attribute.rb")],
                                                                                                ["auto-runner-loader.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/test-unit-3.6.1/lib/test/unit/auto-runner-loader.rb")],
                                                                                                ["autorunner.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/test-unit-3.6.1/lib/test/unit/autorunner.rb")],
                                                                                                ["code-snippet-fetcher.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/test-unit-3.6.1/lib/test/unit/code-snippet-fetcher.rb")],
                                                                                                ["collector", new Directory(new Map([
                                                                                                        ["descendant.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/test-unit-3.6.1/lib/test/unit/collector/descendant.rb")],
                                                                                                        ["dir.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/test-unit-3.6.1/lib/test/unit/collector/dir.rb")],
                                                                                                        ["load.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/test-unit-3.6.1/lib/test/unit/collector/load.rb")],
                                                                                                        ["objectspace.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/test-unit-3.6.1/lib/test/unit/collector/objectspace.rb")],
                                                                                                        ["xml.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/test-unit-3.6.1/lib/test/unit/collector/xml.rb")],
                                                                                                    ]))],
                                                                                                ["collector.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/test-unit-3.6.1/lib/test/unit/collector.rb")],
                                                                                                ["color-scheme.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/test-unit-3.6.1/lib/test/unit/color-scheme.rb")],
                                                                                                ["color.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/test-unit-3.6.1/lib/test/unit/color.rb")],
                                                                                                ["data-sets.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/test-unit-3.6.1/lib/test/unit/data-sets.rb")],
                                                                                                ["data.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/test-unit-3.6.1/lib/test/unit/data.rb")],
                                                                                                ["diff.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/test-unit-3.6.1/lib/test/unit/diff.rb")],
                                                                                                ["error.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/test-unit-3.6.1/lib/test/unit/error.rb")],
                                                                                                ["exception-handler.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/test-unit-3.6.1/lib/test/unit/exception-handler.rb")],
                                                                                                ["failure.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/test-unit-3.6.1/lib/test/unit/failure.rb")],
                                                                                                ["fault-location-detector.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/test-unit-3.6.1/lib/test/unit/fault-location-detector.rb")],
                                                                                                ["fixture.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/test-unit-3.6.1/lib/test/unit/fixture.rb")],
                                                                                                ["notification.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/test-unit-3.6.1/lib/test/unit/notification.rb")],
                                                                                                ["omission.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/test-unit-3.6.1/lib/test/unit/omission.rb")],
                                                                                                ["pending.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/test-unit-3.6.1/lib/test/unit/pending.rb")],
                                                                                                ["priority.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/test-unit-3.6.1/lib/test/unit/priority.rb")],
                                                                                                ["runner", new Directory(new Map([
                                                                                                        ["console.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/test-unit-3.6.1/lib/test/unit/runner/console.rb")],
                                                                                                        ["emacs.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/test-unit-3.6.1/lib/test/unit/runner/emacs.rb")],
                                                                                                        ["xml.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/test-unit-3.6.1/lib/test/unit/runner/xml.rb")],
                                                                                                    ]))],
                                                                                                ["test-suite-creator.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/test-unit-3.6.1/lib/test/unit/test-suite-creator.rb")],
                                                                                                ["testcase.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/test-unit-3.6.1/lib/test/unit/testcase.rb")],
                                                                                                ["testresult.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/test-unit-3.6.1/lib/test/unit/testresult.rb")],
                                                                                                ["testsuite.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/test-unit-3.6.1/lib/test/unit/testsuite.rb")],
                                                                                                ["ui", new Directory(new Map([
                                                                                                        ["console", new Directory(new Map([
                                                                                                                ["outputlevel.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/test-unit-3.6.1/lib/test/unit/ui/console/outputlevel.rb")],
                                                                                                                ["testrunner.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/test-unit-3.6.1/lib/test/unit/ui/console/testrunner.rb")],
                                                                                                            ]))],
                                                                                                        ["emacs", new Directory(new Map([
                                                                                                                ["testrunner.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/test-unit-3.6.1/lib/test/unit/ui/emacs/testrunner.rb")],
                                                                                                            ]))],
                                                                                                        ["testrunner.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/test-unit-3.6.1/lib/test/unit/ui/testrunner.rb")],
                                                                                                        ["testrunnermediator.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/test-unit-3.6.1/lib/test/unit/ui/testrunnermediator.rb")],
                                                                                                        ["testrunnerutilities.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/test-unit-3.6.1/lib/test/unit/ui/testrunnerutilities.rb")],
                                                                                                        ["xml", new Directory(new Map([
                                                                                                                ["testrunner.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/test-unit-3.6.1/lib/test/unit/ui/xml/testrunner.rb")],
                                                                                                            ]))],
                                                                                                    ]))],
                                                                                                ["util", new Directory(new Map([
                                                                                                        ["backtracefilter.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/test-unit-3.6.1/lib/test/unit/util/backtracefilter.rb")],
                                                                                                        ["memory-usage.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/test-unit-3.6.1/lib/test/unit/util/memory-usage.rb")],
                                                                                                        ["method-owner-finder.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/test-unit-3.6.1/lib/test/unit/util/method-owner-finder.rb")],
                                                                                                        ["observable.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/test-unit-3.6.1/lib/test/unit/util/observable.rb")],
                                                                                                        ["output.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/test-unit-3.6.1/lib/test/unit/util/output.rb")],
                                                                                                        ["procwrapper.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/test-unit-3.6.1/lib/test/unit/util/procwrapper.rb")],
                                                                                                    ]))],
                                                                                                ["version.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/test-unit-3.6.1/lib/test/unit/version.rb")],
                                                                                                ["warning.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/test-unit-3.6.1/lib/test/unit/warning.rb")],
                                                                                            ]))],
                                                                                        ["unit.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/test-unit-3.6.1/lib/test/unit.rb")],
                                                                                    ]))],
                                                                                ["test-unit.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/test-unit-3.6.1/lib/test-unit.rb")],
                                                                            ]))],
                                                                        ["PSFL", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/test-unit-3.6.1/PSFL")],
                                                                        ["Rakefile", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/test-unit-3.6.1/Rakefile")],
                                                                        ["README.md", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/test-unit-3.6.1/README.md")],
                                                                        ["sample", new Directory(new Map([
                                                                                ["adder.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/test-unit-3.6.1/sample/adder.rb")],
                                                                                ["subtracter.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/test-unit-3.6.1/sample/subtracter.rb")],
                                                                                ["test_adder.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/test-unit-3.6.1/sample/test_adder.rb")],
                                                                                ["test_subtracter.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/test-unit-3.6.1/sample/test_subtracter.rb")],
                                                                                ["test_user.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/test-unit-3.6.1/sample/test_user.rb")],
                                                                            ]))],
                                                                    ]))],
                                                                ["time-0.3.0", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/time-0.3.0")],
                                                                ["timeout-0.4.1", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/timeout-0.4.1")],
                                                                ["tmpdir-0.2.0", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/tmpdir-0.2.0")],
                                                                ["tsort-0.2.0", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/tsort-0.2.0")],
                                                                ["typeprof-0.21.9", new Directory(new Map([
                                                                        ["exe", new Directory(new Map([
                                                                                ["typeprof", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/typeprof-0.21.9/exe/typeprof")],
                                                                            ]))],
                                                                        ["Gemfile", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/typeprof-0.21.9/Gemfile")],
                                                                        ["Gemfile.lock", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/typeprof-0.21.9/Gemfile.lock")],
                                                                        ["lib", new Directory(new Map([
                                                                                ["typeprof", new Directory(new Map([
                                                                                        ["analyzer.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/typeprof-0.21.9/lib/typeprof/analyzer.rb")],
                                                                                        ["arguments.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/typeprof-0.21.9/lib/typeprof/arguments.rb")],
                                                                                        ["block.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/typeprof-0.21.9/lib/typeprof/block.rb")],
                                                                                        ["builtin.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/typeprof-0.21.9/lib/typeprof/builtin.rb")],
                                                                                        ["cli.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/typeprof-0.21.9/lib/typeprof/cli.rb")],
                                                                                        ["code-range.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/typeprof-0.21.9/lib/typeprof/code-range.rb")],
                                                                                        ["config.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/typeprof-0.21.9/lib/typeprof/config.rb")],
                                                                                        ["container-type.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/typeprof-0.21.9/lib/typeprof/container-type.rb")],
                                                                                        ["export.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/typeprof-0.21.9/lib/typeprof/export.rb")],
                                                                                        ["import.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/typeprof-0.21.9/lib/typeprof/import.rb")],
                                                                                        ["insns-def.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/typeprof-0.21.9/lib/typeprof/insns-def.rb")],
                                                                                        ["iseq.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/typeprof-0.21.9/lib/typeprof/iseq.rb")],
                                                                                        ["lsp.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/typeprof-0.21.9/lib/typeprof/lsp.rb")],
                                                                                        ["method.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/typeprof-0.21.9/lib/typeprof/method.rb")],
                                                                                        ["type.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/typeprof-0.21.9/lib/typeprof/type.rb")],
                                                                                        ["utils.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/typeprof-0.21.9/lib/typeprof/utils.rb")],
                                                                                        ["version.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/typeprof-0.21.9/lib/typeprof/version.rb")],
                                                                                    ]))],
                                                                                ["typeprof.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/typeprof-0.21.9/lib/typeprof.rb")],
                                                                            ]))],
                                                                        ["LICENSE", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/typeprof-0.21.9/LICENSE")],
                                                                        ["Rakefile", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/typeprof-0.21.9/Rakefile")],
                                                                        ["README.md", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/typeprof-0.21.9/README.md")],
                                                                        ["tools", new Directory(new Map([
                                                                                ["coverage.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/typeprof-0.21.9/tools/coverage.rb")],
                                                                                ["setup-insns-def.rb", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/typeprof-0.21.9/tools/setup-insns-def.rb")],
                                                                            ]))],
                                                                        ["typeprof-lsp", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/typeprof-0.21.9/typeprof-lsp")],
                                                                    ]))],
                                                                ["un-0.3.0", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/un-0.3.0")],
                                                                ["uri-0.13.0", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/uri-0.13.0")],
                                                                ["weakref-0.1.3", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/weakref-0.1.3")],
                                                                ["yaml-0.3.0", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/gems/yaml-0.3.0")],
                                                            ]))],
                                                        ["plugins", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/plugins")],
                                                        ["specifications", new Directory(new Map([
                                                                ["debug-1.9.1.gemspec", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/specifications/debug-1.9.1.gemspec")],
                                                                ["default", new Directory(new Map([
                                                                        ["abbrev-0.1.2.gemspec", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/specifications/default/abbrev-0.1.2.gemspec")],
                                                                        ["base64-0.2.0.gemspec", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/specifications/default/base64-0.2.0.gemspec")],
                                                                        ["benchmark-0.3.0.gemspec", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/specifications/default/benchmark-0.3.0.gemspec")],
                                                                        ["bundler-2.5.11.gemspec", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/specifications/default/bundler-2.5.11.gemspec")],
                                                                        ["cgi-0.4.1.gemspec", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/specifications/default/cgi-0.4.1.gemspec")],
                                                                        ["csv-3.2.8.gemspec", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/specifications/default/csv-3.2.8.gemspec")],
                                                                        ["delegate-0.3.1.gemspec", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/specifications/default/delegate-0.3.1.gemspec")],
                                                                        ["did_you_mean-1.6.3.gemspec", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/specifications/default/did_you_mean-1.6.3.gemspec")],
                                                                        ["drb-2.2.0.gemspec", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/specifications/default/drb-2.2.0.gemspec")],
                                                                        ["english-0.8.0.gemspec", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/specifications/default/english-0.8.0.gemspec")],
                                                                        ["erb-4.0.3.gemspec", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/specifications/default/erb-4.0.3.gemspec")],
                                                                        ["error_highlight-0.6.0.gemspec", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/specifications/default/error_highlight-0.6.0.gemspec")],
                                                                        ["fileutils-1.7.2.gemspec", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/specifications/default/fileutils-1.7.2.gemspec")],
                                                                        ["find-0.2.0.gemspec", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/specifications/default/find-0.2.0.gemspec")],
                                                                        ["forwardable-1.3.3.gemspec", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/specifications/default/forwardable-1.3.3.gemspec")],
                                                                        ["getoptlong-0.2.1.gemspec", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/specifications/default/getoptlong-0.2.1.gemspec")],
                                                                        ["ipaddr-1.2.6.gemspec", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/specifications/default/ipaddr-1.2.6.gemspec")],
                                                                        ["irb-1.13.1.gemspec", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/specifications/default/irb-1.13.1.gemspec")],
                                                                        ["logger-1.6.0.gemspec", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/specifications/default/logger-1.6.0.gemspec")],
                                                                        ["mutex_m-0.2.0.gemspec", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/specifications/default/mutex_m-0.2.0.gemspec")],
                                                                        ["net-http-0.4.1.gemspec", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/specifications/default/net-http-0.4.1.gemspec")],
                                                                        ["net-protocol-0.2.2.gemspec", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/specifications/default/net-protocol-0.2.2.gemspec")],
                                                                        ["observer-0.1.2.gemspec", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/specifications/default/observer-0.1.2.gemspec")],
                                                                        ["open-uri-0.4.1.gemspec", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/specifications/default/open-uri-0.4.1.gemspec")],
                                                                        ["open3-0.2.1.gemspec", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/specifications/default/open3-0.2.1.gemspec")],
                                                                        ["optparse-0.4.0.gemspec", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/specifications/default/optparse-0.4.0.gemspec")],
                                                                        ["ostruct-0.6.0.gemspec", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/specifications/default/ostruct-0.6.0.gemspec")],
                                                                        ["pp-0.5.0.gemspec", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/specifications/default/pp-0.5.0.gemspec")],
                                                                        ["prettyprint-0.2.0.gemspec", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/specifications/default/prettyprint-0.2.0.gemspec")],
                                                                        ["prism-0.19.0.gemspec", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/specifications/default/prism-0.19.0.gemspec")],
                                                                        ["pstore-0.1.3.gemspec", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/specifications/default/pstore-0.1.3.gemspec")],
                                                                        ["rdoc-6.6.3.1.gemspec", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/specifications/default/rdoc-6.6.3.1.gemspec")],
                                                                        ["readline-0.0.4.gemspec", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/specifications/default/readline-0.0.4.gemspec")],
                                                                        ["reline-0.5.7.gemspec", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/specifications/default/reline-0.5.7.gemspec")],
                                                                        ["resolv-0.3.0.gemspec", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/specifications/default/resolv-0.3.0.gemspec")],
                                                                        ["resolv-replace-0.1.1.gemspec", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/specifications/default/resolv-replace-0.1.1.gemspec")],
                                                                        ["rinda-0.2.0.gemspec", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/specifications/default/rinda-0.2.0.gemspec")],
                                                                        ["ruby2_keywords-0.0.5.gemspec", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/specifications/default/ruby2_keywords-0.0.5.gemspec")],
                                                                        ["securerandom-0.3.1.gemspec", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/specifications/default/securerandom-0.3.1.gemspec")],
                                                                        ["set-1.1.0.gemspec", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/specifications/default/set-1.1.0.gemspec")],
                                                                        ["shellwords-0.2.0.gemspec", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/specifications/default/shellwords-0.2.0.gemspec")],
                                                                        ["singleton-0.2.0.gemspec", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/specifications/default/singleton-0.2.0.gemspec")],
                                                                        ["syntax_suggest-2.0.0.gemspec", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/specifications/default/syntax_suggest-2.0.0.gemspec")],
                                                                        ["tempfile-0.2.1.gemspec", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/specifications/default/tempfile-0.2.1.gemspec")],
                                                                        ["time-0.3.0.gemspec", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/specifications/default/time-0.3.0.gemspec")],
                                                                        ["timeout-0.4.1.gemspec", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/specifications/default/timeout-0.4.1.gemspec")],
                                                                        ["tmpdir-0.2.0.gemspec", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/specifications/default/tmpdir-0.2.0.gemspec")],
                                                                        ["tsort-0.2.0.gemspec", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/specifications/default/tsort-0.2.0.gemspec")],
                                                                        ["un-0.3.0.gemspec", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/specifications/default/un-0.3.0.gemspec")],
                                                                        ["uri-0.13.0.gemspec", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/specifications/default/uri-0.13.0.gemspec")],
                                                                        ["weakref-0.1.3.gemspec", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/specifications/default/weakref-0.1.3.gemspec")],
                                                                        ["yaml-0.3.0.gemspec", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/specifications/default/yaml-0.3.0.gemspec")],
                                                                    ]))],
                                                                ["matrix-0.4.2.gemspec", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/specifications/matrix-0.4.2.gemspec")],
                                                                ["minitest-5.20.0.gemspec", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/specifications/minitest-5.20.0.gemspec")],
                                                                ["net-ftp-0.3.4.gemspec", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/specifications/net-ftp-0.3.4.gemspec")],
                                                                ["net-imap-0.4.9.1.gemspec", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/specifications/net-imap-0.4.9.1.gemspec")],
                                                                ["net-pop-0.1.2.gemspec", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/specifications/net-pop-0.1.2.gemspec")],
                                                                ["net-smtp-0.4.0.1.gemspec", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/specifications/net-smtp-0.4.0.1.gemspec")],
                                                                ["power_assert-2.0.3.gemspec", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/specifications/power_assert-2.0.3.gemspec")],
                                                                ["prime-0.1.2.gemspec", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/specifications/prime-0.1.2.gemspec")],
                                                                ["racc-1.7.3.gemspec", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/specifications/racc-1.7.3.gemspec")],
                                                                ["rake-13.1.0.gemspec", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/specifications/rake-13.1.0.gemspec")],
                                                                ["rbs-3.4.0.gemspec", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/specifications/rbs-3.4.0.gemspec")],
                                                                ["rexml-3.2.8.gemspec", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/specifications/rexml-3.2.8.gemspec")],
                                                                ["rss-0.3.0.gemspec", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/specifications/rss-0.3.0.gemspec")],
                                                                ["test-unit-3.6.1.gemspec", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/specifications/test-unit-3.6.1.gemspec")],
                                                                ["typeprof-0.21.9.gemspec", new RemoteFile("assets/vfs/usr/local/lib/ruby/gems/3.3.0/specifications/typeprof-0.21.9.gemspec")],
                                                            ]))],
                                                    ]))],
                                            ]))],
                                        ["site_ruby", new Directory(new Map([
                                                ["3.3.0", new Directory(new Map([
                                                        ["wasm32-wasi", new RemoteFile("assets/vfs/usr/local/lib/ruby/site_ruby/3.3.0/wasm32-wasi")],
                                                    ]))],
                                            ]))],
                                        ["vendor_ruby", new Directory(new Map([
                                                ["3.3.0", new Directory(new Map([
                                                        ["wasm32-wasi", new RemoteFile("assets/vfs/usr/local/lib/ruby/vendor_ruby/3.3.0/wasm32-wasi")],
                                                    ]))],
                                            ]))],
                                    ]))],
                            ]))],
                        ["share", new Directory(new Map([
                                ["man", new Directory(new Map([
                                        ["man1", new Directory(new Map([
                                                ["erb.1", new RemoteFile("assets/vfs/usr/local/share/man/man1/erb.1")],
                                                ["irb.1", new RemoteFile("assets/vfs/usr/local/share/man/man1/irb.1")],
                                                ["ri.1", new RemoteFile("assets/vfs/usr/local/share/man/man1/ri.1")],
                                                ["ruby.1", new RemoteFile("assets/vfs/usr/local/share/man/man1/ruby.1")],
                                            ]))],
                                    ]))],
                            ]))],
                    ]))],
            ]))],
        ["vfs-files.txt", new RemoteFile("assets/vfs/vfs-files.txt")],
    ]));

    const DefaultRubyVM = async (rubyModule, options = {}) => {
        const args = [];
        const env = Object.entries(options.env ?? {}).map(([k, v]) => `${k}=${v}`);
        const fds = [
            new OpenFile(new File([])),
            new OpenFile(new File([])),
            new OpenFile(new File([])),
            vfsDirMap,
        ];
        const wasi = new WASI(args, env, fds, { debug: false });
        const printer = options.consolePrint ?? true ? consolePrinter() : undefined;
        const { vm, instance } = await RubyVM.instantiateModule({
            module: rubyModule, wasip1: wasi,
            addToImports: (imports) => {
                printer?.addToImports(imports);
            },
            setMemory: (memory) => {
                printer?.setMemory(memory);
            }
        });
        return {
            vm,
            wasi,
            instance,
        };
    };

    var recordRubyCodeStart;
    const main = async () => {
        globalThis.recordRubyCodeStart = () => {
            performance.mark('poc-init-end');
            performance.mark('poc-deploy-end');
            performance.mark('poc-ruby-code-start');
            updateDisplay();
        };
        await initMeasureButton();
    };
    const pocBtnStart = document.getElementById('poc-btn-start');
    const pocSpanFsize = document.getElementById('poc-span-fsize');
    const pocSpanDltime = document.getElementById('poc-span-dltime');
    const pocSpanInitTime = document.getElementById('poc-span-init-time');
    const pocSpanDeployTime = document.getElementById('poc-span-deploy-time');
    const initMeasureButton = async () => {
        pocBtnStart.addEventListener('click', async () => {
            console.log('performance recording started');
            performance.mark('poc-start');
            performance.mark('poc-deploy-start');
            performance.mark('poc-dl-start');
            await startpoc();
        });
    };
    const startpoc = async () => {
        await startRubyVM({
            wasm_url: "assets/wasm/ruby.wasm",
        });
    };
    const updateDisplay = () => {
        const pocDlDuration = performance.measure('poc-dl', 'poc-dl-start', 'poc-dl-end').duration;
        const pocInitDuration = performance.measure('poc-init', 'poc-init-start', 'poc-init-end').duration;
        const pocDeployDuration = performance.measure('poc-deploy', 'poc-deploy-start', 'poc-deploy-end').duration;
        pocSpanDltime.innerHTML = pocDlDuration.toFixed(2);
        pocSpanInitTime.innerHTML = pocInitDuration.toFixed(2);
        pocSpanDeployTime.innerHTML = pocDeployDuration.toFixed(2);
    };
    exports.rubyVM = void 0;
    const startRubyVM = async (pkg, options) => {
        // 計測開始
        performance.mark('poc-dl-start');
        // 記録する処理
        const response = fetch(pkg.wasm_url);
        // 計測終了
        const module = await compileWebAssemblyModule(response);
        const { vm } = await DefaultRubyVM(module, options);
        exports.rubyVM = vm;
        await mainWithRubyVM(vm);
    };
    const mainWithRubyVM = async (vm) => {
        vm.printVersion();
        globalThis.rubyVM = vm;
        // Wait for the text/ruby script tag to be read.
        // It may take some time to read ruby+stdlib.wasm
        // and DOMContentLoaded has already been fired.
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", () => runRubyScriptsInHtml(vm));
        }
        else {
            runRubyScriptsInHtml(vm);
        }
    };
    const runRubyScriptsInHtml = async (vm) => {
        vm.eval(await fetch('assets/vfs/app/lib/main.rb').then((response) => response.text()));
        // case "async":
        //   vm.evalAsync(scriptContent);
        //   break;
        // case "sync":
        //   vm.eval(scriptContent);
        //   break;
    };
    const compileWebAssemblyModule = async function (response) {
        // if (!WebAssembly.compileStreaming) {
        const buffer = await (await response).arrayBuffer();
        const fsize = await response.then(res => res.headers.get("content-length"));
        pocSpanFsize.innerHTML = fsize;
        performance.mark("poc-dl-end");
        performance.mark('poc-init-start');
        return WebAssembly.compile(buffer);
        // } else {
        // return WebAssembly.compileStreaming(response);
        // }
    };

    window.recordRubyCodeStart = recordRubyCodeStart;
    main();

    exports.recordRubyCodeStart = recordRubyCodeStart;

}));
