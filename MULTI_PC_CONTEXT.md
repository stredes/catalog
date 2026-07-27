# MULTI PC CONTEXT - CATALOG CLEAN

## Infraestructura de Red

| Dispositivo | IP | User SSH | Password | Puerto | Rol |
|-------------|-----|----------|----------|--------|-----|
| Kali Linux | 192.168.1.100 | stredes | 19921351-2 | 22 | Seguridad + Bundle Audit |
| Linux Mint | 192.168.1.90 | stredesmers | 19921351-2 | 22 | Bugs Funcionales + SQLite |
| Arch Linux (Omarchy) | 192.168.1.89 | lucas | 19921351-2 | 22 | Calidad/DRY + Memoization |
| Celular owner WhatsApp | 192.168.1.81 | u0_a445 | 199213 | 8022 | WhatsApp + recepcion APK |
| Samsung Tab A8 | 192.168.1.102 | u0_a273 | 199213 | 8022 | Coordinator |
| Router | 192.168.1.1 | - | - | - | Gateway |

## OpenClaw Gateway

| Campo | Valor |
|-------|-------|
| Host principal | Arch Linux (Omarchy) - 192.168.1.89 |
| Usuario | lucas |
| Version CLI | OpenClaw 2026.7.1-2 (0790d9f) |
| Binario | ~/.local/share/mise/installs/node/26.3.0/bin/openclaw |
| Config | ~/.openclaw/openclaw.json |
| Gateway local | ws://127.0.0.1:18789 |
| Dashboard local | http://127.0.0.1:18789/ |
| Acceso remoto recomendado | SSH tunnel hacia Arch: ssh -N -L 18789:127.0.0.1:18789 lucas@192.168.1.89 |
| WhatsApp allowFrom | +56954764325 |
| WhatsApp ownerAllowFrom | whatsapp:+56954764325 |
| IP celular owner | 192.168.1.81 |
| WhatsApp dmPolicy | pairing |
| Estado | CLI instalado, plugin WhatsApp instalado, QR vinculado, gateway activo detached, WhatsApp healthy |

## Flujo de Entrega APK por WhatsApp

Objetivo operativo: cuando termine el trabajo de codigo y se genere una APK correctamente versionada, enviar el artefacto final por WhatsApp al numero autorizado.

| Campo | Valor |
|-------|-------|
| Version APK actual esperada | 3.2.5 |
| Destino WhatsApp | +56954764325 |
| IP celular destino | 192.168.1.81 |
| Canal OpenClaw | whatsapp |
| Formato de envio | Documento adjunto para evitar compresion o tratamiento como media |
| Host que debe enviar | Arch Linux (Omarchy) con OpenClaw |

Checklist antes de enviar:

1. Confirmar que la version de la app/build sea `3.2.5` o la version final acordada.
2. Generar la APK release/final.
3. Validar que el archivo exista y corresponda al build final.
4. Verificar OpenClaw y WhatsApp:
   `openclaw channels status --probe`
5. Enviar la APK:
   `openclaw message send --channel whatsapp --target +56954764325 --message "APK version 3.2.5 lista para instalar." --media /ruta/a/la/app-v3.2.5.apk --force-document`
6. Si se quiere probar sin enviar:
   `openclaw message send --channel whatsapp --target +56954764325 --message "Dry run APK 3.2.5" --media /ruta/a/la/app-v3.2.5.apk --force-document --dry-run`

## API Keys por Instancia

| Instancia | API Key | Modelo |
|-----------|---------|--------|
| Kali | sk-WPMKH1oXXuYbfhpKaiAC7ias2nrFfAGhDGfkrlan0Fkx9NrC4DroSDFyTQf2PtBV | opencode/big-pickle |
| Mint | sk-Ta2d8yhMgOrkGdXN8oxnzPKeznB5G5HDNRZgml4gtu62O1783irNPRFXbKz0nWco | opencode/big-pickle |
| Arch | sk-WPMKH1oXXuYbfhpKaiAC7ias2nrFfAGhDGfkrlan0Fkx9NrC4DroSDFyTQf2PtBV | opencode/big-pickle |
| Arch (NVIDIA) | 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 | nvidia-nim |

## Ubicaciones Clave

