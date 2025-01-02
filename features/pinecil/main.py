import asyncio
import struct
import time
import json

from bleak import BleakClient, BleakScanner
from paho.mqtt import client as mqtt_client

BROKER = "192.168.178.29"
PORT = 1883
TOPIC = "pinecil/mode"


# mqtt helpers
lastPublish = ""


def mqttPublish(client: mqtt_client, message: dict):
    global lastPublish
    msg = json.dumps(message)

    # Check if we can skip message
    if lastPublish == msg:
        print("[mqtt] Skipping message")
        return
    else:
        lastPublish = msg

    if not client.is_connected():
        return

    result = client.publish(TOPIC, msg)

    if result[0] == 0:
        print(f"[mqtt] Published `{msg}` to topic `{TOPIC}`")
    else:
        print(f"[mqtt] Unable to publish to topic {TOPIC}")


def mqttOnConnect(client, _userdata, _flags, rc):
    if rc == 0 and client.is_connected():
        print("[mqtt] Connected")
        client.subscribe(TOPIC)
    else:
        print(f"[mqtt] Failed to connect, return code {rc}")


def mqttOnDisconnect(client, _userdata, rc):
    print("[mqtt] Disconnected with result code: %s", rc)

    delay = 5

    while True:
        time.sleep(delay)

        try:
            client.reconnect()
            print("[mqtt] Reconnected")
            return
        except Exception as err:
            print("[mqtt] Reconnect failed %s. Retrying...", err)


# Pinecil reader
states = {-1: "OFF", 0: "IDLE", 1: "HEATING", 3: "SLEEPING"}


async def run():
    # Connect to mqtt broker
    mqtt_client_instance = mqtt_client.Client()
    mqtt_client_instance.on_connect = mqttOnConnect
    mqtt_client_instance.connect(BROKER, PORT, keepalive=120)
    mqtt_client_instance.on_disconnect = mqttOnDisconnect
    mqtt_client_instance.loop_start()

    # Loop
    while True:
        try:
            message = {"state": states[-1]}

            # Try to connect to pinecil
            device = await BleakScanner.find_device_by_address(
                "c4:d7:fd:d7:f0:c0", timeout=2.0
            )

            if device is None:
                print("[main] Device not found")
                mqttPublish(mqtt_client_instance, message)
                await asyncio.sleep(5)
                continue

            # Read status
            async with BleakClient(device) as client:
                print("[main] Connected to device")

                LIVE_DATA_CHAR_UUID = "9eae1001-9d0d-48c5-aa55-33e27f9bc533"

                raw_value = await client.read_gatt_char(LIVE_DATA_CHAR_UUID)

                # Decode
                num_of_values = len(raw_value) >> 2  # divide by 4
                values = struct.unpack(f"<{num_of_values}I", raw_value)

                # Map to live data
                values_map = [
                    "LiveTemp",
                    "SetTemp",
                    "Voltage",
                    "HandleTemp",
                    "PWMLevel",
                    "PowerSource",
                    "TipResistance",
                    "Uptime",
                    "MovementTime",
                    "MaxTipTempAbility",
                    "uVoltsTip",
                    "HallSensor",
                    "OperatingMode",
                    "Watts",
                ]

                data = dict(zip(values_map, values))

                # Publish state
                message["state"] = states[data["OperatingMode"]]
                message["temp"] = data["LiveTemp"]

                print(
                    f"[main] Successfully loaded live data: {data['LiveTemp']} Degrees | {data['OperatingMode']} Mode"
                )

                mqttPublish(mqtt_client_instance, message)

        except Exception as err:
            if str(err) != "":
                print(f"[main] Error: {err}")
                print(err)

        await asyncio.sleep(2)


def main():
    asyncio.run(run())


if __name__ == "__main__":
    main()


"""
[main] Successfully loaded live data: 23 Degrees | 0 Mode
[main] Connected to device
[main] Successfully loaded live data: 23 Degrees | 0 Mode
[main] Connected to device
[main] Successfully loaded live data: 23 Degrees | 0 Mode
[main] Connected to device
[main] Successfully loaded live data: 23 Degrees | 0 Mode <- Idle
[main] Connected to device
[main] Successfully loaded live data: 336 Degrees | 1 Mode
[main] Connected to device
[main] Successfully loaded live data: 339 Degrees | 1 Mode
[main] Connected to device
[main] Successfully loaded live data: 338 Degrees | 1 Mode
[main] Connected to device
[main] Successfully loaded live data: 339 Degrees | 1 Mode <- Working
[main] Connected to device
[main] Successfully loaded live data: 307 Degrees | 3 Mode <- Sleep
[main] Connected to device
[main] Successfully loaded live data: 272 Degrees | 3 Mode
[main] Connected to device
[main] Successfully loaded live data: 342 Degrees | 1 Mode
"""
