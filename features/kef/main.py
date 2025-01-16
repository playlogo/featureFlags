import subprocess
import time
import requests
import datetime
import paho.mqtt.subscribe as subscribe


def turnOnSpeaker():
    res = requests.get(f"http://192.168.178.29:4002/api/ifttt/feedback/speaker")

    if res.ok:
        print("[kef] Successfully turned on speakers")
    else:
        print("[kef] Failed to turn on speakers")
        print(res.status_code)
        print(res.text)


def handlePlaybackStart():
    # Get speaker power level
    esp8266_mqtt_last_heartbeat = subscribe.simple(
        "kef/powered", hostname="192.168.178.29"
    )
    esp8266_last_heartbeat = int(esp8266_mqtt_last_heartbeat.payload)

    if (
        datetime.datetime.now()
        - datetime.datetime.fromtimestamp(esp8266_last_heartbeat)
    ).seconds > 60:
        # Speakers are off, turn them on
        turnOnSpeaker()


def main():
    is_active = False
    last_change = 0
    debounce_secs = 0.5
    last_state = None
    target_device = "alsa_output.pci-0000_0f_00.3.iec958-stereo"

    pw_mon = subprocess.Popen(["pw-mon", "-p"], stdout=subprocess.PIPE, text=True)

    try:
        while True:
            line = pw_mon.stdout.readline().strip()  # type: ignore
            if not line:
                continue

            now = time.time()

            if now - last_change < debounce_secs:
                continue

            if 'state: "running"' in line or 'state: "suspended"' in line:
                last_state = "running" if 'state: "running"' in line else "suspended"
            elif "node.name" in line and target_device in line:
                if last_state == "running" and not is_active:
                    handlePlaybackStart()
                    is_active = True
                    last_change = now
                elif last_state == "suspended" and is_active:
                    is_active = False
                    last_change = now

    except KeyboardInterrupt:
        pw_mon.terminate()
