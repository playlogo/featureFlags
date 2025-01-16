import network

import time
import machine
import lib.ntp as ntp
import lib.mqtt as mqtt

wlan = network.WLAN(network.WLAN.IF_STA)

try:
    import env
except:
    print(
        "No env file found. Copy `env_example.oy` as `env.py` to continue. Reseting..."
    )
    time.sleep(1000)
    machine.reset()


def connectWifi():
    if not wlan.isconnected():
        print("connecting to network...")
        wlan.connect(env.WIFI_SSID, env.WIFI_PASSWD)
        while not wlan.isconnected():
            pass

    print("network config:", wlan.ipconfig("addr4"))


def main():
    # Set timestamp
    wlan.active(True)

    if not wlan.isconnected():
        connectWifi()

    # Loop
    while True:
        if not wlan.isconnected():
            try:
                connectWifi()
            except:
                print("Unable to connect to wifi, waiting 100sec and reseting")
                time.sleep(100)
                machine.reset()

        print("Sending timestamp")
        client = mqtt.MQTTClient("kef_power_checker", env.MQTT_HOST)
        client.connect()
        client.publish(env.MQTT_TOPIC, str(ntp.get_ntp_timestamp()), retain=True)
        print("Timestamp sent")
        client.disconnect()

        time.sleep(10)


if __name__ == "__main__":
    main()
