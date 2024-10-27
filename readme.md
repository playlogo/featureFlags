# featureFlags

Run small configurable scripts on any device and control them using a browser.
Interface running on port 80.
Made with alpine.js and deno.

Available features:

- "Shairport": Restrict access to a shairport instance using mac filters

## Development

Start:

```bash
deno run --allow-read --allow-write --allow-run --allow-net server/main.ts
```

## Setup

Allow non root programs to bind on port 80:

```bash
sudo setcap CAP_NET_BIND_SERVICE=+eip ~/.deno/bin/deno
```

Create system service:

```bash
nano $HOME/.config/systemd/user/featureFlag.service
```

```bash
[Unit]  
Description=FeatureFlag  
After=network.target  
After=tailscaled.service  
StartLimitIntervalSec=0  
  
[Service]  
Type=simple  
Restart=always  
RestartSec=3  
WorkingDirectory=~/featureFlag
ExecStart=~/.deno/bin/deno run --allow-read --allow-write --allow-run --allow-net server/main.ts 
  
[Install]  
WantedBy=default.target
```

```bash
systemctl --user daemon-reload
systemctl --user enable FeatureFlag
systemctl --user start FeatureFlag
```
