import main, { rubyVM, recordRubyCodeStart } from "./main";
export { rubyVM, recordRubyCodeStart };

window.recordRubyCodeStart = recordRubyCodeStart;
main();