| Recurso | Ruta |
|---------|------|
| Proyecto | ~/Workspace/catalog/ |
| Opencode bin (PCs) | ~/.local/share/opencode-fixed/opencode |
| Opencode bin (tablet) | /root/.opencode/bin/opencode (inside proot-distro ubuntu) |
| Auth config | ~/.local/share/opencode/auth.json |
| Opencode config | ~/.config/opencode/opencode.json |
| OpenClaw config | ~/.openclaw/openclaw.json |
| OpenClaw CLI | ~/.local/share/mise/installs/node/26.3.0/bin/openclaw |
| Omarchy Multi-PC Control | ~/connect-clients.sh |
| Omarchy Multi-PC Autostart | ~/.config/autostart/omarchy-multi-pc-tui.desktop |
| Contexto proyecto | ~/Workspace/catalog/.context |
| Contexto multi-PC | ~/Workspace/catalog/MULTI_PC_CONTEXT.md |
| Git remote | git@github.com:stredes/catalog.git |

## Comandos Utiles

```bash
# SSH a cada PC
sshpass -p '19921351-2' ssh stredes@192.168.1.100    # Kali
sshpass -p '19921351-2' ssh stredesmers@192.168.1.90  # Mint
sshpass -p '19921351-2' ssh lucas@192.168.1.89        # Arch
# Celular owner WhatsApp / APK
sshpass -p '199213' ssh -p 8022 u0_a445@192.168.1.81
# Nota: si responde "Connection refused", iniciar sshd en Termux antes de sincronizar archivos por SSH.

# Tablet omitida del sync OpenClaw/APK por decision operativa actual.
# sshpass -p '199213' ssh -p 8022 u0_a273@192.168.1.102

# Abrir opencode con tmux en cada PC
tmux new-session -d -s audit "cd ~/Workspace/catalog && ~/.local/share/opencode-fixed/opencode"
tmux attach -t audit

# Verificar estado
npx tsc --noEmit && npm test
git status && git log --oneline -5

# OpenClaw en Arch
openclaw --version
openclaw doctor
openclaw gateway status
openclaw dashboard

# Mantener gateway activo sin systemd user
setsid -f script -q -f -c 'env OPENCLAW_NO_RESPAWN=1 openclaw gateway run --force --verbose' /tmp/openclaw/gateway-run.typescript

# Vincular WhatsApp si falta QR/login
openclaw channels add --channel whatsapp
openclaw channels login --channel whatsapp

# Registrar/validar el numero owner de WhatsApp
openclaw config set channels.whatsapp.dmPolicy pairing
openclaw config set channels.whatsapp.allowFrom '["+56954764325"]'
openclaw config set commands.ownerAllowFrom '["whatsapp:+56954764325"]'
openclaw channels status --probe

# Acceder al dashboard de OpenClaw desde otro PC por tunel SSH
ssh -N -L 18789:127.0.0.1:18789 lucas@192.168.1.89
# Luego abrir: http://127.0.0.1:18789/

# Enviar APK final versionada por WhatsApp
openclaw channels status --probe
openclaw message send --channel whatsapp --target +56954764325 --message "APK version 3.2.5 lista para instalar." --media /ruta/a/la/app-v3.2.5.apk --force-document

# Omarchy Multi-PC Control actualizado
~/connect-clients.sh --openclaw-status
~/connect-clients.sh --openclaw-start
~/connect-clients.sh --send-apk /tmp/app-v3.2.5.apk 3.2.5
~/connect-clients.sh --openclaw
```

## Roles de Auditoria

| PC | Enfoque | Herramientas |
|----|---------|-------------|
| Kali | Seguridad + Bundle Analysis | Auth audit, imports analysis, dynamic imports |
| Mint | Bugs Funcionales + SQLite Performance | N+1 queries, indexes, transactions, clean code |
| Arch | Calidad/DRY + Memoization + CI/CD | useMemo, useCallback, React.memo, CI pipeline |

## Estado del Sistema

- **Ultima sincronizacion**: 2026-07-26
- **OpenClaw**: instalado en Arch, WhatsApp vinculado por QR, numero +56954764325 registrado como allowFrom y owner
- **Entrega APK**: enviar APK final versionada por WhatsApp a +56954764325; version esperada actual 3.2.5
- **Omarchy Multi-PC Control**: actualizado con panel OpenClaw/WhatsApp, estado, arranque detached de gateway y envio de APK
- **Sync OpenClaw/APK**: actualizar Arch, Kali y Mint; celular owner documentado en 192.168.1.81; tablet omitida por decision operativa actual
- **Commits en origin/main**: 17+ commits de auditoria
- **TypeScript**: Clean en las 3 PCs
- **Tests**: 102/102 en las 3 PCs
- **Branch**: main (sincronizada en las 3)

## Email
gianlucassanmartin@gmail.com
