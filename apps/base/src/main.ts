import { DefaultRubyVM } from "./browser"
import { RubyInitComponentOptions, RubyComponentInstantiator, RubyVM } from "@ruby/wasm-wasi";

export var recordRubyCodeStart: Function;

const main = async () => {
  globalThis.recordRubyCodeStart = () => {
    performance.mark('poc-init-end');
    performance.mark('poc-deploy-end');
    performance.mark('poc-ruby-code-start');
    updateDisplay();
  }
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
}

const startpoc = async () => {
  await startRubyVM({
    name: "ruby",
    version: "unknown",
    wasm_url: "assets/wasm/ruby.wasm",
  });
}

const updateDisplay = () => {
  const pocDlDuration = performance.measure('poc-dl', 'poc-dl-start', 'poc-dl-end').duration;
  const pocInitDuration = performance.measure('poc-init', 'poc-init-start', 'poc-init-end').duration;
  const pocDeployDuration = performance.measure('poc-deploy', 'poc-deploy-start', 'poc-deploy-end').duration;

  pocSpanDltime.innerHTML = pocDlDuration.toFixed(2);
  pocSpanInitTime.innerHTML = pocInitDuration.toFixed(2);
  pocSpanDeployTime.innerHTML = pocDeployDuration.toFixed(2);
}

export var rubyVM: RubyVM;

export const startRubyVM = async (
  pkg: { name: string; version: string, wasm_url: string },
  options?: Parameters<typeof DefaultRubyVM>[1],
) => {
  // 計測開始
  performance.mark('poc-dl-start');
  // 記録する処理
  const response = fetch(pkg.wasm_url);
  // 計測終了
  const module = await compileWebAssemblyModule(response);
  const { vm } = await DefaultRubyVM(module, options);
  rubyVM = vm;
  await mainWithRubyVM(vm);
};

const mainWithRubyVM = async (vm: RubyVM) => {
  vm.printVersion();

  globalThis.rubyVM = vm;

  // Wait for the text/ruby script tag to be read.
  // It may take some time to read ruby+stdlib.wasm
  // and DOMContentLoaded has already been fired.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () =>
      runRubyScriptsInHtml(vm),
    );
  } else {
    runRubyScriptsInHtml(vm);
  }
};

const runRubyScriptsInHtml = async (vm: RubyVM) => {
  vm.eval(await fetch('assets/vfs/app/lib/main.rb').then((response) => response.text()));
  // case "async":
  //   vm.evalAsync(scriptContent);
  //   break;
  // case "sync":
  //   vm.eval(scriptContent);
  //   break;
};

const compileWebAssemblyModule = async function (
  response: Promise<Response>,
): Promise<WebAssembly.Module> {
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

export default main;
