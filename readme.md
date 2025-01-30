# featureFlags

Run small configurable scripts on any device and control them using a browser.
Interface running on port 80 by default.
Made with alpine.js and deno.

Available features:

- "Shairport": Restrict access to a shairport instance using mac filters
- "Volume": Control speaker volume remotely
- "Pinecil": Broadcast the state of your Pinecil via MQTT
- "Kef": Turn on your speakers automatically when audio playback starts

## Setup

1. Clone this repo:
1. Allow non root programs to bind on port 80 (or change the port of the webinterface):

```bash
sudo setcap CAP_NET_BIND_SERVICE=+eip ~/.deno/bin/deno
```

2. Create system service:

```bash
nano $HOME/.config/systemd/user/featureFlags.service
```

```bash
[Unit]  
Description=featureFlags
After=network.target  
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

3. Start service

```bash
systemctl --user daemon-reload
systemctl --user enable featureFlags --now
systemctl --user status featureFlags
```

View logs:

```bash
journalctl --user -u featureFlags -e -f
```

## Configuration

## Development

Run:

```bash
deno run --allow-read --allow-write --allow-run --allow-net server/main.ts
```
