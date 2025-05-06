# 🧨 frida-ultimate-evasion.js

> 🎭 **Furtivo. Letal. Invisível.**  
> Um script Frida para derrubar RASP como Arxan, Promon e DexGuard, feito pra quem joga no hard mode.

---

## 🕶️ Sobre

O `frida-ultimate-evasion.js` é um script que implementa evasão completa contra técnicas de detecção de Frida, debugger e tampering — cobrindo **Java e código nativo**.

Você injeta. Ele mascara tudo o app nem percebe que foi invadido.  
Testado contra apps com Arxan, Promon, DexGuard, e validações customizadas.

---

## 🧩 Técnicas de detecção neutralizadas

| 🎯 Técnica de Detecção                         | ✅ Protegido | 💉 Como é feito                                               |
|------------------------------------------------|-------------|---------------------------------------------------------------|
| `android.os.Debug.isDebuggerConnected()`       | ✅           | Hook em Java: sempre retorna `false`                          |
| `android.os.Debug.waitingForDebugger()`        | ✅           | Hook em Java: sempre retorna `false`                          |
| `java.lang.Debug.isDebuggerConnected()`        | ✅           | Hook em Java (redundante)                                     |
| Leitura de `TracerPid` (`/proc/self/status`)   | ✅           | Hook em `fgets()`, sobrescreve `TracerPid:\t0`                |
| `ptrace(PTRACE_TRACEME)`                       | ✅           | Substitui `ptrace()` com retorno `0`                          |
| `syscall(0x1a)` (ptrace via syscall)           | ✅           | Hook em syscall: detecta 0x1a e força retorno `0`             |
| `kill(SIGTRAP)`                                | ✅           | Hook em `kill`, substitui sinal por `0`                       |
| `raise(SIGTRAP)`                               | ✅           | Hook em `raise`, substitui por sinal neutro                  |
| `signal(SIGTRAP)`                              | ✅           | Neutraliza qualquer armadilha via `signal()`                  |
| `getppid()`                                     | ✅           | Retorna `1`, indicando "sem debugger pai"                     |
| `fork()`                                        | ✅           | Retorna `-1`, falha proposital                                |
| `waitpid()`                                     | ✅           | Retorna `0`, ignora filhos                                    |
| `open("/proc/self/maps")`                      | ✅           | Bloqueia leitura de `maps`, usada para detectar gadgets       |
| `dlopen("frida*")`                              | ✅           | Intercepta e bloqueia `frida*.so`                             |
| `strstr`, `strcmp`, `strcasestr`, `memmem`      | ✅           | Neutraliza buscas por "frida"                                 |
| `fcntl`, `ioctl`, `prctl`                       | ✅           | Força retorno `0` (contra PR_SET_DUMPABLE, etc.)              |
| `pthread_create` com `gum-js-loop`             | ✅           | Oculta nome da thread do Frida do `ps`                        |

---

## 🔐 Proteções burladas por vendor

| 🛡️ Vendor / Técnica           | Técnicas aplicadas                         | 🧨 Coberto? |
|-------------------------------|---------------------------------------------|------------|
| **Arxan**                     | TracerPid, ptrace, maps, syscall            | ✅ Sim     |
| **DexGuard**                  | syscall, kill, dlopen, strcmp               | ✅ Sim     |
| **Promon Shield**             | gum-js-loop, signal, prctl, TracerPid       | ✅ Sim     |
| **App tampering detectors**   | kill, raise, debugger via Java              | ✅ Sim     |
| **Validações customizadas**   | strstr, maps, gum-js-loop thread            | ✅ Sim     |

---

## ⚙️ Como usar

```bash
frida -U -n com.exemplo.app -l frida-ultimate-evasion.js --no-pause
```
⚠️ Use --no-pause para aplicar os hooks antes que os guards despertem.

🧠 Requisitos
Frida >= 16.x

Acesso root, VM ou emulador

Apps com RASP (pra diversão ser garantida)

☠️ Disclaimer

[!] Esta ferramenta é para uso educacional e em ambientes autorizados.
[!] Não me responsabilizo por uso indevido.
[!] Teste com ética. Hack com consciência.

👾 Autor
Bruno Moreira
github.com/brunomoreira
Pentester • Mobile Offsec • Red Team Ops

🧬 Contribua
Encontrou uma técnica nova de detecção? Um bypass ainda mais insano?
Faça um PR ou abra uma issue. A comunidade agradece.

🧨 Hack the planet...

