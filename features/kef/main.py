import subprocess
import time
import requests
import paho.mqtt.client as mqtt


def turnOnSpeaker():
    res = requests.get(f"http://192.168.178.29:4002/api/ifttt/feedback/speaker")


def monitor_audio():
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
                    print("started")
                    is_active = True
                    last_change = now
                elif last_state == "suspended" and is_active:
                    print("ended")
                    is_active = False
                    last_change = now

    except KeyboardInterrupt:
        pw_mon.terminate()


if __name__ == "__main__":
    monitor_audio()
