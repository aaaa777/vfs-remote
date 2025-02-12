require 'json'

# 入力ファイルパスを指定してください
input_file = 'dist/assets/vfs/vfs-files.txt'

# ファイルからパス情報を読み込む
paths = File.readlines(input_file, chomp: true)

# 階層構造を構築するための関数
def build_tree(paths)
  tree = {}

  paths.each do |path|
    parts = path.split('/').reject(&:empty?)
    current = tree

    parts.each_with_index do |part, index|
      if index == parts.size - 1
        # ファイル部分は配列に追加
        current[part] ||= {}
      else
        # ディレクトリ部分はネストさせる
        current[part] ||= {}
        current = current[part]
      end
    end
  end

  tree
end

# ツリー構造の構築
tree_structure = build_tree(paths)

p tree_structure

# ツリー構造をTSファイルで出力
def tree_to_ts(tree, indent = 0, basename = 'assets/vfs')
  if indent == 0
    ts = '
import { File, OpenFile, PreopenDirectory, Directory, WASI, Inode } from "@bjorn3/browser_wasi_shim";
import { RemoteFile } from "./remote_file";
import * as wasi from "@bjorn3/browser_wasi_shim/dist/wasi_defs.js";

export const vfsDirMap = new PreopenDirectory(
  "/", new Map<string, File | Directory>([
'
    ts += tree_to_ts(tree, indent + 2)
    ts += "  ])\n);\n"
    return ts
  end

  ts = ''
  tree.map do |key, value|
    if value.is_a?(Hash) && value.size > 0
      ts += "  #{' '*indent}[\"#{key}\", new Directory(new Map<string, Inode>([\n"
      ts += tree_to_ts(value, indent + 2, File.join(basename, key))
      ts += "  #{' '*indent}]))],\n"
    else
      ts += "  #{' '*indent}[\"#{key}\", new RemoteFile(\"#{File.join(basename, key)}\")],\n"
    end
  end
  ts
end

output_js = tree_to_ts(tree_structure['vfs'])
puts output_js

File.write('src/dir_map.ts', output_js)
