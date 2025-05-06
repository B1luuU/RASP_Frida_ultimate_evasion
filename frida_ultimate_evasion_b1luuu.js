const VERBOSE = false;
function log(msg) { if (VERBOSE) console.log(msg); }

// === Java layer anti-debug ===
Java.perform(function () {
    try {
        const Debug = Java.use("android.os.Debug");
        Debug.isDebuggerConnected.implementation = function () {
            log("[Bypass] Debug.isDebuggerConnected()");
            return false;
        };
        Debug.waitingForDebugger.implementation = function () {
            log("[Bypass] Debug.waitingForDebugger()");
            return false;
        };

        const JDebug = Java.use("java.lang.Debug");
        JDebug.isDebuggerConnected.implementation = function () {
            log("[Bypass] java.lang.Debug.isDebuggerConnected()");
            return false;
        };
    } catch (e) {}
});

// === Native layer ===
function bypassFunc(name, handler) {
    const f = Module.findExportByName(null, name);
    if (f) Interceptor.attach(f, handler);
}

function replaceFunc(name, replacement, retType, argTypes) {
    const f = Module.findExportByName(null, name);
    if (f) Interceptor.replace(f, new NativeCallback(replacement, retType, argTypes));
}

// ptrace / syscall
replaceFunc("ptrace", () => { log("[Bypass] ptrace"); return 0; }, 'int', ['int', 'int', 'pointer', 'pointer']);
bypassFunc("syscall", {
    onEnter(args) {
        if (parseInt(args[0]) === 0x1a) {
            log("[Bypass] syscall(ptrace)");
            this.bypass = true;
        }
    },
    onLeave(retval) {
        if (this.bypass) retval.replace(0);
    }
});

// raise/kill/signal(SIGTRAP)
["raise", "kill", "signal"].forEach(func => {
    bypassFunc(func, {
        onEnter(args) {
            const sig = args[func === "kill" ? 1 : 0].toInt32();
            if (sig === 5) {
                log(`[Bypass] ${func}(SIGTRAP)`);
                args[func === "kill" ? 1 : 0] = ptr(0);
            }
        }
    });
});

// getppid / fork / waitpid
replaceFunc("getppid", () => { log("[Bypass] getppid"); return 1; }, 'int', []);
replaceFunc("fork", () => { log("[Bypass] fork"); return -1; }, 'int', []);
replaceFunc("waitpid", () => { log("[Bypass] waitpid"); return 0; }, 'int', ['int', 'pointer', 'int']);

// fgets for TracerPid
bypassFunc("fgets", {
    onEnter(args) { this.buf = args[0]; },
    onLeave() {
        const line = Memory.readUtf8String(this.buf);
        if (line.startsWith("TracerPid:")) {
            log("[Bypass] TracerPid");
            Memory.writeUtf8String(this.buf, "TracerPid:\t0");
        }
    }
});

// Hide Frida from open("/proc/self/maps")
bypassFunc("open", {
    onEnter(args) {
        const path = Memory.readUtf8String(args[0]);
        if (path.includes("maps") || path.includes("smaps")) {
            log("[Bypass] open maps blocked");
            this.block = true;
        }
    },
    onLeave(retval) {
        if (this.block) retval.replace(-1);
    }
});

// Bypass dlopen("frida*") and other symbol-based detections
bypassFunc("dlopen", {
    onEnter(args) {
        const name = Memory.readCString(args[0]) || "";
        if (name.toLowerCase().includes("frida")) {
            log(`[Bypass] dlopen('${name}') blocked`);
            args[0] = ptr(0);
        }
    }
});

// Hide Frida symbols during dlsym and string comparisons
["strstr", "strcmp", "strcasestr", "strncpy", "memmem"].forEach(func => {
    bypassFunc(func, {
        onEnter(args) {
            const s1 = Memory.readCString(args[0]) || "";
            const s2 = args.length > 1 ? Memory.readCString(args[1]) || "" : "";
            if (s1.toLowerCase().includes("frida") || s2.toLowerCase().includes("frida")) {
                log(`[Bypass] ${func}(${s1}, ${s2}) → fake`);
                this.shouldBypass = true;
                this.ptr = args[0];
            }
        },
        onLeave(retval) {
            if (this.shouldBypass) retval.replace(ptr(0));
        }
    });
});

// fcntl / ioctl / prctl evasão (avançado)
["fcntl", "ioctl", "prctl"].forEach(func => {
    bypassFunc(func, {
        onEnter(args) {
            log(`[Bypass] ${func}() neutralizado`);
            this.bypass = true;
        },
        onLeave(retval) {
            if (this.bypass) retval.replace(0);
        }
    });
});

// Opcional: ocultar uso do GumJS (thread "gum-js-loop")
const pthread_create = Module.findExportByName(null, "pthread_create");
if (pthread_create) {
    Interceptor.attach(pthread_create, {
        onEnter(args) {
            this.name_ptr = args[3];
        },
        onLeave() {
            try {
                const name = Memory.readCString(this.name_ptr);
                if (name && name.includes("gum-js")) {
                    log("[Bypass] Ocultando thread gum-js-loop");
                    Memory.writeUtf8String(this.name_ptr, "com.android.system");
                }
            } catch (e) {}
        }
    });
}
