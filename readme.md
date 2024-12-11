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
nano $HOME/.config/systemd/user/featureFlags.service
```

```bash
[Unit]  
Description=featureFlags
After=network.target  
After=tailscaled.service  
StartLimitIntervalSec=0  
  
[Service]  
Type=simple  
Restart=always  
RestartSec=3  
WorkingDirectory=/home/pi/featureFlags
ExecStart=/home/pi/.deno/bin/deno task run 
  
[Install]  
WantedBy=default.target
```

```bash
systemctl --user daemon-reload
systemctl --user enable featureFlags
systemctl --user start featureFlags
systemctl --user status featureFlags
```

View logs:

```bash
journalctl --user -u featureFlags -e -f
```
